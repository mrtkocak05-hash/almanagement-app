const express = require('express')
const router = express.Router()
const { requireAuth } = require('../middleware/auth')
const {
  chat, analyze, getLogs, getCosts, getSettings, updateSettings, getProviderStatus,
  healthCheck,
  askDecision, analyzeInvestment, analyzePortfolio, analyzeExpense, analyzeSale,
  generateRecommendation, forecast, compare,
} = require('../controllers/aiController')
const {
  saveMemory, getRecentMemories, getTopMemories,
  searchMemory, findRelated, updateImportance, archiveMemory,
  list: memList, create: memCreate, clear: memClear, getSummary,
} = require('../controllers/aiMemoryController')
const { getTasks, createTask, updateTask, deleteTask } = require('../controllers/aiTaskController')
const { getDimensionInsight, getAllInsights } = require('../controllers/insightController')

router.use(requireAuth)

// ── Settings & Status ────────────────────────────────────────────────────────
router.get('/settings',         getSettings)
router.put('/settings',         updateSettings)
router.get('/provider-status',  getProviderStatus)
router.get('/provider/health',  healthCheck)

// ── Core AI ──────────────────────────────────────────────────────────────────
router.post('/chat',    chat)
router.post('/analyze', analyze)
router.get('/logs',     getLogs)
router.get('/costs',    getCosts)

// ── Decision Center ──────────────────────────────────────────────────────────
router.post('/decision',            askDecision)
router.post('/decision/investment', analyzeInvestment)
router.post('/decision/portfolio',  analyzePortfolio)
router.post('/decision/expense',    analyzeExpense)
router.post('/decision/sale',       analyzeSale)
router.post('/decision/recommend',  generateRecommendation)
router.post('/decision/forecast',   forecast)
router.post('/decision/compare',    compare)

// ── Memory V4 ────────────────────────────────────────────────────────────────
router.get('/memories',              getRecentMemories)
router.get('/memories/top',          getTopMemories)
router.post('/memories',             saveMemory)
router.post('/memories/search',      searchMemory)
router.post('/memories/related',     findRelated)
router.put('/memories/:id/importance', updateImportance)
router.put('/memories/:id/archive',    archiveMemory)

// ── Legacy memory compat ─────────────────────────────────────────────────────
router.get('/memories/list',    memList)
router.post('/memories/create', memCreate)
router.delete('/memories/clear', memClear)
router.get('/memories/summary',  getSummary)

// ── Tasks ────────────────────────────────────────────────────────────────────
router.get('/tasks',      getTasks)
router.post('/tasks',     createTask)
router.put('/tasks/:id',  updateTask)
router.delete('/tasks/:id', deleteTask)

// ── Executive Insights ───────────────────────────────────────────────────────
router.get('/insights',            getAllInsights)
router.get('/insights/:dimension', getDimensionInsight)

module.exports = router
