const express = require('express')
const router = express.Router()
const ctrl = require('../controllers/salesController')
const { docUpload } = require('../middleware/upload')

router.get('/asset-context/:assetId', ctrl.getAssetContext)

router.get('/', ctrl.listSales)
router.post('/', ctrl.createSale)
router.get('/:id', ctrl.getSale)
router.delete('/:id', ctrl.deleteSale)
router.post('/:id/complete', ctrl.completeSale)

router.post('/:id/expenses', ctrl.addSaleExpense)
router.delete('/:id/expenses/:eid', ctrl.deleteSaleExpense)

router.post('/:id/documents', docUpload.single('document'), ctrl.uploadSaleDocument)
router.delete('/:id/documents/:docId', ctrl.deleteSaleDocument)

module.exports = router
