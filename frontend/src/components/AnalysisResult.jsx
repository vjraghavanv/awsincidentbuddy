import SeverityBadge from './SeverityBadge'
import SafetyWarning from './SafetyWarning'

const CONFIDENCE_LABEL = {
  LOW: 'Low confidence',
  MEDIUM: 'Medium confidence',
  HIGH: 'High confidence',
}

export default function AnalysisResult({ result, onReset }) {
  const {
    service,
    severity,
    summary,
    likelyCause,
    confidence,
    recommendedActions = [],
    checkNext = [],
    safetyWarning,
  } = result

  const confidenceLabel =
    CONFIDENCE_LABEL[(confidence || '').toUpperCase()] || 'Confidence unknown'

  return (
    <div className="analysis-result">
      <div className="result-header">
        <div className="service-badge">{service || 'Unknown service'}</div>
        <SeverityBadge severity={severity} />
      </div>

      <section className="result-section">
        <h3>Summary</h3>
        <p>{summary}</p>
      </section>

      <section className="result-section">
        <h3>Likely cause</h3>
        <div className="cause-row">
          <span className="inference-tag">Inference &mdash; not confirmed</span>
          <span className="confidence-tag">{confidenceLabel}</span>
        </div>
        <p>{likelyCause}</p>
        <p className="cause-note">
          This is a <strong>likely cause</strong>, not a confirmed one. Confirm it
          against your own AWS account before acting.
        </p>
      </section>

      {recommendedActions.length > 0 && (
        <section className="result-section">
          <h3>Recommended actions</h3>
          <ol className="action-list">
            {recommendedActions.map((action, i) => (
              <li key={i}>{action}</li>
            ))}
          </ol>
        </section>
      )}

      {checkNext.length > 0 && (
        <section className="result-section">
          <h3>What to check next</h3>
          <ul className="check-list">
            {checkNext.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        </section>
      )}

      {safetyWarning && <SafetyWarning warning={safetyWarning} />}

      <button type="button" className="btn btn-secondary" onClick={onReset}>
        Analyze another error
      </button>
    </div>
  )
}
