const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const env = require("../config/env");
const { prisma } = require("../config/database");
const ApiError = require("../utils/ApiError");
const { enqueueEmail } = require("./email.service");

const DEFAULT_ROLE = "TENANT_ADMIN";

function publicUser(user) {
  return {
    id: user.id,
    email: user.email,
    role: user.role,
    tenantId: user.tenantId,
    isActive: user.isActive,
    emailVerifiedAt: user.emailVerifiedAt,
    createdAt: user.createdAt
  };
}

function secondsFromExpiry(expiry) {
  const match = /^(\d+)([smhd])$/.exec(expiry);
  if (!match) return 900;
  const value = Number(match[1]);
  const units = { s: 1, m: 60, h: 3600, d: 86400 };
  return value * units[match[2]];
}

function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function signTokens(user) {
  const payload = { role: user.role, tenantId: user.tenantId };
  const accessToken = jwt.sign(payload, env.jwtSecret, {
    subject: user.id,
    expiresIn: env.jwtAccessExpiresIn
  });
  const refreshJti = crypto.randomUUID();
  const refreshToken = jwt.sign({ ...payload, jti: refreshJti }, env.jwtRefreshSecret, {
    subject: user.id,
    expiresIn: env.jwtRefreshExpiresIn
  });
  const decodedRefresh = jwt.decode(refreshToken);

  return {
    accessToken,
    refreshToken,
    expiresIn: secondsFromExpiry(env.jwtAccessExpiresIn),
    refreshJti,
    refreshExpiresAt: new Date(decodedRefresh.exp * 1000)
  };
}

function publicTokens(tokens) {
  return {
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    expiresIn: tokens.expiresIn
  };
}

async function createActiveTokenSet(user, client = prisma) {
  const tokens = signTokens(user);

  await client.activeRefreshToken.create({
    data: {
      jti: tokens.refreshJti,
      userId: user.id,
      expiresAt: tokens.refreshExpiresAt
    }
  });

  return publicTokens(tokens);
}

async function createEmailToken(userId, type, client = prisma) {
  const token = crypto.randomBytes(32).toString("hex");
  await client.emailToken.create({
    data: {
      userId,
      type,
      tokenHash: hashToken(token),
      expiresAt: new Date(Date.now() + 60 * 60 * 1000)
    }
  });
  return token;
}

async function pruneExpiredSessions(userId, client = prisma) {
  await client.activeRefreshToken.deleteMany({
    where: {
      userId,
      expiresAt: { lte: new Date() }
    }
  });
}

async function findActiveSession(userId) {
  await pruneExpiredSessions(userId);
  return prisma.activeRefreshToken.findFirst({
    where: {
      userId,
      expiresAt: { gt: new Date() }
    }
  });
}

function verifyRefreshToken(refreshToken) {
  try {
    return jwt.verify(refreshToken, env.jwtRefreshSecret);
  } catch (_error) {
    throw new ApiError(401, "Invalid or expired refresh token");
  }
}

async function revokeRefreshPayload(payload, client = prisma) {
  await client.revokedRefreshToken.upsert({
    where: { jti: payload.jti },
    update: {},
    create: {
      jti: payload.jti,
      userId: payload.sub,
      expiresAt: new Date(payload.exp * 1000)
    }
  });

  await client.activeRefreshToken.deleteMany({ where: { jti: payload.jti } });
}

async function register({ tenantName, email, password, role = DEFAULT_ROLE }) {
  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) {
    throw new ApiError(422, "Email already registered");
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const result = await prisma.$transaction(async (tx) => {
    const tenant = await tx.tenant.create({ data: { name: tenantName } });
    const user = await tx.user.create({
      data: {
        tenantId: tenant.id,
        email,
        passwordHash,
        role,
        emailVerifiedAt: env.nodeEnv === "test" ? new Date() : null
      }
    });
    const verificationToken = await createEmailToken(user.id, "VERIFY_EMAIL", tx);
    const tokens = env.nodeEnv === "test" ? await createActiveTokenSet(user, tx) : null;

    return { tenant, user, verificationToken, tokens };
  });

  await enqueueEmail({
    tenantId: result.tenant.id,
    to: result.user.email,
    subject: "Verify your LeanStock account",
    template: "VERIFY_EMAIL",
    payload: {
      heading: "Confirm your LeanStock account",
      message: "Click the button below to verify your email address. Protected LeanStock API routes stay blocked until verification is complete.",
      actionUrl: `${env.appBaseUrl}/api/v1/auth/verify-email?token=${result.verificationToken}`
    }
  });

  return {
    user: publicUser(result.user),
    tokens: result.tokens || undefined,
    verificationRequired: true,
    verificationToken: env.nodeEnv === "test" ? result.verificationToken : undefined
  };
}

async function verifyEmail(token) {
  const record = await prisma.emailToken.findFirst({
    where: {
      tokenHash: hashToken(token),
      type: "VERIFY_EMAIL",
      usedAt: null,
      expiresAt: { gt: new Date() }
    }
  });

  if (!record) {
    throw new ApiError(401, "Invalid or expired verification token");
  }

  const user = await prisma.$transaction(async (tx) => {
    await tx.emailToken.update({ where: { id: record.id }, data: { usedAt: new Date() } });
    return tx.user.update({
      where: { id: record.userId },
      data: { emailVerifiedAt: new Date() }
    });
  });

  return { user: publicUser(user), message: "Email verified successfully" };
}

async function login({ email, password }) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.isActive) {
    throw new ApiError(401, "Invalid credentials");
  }

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) {
    throw new ApiError(401, "Invalid credentials");
  }

  if (!user.emailVerifiedAt && env.nodeEnv !== "test") {
    throw new ApiError(403, "Email verification is required before login");
  }

  const activeSession = await findActiveSession(user.id);
  if (activeSession) {
    throw new ApiError(409, "User is already logged in");
  }

  return { user: publicUser(user), tokens: await createActiveTokenSet(user) };
}

async function refresh(refreshToken) {
  const payload = verifyRefreshToken(refreshToken);
  const [revoked, activeSession] = await Promise.all([
    prisma.revokedRefreshToken.findUnique({ where: { jti: payload.jti } }),
    prisma.activeRefreshToken.findUnique({ where: { jti: payload.jti } })
  ]);

  if (revoked || !activeSession || activeSession.expiresAt <= new Date()) {
    throw new ApiError(401, "Invalid or expired refresh token");
  }

  const user = await prisma.user.findFirst({
    where: { id: payload.sub, isActive: true, emailVerifiedAt: { not: null } }
  });
  if (!user) {
    throw new ApiError(401, "Invalid or expired refresh token");
  }

  return prisma.$transaction(async (tx) => {
    await revokeRefreshPayload(payload, tx);
    return createActiveTokenSet(user, tx);
  });
}

async function logout(refreshToken) {
  const payload = verifyRefreshToken(refreshToken);
  await revokeRefreshPayload(payload);

  return { message: "Logged out successfully" };
}

async function requestPasswordReset(email) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return { message: "If the email exists, a reset link has been queued" };
  }

  const token = await createEmailToken(user.id, "PASSWORD_RESET");
  await enqueueEmail({
    tenantId: user.tenantId,
    to: user.email,
    subject: "Reset your LeanStock password",
    template: "PASSWORD_RESET",
    payload: {
      heading: "Reset your password",
      message: "This link expires in 60 minutes.",
      actionUrl: `${env.appBaseUrl}/api/v1/auth/reset-password?token=${token}`
    }
  });

  return {
    message: "If the email exists, a reset link has been queued",
    resetToken: env.nodeEnv === "test" ? token : undefined
  };
}

async function resetPassword({ token, password }) {
  const record = await prisma.emailToken.findFirst({
    where: {
      tokenHash: hashToken(token),
      type: "PASSWORD_RESET",
      usedAt: null,
      expiresAt: { gt: new Date() }
    }
  });

  if (!record) {
    throw new ApiError(401, "Invalid or expired reset token");
  }

  const passwordHash = await bcrypt.hash(password, 12);
  await prisma.$transaction(async (tx) => {
    await tx.emailToken.update({ where: { id: record.id }, data: { usedAt: new Date() } });
    await tx.user.update({ where: { id: record.userId }, data: { passwordHash } });
    await tx.activeRefreshToken.deleteMany({ where: { userId: record.userId } });
  });

  return { message: "Password reset successfully" };
}

module.exports = {
  register,
  verifyEmail,
  login,
  refresh,
  logout,
  requestPasswordReset,
  resetPassword,
  publicUser,
  signTokens
};
