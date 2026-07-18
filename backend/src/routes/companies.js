const express = require('express')
const router = express.Router()
const ctrl = require('../controllers/companiesController')
const { requireAuth, requireRole } = require('../middleware/auth')
const { sanitizeMiddleware } = require('../middleware/validate')

router.use(requireAuth)
router.use(sanitizeMiddleware)

router.get('/', ctrl.list)
router.get('/:id', ctrl.getCompany)
router.post('/', requireRole('ceo'), ctrl.createCompany)
router.put('/:id', requireRole('ceo', 'yonetici'), ctrl.updateCompany)

module.exports = router
