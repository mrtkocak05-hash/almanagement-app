const express = require('express')
const router = express.Router()
const ctrl = require('../controllers/aiMemoryController')
const { requireAuth } = require('../middleware/auth')

router.use(requireAuth)

router.get('/', ctrl.list)
router.post('/', ctrl.create)
router.get('/summary', ctrl.getSummary)
router.delete('/clear', ctrl.clear)

module.exports = router
