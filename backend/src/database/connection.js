const { createDatabase } = require('./init')

let db = null

function getDb() {
  if (!db) {
    db = createDatabase()
  }
  return db
}

function closeDb() {
  if (db) {
    db.close()
    db = null
  }
}

module.exports = { getDb, closeDb }
