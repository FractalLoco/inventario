'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import type { LoteConProductos, Movimiento, Recurso, MovimientoRecurso, ProductoLote } from '@/lib/types'

type Page = 'lotes' | 'movimientos' | 'recursos'
type ToastType = { id: number; msg: string; type: 'ok' | 'err' | 'info' }

const COLOR_MAP: Record<string, { accent: string; bg: string; dark: string }> = {
  blue: { accent: 'var(--blue)', bg: 'var(--blue-bg)', dark: 'var(--blue-dark)' },
  green: { accent: 'var(--green)', bg: 'var(--green-bg)', dark: 'var(--green-dark)' },
  amber: { accent: 'var(--amber)', bg: 'var(--amber-bg)', dark: 'var(--amber-dark)' },
  teal: { accent: 'var(--teal)', bg: 'var(--teal-bg)', dark: 'var(--teal-dark)' },
  purple: { accent: 'var(--purple)', bg: 'var(--purple-bg)', dark: 'var(--purple-dark)' },
  red: { accent: 'var(--red)', bg: 'var(--red-bg)', dark: 'var(--red-dark)' },
}

function estadoBadge(e: string) {
  if (e === 'Disponible') return <span className="badge b-green"><i className="ti ti-circle-check" style={{ fontSize: 11 }} />Disponible</span>
  if (e === 'En proceso') return <span className="badge b-amber"><i className="ti ti-clock" style={{ fontSize: 11 }} />En proceso</span>
  return <span className="badge b-gray">Agotado</span>
}

export default function Home() {
  const [page, setPage] = useState<Page>('lotes')
  const [toasts, setToasts] = useState<ToastType[]>([])
  const [modal, setModal] = useState<React.ReactNode>(null)
  const toastId = useRef(0)

  const toast = useCallback((msg: string, type: 'ok' | 'err' | 'info' = 'ok') => {
    const id = ++toastId.current
    setToasts(t => [...t, { id, msg, type }])
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3500)
  }, [])

  const openModal = (node: React.ReactNode) => setModal(node)
  const closeModal = () => setModal(null)

  const titles: Record<Page, string> = {
    lotes: 'Lotes en planta',
    movimientos: 'Movimientos · Entradas & Salidas',
    recursos: 'Recursos externos',
  }

  return (
    <div className="app">
      {/* SIDEBAR */}
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
          <div className="nav-section">Principal</div>
          {([
            ['lotes', 'ti-stack-2', 'Lotes'],
            ['movimientos', 'ti-arrows-exchange', 'Movimientos'],
          ] as [Page, string, string][]).map(([p, icon, label]) => (
            <div key={p} className={`nav-item${page === p ? ' active' : ''}`} onClick={() => setPage(p)}>
              <i className={`ti ${icon}`} aria-hidden="true" />
              {label}
            </div>
          ))}
          <div className="nav-section">Inventario</div>
          <div className={`nav-item${page === 'recursos' ? ' active' : ''}`} onClick={() => setPage('recursos')}>
            <i className="ti ti-package" aria-hidden="true" />
            Recursos externos
          </div>
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

      {/* MAIN */}
      <main className="main">
        <div className="topbar">
          <div className="topbar-title">{titles[page]}</div>
          <div className="topbar-right" id="topbar-actions">
            {page === 'lotes' && <LotesActions openModal={openModal} closeModal={closeModal} toast={toast} />}
            {page === 'movimientos' && <MovActions openModal={openModal} closeModal={closeModal} toast={toast} />}
            {page === 'recursos' && <RecursosActions openModal={openModal} closeModal={closeModal} toast={toast} />}
          </div>
        </div>

        <div className="content">
          {page === 'lotes' && <LotesPage openModal={openModal} closeModal={closeModal} toast={toast} />}
          {page === 'movimientos' && <MovimientosPage />}
          {page === 'recursos' && <RecursosPage openModal={openModal} closeModal={closeModal} toast={toast} />}
        </div>
      </main>

      {/* MODAL */}
      {modal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            {modal}
          </div>
        </div>
      )}

      {/* TOASTS */}
      <div className="toasts-wrap">
        {toasts.map(t => (
          <div key={t.id} className={`toast ${t.type}`}>
            <i className={`ti ${t.type === 'ok' ? 'ti-circle-check' : t.type === 'err' ? 'ti-alert-circle' : 'ti-info-circle'}`} />
            {t.msg}
          </div>
        ))}
      </div>
    </div>
  )
}

// ===================== LOTES =====================
function LotesActions({ openModal, closeModal, toast }: any) {
  return <>
    <button className="btn btn-ghost btn-sm" onClick={() => openModal(<MovProdModal closeModal={closeModal} toast={toast} />)}>
      <i className="ti ti-arrows-exchange" />Registrar movimiento
    </button>
    <button className="btn btn-blue btn-sm" onClick={() => openModal(<NuevoLoteModal closeModal={closeModal} toast={toast} />)}>
      <i className="ti ti-plus" />Nuevo lote
    </button>
  </>
}

function LotesPage({ openModal, closeModal, toast }: any) {
  const [lotes, setLotes] = useState<LoteConProductos[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState<Record<string, boolean>>({})

  const load = useCallback(async () => {
    setLoading(true)
    const r = await fetch('/api/lotes')
    const data = await r.json()
    setLotes(data)
    const initOpen: Record<string, boolean> = {}
    data.forEach((l: LoteConProductos) => { initOpen[l.id] = true })
    setOpen(initOpen)
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const stats = {
    disp: lotes.reduce((a, l) => a + l.productos.reduce((b, p) => b + p.disponible, 0), 0),
    proc: lotes.reduce((a, l) => a + l.productos.filter(p => p.estado === 'En proceso').reduce((b, p) => b + p.procesadas, 0), 0),
    sal: lotes.reduce((a, l) => a + l.productos.reduce((b, p) => b + p.despachado, 0), 0),
    act: lotes.filter(l => l.productos.some(p => p.disponible > 0)).length,
  }

  return (
    <>
      <div className="stats-grid">
        <div className="stat-card stat-green" style={{ animationDelay: '0ms' }}>
          <div className="stat-label">Disponible</div>
          <div className="stat-val c-green">{stats.disp}</div>
          <div className="stat-note">cajas listas para mover</div>
        </div>
        <div className="stat-card stat-amber" style={{ animationDelay: '50ms' }}>
          <div className="stat-label">En proceso</div>
          <div className="stat-val c-amber">{stats.proc}</div>
          <div className="stat-note">no disponibles aún</div>
        </div>
        <div className="stat-card stat-blue" style={{ animationDelay: '100ms' }}>
          <div className="stat-label">Despachado</div>
          <div className="stat-val c-blue">{stats.sal}</div>
          <div className="stat-note">cajas fuera de planta</div>
        </div>
        <div className="stat-card stat-purple" style={{ animationDelay: '150ms' }}>
          <div className="stat-label">Lotes activos</div>
          <div className="stat-val c-purple">{stats.act}</div>
          <div className="stat-note">con stock disponible</div>
        </div>
      </div>

      {loading ? (
        <div className="loading-row"><div className="spinner" />Cargando lotes...</div>
      ) : lotes.length === 0 ? (
        <div className="empty-state">Sin lotes registrados. Crea el primero con "+ Nuevo lote".</div>
      ) : lotes.map((l, i) => {
        const totP = l.productos.reduce((a, p) => a + p.procesadas, 0)
        const totD = l.productos.reduce((a, p) => a + p.disponible, 0)
        const totS = l.productos.reduce((a, p) => a + p.despachado, 0)
        const dc = totD === 0 ? 'c-red' : totD < totP * 0.3 ? 'c-amber' : 'c-green'
        const isOpen = open[l.id] !== false

        return (
          <div key={l.id} className="lote-block fade-up" style={{ animationDelay: `${i * 40}ms` }}>
            <div className="lote-hdr" onClick={() => setOpen(o => ({ ...o, [l.id]: !isOpen }))}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
                <span className="lote-id-pill">{l.id}</span>
                <span style={{ fontSize: 14, fontWeight: 700 }}>{l.especie}</span>
                <span className="badge b-gray" style={{ fontSize: 11 }}>{l.productos.length} producto{l.productos.length > 1 ? 's' : ''}</span>
                {l.nota && <span style={{ fontSize: 12, color: 'var(--t3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>· {l.nota}</span>}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexShrink: 0 }}>
                <div style={{ textAlign: 'right' }}>
                  <div className={`mono ${dc}`} style={{ fontSize: 15, fontWeight: 700 }}>{totD} <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--t3)' }}>disp.</span></div>
                  <div style={{ fontSize: 10, color: 'var(--t3)' }}>de {totP} procesadas</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div className="mono c-blue" style={{ fontSize: 14, fontWeight: 700 }}>{totS}</div>
                  <div style={{ fontSize: 10, color: 'var(--t3)' }}>despachadas</div>
                </div>
                <i className="ti ti-chevron-down" style={{ fontSize: 16, color: 'var(--t3)', transition: 'transform .2s', transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }} />
              </div>
            </div>

            {isOpen && (
              <div className="lote-body">
                <table>
                  <thead>
                    <tr>
                      <th>Producto</th><th>Tipo</th><th>Procesadas</th><th>Disponible</th><th>Despachado</th><th>Estado</th><th>Avance</th><th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {l.productos.map(p => {
                      const pct = p.procesadas > 0 ? Math.round(p.despachado / p.procesadas * 100) : 0
                      const dc2 = p.estado === 'En proceso' ? 'c-amber' : p.disponible === 0 ? 'c-red' : 'c-green'
                      return (
                        <tr key={p.id} className="data-row">
                          <td style={{ fontWeight: 600 }}>{p.nombre}</td>
                          <td style={{ fontSize: 12, color: 'var(--t2)' }}>{p.tipo_caja}</td>
                          <td className="mono">{p.procesadas}</td>
                          <td><span className={`mono ${dc2}`} style={{ fontWeight: 700, fontSize: 14 }}>{p.disponible}</span></td>
                          <td className="mono" style={{ color: 'var(--t2)' }}>{p.despachado}</td>
                          <td>{estadoBadge(p.estado)}</td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <div className="prog" style={{ width: 80 }}>
                                <div className="prog-fill" style={{ width: `${pct}%`, background: pct === 100 ? 'var(--blue)' : pct > 60 ? 'var(--amber)' : 'var(--green)' }} />
                              </div>
                              <span style={{ fontSize: 11, color: 'var(--t3)' }}>{pct}%</span>
                            </div>
                          </td>
                          <td>
                            {p.estado !== 'Agotado' && p.estado !== 'En proceso' ? (
                              <button className="btn btn-ghost btn-xs" onClick={() => openModal(
                                <DespachoRapidoModal prod={p} loteId={l.id} closeModal={closeModal} toast={toast} onDone={load} />
                              )}>
                                <i className="ti ti-arrow-up-right" />Despachar
                              </button>
                            ) : <span style={{ fontSize: 11, color: 'var(--t3)' }}>—</span>}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
                <div style={{ padding: '9px 16px', background: 'var(--s2)', borderTop: '0.5px solid var(--border)', display: 'flex', gap: 8, alignItems: 'center' }}>
                  <i className="ti ti-calendar-event" style={{ fontSize: 13, color: 'var(--t3)' }} />
                  <span style={{ fontSize: 12, color: 'var(--t3)' }}>{l.fecha} · Registrado por {l.responsable}</span>
                </div>
              </div>
            )}
          </div>
        )
      })}
    </>
  )
}

// ===================== MOVIMIENTOS =====================
function MovActions({ openModal, closeModal, toast }: any) {
  return (
    <button className="btn btn-blue btn-sm" onClick={() => openModal(<MovProdModal closeModal={closeModal} toast={toast} />)}>
      <i className="ti ti-plus" />Nuevo movimiento
    </button>
  )
}

function MovimientosPage() {
  const [movs, setMovs] = useState<Movimiento[]>([])
  const [loading, setLoading] = useState(true)
  const [filtroTipo, setFiltroTipo] = useState('')
  const [filtroLote, setFiltroLote] = useState('')
  const [lotes, setLotes] = useState<{ id: string; especie: string }[]>([])

  useEffect(() => {
    fetch('/api/lotes').then(r => r.json()).then(d => setLotes(d.map((l: any) => ({ id: l.id, especie: l.especie }))))
  }, [])

  useEffect(() => {
    setLoading(true)
    const params = new URLSearchParams()
    if (filtroTipo) params.set('tipo', filtroTipo)
    if (filtroLote) params.set('lote', filtroLote)
    fetch(`/api/movimientos?${params}`).then(r => r.json()).then(d => { setMovs(d); setLoading(false) })
  }, [filtroTipo, filtroLote])

  return (
    <>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 16, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--t2)' }}>Filtrar:</span>
        {[['', 'Todos'], ['Entrada', 'Entradas'], ['Salida', 'Salidas']].map(([val, label]) => (
          <button key={val} className={`chip ${filtroTipo === val ? 'chip-active' : 'chip-inactive'}`} onClick={() => setFiltroTipo(val)}>
            {val === 'Entrada' && <i className="ti ti-arrow-down" style={{ fontSize: 12, color: filtroTipo === 'Entrada' ? '#fff' : 'var(--green)' }} />}
            {val === 'Salida' && <i className="ti ti-arrow-up" style={{ fontSize: 12, color: filtroTipo === 'Salida' ? '#fff' : 'var(--blue)' }} />}
            {label}
          </button>
        ))}
        <select className="fi" style={{ width: 160, padding: '5px 8px', fontSize: 12 }} value={filtroLote} onChange={e => setFiltroLote(e.target.value)}>
          <option value="">Todos los lotes</option>
          {lotes.map(l => <option key={l.id} value={l.id}>{l.id} — {l.especie}</option>)}
        </select>
      </div>

      <div className="card">
        <div className="card-head">
          <div className="card-title"><i className="ti ti-arrows-exchange" style={{ color: 'var(--blue)' }} />Registro de movimientos</div>
          <span className="badge b-blue">{movs.length} registros</span>
        </div>
        <table>
          <thead>
            <tr><th>Fecha / Hora</th><th>Lote</th><th>Producto</th><th>Tipo</th><th>Cajas</th><th>Responsable</th><th>Nota</th></tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7}><div className="loading-row"><div className="spinner" />Cargando...</div></td></tr>
            ) : movs.length === 0 ? (
              <tr><td colSpan={7}><div className="empty-state">Sin movimientos.</div></td></tr>
            ) : movs.map((m, i) => (
              <tr key={m.id} className="data-row slide-in" style={{ animationDelay: `${i * 20}ms` }}>
                <td className="mono" style={{ fontSize: 11, color: 'var(--t2)' }}>{new Date(m.created_at).toLocaleString('es-CL')}</td>
                <td><span style={{ fontFamily: 'DM Mono,monospace', fontSize: 12, fontWeight: 700, color: 'var(--blue-dark)', background: 'var(--blue-bg)', padding: '2px 7px', borderRadius: 20 }}>{m.lote_id}</span></td>
                <td style={{ fontWeight: 500 }}>{m.producto_nombre}</td>
                <td>
                  {m.tipo === 'Entrada'
                    ? <span className="badge b-green"><i className="ti ti-arrow-down" style={{ fontSize: 11 }} />Entrada</span>
                    : <span className="badge b-blue"><i className="ti ti-arrow-up" style={{ fontSize: 11 }} />Salida</span>}
                </td>
                <td><span className="mono" style={{ fontWeight: 700, fontSize: 13 }}>{m.cajas}</span></td>
                <td style={{ fontSize: 12, color: 'var(--t2)' }}>{m.responsable}</td>
                <td style={{ fontSize: 12, color: 'var(--t3)' }}>{m.nota || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}

// ===================== RECURSOS =====================
function RecursosActions({ openModal, closeModal, toast }: any) {
  return <>
    <button className="btn btn-ghost btn-sm" onClick={() => openModal(<MovRecursoModal closeModal={closeModal} toast={toast} />)}>
      <i className="ti ti-arrows-exchange" />Registrar movimiento
    </button>
    <button className="btn btn-blue btn-sm" onClick={() => openModal(<NuevoRecursoModal closeModal={closeModal} toast={toast} />)}>
      <i className="ti ti-plus" />Nuevo recurso
    </button>
  </>
}

function RecursosPage({ openModal, closeModal, toast }: any) {
  const [recursos, setRecursos] = useState<Recurso[]>([])
  const [movs, setMovs] = useState<MovimientoRecurso[]>([])
  const [loading, setLoading] = useState(true)
  const [filtro, setFiltro] = useState('')

  const loadRecursos = useCallback(async () => {
    const [r1, r2] = await Promise.all([fetch('/api/recursos'), fetch('/api/mov-recursos')])
    const [d1, d2] = await Promise.all([r1.json(), r2.json()])
    setRecursos(d1); setMovs(d2); setLoading(false)
  }, [])

  useEffect(() => { loadRecursos() }, [loadRecursos])

  const filteredMovs = filtro ? movs.filter(m => m.tipo === filtro) : movs

  return (
    <>
      {loading ? (
        <div className="loading-row"><div className="spinner" />Cargando recursos...</div>
      ) : (
        <div className="inv-grid">
          {recursos.map((r, i) => {
            const pct = Math.min(100, Math.round(r.cantidad / (r.stock_minimo * 2 || 1) * 100))
            const estado = r.cantidad <= r.stock_minimo ? 'crítico' : r.cantidad <= r.stock_minimo * 1.5 ? 'bajo' : 'ok'
            const ec = estado === 'crítico' ? 'red' : estado === 'bajo' ? 'amber' : 'green'
            const col = COLOR_MAP[r.color] || COLOR_MAP.blue

            return (
              <div key={r.id} className="inv-card pop-in" style={{ animationDelay: `${i * 40}ms` }}>
                <div className="inv-card-accent" style={{ background: col.accent }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                  <div className="inv-name">{r.nombre}</div>
                  <span className={`badge b-${ec}`} style={{ fontSize: 10, flexShrink: 0, marginLeft: 4 }}>{estado}</span>
                </div>
                <div className="inv-desc">{r.descripcion}</div>
                <div className="inv-qty" style={{ color: col.accent }}>
                  {r.cantidad}<span style={{ fontSize: 12, color: 'var(--t2)', fontFamily: 'DM Sans,sans-serif', marginLeft: 3 }}>{r.unidad}</span>
                </div>
                <div style={{ margin: '8px 0 4px' }}>
                  <div className="prog" style={{ width: '100%' }}>
                    <div className="prog-fill" style={{ width: `${pct}%`, background: ec === 'red' ? 'var(--red)' : ec === 'amber' ? 'var(--amber)' : 'var(--green)' }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 3, fontSize: 10, color: 'var(--t3)' }}>
                    <span>Mín {r.stock_minimo} {r.unidad}</span><span>{pct}%</span>
                  </div>
                </div>
                <div className="inv-prov">
                  <i className="ti ti-building-factory-2" style={{ fontSize: 12, verticalAlign: -1, marginRight: 3, color: 'var(--t3)' }} />
                  <span style={{ color: 'var(--t3)' }}>{r.proveedor}</span>
                  <span style={{ marginLeft: 6, fontSize: 10, color: 'var(--t3)', background: 'var(--s3)', padding: '1px 6px', borderRadius: 10 }}>{r.categoria}</span>
                </div>
                <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
                  <button className="btn btn-ghost btn-xs" style={{ flex: 1, justifyContent: 'center' }}
                    onClick={() => openModal(<RecursoMovRapidoModal recurso={r} tipo="Entrada" closeModal={closeModal} toast={toast} onDone={loadRecursos} />)}>
                    <i className="ti ti-arrow-down" style={{ color: 'var(--green)' }} />Entrada
                  </button>
                  <button className="btn btn-ghost btn-xs" style={{ flex: 1, justifyContent: 'center' }}
                    onClick={() => openModal(<RecursoMovRapidoModal recurso={r} tipo="Salida" closeModal={closeModal} toast={toast} onDone={loadRecursos} />)}>
                    <i className="ti ti-arrow-up" style={{ color: 'var(--blue)' }} />Salida
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <div className="section-divider">
        <div className="section-divider-line" />
        <div className="section-divider-label"><i className="ti ti-history" style={{ fontSize: 11, verticalAlign: -1, marginRight: 3 }} />Movimientos de recursos</div>
        <div className="section-divider-line" />
      </div>

      <div className="card">
        <div className="card-head">
          <div className="card-title"><i className="ti ti-arrows-exchange" style={{ color: 'var(--teal)' }} />Historial</div>
          <div style={{ display: 'flex', gap: 6 }}>
            {[['', 'Todos'], ['Entrada', 'Entradas'], ['Salida', 'Salidas']].map(([val, label]) => (
              <button key={val} className={`chip ${filtro === val ? 'chip-active' : 'chip-inactive'}`} onClick={() => setFiltro(val)}>
                {val === 'Entrada' && <i className="ti ti-arrow-down" style={{ fontSize: 11, color: filtro === 'Entrada' ? '#fff' : 'var(--green)' }} />}
                {val === 'Salida' && <i className="ti ti-arrow-up" style={{ fontSize: 11, color: filtro === 'Salida' ? '#fff' : 'var(--blue)' }} />}
                {label}
              </button>
            ))}
          </div>
        </div>
        <table>
          <thead><tr><th>Fecha</th><th>Recurso</th><th>Tipo</th><th>Cantidad</th><th>Responsable</th><th>Nota</th></tr></thead>
          <tbody>
            {filteredMovs.length === 0 ? (
              <tr><td colSpan={6}><div className="empty-state">Sin movimientos.</div></td></tr>
            ) : filteredMovs.map((m, i) => (
              <tr key={m.id} className="data-row" style={{ animation: `slideIn .18s ease ${i * 20}ms both` }}>
                <td className="mono" style={{ fontSize: 11, color: 'var(--t2)' }}>{new Date(m.created_at).toLocaleString('es-CL')}</td>
                <td style={{ fontWeight: 600 }}>{m.recurso_nombre}</td>
                <td>{m.tipo === 'Entrada'
                  ? <span className="badge b-green"><i className="ti ti-arrow-down" style={{ fontSize: 11 }} />Entrada</span>
                  : <span className="badge b-blue"><i className="ti ti-arrow-up" style={{ fontSize: 11 }} />Salida</span>}
                </td>
                <td><span className="mono" style={{ fontWeight: 700 }}>{m.cantidad}</span> {m.unidad}</td>
                <td style={{ fontSize: 12, color: 'var(--t2)' }}>{m.responsable}</td>
                <td style={{ fontSize: 12, color: 'var(--t3)' }}>{m.nota || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}

// ===================== MODALS =====================

function ModalHeader({ title, closeModal }: { title: string; closeModal: () => void }) {
  return (
    <div className="modal-hdr">
      <h2>{title}</h2>
      <button className="xbtn" onClick={closeModal}><i className="ti ti-x" /></button>
    </div>
  )
}

function NuevoLoteModal({ closeModal, toast }: any) {
  const [prods, setProds] = useState([{ nombre: '', tipo: '', cajas: '' }])
  const [loading, setLoading] = useState(false)
  const today = new Date().toISOString().split('T')[0]

  const addProd = () => setProds(p => [...p, { nombre: '', tipo: '', cajas: '' }])
  const removeProd = (i: number) => setProds(p => p.filter((_, idx) => idx !== i))
  const updateProd = (i: number, key: string, val: string) =>
    setProds(p => p.map((row, idx) => idx === i ? { ...row, [key]: val } : row))

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const validProds = prods.filter(p => p.nombre.trim() && parseInt(p.cajas) > 0)
    if (!validProds.length) { toast('Agrega al menos un producto con cajas', 'err'); return }
    setLoading(true)
    const r = await fetch('/api/lotes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: (fd.get('id') as string).toUpperCase(),
        especie: fd.get('especie'),
        fecha: fd.get('fecha'),
        responsable: fd.get('responsable'),
        nota: fd.get('nota'),
        productos: validProds.map(p => ({ nombre: p.nombre.trim(), tipo_caja: p.tipo.trim() || 'Caja', procesadas: parseInt(p.cajas) })),
      }),
    })
    const data = await r.json()
    setLoading(false)
    if (!r.ok) { toast(data.error || 'Error al guardar', 'err'); return }
    toast(`Lote registrado con ${validProds.length} producto(s)`, 'ok')
    closeModal()
    setTimeout(() => window.location.reload(), 300)
  }

  return (
    <form onSubmit={submit}>
      <ModalHeader title="Registrar nuevo lote" closeModal={closeModal} />
      <div className="frow">
        <div className="fg"><label className="fl">ID del lote</label><input className="fi" name="id" placeholder="Ej: JB-002" required /></div>
        <div className="fg"><label className="fl">Especie / faena</label><input className="fi" name="especie" placeholder="Ej: Jibia" required /></div>
      </div>
      <div className="frow">
        <div className="fg"><label className="fl">Fecha</label><input className="fi" name="fecha" type="date" defaultValue={today} required /></div>
        <div className="fg"><label className="fl">Responsable</label><input className="fi" name="responsable" placeholder="Operador" required /></div>
      </div>
      <div className="fg"><label className="fl">Nota (opcional)</label><input className="fi" name="nota" placeholder="Observación del lote" /></div>
      <div className="sep" />
      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '.6px', marginBottom: 8 }}>Productos del lote</div>
      <div className="prod-items-wrap">
        <div className="prod-item-hdr"><span>Producto</span><span>Tipo caja</span><span>Cajas</span><span /></div>
        {prods.map((p, i) => (
          <div key={i} className="prod-item-row">
            <input className="fi" style={{ padding: '5px 8px', fontSize: 12 }} placeholder="Nombre producto" value={p.nombre} onChange={e => updateProd(i, 'nombre', e.target.value)} />
            <input className="fi" style={{ padding: '5px 8px', fontSize: 12 }} placeholder="Tipo caja" value={p.tipo} onChange={e => updateProd(i, 'tipo', e.target.value)} />
            <input className="fi" type="number" style={{ padding: '5px 8px', fontSize: 12 }} placeholder="Cajas" value={p.cajas} min={0} onChange={e => updateProd(i, 'cajas', e.target.value)} />
            <button type="button" onClick={() => removeProd(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--t3)', fontSize: 18, lineHeight: 1, padding: 0 }}>×</button>
          </div>
        ))}
      </div>
      <button type="button" className="btn btn-ghost btn-sm" onClick={addProd} style={{ marginBottom: 4 }}><i className="ti ti-plus" />Agregar producto</button>
      <div className="factions">
        <button type="button" className="btn btn-ghost" onClick={closeModal}>Cancelar</button>
        <button type="submit" className="btn btn-blue" disabled={loading}>{loading ? <><div className="spinner" style={{ width: 14, height: 14 }} />Guardando...</> : <><i className="ti ti-check" />Registrar lote</>}</button>
      </div>
    </form>
  )
}

function MovProdModal({ closeModal, toast }: any) {
  const [lotes, setLotes] = useState<LoteConProductos[]>([])
  const [selectedLote, setSelectedLote] = useState('')
  const [selectedProd, setSelectedProd] = useState<ProductoLote | null>(null)
  const [tipo, setTipo] = useState<'Salida' | 'Entrada'>('Salida')
  const [loading, setLoading] = useState(false)

  useEffect(() => { fetch('/api/lotes').then(r => r.json()).then(setLotes) }, [])

  const loteActual = lotes.find(l => l.id === selectedLote)
  const prods = loteActual?.productos ?? []

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!selectedProd) { toast('Selecciona un producto', 'err'); return }
    const fd = new FormData(e.currentTarget)
    const cajas = parseInt(fd.get('cajas') as string)
    if (!cajas || cajas <= 0) { toast('Ingresa una cantidad válida', 'err'); return }
    setLoading(true)
    const r = await fetch('/api/movimientos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lote_id: selectedLote, producto_id: selectedProd.id, producto_nombre: selectedProd.nombre, tipo, cajas, responsable: fd.get('responsable'), nota: fd.get('nota') }),
    })
    const data = await r.json()
    setLoading(false)
    if (!r.ok) { toast(data.error, 'err'); return }
    toast(`${tipo} registrada: ${cajas} cajas de "${selectedProd.nombre}"`, 'ok')
    closeModal()
    setTimeout(() => window.location.reload(), 300)
  }

  return (
    <form onSubmit={submit}>
      <ModalHeader title="Registrar movimiento de producto" closeModal={closeModal} />
      <div className="fg">
        <label className="fl">Lote</label>
        <select className="fi" value={selectedLote} onChange={e => { setSelectedLote(e.target.value); setSelectedProd(null) }} required>
          <option value="">Seleccionar...</option>
          {lotes.map(l => <option key={l.id} value={l.id}>{l.id} — {l.especie}</option>)}
        </select>
      </div>
      <div className="fg">
        <label className="fl">Producto</label>
        <select className="fi" value={selectedProd?.id ?? ''} onChange={e => setSelectedProd(prods.find(p => p.id === parseInt(e.target.value)) ?? null)} required>
          <option value="">Seleccionar...</option>
          {prods.map(p => <option key={p.id} value={p.id}>{p.nombre} ({p.disponible} disp.)</option>)}
        </select>
      </div>
      {selectedProd && (
        <div className={`info-box ${tipo === 'Salida' ? 'info-green' : 'info-blue'}`}>
          <span style={{ fontSize: 12, color: tipo === 'Salida' ? 'var(--green-dark)' : 'var(--blue-dark)' }}>{tipo === 'Salida' ? 'Disponible para salida: ' : 'Procesadas actualmente: '}</span>
          <strong style={{ color: tipo === 'Salida' ? 'var(--green)' : 'var(--blue)', fontFamily: 'DM Mono,monospace' }}>{tipo === 'Salida' ? selectedProd.disponible : selectedProd.procesadas}</strong> cajas
        </div>
      )}
      <div className="frow">
        <div className="fg">
          <label className="fl">Tipo</label>
          <select className="fi" value={tipo} onChange={e => setTipo(e.target.value as any)}>
            <option value="Salida">Salida (despacho)</option>
            <option value="Entrada">Entrada (más cajas al lote)</option>
          </select>
        </div>
        <div className="fg"><label className="fl">Cajas</label><input className="fi" name="cajas" type="number" placeholder="0" min={1} required /></div>
      </div>
      <div className="frow">
        <div className="fg"><label className="fl">Responsable</label><input className="fi" name="responsable" placeholder="Nombre" required /></div>
        <div className="fg"><label className="fl">Nota</label><input className="fi" name="nota" placeholder="Ej: Pedido RM-442" /></div>
      </div>
      <div className="factions">
        <button type="button" className="btn btn-ghost" onClick={closeModal}>Cancelar</button>
        <button type="submit" className="btn btn-blue" disabled={loading}>{loading ? 'Guardando...' : <><i className="ti ti-check" />Confirmar</>}</button>
      </div>
    </form>
  )
}

function DespachoRapidoModal({ prod, loteId, closeModal, toast, onDone }: { prod: ProductoLote; loteId: string; closeModal: () => void; toast: any; onDone: () => void }) {
  const [loading, setLoading] = useState(false)

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const cajas = parseInt(fd.get('cajas') as string)
    if (!cajas || cajas <= 0) { toast('Ingresa una cantidad válida', 'err'); return }
    setLoading(true)
    const r = await fetch('/api/movimientos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lote_id: loteId, producto_id: prod.id, producto_nombre: prod.nombre, tipo: 'Salida', cajas, responsable: fd.get('responsable'), nota: fd.get('nota') }),
    })
    const data = await r.json()
    setLoading(false)
    if (!r.ok) { toast(data.error, 'err'); return }
    toast(`Salida: ${cajas} cajas de "${prod.nombre}". Quedan ${data.disponible}.`, 'ok')
    closeModal()
    onDone()
  }

  return (
    <form onSubmit={submit}>
      <ModalHeader title={`Despachar · ${loteId}`} closeModal={closeModal} />
      <div className="info-box info-green" style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 12, color: 'var(--green-dark)' }}>Disponible para despachar</div>
        <div style={{ fontSize: 26, fontWeight: 700, color: 'var(--green)', fontFamily: 'DM Mono,monospace' }}>{prod.disponible} cajas</div>
        <div style={{ fontSize: 12, color: 'var(--green-dark)' }}>{prod.nombre} · {prod.tipo_caja}</div>
      </div>
      <div className="frow">
        <div className="fg"><label className="fl">Cajas a despachar</label><input className="fi" name="cajas" type="number" placeholder="0" min={1} max={prod.disponible} required /></div>
        <div className="fg"><label className="fl">Responsable</label><input className="fi" name="responsable" placeholder="Nombre" required /></div>
      </div>
      <div className="fg"><label className="fl">Destino / Nota</label><input className="fi" name="nota" placeholder="Ej: Pedido RM-442" /></div>
      <div className="factions">
        <button type="button" className="btn btn-ghost" onClick={closeModal}>Cancelar</button>
        <button type="submit" className="btn btn-blue" disabled={loading}>{loading ? 'Guardando...' : <><i className="ti ti-arrow-up-right" />Confirmar salida</>}</button>
      </div>
    </form>
  )
}

function NuevoRecursoModal({ closeModal, toast }: any) {
  const [loading, setLoading] = useState(false)
  const cats = ['Conservación', 'EPP', 'Embalaje', 'Logística', 'Trazabilidad', 'Limpieza', 'Otro']
  const cols = ['blue', 'teal', 'purple', 'amber', 'green', 'red']

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    setLoading(true)
    const r = await fetch('/api/recursos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre: fd.get('nombre'), proveedor: fd.get('proveedor'), descripcion: fd.get('descripcion'), categoria: fd.get('categoria'), cantidad: parseInt(fd.get('cantidad') as string) || 0, unidad: fd.get('unidad'), stock_minimo: parseInt(fd.get('stock_minimo') as string) || 0, color: fd.get('color') }),
    })
    const data = await r.json()
    setLoading(false)
    if (!r.ok) { toast(data.error || 'Error', 'err'); return }
    toast(`Recurso "${fd.get('nombre')}" agregado`, 'ok')
    closeModal()
    setTimeout(() => window.location.reload(), 300)
  }

  return (
    <form onSubmit={submit}>
      <ModalHeader title="Agregar recurso externo" closeModal={closeModal} />
      <div className="frow">
        <div className="fg"><label className="fl">Nombre</label><input className="fi" name="nombre" placeholder="Ej: Guantes Nitrilo" required /></div>
        <div className="fg"><label className="fl">Proveedor</label><input className="fi" name="proveedor" placeholder="Nombre proveedor" required /></div>
      </div>
      <div className="fg"><label className="fl">Descripción</label><input className="fi" name="descripcion" placeholder="Descripción breve del artículo" /></div>
      <div className="frow3">
        <div className="fg"><label className="fl">Categoría</label><select className="fi" name="categoria">{cats.map(c => <option key={c}>{c}</option>)}</select></div>
        <div className="fg"><label className="fl">Cantidad inicial</label><input className="fi" name="cantidad" type="number" placeholder="0" min={0} /></div>
        <div className="fg"><label className="fl">Unidad</label><input className="fi" name="unidad" placeholder="u / kg / pares" required /></div>
      </div>
      <div className="frow">
        <div className="fg"><label className="fl">Stock mínimo</label><input className="fi" name="stock_minimo" type="number" placeholder="0" min={0} /></div>
        <div className="fg"><label className="fl">Color</label><select className="fi" name="color">{cols.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
      </div>
      <div className="factions">
        <button type="button" className="btn btn-ghost" onClick={closeModal}>Cancelar</button>
        <button type="submit" className="btn btn-blue" disabled={loading}>{loading ? 'Guardando...' : <><i className="ti ti-check" />Agregar recurso</>}</button>
      </div>
    </form>
  )
}

function MovRecursoModal({ closeModal, toast }: any) {
  const [recursos, setRecursos] = useState<Recurso[]>([])
  const [selectedRec, setSelectedRec] = useState<Recurso | null>(null)
  const [tipo, setTipo] = useState<'Salida' | 'Entrada'>('Salida')
  const [loading, setLoading] = useState(false)

  useEffect(() => { fetch('/api/recursos').then(r => r.json()).then(setRecursos) }, [])

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!selectedRec) { toast('Selecciona un recurso', 'err'); return }
    const fd = new FormData(e.currentTarget)
    const cantidad = parseInt(fd.get('cantidad') as string)
    setLoading(true)
    const r = await fetch('/api/mov-recursos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ recurso_id: selectedRec.id, tipo, cantidad, responsable: fd.get('responsable'), nota: fd.get('nota') }),
    })
    const data = await r.json()
    setLoading(false)
    if (!r.ok) { toast(data.error, 'err'); return }
    toast(`${tipo} registrada: ${cantidad} ${selectedRec.unidad} de "${selectedRec.nombre}"`, 'ok')
    closeModal()
    setTimeout(() => window.location.reload(), 300)
  }

  return (
    <form onSubmit={submit}>
      <ModalHeader title="Movimiento de recurso" closeModal={closeModal} />
      <div className="fg">
        <label className="fl">Recurso</label>
        <select className="fi" onChange={e => setSelectedRec(recursos.find(r => r.id === parseInt(e.target.value)) ?? null)} required>
          <option value="">Seleccionar...</option>
          {recursos.map(r => <option key={r.id} value={r.id}>{r.nombre} ({r.cantidad} {r.unidad} disp.)</option>)}
        </select>
      </div>
      {selectedRec && (
        <div className={`info-box ${tipo === 'Salida' ? 'info-green' : 'info-blue'}`}>
          <span style={{ fontSize: 12 }}>{tipo === 'Salida' ? 'Disponible: ' : 'Stock actual: '}</span>
          <strong style={{ fontFamily: 'DM Mono,monospace' }}>{selectedRec.cantidad} {selectedRec.unidad}</strong>
        </div>
      )}
      <div className="frow">
        <div className="fg">
          <label className="fl">Tipo</label>
          <select className="fi" value={tipo} onChange={e => setTipo(e.target.value as any)}>
            <option value="Salida">Salida (uso en planta)</option>
            <option value="Entrada">Entrada (reposición / compra)</option>
          </select>
        </div>
        <div className="fg"><label className="fl">Cantidad</label><input className="fi" name="cantidad" type="number" placeholder="0" min={1} required /></div>
      </div>
      <div className="frow">
        <div className="fg"><label className="fl">Responsable</label><input className="fi" name="responsable" placeholder="Nombre" required /></div>
        <div className="fg"><label className="fl">Nota</label><input className="fi" name="nota" placeholder="Ej: Lote JB-002" /></div>
      </div>
      <div className="factions">
        <button type="button" className="btn btn-ghost" onClick={closeModal}>Cancelar</button>
        <button type="submit" className="btn btn-blue" disabled={loading}>{loading ? 'Guardando...' : <><i className="ti ti-check" />Confirmar</>}</button>
      </div>
    </form>
  )
}

function RecursoMovRapidoModal({ recurso, tipo, closeModal, toast, onDone }: { recurso: Recurso; tipo: 'Entrada' | 'Salida'; closeModal: () => void; toast: any; onDone: () => void }) {
  const [loading, setLoading] = useState(false)
  const col = COLOR_MAP[recurso.color] || COLOR_MAP.blue

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const cantidad = parseInt(fd.get('cantidad') as string)
    setLoading(true)
    const r = await fetch('/api/mov-recursos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ recurso_id: recurso.id, tipo, cantidad, responsable: fd.get('responsable'), nota: fd.get('nota') }),
    })
    const data = await r.json()
    setLoading(false)
    if (!r.ok) { toast(data.error, 'err'); return }
    toast(`${tipo} confirmada: ${cantidad} ${recurso.unidad} de "${recurso.nombre}"`, 'ok')
    closeModal()
    onDone()
  }

  return (
    <form onSubmit={submit}>
      <ModalHeader title={`${tipo} · ${recurso.nombre}`} closeModal={closeModal} />
      <div style={{ background: col.bg, border: `0.5px solid rgba(0,0,0,.08)`, borderRadius: 'var(--r2)', padding: '12px 14px', marginBottom: 16 }}>
        <div style={{ fontSize: 12, color: col.dark }}>{tipo === 'Salida' ? 'Disponible para usar' : 'Stock actual'}</div>
        <div style={{ fontSize: 24, fontWeight: 700, color: col.accent, fontFamily: 'DM Mono,monospace' }}>{recurso.cantidad} {recurso.unidad}</div>
        <div style={{ fontSize: 12, color: col.dark }}>{recurso.proveedor}</div>
      </div>
      <div className="frow">
        <div className="fg"><label className="fl">Cantidad</label><input className="fi" name="cantidad" type="number" placeholder="0" min={1} required /></div>
        <div className="fg"><label className="fl">Responsable</label><input className="fi" name="responsable" placeholder="Nombre" required /></div>
      </div>
      <div className="fg"><label className="fl">Nota / Propósito</label><input className="fi" name="nota" placeholder="Ej: Conservación lote JB-002" /></div>
      <div className="factions">
        <button type="button" className="btn btn-ghost" onClick={closeModal}>Cancelar</button>
        <button type="submit" className="btn btn-blue" disabled={loading}>{loading ? 'Guardando...' : <><i className="ti ti-check" />Confirmar {tipo.toLowerCase()}</>}</button>
      </div>
    </form>
  )
}
