const jwt = require('jsonwebtoken')
const { getDb } = require('../database/connection')

const JWT_SECRET = process.env.JWT_SECRET || 'alm_jwt_secret_fallback'

function requireAuth(req, res, next) {
  const header = req.headers['authorization']
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Oturum gereklidir.' })
  }
  const token = header.slice(7)
  try {
    const payload = jwt.verify(token, JWT_SECRET)
    req.user = payload
    next()
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Oturum süresi doldu.', code: 'TOKEN_EXPIRED' })
    }
    return res.status(401).json({ success: false, message: 'Geçersiz token.', code: 'TOKEN_INVALID' })
  }
}

function optionalAuth(req, res, next) {
  const header = req.headers['authorization']
  if (!header || !header.startsWith('Bearer ')) return next()
  try {
    const payload = jwt.verify(header.slice(7), JWT_SECRET)
    req.user = payload
  } catch (_) {}
  next()
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ success: false, message: 'Oturum gereklidir.' })
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Bu işlem için yetkiniz yok.' })
    }
    next()
  }
}

function generateAccessToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role, full_name: user.full_name, company_id: user.company_id },
    JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '1h' }
  )
}

function generateRefreshToken(user) {
  const secret = process.env.JWT_REFRESH_SECRET || 'alm_refresh_secret_fallback'
  return jwt.sign(
    { id: user.id, type: 'refresh' },
    secret,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
  )
}

function verifyRefreshToken(token) {
  const secret = process.env.JWT_REFRESH_SECRET || 'alm_refresh_secret_fallback'
  return jwt.verify(token, secret)
}

module.exports = { requireAuth, optionalAuth, requireRole, generateAccessToken, generateRefreshToken, verifyRefreshToken }
