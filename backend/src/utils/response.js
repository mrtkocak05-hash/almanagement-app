function success(res, data, message = 'OK', statusCode = 200) {
  return res.status(statusCode).json({ success: true, message, data })
}

function error(res, message = 'Internal Server Error', statusCode = 500) {
  return res.status(statusCode).json({ success: false, message })
}

function paginated(res, items, total, page, limit) {
  return res.status(200).json({
    success: true,
    data: {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  })
}

module.exports = { success, error, paginated }
