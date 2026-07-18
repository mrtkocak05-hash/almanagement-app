const express = require('express')
const router = express.Router()
const ctrl = require('../controllers/expensesController')
const { docUpload } = require('../middleware/upload')

router.get('/summary', ctrl.getSummary)
router.get('/form-context', ctrl.getFormContext)
router.get('/categories', ctrl.listCategories)
router.get('/reports', ctrl.getReports)
router.get('/', ctrl.listExpenses)
router.post('/', ctrl.createExpense)
router.get('/:id', ctrl.getExpense)
router.put('/:id', ctrl.updateExpense)
router.delete('/:id', ctrl.deleteExpense)
router.post('/:id/documents', docUpload.single('document'), ctrl.uploadDocument)
router.delete('/:id/documents/:docId', ctrl.deleteDocument)

module.exports = router
