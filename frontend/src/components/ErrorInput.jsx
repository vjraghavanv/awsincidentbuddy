import { EXAMPLE_ERRORS } from '../constants/exampleErrors'

const MAX_LENGTH = 5000

export default function ErrorInput({ value, onChange, onSubmit, validationError }) {
  function loadExample(text) {
    onChange(text)
  }

  function handleSubmit(e) {
    e.preventDefault()
    onSubmit()
  }

  return (
    <form className="error-input" onSubmit={handleSubmit}>
      <label htmlFor="incident" className="input-label">
        Paste an AWS error and I&apos;ll help you understand what happened.
      </label>

      <textarea
        id="incident"
        className="incident-textarea"
        placeholder="Paste your AWS error, exception, CloudWatch log, or deployment failure here..."
        value={value}
        maxLength={MAX_LENGTH}
        rows={10}
        onChange={(e) => onChange(e.target.value)}
      />

      <div className="input-meta">
        <span className="char-count">
          {value.length} / {MAX_LENGTH}
        </span>
      </div>

      <div className="example-buttons">
        <span className="example-label">Try an example:</span>
        {EXAMPLE_ERRORS.map((ex) => (
          <button
            key={ex.id}
            type="button"
            className="btn btn-ghost"
            onClick={() => loadExample(ex.text)}
          >
            {ex.label}
          </button>
        ))}
      </div>

      {validationError && <p className="validation-error">{validationError}</p>}

      <button type="submit" className="btn btn-primary btn-analyze">
        Analyze Incident
      </button>
    </form>
  )
}
