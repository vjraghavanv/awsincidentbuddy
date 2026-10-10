// Thin wrapper around the backend /analyze endpoint.
//
// Modes:
//  - Real backend: set VITE_API_URL to your API Gateway base URL.
//  - Local dev:    leave VITE_API_URL empty; Vite proxies /analyze to sam local.
//  - Mock/demo:    set VITE_USE_MOCK=true to run with NO backend (client-side
//                  analysis), ideal for a standalone Amplify demo.

import { mockAnalyze } from './mockAnalyzer'

const API_BASE = import.meta.env.VITE_API_URL ?? ''
const USE_MOCK = String(import.meta.env.VITE_USE_MOCK ?? '').toLowerCase() === 'true'

// Simulate a short "thinking" delay so the loading state is visible in demos.
function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function analyzeIncident(incident) {
  // Mock mode: no network call, deterministic structured analysis.
  if (USE_MOCK) {
    await delay(900)
    return mockAnalyze(incident)
  }

  const res = await fetch(`${API_BASE}/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ incident }),
  })

  if (!res.ok) {
    // Try to surface a friendly backend message, but never a stack trace.
    let message = "We couldn't analyze this incident right now. Please try again."
    try {
      const data = await res.json()
      if (data && typeof data.error === 'string') {
        message = data.error
      }
    } catch {
      // ignore JSON parse failures, keep default message
    }
    throw new Error(message)
  }

  return res.json()
}
