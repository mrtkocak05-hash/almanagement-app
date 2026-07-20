'use strict'

// sql.js wrapper that mimics better-sqlite3 synchronous API for Lambda environments
const fs = require('fs')

let SQL = null

class Statement {
  constructor(database, sql) {
    this._database = database
    this._db = database._db
    this._sql = sql.trim()
  }

  _flatten(params) {
    const arr = (params.length === 1 && Array.isArray(params[0])) ? params[0] : params
    if (arr.length === 0) return undefined
    // sql.js doesn't accept undefined — convert to null
    return arr.map(v => (v === undefined ? null : v))
  }

  get(...params) {
    const p = this._flatten(params)
    const stmt = this._db.prepare(this._sql)
    if (p) stmt.bind(p)
    const row = stmt.step() ? stmt.getAsObject() : undefined
    stmt.free()
    return row
  }

  all(...params) {
    const p = this._flatten(params)
    const stmt = this._db.prepare(this._sql)
    if (p) stmt.bind(p)
    const rows = []
    while (stmt.step()) rows.push(stmt.getAsObject())
    stmt.free()
    return rows
  }

  run(...params) {
    const p = this._flatten(params)
    this._db.run(this._sql, p || [])
    const lastId = this._db.exec('SELECT last_insert_rowid()')[0]?.values[0]?.[0] ?? 0
    const changes = this._db.exec('SELECT changes()')[0]?.values[0]?.[0] ?? 0
    this._database._persist()
    return { lastInsertRowid: Number(lastId), changes: Number(changes) }
  }
}

class Database {
  constructor(filePath) {
    if (!SQL) throw new Error('[sqljs-compat] Not initialized — call initSqlJs() first')
    this._path = filePath || null
    this._inTransaction = false

    if (filePath && fs.existsSync(filePath)) {
      this._db = new SQL.Database(new Uint8Array(fs.readFileSync(filePath)))
      console.log('[DB] Loaded from', filePath)
    } else {
      this._db = new SQL.Database()
      console.log('[DB] Created new in-memory DB', filePath ? `→ ${filePath}` : '')
    }
  }

  prepare(sql) {
    return new Statement(this, sql)
  }

  exec(sql) {
    // WAL mode is not applicable in sql.js in-memory mode — skip it
    const cleaned = sql.replace(/PRAGMA\s+journal_mode\s*=\s*WAL\s*;?/gi, '')
    this._db.exec(cleaned)
    this._persist()
    return this
  }

  pragma(str) {
    if (/=/.test(str)) {
      try { this._db.run(`PRAGMA ${str}`) } catch (_) {}
      return
    }
    try {
      const res = this._db.exec(`PRAGMA ${str}`)
      if (!res?.length) return []
      const { columns, values } = res[0]
      return values.map(row => Object.fromEntries(columns.map((c, i) => [c, row[i]])))
    } catch (_) { return [] }
  }

  transaction(fn) {
    const self = this
    return function (...args) {
      self._db.run('BEGIN')
      self._inTransaction = true
      try {
        const result = fn(...args)
        self._db.run('COMMIT')
        self._inTransaction = false
        self._persist()
        return result
      } catch (e) {
        self._inTransaction = false
        try { self._db.run('ROLLBACK') } catch (_) {}
        throw e
      }
    }
  }

  close() {
    this._persist()
    this._db.close()
  }

  _persist() {
    if (this._inTransaction || !this._path) return
    try {
      fs.writeFileSync(this._path, Buffer.from(this._db.export()))
    } catch (e) {
      console.warn('[sqljs-compat] persist error:', e.message)
    }
  }
}

async function initSqlJs() {
  if (SQL) return
  const path = require('path')
  // Explicitly read wasm binary so nft bundler traces and includes the file
  const wasmPath = path.join(path.dirname(require.resolve('sql.js')), 'sql-wasm.wasm')
  const wasmBinary = fs.readFileSync(wasmPath)
  SQL = await require('sql.js')({ wasmBinary })
  console.log('[DB] sql.js initialized')
}

module.exports = { Database, initSqlJs }
