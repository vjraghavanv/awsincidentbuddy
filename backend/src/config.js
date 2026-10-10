// Centralised configuration pulled from environment variables.
// All values have safe defaults so the handler never crashes on a missing var.

export const config = {
  bedrockRegion: process.env.BEDROCK_REGION || 'us-east-1',
  modelId: process.env.BEDROCK_MODEL_ID || 'amazon.nova-lite-v1:0',
  maxInputLength: Number(process.env.MAX_INPUT_LENGTH || 5000),
  allowedOrigin: process.env.ALLOWED_ORIGIN || '*',
}
