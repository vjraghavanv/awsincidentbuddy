const SEVERITY_STYLES = {
  LOW: { bg: '#dcfce7', color: '#166534', label: 'LOW' },
  MEDIUM: { bg: '#fef9c3', color: '#854d0e', label: 'MEDIUM' },
  HIGH: { bg: '#ffedd5', color: '#9a3412', label: 'HIGH' },
  CRITICAL: { bg: '#fee2e2', color: '#991b1b', label: 'CRITICAL' },
}

export default function SeverityBadge({ severity }) {
  const key = (severity || '').toUpperCase()
  const style = SEVERITY_STYLES[key] || {
    bg: '#e5e7eb',
    color: '#374151',
    label: severity || 'UNKNOWN',
  }

  return (
    <span
      className="severity-badge"
      style={{ backgroundColor: style.bg, color: style.color }}
    >
      {style.label}
    </span>
  )
}
