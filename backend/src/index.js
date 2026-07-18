const app = require('./app')

const PORT = process.env.PORT || 3001

app.listen(PORT, () => {
  console.log(`[Server] AlManagement API running on http://localhost:${PORT}`)
  console.log(`[Server] Environment: ${process.env.NODE_ENV || 'development'}`)
})

process.on('SIGTERM', () => {
  const { closeDb } = require('./database/connection')
  closeDb()
  process.exit(0)
})
