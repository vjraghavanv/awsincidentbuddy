import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { analyzeIncident } from '../src/handler.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const fixtures = JSON.parse(
  readFileSync(join(__dirname, 'fixtures', 'sampleIncidents.json'), 'utf-8')
)

function makeEvent(bodyObj, method = 'POST') {
  return {
    requestContext: { http: { method } },
    body: bodyObj === undefined ? undefined : JSON.stringify(bodyObj),
  }
}

test('handler returns 200 with analysis on valid input', async () => {
  const fakeInvoke = async () => JSON.stringify(fixtures.validModelResponse)
  const res = await analyzeIncident(makeEvent({ incident: 'AccessDenied s3:GetObject' }), {
    invokeModel: fakeInvoke,
  })
  assert.equal(res.statusCode, 200)
  const body = JSON.parse(res.body)
  assert.equal(body.service, 'AWS Lambda')
  assert.equal(body.severity, 'HIGH')
  assert.ok(Array.isArray(body.recommendedActions))
})

test('handler returns 400 on empty incident', async () => {
  const res = await analyzeIncident(makeEvent({ incident: '' }))
  assert.equal(res.statusCode, 400)
  const body = JSON.parse(res.body)
  assert.ok(body.error)
})

test('handler returns 400 on missing body', async () => {
  const res = await analyzeIncident(makeEvent(undefined))
  assert.equal(res.statusCode, 400)
})

test('handler returns 400 on missing incident field', async () => {
  const res = await analyzeIncident(makeEvent({ foo: 'bar' }))
  assert.equal(res.statusCode, 400)
})

test('handler returns 500 friendly message when Bedrock throws', async () => {
  const fakeInvoke = async () => {
    throw new Error('Bedrock unavailable')
  }
  const res = await analyzeIncident(makeEvent({ incident: 'some error' }), {
    invokeModel: fakeInvoke,
  })
  assert.equal(res.statusCode, 500)
  const body = JSON.parse(res.body)
  assert.match(body.error, /couldn't analyze/i)
  // Must NOT leak the internal error message.
  assert.doesNotMatch(body.error, /Bedrock unavailable/)
})

test('handler returns 500 when model output is unparseable', async () => {
  const fakeInvoke = async () => fixtures.malformedModelResponse
  const res = await analyzeIncident(makeEvent({ incident: 'some error' }), {
    invokeModel: fakeInvoke,
  })
  assert.equal(res.statusCode, 500)
})

test('handler handles OPTIONS preflight with 200', async () => {
  const res = await analyzeIncident(makeEvent(undefined, 'OPTIONS'))
  assert.equal(res.statusCode, 200)
})

test('handler includes CORS headers on responses', async () => {
  const fakeInvoke = async () => JSON.stringify(fixtures.validModelResponse)
  const res = await analyzeIncident(makeEvent({ incident: 'err' }), {
    invokeModel: fakeInvoke,
  })
  assert.ok(res.headers['Access-Control-Allow-Origin'])
})
