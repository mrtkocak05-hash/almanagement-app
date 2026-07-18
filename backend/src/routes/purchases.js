const express = require('express')
const router = express.Router()
const ctrl = require('../controllers/purchasesController')
const { docUpload } = require('../middleware/upload')

router.get('/', ctrl.listPurchases)
router.post('/', ctrl.createPurchase)
router.get('/:id', ctrl.getPurchase)
router.put('/:id', ctrl.updatePurchase)
router.delete('/:id', ctrl.deletePurchase)
router.post('/:id/complete', ctrl.completePurchase)

router.post('/:id/expenses', ctrl.addExpense)
router.delete('/:id/expenses/:eid', ctrl.deleteExpense)

router.post('/:id/partners', ctrl.addPurchasePartner)
router.delete('/:id/partners/:pid', ctrl.deletePurchasePartner)

router.post('/:id/documents', docUpload.single('document'), ctrl.uploadPurchaseDocument)
router.delete('/:id/documents/:docId', ctrl.deletePurchaseDocument)

module.exports = router
