const jwt = require("jsonwebtoken");
const env = require("../config/env");
const { prisma } = require("../config/database");
const ApiError = require("../utils/ApiError");

async function authenticate(req, _res, next) {
  const header = req.headers.authorization || "";
  const [scheme, token] = header.split(" ");

  if (scheme !== "Bearer" || !token) {
    return next(new ApiError(401, "JWT token is missing or invalid"));
  }

  try {
    const payload = jwt.verify(token, env.jwtSecret);
    const user = await prisma.user.findFirst({
      where: {
        id: payload.sub,
        isActive: true,
        ...(env.nodeEnv === "test" ? {} : { emailVerifiedAt: { not: null } })
      },
      select: { id: true, tenantId: true, email: true, role: true, isActive: true, emailVerifiedAt: true }
    });

    if (!user) {
      throw new ApiError(401, "JWT token is missing or invalid");
    }

    req.user = user;
    req.tenantId = user.tenantId;
    return next();
  } catch (error) {
    return next(error instanceof ApiError ? error : new ApiError(401, "JWT token is missing or invalid"));
  }
}

module.exports = authenticate;
