export default function SafetyWarning({ warning }) {
  return (
    <div className="safety-warning">
      <span className="safety-warning-icon" aria-hidden="true">
        &#9888;
      </span>
      <div>
        <strong>Safety warning</strong>
        <p>{warning}</p>
      </div>
    </div>
  )
}
