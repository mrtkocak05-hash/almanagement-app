const bcrypt = require('bcryptjs')
const { getDb } = require('../database/connection')
const { createAuditLog } = require('../middleware/audit')

const ROLE_LABELS = {
  ceo: 'CEO', yonetici: 'Yönetici', muhasebe: 'Muhasebe', finans: 'Finans',
  satinalma: 'Satınalma', satis: 'Satış', operasyon: 'Operasyon', misafir: 'Misafir',
}

function formatUser(u) {
  return {
    id: u.id, company_id: u.company_id, full_name: u.full_name,
    email: u.email, phone: u.phone, avatar: u.avatar,
    role: u.role, role_label: ROLE_LABELS[u.role] ?? u.role,
    status: u.status, last_login: u.last_login, created_at: u.created_at,
  }
}

function list(req, res) {
  const db = getDb()
  const users = db.prepare(`SELECT * FROM users WHERE deleted_at IS NULL ORDER BY full_name`).all()
  res.json({ success: true, data: users.map(formatUser) })
}

function getUser(req, res) {
  const db = getDb()
  const user = db.prepare(`SELECT * FROM users WHERE id = ? AND deleted_at IS NULL`).get(req.params.id)
  if (!user) return res.status(404).json({ success: false, message: 'Kullanıcı bulunamadı.' })
  res.json({ success: true, data: formatUser(user) })
}

async function createUser(req, res) {
  const { full_name, email, phone, password, role, company_id, status } = req.body
  if (!full_name || !email || !password) {
    return res.status(400).json({ success: false, message: 'Ad soyad, e-posta ve şifre gereklidir.' })
  }
  const db = getDb()
  const existing = db.prepare(`SELECT id FROM users WHERE email = ?`).get(email.toLowerCase())
  if (existing) return res.status(400).json({ success: false, message: 'Bu e-posta zaten kayıtlı.' })

  const hash = await bcrypt.hash(password, 10)
  const result = db.prepare(`
    INSERT INTO users (company_id, full_name, email, phone, password_hash, role, status)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(company_id ?? 1, full_name, email.toLowerCase(), phone ?? null, hash, role ?? 'misafir', status ?? 'active')

  createAuditLog({ userId: req.user?.id, userName: req.user?.full_name, action: 'create_user', module: 'users', recordId: result.lastInsertRowid, req })
  res.status(201).json({ success: true, data: { id: result.lastInsertRowid } })
}

async function updateUser(req, res) {
  const db = getDb()
  const user = db.prepare(`SELECT * FROM users WHERE id = ? AND deleted_at IS NULL`).get(req.params.id)
  if (!user) return res.status(404).json({ success: false, message: 'Kullanıcı bulunamadı.' })

  const { full_name, phone, role, avatar, status } = req.body
  const old = formatUser(user)

  db.prepare(`UPDATE users SET full_name = ?, phone = ?, role = ?, avatar = ?, status = ?, updated_at = datetime('now') WHERE id = ?`)
    .run(full_name ?? user.full_name, phone ?? user.phone, role ?? user.role, avatar ?? user.avatar, status ?? user.status, user.id)

  createAuditLog({ userId: req.user?.id, userName: req.user?.full_name, action: 'update_user', module: 'users', recordId: user.id, oldValues: old, req })
  res.json({ success: true, data: { id: user.id } })
}

function deleteUser(req, res) {
  const db = getDb()
  if (parseInt(req.params.id) === req.user?.id) {
    return res.status(400).json({ success: false, message: 'Kendinizi silemezsiniz.' })
  }
  db.prepare(`UPDATE users SET deleted_at = datetime('now') WHERE id = ?`).run(req.params.id)
  createAuditLog({ userId: req.user?.id, userName: req.user?.full_name, action: 'delete_user', module: 'users', recordId: req.params.id, req })
  res.json({ success: true, data: null })
}

function updateProfile(req, res) {
  const db = getDb()
  const { full_name, phone, avatar } = req.body
  db.prepare(`UPDATE users SET full_name = ?, phone = ?, avatar = ?, updated_at = datetime('now') WHERE id = ?`)
    .run(full_name ?? null, phone ?? null, avatar ?? null, req.user.id)
  res.json({ success: true, data: { id: req.user.id } })
}

function getPermissions(req, res) {
  const db = getDb()
  const perms = db.prepare(`SELECT * FROM user_permissions WHERE user_id = ?`).all(req.params.id)
  res.json({ success: true, data: perms })
}

function setPermission(req, res) {
  const db = getDb()
  const { module, can_read = 1, can_write = 0, can_update = 0, can_delete = 0, can_export = 0, can_ai = 0 } = req.body
  if (!module) return res.status(400).json({ success: false, message: 'Modül gereklidir.' })
  db.prepare(`
    INSERT INTO user_permissions (user_id, module, can_read, can_write, can_update, can_delete, can_export, can_ai)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(user_id, module) DO UPDATE SET
      can_read=excluded.can_read, can_write=excluded.can_write,
      can_update=excluded.can_update, can_delete=excluded.can_delete,
      can_export=excluded.can_export, can_ai=excluded.can_ai,
      updated_at=datetime('now')
  `).run(req.params.id, module, can_read, can_write, can_update, can_delete, can_export, can_ai)
  res.json({ success: true, data: null })
}

module.exports = { list, getUser, createUser, updateUser, deleteUser, updateProfile, getPermissions, setPermission }
