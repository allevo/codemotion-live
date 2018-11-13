'use strict'

const fetch = require('node-fetch')
const chalk = require('chalk')

async function makeRequest (apikey, method, path) {
  const response = await fetch('http://localhost:8080' + path, { method: method, headers: { apikey: apikey } })
  let body = { name: 'error-in-json' }
  try {
    body = await response.json()
  } catch (e) { }
  return { statusCode: response.status, body: body }
}

async function getRequestResponse (apikey, method, path, expectedStatusCode, expectedName) {
  const { statusCode, body } = await makeRequest(apikey, method, path)
  return {
    apikey,
    method,
    path,
    expectedStatusCode,
    actualStatusCode: statusCode,
    expectedName: expectedName,
    actualName: body.name
  }
}

const APIKEYS = { startup: 'startup-apikey', premium: 'premium-apikey', unknown: 'unknown' }

const config = [
  {
    apikey: APIKEYS.startup,
    method: 'GET',
    path: '/inventory/',
    expectedStatusCode: 200,
    name: 'inventory'
  },
  {
    apikey: APIKEYS.premium,
    method: 'GET',
    path: '/inventory/',
    expectedStatusCode: 200,
    name: 'inventory'
  },
  {
    apikey: APIKEYS.unknown,
    method: 'GET',
    path: '/inventory/',
    expectedStatusCode: 403,
    name: 'forbidden'
  },
  {
    apikey: APIKEYS.startup,
    method: 'POST',
    path: '/inventory/',
    expectedStatusCode: 200,
    name: 'inventory'
  },
  {
    apikey: APIKEYS.premium,
    method: 'POST',
    path: '/inventory/',
    expectedStatusCode: 200,
    name: 'inventory'
  },
  {
    apikey: APIKEYS.startup,
    method: 'DELETE',
    path: '/inventory/item1234',
    expectedStatusCode: 403,
    name: 'forbidden'
  },
  {
    apikey: APIKEYS.premium,
    method: 'DELETE',
    path: '/inventory/item1234',
    expectedStatusCode: 200,
    name: 'inventory'
  },

  {
    apikey: APIKEYS.startup,
    method: 'POST',
    path: '/rating/',
    expectedStatusCode: 200,
    name: 'rating'
  },
  {
    apikey: APIKEYS.premium,
    method: 'POST',
    path: '/rating/',
    expectedStatusCode: 200,
    name: 'rating'
  },
  {
    apikey: APIKEYS.startup,
    method: 'GET',
    path: '/rating/suggests',
    expectedStatusCode: 200,
    name: 'rating'
  },
  {
    apikey: APIKEYS.premium,
    method: 'POST',
    path: '/rating/',
    expectedStatusCode: 200,
    name: 'rating'
  },
  {
    apikey: APIKEYS.startup,
    method: 'DELETE',
    path: '/rating/rateABC',
    expectedStatusCode: 403,
    name: 'forbidden'
  },
  {
    apikey: APIKEYS.premium,
    method: 'DELETE',
    path: '/rating/rateABC',
    expectedStatusCode: 200,
    name: 'rating'
  }
]

const ok = txt => txt + Buffer.from([0x1b, 0x5b, 0x33, 0x39, 0x6d]).toString().repeat(2)
const error = txt => chalk.yellow(txt)

Promise.all(config.map(c => getRequestResponse(c.apikey, c.method, c.path, c.expectedStatusCode, c.name)))
  .then(results => {
    console.log()
    console.log('apikey'.padEnd(15, ' ') + ' ' + 'method'.padEnd(8, ' ') + ' ' + 'path'.padEnd(30, ' ') + ' statusCode      backend')
    console.log('-------------------------------------------------------------------------------------')

    for (var i = 0; i < results.length; i++) {
      const r = results[i]

      const f = {
        statusCode: r.actualStatusCode === r.expectedStatusCode ? ok : error,
        name: r.actualName === r.expectedName ? ok : error
      }
      let row = r.apikey.padEnd(15, ' ') + ' ' + r.method.padEnd(8, ' ') + ' ' + r.path.padEnd(30, ' ')
      row += '  ' + f.statusCode(r.actualStatusCode) + '/' + r.expectedStatusCode
      row += ('  ' + f.name(r.actualName) + '/' + r.expectedName).padEnd(22, ' ')

      console.log(row)
    }

    console.log()
  })
