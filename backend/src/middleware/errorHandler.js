function notFound(req, res, next) {
  const error = new Error(`Not Found: ${req.originalUrl}`)
  res.status(404)
  next(error)
}

function errorHandler(err, req, res, _next) {
  const statusCode = res.statusCode !== 200 ? res.statusCode : 500

  res.status(statusCode).json({
    success: false,
    message: err.message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  })
}

module.exports = { notFound, errorHandler }
