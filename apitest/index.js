'use strict'

const fetch = require('node-fetch')
const chalk = require('chalk')

async function makeRequest (sid, apikey, method, path) {
  const response = await fetch('http://localhost:8080' + path, { method: method, headers: { apikey: apikey, cookie: 'sid=' + sid } })
  let body = { name: 'error-in-json', headers: {} }
  try {
    body = await response.json()
  } catch (e) { }
  return { statusCode: response.status, body: body }
}

async function getRequestResponse (expectedUserId, sid, apikey, method, path, expectedStatusCode, expectedName) {
  if (!method) return null
  const { statusCode, body } = await makeRequest(sid, apikey, method, path)
  return {
    sid,
    apikey,
    method,
    path,
    expectedStatusCode,
    actualStatusCode: statusCode,
    expectedName: expectedName,
    actualName: body.name,
    expectedUserId,
    actualUserId: (body.headers || {}).userid
  }
}

const APIKEYS = { startup: 'startup-apikey', premium: 'premium-apikey', unknown: 'unknown' }
const SID = {
  user: 'user-sid',
  editor: 'editor-sid',
  admin: 'admin-sid'
}

const config = [
  {
    apikey: APIKEYS.startup,
    sid: SID.user,
    method: 'GET',
    path: '/inventory/',
    expectedStatusCode: 200,
    name: 'inventory',
    userId: 'userId1'
  },
  {
    apikey: APIKEYS.startup,
    sid: SID.editor,
    method: 'GET',
    path: '/inventory/',
    expectedStatusCode: 200,
    name: 'inventory',
    userId: 'editorId2'
  },
  {
    apikey: APIKEYS.startup,
    sid: SID.admin,
    method: 'GET',
    path: '/inventory/',
    expectedStatusCode: 200,
    name: 'inventory',
    userId: 'adminId3'
  },

  {
    apikey: APIKEYS.startup,
    sid: SID.user,
    method: 'POST',
    path: '/inventory/',
    expectedStatusCode: 403,
    name: 'forbidden',
    userId: undefined
  },
  {
    apikey: APIKEYS.startup,
    sid: SID.editor,
    method: 'POST',
    path: '/inventory/',
    expectedStatusCode: 200,
    name: 'inventory',
    userId: 'editorId2'
  },
  {
    apikey: APIKEYS.startup,
    sid: SID.admin,
    method: 'POST',
    path: '/inventory/',
    expectedStatusCode: 200,
    name: 'inventory',
    userId: 'adminId3'
  },
  {
    apikey: APIKEYS.startup,
    sid: SID.user,
    method: 'DELETE',
    path: '/inventory/item1234',
    expectedStatusCode: 403,
    name: 'forbidden',
    userId: undefined
  },
  {
    apikey: APIKEYS.startup,
    sid: SID.editor,
    method: 'DELETE',
    path: '/inventory/item1234',
    expectedStatusCode: 403,
    name: 'forbidden',
    userId: undefined
  },
  {
    apikey: APIKEYS.startup,
    sid: SID.admin,
    method: 'DELETE',
    path: '/inventory/item1234',
    expectedStatusCode: 403,
    name: 'forbidden',
    userId: undefined
  },
  {},
  {
    apikey: APIKEYS.premium,
    sid: SID.user,
    method: 'GET',
    path: '/inventory/',
    expectedStatusCode: 200,
    name: 'inventory',
    userId: 'userId1'
  },
  {
    apikey: APIKEYS.premium,
    sid: SID.editor,
    method: 'GET',
    path: '/inventory/',
    expectedStatusCode: 200,
    name: 'inventory',
    userId: 'editorId2'
  },
  {
    apikey: APIKEYS.premium,
    sid: SID.admin,
    method: 'GET',
    path: '/inventory/',
    expectedStatusCode: 200,
    name: 'inventory',
    userId: 'adminId3'
  },

  {
    apikey: APIKEYS.premium,
    sid: SID.user,
    method: 'POST',
    path: '/inventory/',
    expectedStatusCode: 403,
    name: 'forbidden',
    userId: undefined
  },
  {
    apikey: APIKEYS.premium,
    sid: SID.editor,
    method: 'POST',
    path: '/inventory/',
    expectedStatusCode: 200,
    name: 'inventory',
    userId: 'editorId2'
  },
  {
    apikey: APIKEYS.premium,
    sid: SID.admin,
    method: 'POST',
    path: '/inventory/',
    expectedStatusCode: 200,
    name: 'inventory',
    userId: 'adminId3'
  },
  {
    apikey: APIKEYS.premium,
    sid: SID.user,
    method: 'DELETE',
    path: '/inventory/item1234',
    expectedStatusCode: 403,
    name: 'forbidden',
    userId: undefined
  },
  {
    apikey: APIKEYS.premium,
    sid: SID.editor,
    method: 'DELETE',
    path: '/inventory/item1234',
    expectedStatusCode: 403,
    name: 'forbidden',
    userId: undefined
  },
  {
    apikey: APIKEYS.premium,
    sid: SID.admin,
    method: 'DELETE',
    path: '/inventory/item1234',
    expectedStatusCode: 200,
    name: 'inventory',
    userId: 'adminId3'
  }
]

const ok = txt => txt + Buffer.from([0x1b, 0x5b, 0x33, 0x39, 0x6d]).toString().repeat(2)
const error = txt => chalk.yellow(txt)

Promise.all(config.map(c => getRequestResponse(c.userId, c.sid, c.apikey, c.method, c.path, c.expectedStatusCode, c.name)))
  .then(results => {
    console.log()
    console.log('sid'.padEnd(15, ' ') + ' ' + 'apikey'.padEnd(15, ' ') + ' ' + 'method'.padEnd(8, ' ') + ' ' + 'path'.padEnd(30, ' ') + ' statusCode      backend              user_id')
    console.log('---------------------------------------------------------------------------------------------------------------------------')

    for (var i = 0; i < results.length; i++) {
      const r = results[i]

      let row = ''
      if (r !== null) {
        const f = {
          statusCode: r.actualStatusCode === r.expectedStatusCode ? ok : error,
          name: r.actualName === r.expectedName ? ok : error,
          userId: r.actualUserId === r.expectedUserId ? ok : error
        }

        row = r.sid.padEnd(15, ' ') + ' ' + r.apikey.padEnd(15, ' ') + ' ' + r.method.padEnd(8, ' ') + ' ' + r.path.padEnd(30, ' ')
        row += '  ' + f.statusCode(r.actualStatusCode) + '/' + r.expectedStatusCode
        row += ('  ' + f.name(r.actualName) + '/' + r.expectedName).padEnd(22, ' ')
        row += ('  ' + f.userId(r.actualUserId) + '/' + r.expectedUserId).padEnd(22, ' ')
      }
      console.log(row)
    }

    console.log()
  })
