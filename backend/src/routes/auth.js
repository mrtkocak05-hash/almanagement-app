const express = require('express')
const router = express.Router()
const ctrl = require('../controllers/authController')
const { requireAuth } = require('../middleware/auth')
const { authLimiter } = require('../middleware/rateLimit')
const { sanitizeMiddleware } = require('../middleware/validate')

router.use(sanitizeMiddleware)

router.post('/login', authLimiter, ctrl.login)
router.post('/logout', ctrl.logout)
router.post('/refresh', ctrl.refresh)
router.get('/me', requireAuth, ctrl.me)
router.post('/forgot-password', ctrl.forgotPassword)
router.post('/reset-password', ctrl.resetPassword)
router.post('/change-password', requireAuth, ctrl.changePassword)

module.exports = router
