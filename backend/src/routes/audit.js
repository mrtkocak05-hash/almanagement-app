const express = require('express')
const router = express.Router()
const ctrl = require('../controllers/auditController')
const { requireAuth, requireRole } = require('../middleware/auth')

router.use(requireAuth)
router.use(requireRole('ceo', 'yonetici'))

router.get('/', ctrl.list)
router.get('/:id', ctrl.getLog)

module.exports = router
