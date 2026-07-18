const express = require('express')
const router = express.Router()
const ctrl = require('../controllers/notificationsController')
const { requireAuth } = require('../middleware/auth')

router.use(requireAuth)

router.get('/', ctrl.list)
router.get('/unread-count', ctrl.unreadCount)
router.put('/mark-all-read', ctrl.markAllRead)
router.put('/:id/read', ctrl.markRead)
router.delete('/:id', ctrl.deleteNotification)

module.exports = router
