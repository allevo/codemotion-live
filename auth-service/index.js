'use strict'

const sids = {
  'user-sid': { userId: 'userId1', groups: ['user'] },
  'editor-sid': { userId: 'editorId2', groups: ['user', 'editor'] },
  'admin-sid': { userId: 'adminId3', groups: ['user', 'editor', 'admin'] }
}

function getSession(log, sid) {
  log.debug({ sid }, 'getting session')
  const session = sids[sid]
  if (!session) {
    log.debug('No session is found')
    return null
  }
  log.debug({ sid, session }, 'Session is found')
  return session
}

function arrayToObject(agg, item) {
  agg[item] = true
  return agg
}

function getGroupsFromSession(log, session) {
  return session.groups.reduce(arrayToObject, { logged: true })
}

function createFunction(ge) {
  return new Function('groups', 'plan', 'return Boolean(' + ge + ')')
}

function getExpressionFunction(log, ge) {
  const cacheValue = this.cache.get(ge)
  if (cacheValue !== undefined) {
    log.debug('Loaded from cache')
    return cacheValue
  }
  log.debug('Building function')
  const func = this.createFunction(ge)
  this.cache.set(ge, func)
  return func
}

function getUserIdFromSession(session) {
  return session.userId
}

function evaluateExpression(log, expressionFunction, groupsAsObject, plan) {
  log.debug({ groupsAsObject }, 'Evaluate expression')
  return expressionFunction(groupsAsObject, plan)
}

module.exports = async function (fastify, options) {
  fastify.register(require('fastify-cookie'))
  fastify.decorate('cache', require('tiny-lru')(100))

  fastify.decorate('getSession', getSession)
  fastify.decorate('getGroupsFromSession', getGroupsFromSession)
  fastify.decorate('evaluateExpression', evaluateExpression)
  fastify.decorate('getExpressionFunction', getExpressionFunction)
  fastify.decorate('createFunction', createFunction)
  fastify.decorate('getUserIdFromSession', getUserIdFromSession)

  fastify.get('/auth', { schema }, function (request, reply) {
    const sid = request.cookies.sid
    const ge = request.headers.ge
    const plan = request.headers.plan

    request.log.info({ sid, ge, plan }, 'input')

    const session = this.getSession(request.log, sid)
    const groupsAsObject = session ? this.getGroupsFromSession(request.log, session) : { unlogged: true }
    const userId = session ? this.getUserIdFromSession(session) : ''

    const expressionFunction = this.getExpressionFunction(request.log, ge)
    const isAllowed = this.evaluateExpression(request.log, expressionFunction, groupsAsObject, plan)

    request.log.info({ isAllowed, userId }, 'result')

    reply.code(204)
    reply.header('isallowed', isAllowed ? '1' : '0')
    reply.header('userid', userId)
    reply.send()
  })
}

const schema = {
  headers: {
    type: 'object',
    required: ['ge', 'plan'],
    properties: {
      ge: { type: 'string' },
      plan: { type: 'string' },
    }
  }
}
