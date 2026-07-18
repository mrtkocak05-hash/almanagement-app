const rateLimit = require('express-rate-limit')

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Çok fazla istek. Lütfen 15 dakika bekleyin.' },
})

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Çok fazla giriş denemesi. Lütfen 15 dakika bekleyin.' },
})

module.exports = { apiLimiter, authLimiter }
