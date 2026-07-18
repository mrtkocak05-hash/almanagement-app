const multer = require('multer')
const path = require('path')
const fs = require('fs')

const STORAGE_BASE = path.join(__dirname, '../../../storage')

function makeStorage(folder) {
  const dir = path.join(STORAGE_BASE, folder)
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })

  return multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, dir),
    filename: (_req, file, cb) => {
      const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`
      cb(null, `${unique}${path.extname(file.originalname).toLowerCase()}`)
    },
  })
}

const photoFilter = (_req, file, cb) => {
  cb(null, /image\/(jpeg|jpg|png|webp|gif)/.test(file.mimetype))
}

const docFilter = (_req, file, cb) => {
  cb(null, /image\/|application\/(pdf|msword|vnd\.)/.test(file.mimetype))
}

const photoUpload = multer({
  storage: makeStorage('photos'),
  fileFilter: photoFilter,
  limits: { fileSize: 15 * 1024 * 1024 },
})

const docUpload = multer({
  storage: makeStorage('documents'),
  fileFilter: docFilter,
  limits: { fileSize: 30 * 1024 * 1024 },
})

const archiveUpload = multer({
  storage: makeStorage('documents'),
  fileFilter: (_req, _file, cb) => cb(null, true), // accept everything
  limits: { fileSize: 100 * 1024 * 1024 },
})

module.exports = { photoUpload, docUpload, archiveUpload }
