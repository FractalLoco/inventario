import { useAuth } from '../context/AuthContext'

export default function Sidebar({ page, setPage }) {
  const { user, signOut } = useAuth()

  const navItems = [
    { section: 'Principal' },
    { id: 'lotes', icon: 'ti-stack-2', label: 'Lotes' },
    { id: 'movimientos', icon: 'ti-arrows-exchange', label: 'Movimientos' },
    { section: 'Inventario' },
    { id: 'recursos', icon: 'ti-package', label: 'Recursos externos' },
    { section: 'Sistema' },
    { id: 'historial', icon: 'ti-shield-check', label: 'Historial' },
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
        {user && (
          <div style={{ marginBottom: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
              <div style={{
                width: 26, height: 26, borderRadius: '50%',
                background: 'var(--blue-bg)', border: '1px solid var(--blue)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, fontWeight: 700, color: 'var(--blue)',
                flexShrink: 0,
              }}>
                {user.email?.[0]?.toUpperCase()}
              </div>
              <span style={{ fontSize: 11, color: 'var(--t2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                {user.email}
              </span>
            </div>
            <button
              className="btn btn-ghost btn-xs"
              style={{ width: '100%', justifyContent: 'center', color: 'var(--t3)' }}
              onClick={signOut}
            >
              <i className="ti ti-logout" />Cerrar sesión
            </button>
          </div>
        )}
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
