/**
 * Vehicle Intelligence Routes — Sprint 13.0
 */

const router = require('express').Router()
const { requireAuth } = require('../middleware/auth')
const ctrl = require('../controllers/vehicleIntelligenceController')

router.use(requireAuth)

// Dashboard widget stats
router.get('/dashboard', ctrl.getDashboardStats)

// Full vehicle intelligence by assetId
router.get('/:assetId', ctrl.getByAsset)

// Expert info
router.post('/:assetId/expert', ctrl.saveExpert)

// Body parts damage map
router.post('/:assetId/parts', ctrl.saveParts)

// Photos
router.post('/:assetId/photos', ctrl.uploadPhoto)
router.delete('/photos/:photoId', ctrl.deletePhoto)

// Tires
router.post('/:assetId/tires', ctrl.saveTires)

// Battery
router.post('/:assetId/battery', ctrl.saveBattery)

// Maintenance
router.get('/:assetId/maintenance', ctrl.getMaintenance)
router.post('/:assetId/maintenance', ctrl.addMaintenance)
router.put('/maintenance/:id', ctrl.updateMaintenance)
router.delete('/maintenance/:id', ctrl.deleteMaintenance)

// AI score generation
router.post('/:assetId/ai-score', ctrl.generateScore)

module.exports = router
