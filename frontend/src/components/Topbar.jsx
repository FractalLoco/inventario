export default function Topbar({ title, actions }) {
  return (
    <div className="topbar">
      <div className="topbar-title">{title}</div>
      <div className="topbar-right">{actions}</div>
    </div>
  )
}
