import { useState } from 'react'
import { useRecursos } from '../hooks/useRecursos'
import { recursosService, movRecursosService } from '../services/api'
import { useModal } from '../context/ModalContext'
import { useToast } from '../context/ToastContext'
import Badge from '../components/Badge'
import ModalHeader from '../components/ModalHeader'
import Spinner from '../components/Spinner'

const COLOR_MAP = {
  blue:   { accent: 'var(--blue)',   bg: 'var(--blue-bg)',   dark: 'var(--blue-dark)'   },
  green:  { accent: 'var(--green)',  bg: 'var(--green-bg)',  dark: 'var(--green-dark)'  },
  amber:  { accent: 'var(--amber)',  bg: 'var(--amber-bg)',  dark: 'var(--amber-dark)'  },
  teal:   { accent: 'var(--teal)',   bg: 'var(--teal-bg)',   dark: 'var(--teal-dark)'   },
  purple: { accent: 'var(--purple)', bg: 'var(--purple-bg)', dark: 'var(--purple-dark)' },
  red:    { accent: 'var(--red)',    bg: 'var(--red-bg)',    dark: 'var(--red-dark)'    },
}

// ───── MODALS ─────

function NuevoRecursoModal({ onDone }) {
  const { closeModal } = useModal()
  const toast = useToast()
  const [loading, setLoading] = useState(false)
  const cats = ['Conservación', 'EPP', 'Embalaje', 'Logística', 'Trazabilidad', 'Limpieza', 'Otro']
  const cols = ['blue', 'teal', 'purple', 'amber', 'green', 'red']

  const submit = async (e) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    setLoading(true)
    try {
      await recursosService.crear({
        nombre: fd.get('nombre'),
        proveedor: fd.get('proveedor'),
        descripcion: fd.get('descripcion') || '',
        categoria: fd.get('categoria'),
        cantidad: parseInt(fd.get('cantidad')) || 0,
        unidad: fd.get('unidad'),
        stock_minimo: parseInt(fd.get('stock_minimo')) || 0,
        color: fd.get('color'),
      })
      toast(`Recurso "${fd.get('nombre')}" agregado`, 'ok')
      closeModal(); onDone()
    } catch (err) { toast(err.message, 'err') }
    finally { setLoading(false) }
  }

  return (
    <form onSubmit={submit}>
      <ModalHeader title="Agregar recurso externo" />
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
        <div className="fg">
          <label className="fl">Color</label>
          <select className="fi" name="color">{cols.map(c => <option key={c} value={c}>{c}</option>)}</select>
        </div>
      </div>
      <div className="factions">
        <button type="button" className="btn btn-ghost" onClick={closeModal}>Cancelar</button>
        <button type="submit" className="btn btn-blue" disabled={loading}>
          {loading ? 'Guardando...' : <><i className="ti ti-check" />Agregar recurso</>}
        </button>
      </div>
    </form>
  )
}

function MovRecursoModal({ onDone }) {
  const { closeModal } = useModal()
  const toast = useToast()
  const { recursos } = useRecursos()
  const [selected, setSelected] = useState(null)
  const [tipo, setTipo] = useState('Salida')
  const [loading, setLoading] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    if (!selected) { toast('Selecciona un recurso', 'err'); return }
    const fd = new FormData(e.currentTarget)
    const cantidad = parseInt(fd.get('cantidad'))
    setLoading(true)
    try {
      await movRecursosService.crear({ recurso_id: selected.id, tipo, cantidad, responsable: fd.get('responsable'), nota: fd.get('nota') || '' })
      toast(`${tipo} registrada: ${cantidad} ${selected.unidad} de "${selected.nombre}"`, 'ok')
      closeModal(); onDone()
    } catch (err) { toast(err.message, 'err') }
    finally { setLoading(false) }
  }

  return (
    <form onSubmit={submit}>
      <ModalHeader title="Movimiento de recurso" />
      <div className="fg">
        <label className="fl">Recurso</label>
        <select className="fi" onChange={e => setSelected(recursos.find(r => r.id === parseInt(e.target.value)) ?? null)} required>
          <option value="">Seleccionar...</option>
          {recursos.map(r => <option key={r.id} value={r.id}>{r.nombre} ({r.cantidad} {r.unidad} disp.)</option>)}
        </select>
      </div>
      {selected && (
        <div className={`info-box ${tipo === 'Salida' ? 'info-green' : 'info-blue'}`}>
          <span style={{ fontSize: 12 }}>{tipo === 'Salida' ? 'Disponible: ' : 'Stock actual: '}</span>
          <strong style={{ fontFamily: 'DM Mono,monospace' }}>{selected.cantidad} {selected.unidad}</strong>
        </div>
      )}
      <div className="frow">
        <div className="fg">
          <label className="fl">Tipo</label>
          <select className="fi" value={tipo} onChange={e => setTipo(e.target.value)}>
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
        <button type="submit" className="btn btn-blue" disabled={loading}><i className="ti ti-check" />Confirmar</button>
      </div>
    </form>
  )
}

function MovRapidoModal({ recurso, tipo, onDone }) {
  const { closeModal } = useModal()
  const toast = useToast()
  const [loading, setLoading] = useState(false)
  const col = COLOR_MAP[recurso.color] || COLOR_MAP.blue

  const submit = async (e) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const cantidad = parseInt(fd.get('cantidad'))
    setLoading(true)
    try {
      await movRecursosService.crear({ recurso_id: recurso.id, tipo, cantidad, responsable: fd.get('responsable'), nota: fd.get('nota') || '' })
      toast(`${tipo} confirmada: ${cantidad} ${recurso.unidad} de "${recurso.nombre}"`, 'ok')
      closeModal(); onDone()
    } catch (err) { toast(err.message, 'err') }
    finally { setLoading(false) }
  }

  return (
    <form onSubmit={submit}>
      <ModalHeader title={`${tipo} · ${recurso.nombre}`} />
      <div style={{ background: col.bg, border: '0.5px solid rgba(0,0,0,.08)', borderRadius: 'var(--r2)', padding: '12px 14px', marginBottom: 16 }}>
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
        <button type="submit" className="btn btn-blue" disabled={loading}>
          <i className="ti ti-check" />Confirmar {tipo.toLowerCase()}
        </button>
      </div>
    </form>
  )
}

// ───── PAGE ─────

function RecursosPageContent() {
  const { recursos, movimientos, loading, recargar } = useRecursos()
  const { openModal } = useModal()
  const [filtro, setFiltro] = useState('')

  const filteredMovs = filtro ? movimientos.filter(m => m.tipo === filtro) : movimientos

  return (
    <>
      {loading ? <Spinner /> : (
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
                  <Badge label={estado} />
                </div>
                <div className="inv-desc">{r.descripcion}</div>
                <div className="inv-qty" style={{ color: col.accent }}>
                  {r.cantidad}
                  <span style={{ fontSize: 12, color: 'var(--t2)', fontFamily: 'DM Sans,sans-serif', marginLeft: 3 }}>{r.unidad}</span>
                </div>
                <div style={{ margin: '8px 0 4px' }}>
                  <div className="prog" style={{ width: '100%' }}>
                    <div className="prog-fill" style={{ width: `${pct}%`, background: ec === 'red' ? 'var(--red)' : ec === 'amber' ? 'var(--amber)' : 'var(--green)' }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 3, fontSize: 10, color: 'var(--t3)' }}>
                    <span>Mín {r.stock_minimo} {r.unidad}</span>
                    <span>{pct}%</span>
                  </div>
                </div>
                <div className="inv-prov">
                  <i className="ti ti-building-factory-2" style={{ fontSize: 12, verticalAlign: -1, marginRight: 3, color: 'var(--t3)' }} />
                  <span style={{ color: 'var(--t3)' }}>{r.proveedor}</span>
                  <span style={{ marginLeft: 6, fontSize: 10, color: 'var(--t3)', background: 'var(--s3)', padding: '1px 6px', borderRadius: 10 }}>{r.categoria}</span>
                </div>
                <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
                  <button
                    className="btn btn-ghost btn-xs"
                    style={{ flex: 1, justifyContent: 'center' }}
                    onClick={() => openModal(<MovRapidoModal recurso={r} tipo="Entrada" onDone={recargar} />)}
                  >
                    <i className="ti ti-arrow-down" style={{ color: 'var(--green)' }} />Entrada
                  </button>
                  <button
                    className="btn btn-ghost btn-xs"
                    style={{ flex: 1, justifyContent: 'center' }}
                    onClick={() => openModal(<MovRapidoModal recurso={r} tipo="Salida" onDone={recargar} />)}
                  >
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
        <div className="section-divider-label">
          <i className="ti ti-history" style={{ fontSize: 11, verticalAlign: -1, marginRight: 3 }} />
          Movimientos de recursos
        </div>
        <div className="section-divider-line" />
      </div>

      <div className="card">
        <div className="card-head">
          <div className="card-title">
            <i className="ti ti-arrows-exchange" style={{ color: 'var(--teal)' }} />Historial
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            {[['', 'Todos'], ['Entrada', 'Entradas'], ['Salida', 'Salidas']].map(([val, label]) => (
              <button key={val} className={`chip ${filtro === val ? 'chip-active' : 'chip-inactive'}`} onClick={() => setFiltro(val)}>
                {val === 'Entrada' && <i className="ti ti-arrow-down" style={{ fontSize: 11 }} />}
                {val === 'Salida' && <i className="ti ti-arrow-up" style={{ fontSize: 11 }} />}
                {label}
              </button>
            ))}
          </div>
        </div>
        <table>
          <thead>
            <tr><th>Fecha</th><th>Recurso</th><th>Tipo</th><th>Cantidad</th><th>Responsable</th><th>Nota</th></tr>
          </thead>
          <tbody>
            {filteredMovs.length === 0 ? (
              <tr><td colSpan={6}><div className="empty-state">Sin movimientos registrados.</div></td></tr>
            ) : filteredMovs.map((m, i) => (
              <tr key={m.id} className="data-row" style={{ animation: `slideIn .18s ease ${i * 20}ms both` }}>
                <td className="mono" style={{ fontSize: 11, color: 'var(--t2)' }}>{new Date(m.created_at).toLocaleString('es-CL')}</td>
                <td style={{ fontWeight: 600 }}>{m.recurso_nombre}</td>
                <td><Badge label={m.tipo} /></td>
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

function RecursosActions() {
  const { openModal } = useModal()
  const { recargar } = useRecursos()
  return <>
    <button className="btn btn-ghost btn-sm" onClick={() => openModal(<MovRecursoModal onDone={recargar} />)}>
      <i className="ti ti-arrows-exchange" />Registrar movimiento
    </button>
    <button className="btn btn-blue btn-sm" onClick={() => openModal(<NuevoRecursoModal onDone={recargar} />)}>
      <i className="ti ti-plus" />Nuevo recurso
    </button>
  </>
}

RecursosPageContent.Actions = RecursosActions
export default RecursosPageContent
