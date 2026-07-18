const express = require('express')
const router = express.Router()
const c = require('../controllers/financialController')

router.get('/summary', c.getSummary)

router.get('/cash-accounts', c.listCashAccounts)
router.post('/cash-accounts', c.createCashAccount)
router.put('/cash-accounts/:id', c.updateCashAccount)
router.delete('/cash-accounts/:id', c.deleteCashAccount)
router.post('/cash-accounts/:id/adjust', c.adjustCashBalance)

router.get('/bank-accounts', c.listBankAccounts)
router.post('/bank-accounts', c.createBankAccount)
router.put('/bank-accounts/:id', c.updateBankAccount)
router.delete('/bank-accounts/:id', c.deleteBankAccount)
router.post('/bank-accounts/:id/adjust', c.adjustBankBalance)

router.get('/credit-cards', c.listCreditCards)
router.post('/credit-cards', c.createCreditCard)
router.put('/credit-cards/:id', c.updateCreditCard)
router.delete('/credit-cards/:id', c.deleteCreditCard)

router.get('/capital-movements', c.listCapitalMovements)
router.post('/capital-movements', c.createCapitalMovement)
router.delete('/capital-movements/:id', c.deleteCapitalMovement)

router.get('/transfers', c.listTransfers)
router.post('/transfers', c.createTransfer)

router.get('/receivables', c.listReceivables)
router.post('/receivables', c.createReceivable)
router.post('/receivables/:id/collect', c.collectReceivable)
router.delete('/receivables/:id', c.deleteReceivable)

router.get('/payables', c.listPayables)
router.post('/payables', c.createPayable)
router.post('/payables/:id/pay', c.payPayable)
router.delete('/payables/:id', c.deletePayable)

router.get('/transactions', c.listTransactions)
router.post('/transactions', c.createTransaction)

module.exports = router
