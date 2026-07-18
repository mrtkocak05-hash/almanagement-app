'use strict'
const router = require('express').Router()
const ctrl = require('../controllers/masterDataController')

router.get('/brands', ctrl.listBrands)
router.get('/models', ctrl.listModels)
router.get('/districts', ctrl.listDistricts)
router.get('/debug', ctrl.debugCounts)
router.get('/:type', ctrl.listTable)

module.exports = router
