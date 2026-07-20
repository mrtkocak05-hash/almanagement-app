require('dotenv').config()

const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const path = require('path')
const { notFound, errorHandler } = require('./middleware/errorHandler')
const requestLogger = require('./middleware/requestLogger')
const routes = require('./routes')
const { getDb } = require('./database/connection')

// Initialize database
getDb()

const app = express()

// Security
app.use(helmet())

// CORS — allow localhost + any configured origin(s)
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

// Serve React build (frontend)
const distPath = path.join(__dirname, '../../dist')
app.use(express.static(distPath))

// API Routes
app.use('/api', routes)

// SPA fallback — serve index.html for any non-API route
app.get('/{*path}', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'))
})

// 404 + Error handlers
app.use(notFound)
app.use(errorHandler)

module.exports = app
