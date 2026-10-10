// Parse and validate the structured JSON returned by Bedrock.

export class ParseError extends Error {
  constructor(message) {
    super(message)
    this.name = 'ParseError'
  }
}

const VALID_SEVERITY = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']
const VALID_CONFIDENCE = ['LOW', 'MEDIUM', 'HIGH']

/**
 * Extract the first JSON object from a model's text output.
 * Models sometimes wrap JSON in ```json fences or add stray prose, so we
 * locate the outermost {...} block rather than trusting the whole string.
 * @param {string} text
 * @returns {object}
 */
export function extractJson(text) {
  if (typeof text !== 'string' || text.trim() === '') {
    throw new ParseError('Model returned an empty response.')
  }

  // Strip code fences if present.
  let cleaned = text.trim()
  cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '')

  // Find the outermost JSON object.
  const start = cleaned.indexOf('{')
  const end = cleaned.lastIndexOf('}')

  if (start === -1 || end === -1 || end < start) {
    throw new ParseError('Model response did not contain a JSON object.')
  }

  const jsonSlice = cleaned.slice(start, end + 1)

  try {
    return JSON.parse(jsonSlice)
  } catch {
    throw new ParseError('Model response contained invalid JSON.')
  }
}

/**
 * Validate and normalise the parsed analysis object into a stable shape.
 * Missing optional arrays are defaulted; invalid enums are coerced sensibly.
 * @param {object} obj
 * @returns {object} the normalised analysis
 * @throws {ParseError} when required fields are missing
 */
export function validateAnalysis(obj) {
  if (!obj || typeof obj !== 'object') {
    throw new ParseError('Parsed analysis is not an object.')
  }

  const requiredStringFields = ['service', 'summary', 'likelyCause', 'safetyWarning']
  for (const field of requiredStringFields) {
    if (typeof obj[field] !== 'string' || obj[field].trim() === '') {
      throw new ParseError(`Analysis is missing required field: ${field}.`)
    }
  }

  const severity = String(obj.severity || '').toUpperCase()
  const confidence = String(obj.confidence || '').toUpperCase()

  return {
    service: obj.service.trim(),
    severity: VALID_SEVERITY.includes(severity) ? severity : 'MEDIUM',
    summary: obj.summary.trim(),
    likelyCause: obj.likelyCause.trim(),
    confidence: VALID_CONFIDENCE.includes(confidence) ? confidence : 'LOW',
    recommendedActions: normaliseArray(obj.recommendedActions, 3),
    checkNext: normaliseArray(obj.checkNext, 3),
    safetyWarning: obj.safetyWarning.trim(),
  }
}

function normaliseArray(value, max) {
  if (!Array.isArray(value)) return []
  return value
    .filter((item) => typeof item === 'string' && item.trim() !== '')
    .map((item) => item.trim())
    .slice(0, max)
}

/**
 * Convenience: extract + validate in one call.
 * @param {string} modelText
 * @returns {object}
 */
export function parseModelResponse(modelText) {
  return validateAnalysis(extractJson(modelText))
}
