'use strict'

module.exports = async function (fastify, options) {
  fastify.all('*', async function (request) {
    return {
      name: process.env.NAME,
      path: request.raw.url,
      query: request.query,
      method: request.raw.method,
      headers: request.headers
    }
  })
}
