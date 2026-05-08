export default function Sidebar({ page, setPage }) {
  const navItems = [
    { section: 'Principal' },
    { id: 'lotes', icon: 'ti-stack-2', label: 'Lotes' },
    { id: 'movimientos', icon: 'ti-arrows-exchange', label: 'Movimientos' },
    { section: 'Inventario' },
    { id: 'recursos', icon: 'ti-package', label: 'Recursos externos' },
  ]

  return (
    <aside className="sidebar">
      <div className="logo-area">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div className="logo-box">3M</div>
          <div>
            <div className="logo-name">Tres al Mar</div>
            <div className="logo-sub">Control de inventario</div>
          </div>
        </div>
      </div>

      <div style={{ flex: 1 }}>
        {navItems.map((item, i) =>
          item.section ? (
            <div key={i} className="nav-section">{item.section}</div>
          ) : (
            <div
              key={item.id}
              className={`nav-item${page === item.id ? ' active' : ''}`}
              onClick={() => setPage(item.id)}
            >
              <i className={`ti ${item.icon}`} aria-hidden="true" />
              {item.label}
            </div>
          )
        )}
      </div>

      <div className="nav-footer">
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 4 }}>
          <span className="live-dot" />
          <span style={{ fontSize: 12, color: 'var(--t2)' }}>Sistema activo</span>
        </div>
        <div style={{ fontSize: 11, color: 'var(--t3)' }}>
          {new Date().toLocaleDateString('es-CL', { weekday: 'short', day: 'numeric', month: 'short' })}
        </div>
      </div>
    </aside>
  )
}
