const express = require('express')
const router = express.Router()
const { requireAuth } = require('../middleware/auth')
const { apiLimiter } = require('../middleware/rateLimit')

router.get('/health', (_req, res) => {
  res.json({ success: true, message: 'AlManagement API is running', timestamp: new Date().toISOString(), version: '3.0.0' })
})

// Rate limit all API endpoints
router.use(apiLimiter)

// Public auth routes (no requireAuth)
router.use('/auth', require('./auth'))

// All other routes require authentication
router.use('/dashboard', requireAuth, require('./dashboard'))
router.use('/assets', requireAuth, require('./assets'))
router.use('/purchases', requireAuth, require('./purchases'))
router.use('/sales', requireAuth, require('./sales'))
router.use('/financial', requireAuth, require('./financial'))
router.use('/expenses', requireAuth, require('./expenses'))
router.use('/archive', requireAuth, require('./archive'))
router.use('/master-data', requireAuth, require('./masterData'))
router.use('/search', requireAuth, require('./search'))
router.use('/market-research', requireAuth, require('./marketResearch'))

// Sprint 10
router.use('/users', require('./users'))
router.use('/companies', require('./companies'))
router.use('/notifications', require('./notifications'))
router.use('/audit', require('./audit'))
router.use('/ai-memory', require('./aiMemory'))

// Sprint 11
router.use('/ai', require('./ai'))

// Sprint 12.2B
router.use('/doc-intel', require('./documentIntelligence'))

// Sprint 13.0
router.use('/vehicle-intel', require('./vehicleIntelligence'))

// Sprint 13.1
router.use('/vehicle-valuation', require('./vehicleValuation'))

// DEV-1.0: Developer Toolkit (ceo role only)
router.use('/dev', requireAuth, require('./dev'))

module.exports = router
