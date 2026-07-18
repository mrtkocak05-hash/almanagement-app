// Resolve serverless-http from backend node_modules
const serverless = require('../../../backend/node_modules/serverless-http')
const app = require('../../../backend/src/app')

module.exports.handler = serverless(app)
