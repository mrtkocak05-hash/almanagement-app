// Input sanitization helpers — XSS + SQL injection prevention

// Password fields must never be sanitized — bcrypt needs the raw value
const SKIP_SANITIZE_KEYS = new Set(['password', 'current_password', 'new_password'])

function sanitizeString(str) {
  if (typeof str !== 'string') return str
  return str
    .replace(/<[^>]*>/g, '') // strip HTML tags
    .replace(/['"`;]/g, '')   // strip SQL dangerous chars
    .trim()
}

function sanitizeBody(obj) {
  if (!obj || typeof obj !== 'object') return obj
  const out = {}
  for (const [k, v] of Object.entries(obj)) {
    if (SKIP_SANITIZE_KEYS.has(k)) { out[k] = v; continue }
    if (typeof v === 'string') out[k] = sanitizeString(v)
    else if (typeof v === 'object' && v !== null) out[k] = sanitizeBody(v)
    else out[k] = v
  }
  return out
}

function sanitizeMiddleware(req, _res, next) {
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeBody(req.body)
  }
  next()
}

function requireFields(...fields) {
  return (req, res, next) => {
    const missing = fields.filter(f => !req.body[f] && req.body[f] !== 0)
    if (missing.length > 0) {
      return res.status(400).json({ success: false, message: `Zorunlu alanlar eksik: ${missing.join(', ')}` })
    }
    next()
  }
}

module.exports = { sanitizeMiddleware, sanitizeString, requireFields }
