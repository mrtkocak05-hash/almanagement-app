const express = require('express')
const router = express.Router()
const { photoUpload, docUpload } = require('../middleware/upload')
const ctrl = require('../controllers/assetsController')

// Asset CRUD
router.get('/', ctrl.listAssets)
router.post('/', ctrl.createAsset)
router.get('/:id', ctrl.getAsset)
router.put('/:id', ctrl.updateAsset)
router.delete('/:id', ctrl.deleteAsset)

// Photos
router.post('/:id/photos', photoUpload.array('photos', 10), ctrl.uploadPhotos)
router.patch('/:id/photos/:photoId/main', ctrl.setMainPhoto)
router.delete('/:id/photos/:photoId', ctrl.deletePhoto)

// Partners
router.post('/:id/partners', ctrl.addPartner)
router.put('/:id/partners/:pid', ctrl.updatePartner)
router.delete('/:id/partners/:pid', ctrl.deletePartner)

// Documents
router.post('/:id/documents', docUpload.single('document'), ctrl.uploadDocument)
router.delete('/:id/documents/:docId', ctrl.deleteDocument)

// Activity Story
router.get('/:id/story', ctrl.getActivityStory)

module.exports = router
