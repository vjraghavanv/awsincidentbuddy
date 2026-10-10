// Input validation and light sanitisation for incoming incident text.

export class ValidationError extends Error {
  constructor(message) {
    super(message)
    this.name = 'ValidationError'
  }
}

/**
 * Parse and validate the API request body.
 * @param {string|object|null} rawBody - the raw event body (string from API GW, or object in tests)
 * @param {number} maxLength - maximum allowed incident length
 * @returns {string} the sanitised incident text
 * @throws {ValidationError} when the input is missing, malformed, or too long
 */
export function validateIncident(rawBody, maxLength = 5000) {
  let body = rawBody

  if (typeof rawBody === 'string') {
    if (rawBody.trim() === '') {
      throw new ValidationError('Request body is empty.')
    }
    try {
      body = JSON.parse(rawBody)
    } catch {
      throw new ValidationError('Request body must be valid JSON.')
    }
  }

  if (!body || typeof body !== 'object') {
    throw new ValidationError('Request body must be a JSON object.')
  }

  const { incident } = body

  if (typeof incident !== 'string') {
    throw new ValidationError('Field "incident" is required and must be a string.')
  }

  const trimmed = incident.trim()

  if (trimmed.length === 0) {
    throw new ValidationError('Field "incident" cannot be empty.')
  }

  if (trimmed.length > maxLength) {
    throw new ValidationError(
      `Field "incident" exceeds the maximum length of ${maxLength} characters.`
    )
  }

  return sanitize(trimmed)
}

/**
 * Light sanitisation: strip control characters that could corrupt the prompt,
 * while preserving normal whitespace (newlines, tabs). We do NOT attempt to
 * neutralise prompt-injection here — the model is instructed to only analyse
 * the text as an error, and the backend validates the structured output.
 */
export function sanitize(text) {
  // Remove ASCII control chars except \t (09), \n (0A), \r (0D)
  // eslint-disable-next-line no-control-regex
  return text.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '')
}
