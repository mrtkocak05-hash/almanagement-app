const express = require('express')
const router = express.Router()
const ctrl = require('../controllers/dashboardController')

router.get('/', ctrl.getDashboard)
router.get('/ai-brief', ctrl.getAIBrief)
router.get('/portfolio-breakdown', ctrl.getPortfolioBreakdown)
router.get('/profitability', ctrl.getProfitability)
router.get('/alerts', ctrl.getAlerts)
router.get('/executive-summary', ctrl.getExecutiveSummary)
router.get('/kpis', ctrl.getKPIs)
router.get('/chart-data', ctrl.getChartData)
router.get('/executive-score', ctrl.getExecutiveScore)
router.get('/top-investments', ctrl.getTopInvestments)
router.get('/top-expense-assets', ctrl.getTopExpenseAssets)
router.get('/balance-summary', ctrl.getBalanceSummary)

module.exports = router
