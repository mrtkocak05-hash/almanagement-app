const { getDb } = require('../database/connection')

function createAuditLog({ userId, userName, action, module, recordId, oldValues, newValues, req }) {
  try {
    const db = getDb()
    const ip = req?.headers?.['x-forwarded-for'] || req?.socket?.remoteAddress || null
    const ua = req?.headers?.['user-agent'] || null
    db.prepare(`
      INSERT INTO audit_logs (user_id, user_name, action, module, record_id, old_values, new_values, ip_address, user_agent)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      userId ?? null,
      userName ?? null,
      action,
      module,
      recordId ?? null,
      oldValues ? JSON.stringify(oldValues) : null,
      newValues ? JSON.stringify(newValues) : null,
      ip,
      ua,
    )
  } catch (_) {}
}

function auditMiddleware(module, action) {
  return (req, res, next) => {
    const originalJson = res.json.bind(res)
    res.json = function (body) {
      if (res.statusCode < 400 && req.user) {
        createAuditLog({
          userId: req.user?.id,
          userName: req.user?.full_name,
          action,
          module,
          recordId: body?.data?.id ?? req.params?.id ?? null,
          req,
        })
      }
      return originalJson(body)
    }
    next()
  }
}

module.exports = { createAuditLog, auditMiddleware }
