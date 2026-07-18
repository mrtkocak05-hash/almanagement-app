const express = require('express')
const router = express.Router()
const ctrl = require('../controllers/usersController')
const { requireAuth, requireRole } = require('../middleware/auth')
const { sanitizeMiddleware } = require('../middleware/validate')

router.use(requireAuth)
router.use(sanitizeMiddleware)

router.get('/', ctrl.list)
router.get('/:id', ctrl.getUser)
router.post('/', requireRole('ceo', 'yonetici'), ctrl.createUser)
router.put('/profile', ctrl.updateProfile)
router.put('/:id', requireRole('ceo', 'yonetici'), ctrl.updateUser)
router.delete('/:id', requireRole('ceo'), ctrl.deleteUser)
router.get('/:id/permissions', ctrl.getPermissions)
router.put('/:id/permissions', requireRole('ceo', 'yonetici'), ctrl.setPermission)

module.exports = router
