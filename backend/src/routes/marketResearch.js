const express = require('express')
const router = express.Router()
const ctrl = require('../controllers/marketResearchController')

// Dashboard + selector
router.get('/today-opportunities', ctrl.getTodayOpportunities)
router.get('/selector', ctrl.listResearchSelector)

// Research CRUD
router.get('/', ctrl.listResearches)
router.get('/:id', ctrl.getResearch)
router.post('/', ctrl.createResearch)
router.put('/:id', ctrl.updateResearch)
router.delete('/:id', ctrl.deleteResearch)

// Listings
router.post('/:id/listings', ctrl.createListing)
router.put('/:id/listings/:listingId', ctrl.updateListing)
router.delete('/:id/listings/:listingId', ctrl.deleteListing)

// Opportunity score
router.get('/:id/opportunity', ctrl.getOpportunity)

module.exports = router
