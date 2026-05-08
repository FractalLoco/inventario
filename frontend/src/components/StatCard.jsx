export default function StatCard({ label, value, note, color, delay = 0 }) {
  return (
    <div className={`stat-card stat-${color}`} style={{ animationDelay: `${delay}ms` }}>
      <div className="stat-label">{label}</div>
      <div className={`stat-val c-${color}`}>{value}</div>
      <div className="stat-note">{note}</div>
    </div>
  )
}
