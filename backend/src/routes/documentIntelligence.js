const express    = require('express')
const router     = express.Router()
const { requireAuth } = require('../middleware/auth')
const ctrl       = require('../controllers/documentIntelligenceController')

router.use(requireAuth)

router.get('/health',         ctrl.getDocumentHealth)
router.get('/health/assets',  ctrl.getHealthByAsset)
router.get('/missing',        ctrl.getMissingDocuments)
router.get('/expiring',       ctrl.getExpiringDocuments)
router.get('/stats',          ctrl.getStats)
router.post('/:documentId',   ctrl.processDocument)
router.get('/:documentId',    ctrl.getIntelligence)

module.exports = router
