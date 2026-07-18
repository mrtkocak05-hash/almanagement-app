const bcrypt = require('bcryptjs')
const crypto = require('crypto')
const { getDb } = require('../database/connection')
const { generateAccessToken, generateRefreshToken, verifyRefreshToken } = require('../middleware/auth')
const { createAuditLog } = require('../middleware/audit')

const ROLE_LABELS = {
  ceo: 'CEO', yonetici: 'Yönetici', muhasebe: 'Muhasebe', finans: 'Finans',
  satinalma: 'Satınalma', satis: 'Satış', operasyon: 'Operasyon', misafir: 'Misafir',
}

function formatUser(u) {
  return {
    id: u.id,
    full_name: u.full_name,
    email: u.email,
    phone: u.phone,
    avatar: u.avatar,
    role: u.role,
    role_label: ROLE_LABELS[u.role] ?? u.role,
    company_id: u.company_id,
    status: u.status,
    last_login: u.last_login,
  }
}

async function login(req, res) {
  const { email, password, remember_me } = req.body
  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'E-posta ve şifre gereklidir.' })
  }

  const db = getDb()
  const user = db.prepare(`SELECT * FROM users WHERE email = ? AND deleted_at IS NULL`).get(email.toLowerCase().trim())

  if (!user) return res.status(401).json({ success: false, message: 'E-posta veya şifre hatalı.' })
  if (user.status !== 'active') return res.status(403).json({ success: false, message: 'Hesabınız devre dışı.' })

  const valid = await bcrypt.compare(password, user.password_hash)
  if (!valid) return res.status(401).json({ success: false, message: 'E-posta veya şifre hatalı.' })

  const accessToken = generateAccessToken(user)
  const refreshToken = generateRefreshToken(user)

  const tokenTtl = remember_me ? 7 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000
  const expiresAt = new Date(Date.now() + tokenTtl).toISOString()
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress
  const ua = req.headers['user-agent']
  db.prepare(`INSERT INTO refresh_tokens (user_id, token, expires_at, ip_address, user_agent) VALUES (?, ?, ?, ?, ?)`)
    .run(user.id, refreshToken, expiresAt, ip, ua)

  db.prepare(`UPDATE users SET last_login = datetime('now') WHERE id = ?`).run(user.id)

  createAuditLog({ userId: user.id, userName: user.full_name, action: 'login', module: 'auth', req })

  res.json({ success: true, data: { user: formatUser(user), accessToken, refreshToken } })
}

async function logout(req, res) {
  const { refreshToken } = req.body
  if (refreshToken) {
    const db = getDb()
    db.prepare(`DELETE FROM refresh_tokens WHERE token = ?`).run(refreshToken)
  }
  if (req.user) {
    createAuditLog({ userId: req.user.id, userName: req.user.full_name, action: 'logout', module: 'auth', req })
  }
  res.json({ success: true, data: null })
}

function refresh(req, res) {
  const { refreshToken } = req.body
  if (!refreshToken) return res.status(400).json({ success: false, message: 'Refresh token gereklidir.' })

  try {
    const payload = verifyRefreshToken(refreshToken)
    const db = getDb()

    const stored = db.prepare(`SELECT * FROM refresh_tokens WHERE token = ? AND expires_at > datetime('now')`).get(refreshToken)
    if (!stored) return res.status(401).json({ success: false, message: 'Geçersiz refresh token.' })

    const user = db.prepare(`SELECT * FROM users WHERE id = ? AND deleted_at IS NULL AND status = 'active'`).get(payload.id)
    if (!user) return res.status(401).json({ success: false, message: 'Kullanıcı bulunamadı.' })

    const accessToken = generateAccessToken(user)
    res.json({ success: true, data: { accessToken, user: formatUser(user) } })
  } catch {
    res.status(401).json({ success: false, message: 'Geçersiz refresh token.' })
  }
}

function me(req, res) {
  const db = getDb()
  const user = db.prepare(`SELECT * FROM users WHERE id = ? AND deleted_at IS NULL`).get(req.user.id)
  if (!user) return res.status(404).json({ success: false, message: 'Kullanıcı bulunamadı.' })
  res.json({ success: true, data: formatUser(user) })
}

function forgotPassword(req, res) {
  const { email } = req.body
  if (!email) return res.status(400).json({ success: false, message: 'E-posta gereklidir.' })

  const db = getDb()
  const user = db.prepare(`SELECT id FROM users WHERE email = ? AND deleted_at IS NULL`).get(email.toLowerCase().trim())

  // Always respond with success (don't leak if email exists)
  if (user) {
    const token = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString() // 1h
    db.prepare(`INSERT OR REPLACE INTO password_resets (user_id, token, expires_at) VALUES (?, ?, ?)`).run(user.id, token, expiresAt)
    // TODO: Send email with reset link
    console.log(`[Auth] Password reset token for ${email}: ${token}`)
  }

  res.json({ success: true, data: { message: 'Şifre sıfırlama talimatları e-posta adresinize gönderildi (demo modunda konsola yazdırıldı).' } })
}

async function resetPassword(req, res) {
  const { token, password } = req.body
  if (!token || !password) return res.status(400).json({ success: false, message: 'Token ve yeni şifre gereklidir.' })
  if (password.length < 8) return res.status(400).json({ success: false, message: 'Şifre en az 8 karakter olmalıdır.' })

  const db = getDb()
  const reset = db.prepare(`SELECT * FROM password_resets WHERE token = ? AND expires_at > datetime('now') AND used = 0`).get(token)
  if (!reset) return res.status(400).json({ success: false, message: 'Geçersiz veya süresi dolmuş token.' })

  const hash = await bcrypt.hash(password, 10)
  db.prepare(`UPDATE users SET password_hash = ?, updated_at = datetime('now') WHERE id = ?`).run(hash, reset.user_id)
  db.prepare(`UPDATE password_resets SET used = 1 WHERE id = ?`).run(reset.id)

  res.json({ success: true, data: { message: 'Şifreniz başarıyla güncellendi.' } })
}

async function changePassword(req, res) {
  const { current_password, new_password } = req.body
  if (!current_password || !new_password) return res.status(400).json({ success: false, message: 'Mevcut ve yeni şifre gereklidir.' })
  if (new_password.length < 8) return res.status(400).json({ success: false, message: 'Yeni şifre en az 8 karakter olmalıdır.' })

  const db = getDb()
  const user = db.prepare(`SELECT * FROM users WHERE id = ?`).get(req.user.id)
  const valid = await bcrypt.compare(current_password, user.password_hash)
  if (!valid) return res.status(400).json({ success: false, message: 'Mevcut şifre hatalı.' })

  const hash = await bcrypt.hash(new_password, 10)
  db.prepare(`UPDATE users SET password_hash = ?, updated_at = datetime('now') WHERE id = ?`).run(hash, req.user.id)
  createAuditLog({ userId: req.user.id, userName: req.user.full_name, action: 'change_password', module: 'auth', req })
  res.json({ success: true, data: { message: 'Şifre başarıyla güncellendi.' } })
}

module.exports = { login, logout, refresh, me, forgotPassword, resetPassword, changePassword }
