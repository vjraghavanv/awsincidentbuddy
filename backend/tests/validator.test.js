import { test } from 'node:test'
import assert from 'node:assert/strict'
import { validateIncident, ValidationError, sanitize } from '../src/validator.js'

test('validateIncident accepts a valid JSON string body', () => {
  const body = JSON.stringify({ incident: 'AccessDenied on s3:GetObject' })
  const result = validateIncident(body, 5000)
  assert.equal(result, 'AccessDenied on s3:GetObject')
})

test('validateIncident accepts an object body (test convenience)', () => {
  const result = validateIncident({ incident: '  some error  ' }, 5000)
  assert.equal(result, 'some error', 'should trim surrounding whitespace')
})

test('validateIncident rejects empty string body', () => {
  assert.throws(() => validateIncident('', 5000), ValidationError)
})

test('validateIncident rejects invalid JSON string', () => {
  assert.throws(() => validateIncident('{not json', 5000), ValidationError)
})

test('validateIncident rejects missing incident field', () => {
  assert.throws(() => validateIncident(JSON.stringify({ foo: 'bar' }), 5000), ValidationError)
})

test('validateIncident rejects non-string incident', () => {
  assert.throws(() => validateIncident(JSON.stringify({ incident: 123 }), 5000), ValidationError)
})

test('validateIncident rejects whitespace-only incident', () => {
  assert.throws(() => validateIncident(JSON.stringify({ incident: '   ' }), 5000), ValidationError)
})

test('validateIncident rejects input over max length', () => {
  const long = 'x'.repeat(5001)
  assert.throws(
    () => validateIncident(JSON.stringify({ incident: long }), 5000),
    ValidationError
  )
})

test('validateIncident accepts input exactly at max length', () => {
  const exact = 'x'.repeat(5000)
  const result = validateIncident(JSON.stringify({ incident: exact }), 5000)
  assert.equal(result.length, 5000)
})

test('validateIncident rejects null body', () => {
  assert.throws(() => validateIncident(null, 5000), ValidationError)
})

test('sanitize strips control characters but keeps newlines and tabs', () => {
  const input = 'line1\n\tline2\u0000\u0007end'
  const result = sanitize(input)
  assert.equal(result, 'line1\n\tline2end')
})
