require('dotenv').config()

const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const path = require('path')
const { notFound, errorHandler } = require('./middleware/errorHandler')
const requestLogger = require('./middleware/requestLogger')
const routes = require('./routes')
const { getDb } = require('./database/connection')

const app = express()
const PORT = process.env.PORT || 3001

// Initialize database on startup
getDb()

// Security
app.use(helmet())

// CORS
const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5173')
  .split(',')
  .map(o => o.trim())
app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin || allowedOrigins.includes(origin)) return cb(null, true)
      cb(new Error('CORS not allowed'))
    },
    credentials: true,
  })
)

// Body parsing
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))

// Logging
app.use(requestLogger)

// Serve uploaded files
app.use('/storage', express.static(path.join(__dirname, '../../storage')))

// API Routes
app.use('/api', routes)

// 404 + Error handlers
app.use(notFound)
app.use(errorHandler)

app.listen(PORT, () => {
  console.log(`[Server] AlManagement API running on http://localhost:${PORT}`)
  console.log(`[Server] Environment: ${process.env.NODE_ENV || 'development'}`)
})

// Graceful shutdown
process.on('SIGTERM', () => {
  const { closeDb } = require('./database/connection')
  closeDb()
  process.exit(0)
})
