import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import {
  extractJson,
  validateAnalysis,
  parseModelResponse,
  ParseError,
} from '../src/responseParser.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const fixtures = JSON.parse(
  readFileSync(join(__dirname, 'fixtures', 'sampleIncidents.json'), 'utf-8')
)

test('extractJson parses a plain JSON string', () => {
  const obj = extractJson('{"service":"S3"}')
  assert.equal(obj.service, 'S3')
})

test('extractJson strips markdown code fences', () => {
  const obj = extractJson(fixtures.modelResponseWithFences)
  assert.equal(obj.service, 'API Gateway')
})

test('extractJson extracts JSON embedded in prose', () => {
  const obj = extractJson(fixtures.modelResponseWithProse)
  assert.equal(obj.service, 'CloudFormation')
})

test('extractJson throws on empty input', () => {
  assert.throws(() => extractJson(''), ParseError)
})

test('extractJson throws when no JSON object is present', () => {
  assert.throws(() => extractJson(fixtures.malformedModelResponse), ParseError)
})

test('validateAnalysis normalises a complete response', () => {
  const result = validateAnalysis(fixtures.validModelResponse)
  assert.equal(result.service, 'AWS Lambda')
  assert.equal(result.severity, 'HIGH')
  assert.equal(result.confidence, 'MEDIUM')
  assert.equal(result.recommendedActions.length, 3)
  assert.equal(result.checkNext.length, 2)
})

test('validateAnalysis defaults invalid severity to MEDIUM', () => {
  const result = validateAnalysis({
    service: 'S3',
    severity: 'BOGUS',
    summary: 'x',
    likelyCause: 'y',
    confidence: 'nope',
    safetyWarning: 'z',
  })
  assert.equal(result.severity, 'MEDIUM')
  assert.equal(result.confidence, 'LOW')
})

test('validateAnalysis caps recommendedActions at 3', () => {
  const result = validateAnalysis({
    service: 'S3',
    severity: 'LOW',
    summary: 'x',
    likelyCause: 'y',
    confidence: 'LOW',
    recommendedActions: ['a', 'b', 'c', 'd', 'e'],
    checkNext: [],
    safetyWarning: 'z',
  })
  assert.equal(result.recommendedActions.length, 3)
})

test('validateAnalysis throws when required field missing', () => {
  assert.throws(() => validateAnalysis(JSON.parse(fixtures.missingFieldsResponse)), ParseError)
})

test('validateAnalysis throws on non-object', () => {
  assert.throws(() => validateAnalysis(null), ParseError)
})

test('parseModelResponse end-to-end on fenced response', () => {
  const result = parseModelResponse(fixtures.modelResponseWithFences)
  assert.equal(result.service, 'API Gateway')
  assert.equal(result.severity, 'MEDIUM')
})
