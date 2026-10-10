// Wrapper around Amazon Bedrock's Converse API for Nova models.
import {
  BedrockRuntimeClient,
  ConverseCommand,
} from '@aws-sdk/client-bedrock-runtime'
import { config } from './config.js'
import { SYSTEM_PROMPT, buildUserPrompt } from './prompt.js'

// Reuse the client across warm invocations.
let client

function getClient() {
  if (!client) {
    client = new BedrockRuntimeClient({ region: config.bedrockRegion })
  }
  return client
}

/**
 * Send an incident to Bedrock and return the raw model text output.
 * The Converse API gives a provider-agnostic request/response shape, so this
 * works for Nova Lite / Micro / Pro without changing the body format.
 *
 * @param {string} incident - sanitised incident text
 * @param {object} [deps] - injectable dependencies for testing
 * @returns {Promise<string>} raw text content from the model
 */
export async function invokeModel(incident, deps = {}) {
  const bedrock = deps.client || getClient()

  const command = new ConverseCommand({
    modelId: config.modelId,
    system: [{ text: SYSTEM_PROMPT }],
    messages: [
      {
        role: 'user',
        content: [{ text: buildUserPrompt(incident) }],
      },
    ],
    inferenceConfig: {
      maxTokens: 1024,
      temperature: 0.2,
      topP: 0.9,
    },
  })

  const response = await bedrock.send(command)

  const text = response?.output?.message?.content?.[0]?.text
  if (!text) {
    throw new Error('Bedrock returned no content.')
  }
  return text
}
