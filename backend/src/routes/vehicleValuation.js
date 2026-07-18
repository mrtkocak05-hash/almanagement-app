/**
 * Vehicle Valuation Routes — Sprint 13.1
 */

const router = require('express').Router()
const { requireAuth } = require('../middleware/auth')
const ctrl = require('../controllers/vehicleValuationController')

router.use(requireAuth)

// Quick anonymous valuation (no save)
router.post('/quick', ctrl.quickValuation)

// Dashboard opportunities
router.get('/dashboard', ctrl.getDashboardOpportunities)

// Purchase-linked valuation
router.get('/purchase/:purchaseId', ctrl.getPurchaseValuation)
router.post('/purchase/:purchaseId', ctrl.valuatePurchase)

// Asset-linked valuation
router.get('/asset/:assetId', ctrl.getAssetValuation)
router.post('/asset/:assetId', ctrl.valuateAsset)

module.exports = router
