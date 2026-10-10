// Lambda handler for AWS Incident Buddy.
// Flow: validate input -> call Bedrock -> parse structured output -> respond.
import { config } from './config.js'
import { validateIncident, ValidationError } from './validator.js'
import { parseModelResponse, ParseError } from './responseParser.js'
import { invokeModel } from './bedrockClient.js'

const FRIENDLY_ERROR =
  "We couldn't analyze this incident right now. Please try again."

function corsHeaders() {
  return {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': config.allowedOrigin,
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST,OPTIONS',
  }
}

function respond(statusCode, bodyObj) {
  return {
    statusCode,
    headers: corsHeaders(),
    body: JSON.stringify(bodyObj),
  }
}

/**
 * API Gateway (HTTP API, payload v2) proxy handler.
 * @param {object} event
 * @param {object} [deps] - injectable { invokeModel } for tests
 */
export async function analyzeIncident(event, deps = {}) {
  // Handle CORS preflight.
  const method =
    event?.requestContext?.http?.method || event?.httpMethod || 'POST'
  if (method === 'OPTIONS') {
    return respond(200, { ok: true })
  }

  // 1. Validate input.
  let incident
  try {
    incident = validateIncident(event?.body, config.maxInputLength)
  } catch (err) {
    if (err instanceof ValidationError) {
      return respond(400, { error: err.message })
    }
    // Unexpected validation failure — do not leak details.
    console.error('Unexpected validation failure:', err?.name)
    return respond(400, { error: 'Invalid request.' })
  }

  // 2. Call Bedrock and parse the structured response.
  try {
    const invoke = deps.invokeModel || invokeModel
    const rawText = await invoke(incident)
    const analysis = parseModelResponse(rawText)
    return respond(200, analysis)
  } catch (err) {
    // Log only the error type/name — never the raw user incident.
    if (err instanceof ParseError) {
      console.error('Model response parse error:', err.message)
    } else {
      console.error('Bedrock invocation error:', err?.name || 'UnknownError')
    }
    return respond(500, { error: FRIENDLY_ERROR })
  }
}
