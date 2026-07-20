'use strict'

let handler = null
let initError = null

async function initialize() {
  try {
    handler = require('../backend/src/app')
  } catch (e) {
    initError = e
    console.error('[Vercel] Init failed:', e.message)
  }
}

const initPromise = initialize()

module.exports = async (req, res) => {
  await initPromise
  if (initError) {
    res.status(500).json({ error: initError.message })
    return
  }
  return handler(req, res)
}
