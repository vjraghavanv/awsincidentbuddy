import { useState } from 'react'
import './App.css'
import ErrorInput from './components/ErrorInput'
import LoadingState from './components/LoadingState'
import AnalysisResult from './components/AnalysisResult'
import { analyzeIncident } from './api/analyzeIncident'

const IS_MOCK =
  String(import.meta.env.VITE_USE_MOCK ?? '').toLowerCase() === 'true'

// Simple state machine: IDLE -> LOADING -> RESULT | ERROR
const STATUS = {
  IDLE: 'IDLE',
  LOADING: 'LOADING',
  RESULT: 'RESULT',
  ERROR: 'ERROR',
}

export default function App() {
  const [incident, setIncident] = useState('')
  const [status, setStatus] = useState(STATUS.IDLE)
  const [result, setResult] = useState(null)
  const [apiError, setApiError] = useState('')
  const [validationError, setValidationError] = useState('')

  async function handleAnalyze() {
    const trimmed = incident.trim()

    if (!trimmed) {
      setValidationError('Please paste an AWS error before analyzing.')
      return
    }
    setValidationError('')
    setStatus(STATUS.LOADING)
    setApiError('')

    try {
      const data = await analyzeIncident(trimmed)
      setResult(data)
      setStatus(STATUS.RESULT)
    } catch (err) {
      setApiError(err.message)
      setStatus(STATUS.ERROR)
    }
  }

  function handleReset() {
    setIncident('')
    setResult(null)
    setApiError('')
    setValidationError('')
    setStatus(STATUS.IDLE)
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>AWS Incident Buddy</h1>
        <p className="subtitle">
          Turn AWS errors into your next troubleshooting step.
        </p>
        {IS_MOCK && (
          <p className="demo-banner">
            Demo mode — analysis is generated client-side for demonstration, not
            by a live model.
          </p>
        )}
      </header>

      <main className="app-main">
        {status === STATUS.IDLE && (
          <ErrorInput
            value={incident}
            onChange={(val) => {
              setIncident(val)
              if (validationError) setValidationError('')
            }}
            onSubmit={handleAnalyze}
            validationError={validationError}
          />
        )}

        {status === STATUS.LOADING && <LoadingState />}

        {status === STATUS.RESULT && result && (
          <AnalysisResult result={result} onReset={handleReset} />
        )}

        {status === STATUS.ERROR && (
          <div className="error-panel">
            <h3>Something went wrong</h3>
            <p>{apiError}</p>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleReset}
            >
              Analyze another error
            </button>
          </div>
        )}
      </main>

      <footer className="app-footer">
        <p className="disclaimer">
          This analysis is advisory. Verify changes before applying them to your
          AWS environment.
        </p>
      </footer>
    </div>
  )
}
