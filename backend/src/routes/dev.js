const express = require('express')
const router = express.Router()
const { requireRole } = require('../middleware/auth')
const ctrl = require('../controllers/devController')

// requireAuth is applied at the index.js level for /dev
// requireRole('ceo') restricts to admin only
const adminOnly = requireRole('ceo')

router.get('/status',              adminOnly, ctrl.getStatus)
router.post('/reset-database',     adminOnly, ctrl.resetDatabase)
router.post('/load-demo-data',     adminOnly, ctrl.loadDemoData)
router.post('/clear-demo',         adminOnly, ctrl.clearDemo)
router.post('/rebuild-dashboard',  adminOnly, ctrl.rebuildDashboard)
router.post('/create-demo-company',adminOnly, ctrl.createDemoCompany)
router.get('/statistics',          adminOnly, ctrl.getStatistics)

module.exports = router
