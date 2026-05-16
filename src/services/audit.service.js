const { prisma } = require("../config/database");
const { pagePagination, buildPageMeta } = require("../utils/pagination");

async function recordAudit({ tenantId, actorId, action, entity, entityId, metadata }, client = prisma) {
  return client.auditLog.create({
    data: {
      tenantId: tenantId || null,
      actorId: actorId || null,
      action,
      entity,
      entityId: entityId || null,
      metadata: metadata || undefined
    }
  });
}

async function safeRecordAudit(event, client = prisma) {
  try {
    return await recordAudit(event, client);
  } catch (error) {
    console.error(`Audit log write failed: ${error.message}`);
    return null;
  }
}

async function listAuditLogs(user, query) {
  const { page, limit, skip } = pagePagination(query);
  const where = {
    ...(user.role === "SUPER_ADMIN" ? {} : { tenantId: user.tenantId }),
    ...(query.tenantId && user.role === "SUPER_ADMIN" ? { tenantId: query.tenantId } : {}),
    ...(query.action ? { action: query.action } : {}),
    ...(query.entity ? { entity: query.entity } : {}),
    ...(query.entityId ? { entityId: query.entityId } : {}),
    ...(query.actorId ? { actorId: query.actorId } : {})
  };

  const [total, data] = await Promise.all([
    prisma.auditLog.count({ where }),
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit
    })
  ]);

  return { data, pagination: buildPageMeta(total, page, limit) };
}

module.exports = { recordAudit, safeRecordAudit, listAuditLogs };
