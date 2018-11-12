'use strict'

const fetch = require('node-fetch')
const chalk = require('chalk')

async function makeRequest (method, path) {
  const response = await fetch('http://localhost:8080' + path, { method: method })
  let body = { name: 'error-in-json' }
  try {
    body = await response.json()
  } catch (e) { }
  return { statusCode: response.status, body: body }
}

async function getRequestResponse (method, path, expectedStatusCode, expectedName, expectedPath) {
  const { statusCode, body } = await makeRequest(method, path)
  return {
    method,
    path,
    expectedStatusCode,
    actualStatusCode: statusCode,
    expectedName: expectedName,
    actualName: body.name,
    expectedPath: expectedPath,
    actualPath: body.path
  }
}

const config = [
  {
    method: 'GET',
    path: '/inventory/',
    expectedStatusCode: 200,
    name: 'inventory',
    expectedPath: '/'
  },
  {
    method: 'POST',
    path: '/inventory/',
    expectedStatusCode: 200,
    name: 'inventory',
    expectedPath: '/'
  },
  {
    method: 'DELETE',
    path: '/inventory/item1234',
    expectedStatusCode: 200,
    name: 'inventory',
    expectedPath: '/item1234'
  },
  {
    method: 'POST',
    path: '/rating/',
    expectedStatusCode: 200,
    name: 'rating',
    expectedPath: '/'
  },
  {
    method: 'GET',
    path: '/rating/suggests?item=1234',
    expectedStatusCode: 200,
    name: 'rating',
    expectedPath: '/suggests?item=1234'
  },
  {
    method: 'DELETE',
    path: '/rating/ratingABC',
    expectedStatusCode: 200,
    name: 'rating',
    expectedPath: '/ratingABC'
  },
  {
    method: 'GET',
    path: '/unknown/path',
    expectedStatusCode: 404,
    name: 'not-found',
    expectedPath: '/unknown/path'
  }
]

const ok = txt => txt + Buffer.from([0x1b, 0x5b, 0x33, 0x39, 0x6d]).toString().repeat(2)
const error = txt => chalk.yellow(txt)

Promise.all(config.map(c => getRequestResponse(c.method, c.path, c.expectedStatusCode, c.name, c.expectedPath)))
  .then(results => {
    console.log()
    console.log('method'.padEnd(8, ' ') + ' ' + 'path'.padEnd(30, ' ') + ' statusCode      backend               path')
    console.log('----------------------------------------------------------------------------------------------------------')

    for (var i = 0; i < results.length; i++) {
      const r = results[i]

      const f = {
        statusCode: r.actualStatusCode === r.expectedStatusCode ? ok : error,
        name: r.actualName === r.expectedName ? ok : error,
        path: r.actualPath === r.expectedPath ? ok : error
      }

      let row = r.method.padEnd(8, ' ') + ' ' + r.path.padEnd(30, ' ')
      row += '  ' + f.statusCode(r.actualStatusCode) + '/' + r.expectedStatusCode
      row += ('  ' + f.name(r.actualName) + '/' + r.expectedName).padEnd(35, ' ')
      row += '  ' + f.path(r.actualPath) + ' ' + r.expectedPath

      console.log(row)
    }

    console.log()
  })
