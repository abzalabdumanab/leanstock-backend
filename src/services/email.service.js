const nodemailer = require("nodemailer");
const env = require("../config/env");
const { prisma } = require("../config/database");
const { redis } = require("../config/redis");

const QUEUE_KEY = "leanstock:email:queue";

function renderEmail(job) {
  const payload = job.payload || {};
  const safe = (value) => String(value || "").replace(/[<>&]/g, (char) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;" }[char]));
  const lines = [
    payload.heading || job.subject,
    "",
    payload.message || "",
    payload.actionUrl ? `Open this link: ${payload.actionUrl}` : "",
    "",
    "If you did not request this email, you can ignore it.",
    "LeanStock"
  ].filter(Boolean);

  return {
    text: lines.join("\n"),
    html: [
      `<h2>${safe(payload.heading || job.subject)}</h2>`,
      payload.message ? `<p>${safe(payload.message)}</p>` : "",
      payload.actionUrl ? `<p><a href="${safe(payload.actionUrl)}" style="display:inline-block;padding:10px 16px;background:#111827;color:#ffffff;text-decoration:none;border-radius:6px">Verify email</a></p>` : "",
      payload.actionUrl ? `<p style="font-size:12px;color:#6b7280">Or open this link: ${safe(payload.actionUrl)}</p>` : "",
      `<p style="font-size:12px;color:#6b7280">If you did not request this email, you can ignore it.</p>`,
      `<p>LeanStock</p>`
    ].filter(Boolean).join("")
  };
}

function createTransport() {
  if (!env.smtp.host) {
    return null;
  }

  return nodemailer.createTransport({
    host: env.smtp.host,
    port: env.smtp.port,
    secure: env.smtp.port === 465,
    auth: env.smtp.user ? { user: env.smtp.user, pass: env.smtp.pass } : undefined
  });
}

async function enqueueEmail({ tenantId, to, subject, template, payload }) {
  const job = await prisma.emailJob.create({
    data: { tenantId, to, subject, template, payload }
  });

  try {
    await redis.rpush(QUEUE_KEY, job.id);
  } catch (_error) {
    // The database status remains observable if Redis is temporarily down.
  }

  return job;
}

async function sendJob(job) {
  const rendered = renderEmail(job);
  const transport = createTransport();

  if (!transport) {
    return { skipped: true, reason: "SMTP is not configured" };
  }

  await transport.sendMail({
    from: env.smtp.from,
    to: job.to,
    subject: job.subject,
    text: rendered.text,
    html: rendered.html
  });

  return { skipped: false };
}

async function processOneEmailJob() {
  let jobId;

  try {
    jobId = await redis.lpop(QUEUE_KEY);
  } catch (_error) {
    const fallback = await prisma.emailJob.findFirst({
      where: { status: "QUEUED" },
      orderBy: { createdAt: "asc" }
    });
    jobId = fallback?.id;
  }

  if (!jobId) {
    return null;
  }

  const job = await prisma.emailJob.update({
    where: { id: jobId },
    data: { status: "PROCESSING", attempts: { increment: 1 } }
  });

  try {
    const result = await sendJob(job);
    return prisma.emailJob.update({
      where: { id: job.id },
      data: {
        status: "COMPLETED",
        lastError: result.skipped ? result.reason : null,
        processedAt: new Date()
      }
    });
  } catch (error) {
    const failed = await prisma.emailJob.update({
      where: { id: job.id },
      data: {
        status: job.attempts + 1 >= 3 ? "FAILED" : "QUEUED",
        lastError: error.message,
        processedAt: new Date()
      }
    });

    if (failed.status === "QUEUED") {
      try {
        await redis.rpush(QUEUE_KEY, failed.id);
      } catch (_error) {
        // It will still be picked by DB fallback.
      }
    }

    return failed;
  }
}

async function queueStats(tenantId) {
  const where = tenantId ? { tenantId } : {};
  const [queued, processing, completed, failed] = await Promise.all([
    prisma.emailJob.count({ where: { ...where, status: "QUEUED" } }),
    prisma.emailJob.count({ where: { ...where, status: "PROCESSING" } }),
    prisma.emailJob.count({ where: { ...where, status: "COMPLETED" } }),
    prisma.emailJob.count({ where: { ...where, status: "FAILED" } })
  ]);

  return { queued, processing, completed, failed };
}

module.exports = { enqueueEmail, processOneEmailJob, queueStats, QUEUE_KEY };
