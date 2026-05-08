import { useState } from 'react'
import { useLotes } from '../hooks/useLotes'
import { movimientosService, lotesService } from '../services/api'
import { useModal } from '../context/ModalContext'
import { useToast } from '../context/ToastContext'
import StatCard from '../components/StatCard'
import Badge from '../components/Badge'
import ModalHeader from '../components/ModalHeader'
import Spinner from '../components/Spinner'

// ───── MODALS ─────

function NuevoLoteModal({ onDone }) {
  const { closeModal } = useModal()
  const toast = useToast()
  const [prods, setProds] = useState([{ nombre: '', tipo: '', cajas: '' }])
  const [loading, setLoading] = useState(false)
  const today = new Date().toISOString().split('T')[0]

  const addProd = () => setProds(p => [...p, { nombre: '', tipo: '', cajas: '' }])
  const removeProd = (i) => setProds(p => p.filter((_, idx) => idx !== i))
  const update = (i, k, v) => setProds(p => p.map((r, idx) => idx === i ? { ...r, [k]: v } : r))

  const submit = async (e) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const valid = prods.filter(p => p.nombre.trim() && parseInt(p.cajas) > 0)
    if (!valid.length) { toast('Agrega al menos un producto con cajas', 'err'); return }
    const nombres = valid.map(p => p.nombre.trim().toLowerCase())
    if (new Set(nombres).size !== nombres.length) { toast('Hay productos con nombres duplicados', 'err'); return }
    setLoading(true)
    try {
      await lotesService.crear({
        id: fd.get('id').toUpperCase(),
        especie: fd.get('especie'),
        fecha: fd.get('fecha'),
        responsable: fd.get('responsable'),
        nota: fd.get('nota') || '',
        productos: valid.map(p => ({ nombre: p.nombre.trim(), tipo_caja: p.tipo.trim() || 'Caja', procesadas: parseInt(p.cajas) })),
      })
      toast(`Lote registrado con ${valid.length} producto(s)`, 'ok')
      closeModal(); onDone()
    } catch (err) {
      toast(err.message, 'err')
    } finally { setLoading(false) }
  }

  return (
    <form onSubmit={submit}>
      <ModalHeader title="Registrar nuevo lote" />
      <div className="frow">
        <div className="fg"><label className="fl">ID del lote</label><input className="fi" name="id" placeholder="Ej: JB-002" required /></div>
        <div className="fg"><label className="fl">Especie / faena</label><input className="fi" name="especie" placeholder="Ej: Jibia" required /></div>
      </div>
      <div className="frow">
        <div className="fg"><label className="fl">Fecha</label><input className="fi" name="fecha" type="date" defaultValue={today} max={today} required /></div>
        <div className="fg"><label className="fl">Responsable</label><input className="fi" name="responsable" placeholder="Operador" required /></div>
      </div>
      <div className="fg"><label className="fl">Nota (opcional)</label><input className="fi" name="nota" placeholder="Observación del lote" /></div>
      <div className="sep" />
      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '.6px', marginBottom: 8 }}>Productos del lote</div>
      <div className="prod-items-wrap">
        <div className="prod-item-hdr"><span>Producto</span><span>Tipo caja</span><span>Cajas</span><span /></div>
        {prods.map((p, i) => (
          <div key={i} className="prod-item-row">
            <input className="fi" style={{ padding: '5px 8px', fontSize: 12 }} placeholder="Nombre producto" value={p.nombre} onChange={e => update(i, 'nombre', e.target.value)} />
            <input className="fi" style={{ padding: '5px 8px', fontSize: 12 }} placeholder="Tipo caja" value={p.tipo} onChange={e => update(i, 'tipo', e.target.value)} />
            <input className="fi" type="number" style={{ padding: '5px 8px', fontSize: 12 }} placeholder="Cajas" value={p.cajas} min={1} max={9999} onChange={e => update(i, 'cajas', e.target.value)} />
            <button type="button" onClick={() => removeProd(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--t3)', fontSize: 18, lineHeight: 1 }}>×</button>
          </div>
        ))}
      </div>
      <button type="button" className="btn btn-ghost btn-sm" onClick={addProd}><i className="ti ti-plus" />Agregar producto</button>
      <div className="factions">
        <button type="button" className="btn btn-ghost" onClick={closeModal}>Cancelar</button>
        <button type="submit" className="btn btn-blue" disabled={loading}>
          {loading ? <><div className="spinner" style={{ width: 14, height: 14 }} />Guardando...</> : <><i className="ti ti-check" />Registrar lote</>}
        </button>
      </div>
    </form>
  )
}

function MovProdModal({ lotes, onDone }) {
  const { closeModal } = useModal()
  const toast = useToast()
  const [loteId, setLoteId] = useState('')
  const [prod, setProd] = useState(null)
  const [tipo, setTipo] = useState('Salida')
  const [loading, setLoading] = useState(false)

  const loteActual = lotes.find(l => l.id === loteId)
  const prods = loteActual?.productos ?? []

  const submit = async (e) => {
    e.preventDefault()
    if (!prod) { toast('Selecciona un producto', 'err'); return }
    const fd = new FormData(e.currentTarget)
    const cajas = parseInt(fd.get('cajas'))
    const nota = fd.get('nota') || ''
    if (!cajas || cajas <= 0) { toast('Cantidad inválida', 'err'); return }
    if (tipo === 'Salida' && nota.trim().length < 3) { toast('La nota es obligatoria para salidas', 'err'); return }
    setLoading(true)
    try {
      const res = await movimientosService.crear({ lote_id: loteId, producto_id: prod.id, producto_nombre: prod.nombre, tipo, cajas, responsable: fd.get('responsable'), nota })
      const msg = `${tipo} registrada: ${cajas} cajas de "${prod.nombre}"`
      toast(res.alerta === 'agotado' ? `${msg} — PRODUCTO AGOTADO` : res.alerta === 'critico' ? `${msg} — Stock crítico (${res.disponible} restantes)` : msg, res.alerta ? 'warn' : 'ok')
      closeModal(); onDone()
    } catch (err) { toast(err.message, 'err') }
    finally { setLoading(false) }
  }

  return (
    <form onSubmit={submit}>
      <ModalHeader title="Registrar movimiento de producto" />
      <div className="fg">
        <label className="fl">Lote</label>
        <select className="fi" value={loteId} onChange={e => { setLoteId(e.target.value); setProd(null) }} required>
          <option value="">Seleccionar...</option>
          {lotes.map(l => <option key={l.id} value={l.id}>{l.id} — {l.especie}</option>)}
        </select>
      </div>
      <div className="fg">
        <label className="fl">Producto</label>
        <select className="fi" value={prod?.id ?? ''} onChange={e => setProd(prods.find(p => p.id === parseInt(e.target.value)) ?? null)} required>
          <option value="">Seleccionar...</option>
          {prods.map(p => <option key={p.id} value={p.id} disabled={tipo === 'Salida' && p.estado === 'Agotado'}>{p.nombre} ({p.disponible} disp.) {p.estado === 'Agotado' ? '— Agotado' : ''}</option>)}
        </select>
      </div>
      {prod && (
        <div className={`info-box ${tipo === 'Salida' ? 'info-green' : 'info-blue'}`}>
          <span style={{ fontSize: 12 }}>{tipo === 'Salida' ? 'Disponible para salida: ' : 'Procesadas actualmente: '}</span>
          <strong style={{ fontFamily: 'DM Mono,monospace' }}>{tipo === 'Salida' ? prod.disponible : prod.procesadas}</strong> cajas
        </div>
      )}
      <div className="frow">
        <div className="fg">
          <label className="fl">Tipo</label>
          <select className="fi" value={tipo} onChange={e => setTipo(e.target.value)}>
            <option value="Salida">Salida (despacho)</option>
            <option value="Entrada">Entrada (más cajas al lote)</option>
          </select>
        </div>
        <div className="fg"><label className="fl">Cajas</label><input className="fi" name="cajas" type="number" placeholder="0" min={1} max={tipo === 'Salida' ? prod?.disponible : 9999} required /></div>
      </div>
      <div className="frow">
        <div className="fg"><label className="fl">Responsable</label><input className="fi" name="responsable" placeholder="Nombre" required /></div>
        <div className="fg">
          <label className="fl">
            {tipo === 'Salida' ? <><span style={{ color: 'var(--red)' }}>*</span> Destino / Nota</> : 'Nota'}
          </label>
          <input className="fi" name="nota" placeholder={tipo === 'Salida' ? 'Ej: Pedido RM-442 — obligatorio' : 'Observación (opcional)'} required={tipo === 'Salida'} />
        </div>
      </div>
      <div className="factions">
        <button type="button" className="btn btn-ghost" onClick={closeModal}>Cancelar</button>
        <button type="submit" className="btn btn-blue" disabled={loading}>{loading ? 'Guardando...' : <><i className="ti ti-check" />Confirmar</>}</button>
      </div>
    </form>
  )
}

function DespachoRapidoModal({ prod, loteId, onDone }) {
  const { closeModal } = useModal()
  const toast = useToast()
  const [loading, setLoading] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const cajas = parseInt(fd.get('cajas'))
    const nota = fd.get('nota') || ''
    if (nota.trim().length < 3) { toast('Indica el destino o pedido (obligatorio)', 'err'); return }
    setLoading(true)
    try {
      const res = await movimientosService.crear({ lote_id: loteId, producto_id: prod.id, producto_nombre: prod.nombre, tipo: 'Salida', cajas, responsable: fd.get('responsable'), nota })
      const msg = `Salida: ${cajas} cajas de "${prod.nombre}". Quedan ${res.disponible}.`
      toast(res.alerta === 'agotado' ? `${msg} — PRODUCTO AGOTADO` : res.alerta === 'critico' ? `${msg} — Stock crítico` : msg, res.alerta ? 'warn' : 'ok')
      closeModal(); onDone()
    } catch (err) { toast(err.message, 'err') }
    finally { setLoading(false) }
  }

  return (
    <form onSubmit={submit}>
      <ModalHeader title={`Despachar · ${loteId}`} />
      <div className="info-box info-green" style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 12, color: 'var(--green-dark)' }}>Disponible para despachar</div>
        <div style={{ fontSize: 26, fontWeight: 700, color: 'var(--green)', fontFamily: 'DM Mono,monospace' }}>{prod.disponible} cajas</div>
        <div style={{ fontSize: 12, color: 'var(--green-dark)' }}>{prod.nombre} · {prod.tipo_caja}</div>
      </div>
      <div className="frow">
        <div className="fg"><label className="fl">Cajas a despachar</label><input className="fi" name="cajas" type="number" placeholder="0" min={1} max={prod.disponible} required /></div>
        <div className="fg"><label className="fl">Responsable</label><input className="fi" name="responsable" placeholder="Nombre" required /></div>
      </div>
      <div className="fg">
        <label className="fl"><span style={{ color: 'var(--red)' }}>*</span> Destino / Pedido</label>
        <input className="fi" name="nota" placeholder="Ej: Pedido RM-442 — obligatorio" required />
      </div>
      <div className="factions">
        <button type="button" className="btn btn-ghost" onClick={closeModal}>Cancelar</button>
        <button type="submit" className="btn btn-blue" disabled={loading}><i className="ti ti-arrow-up-right" />Confirmar salida</button>
      </div>
    </form>
  )
}

function EliminarLoteModal({ lote, onDone }) {
  const { closeModal } = useModal()
  const toast = useToast()
  const [loading, setLoading] = useState(false)

  const confirmar = async () => {
    setLoading(true)
    try {
      await lotesService.eliminar(lote.id)
      toast(`Lote ${lote.id} eliminado`, 'ok')
      closeModal(); onDone()
    } catch (err) { toast(err.message, 'err') }
    finally { setLoading(false) }
  }

  return (
    <div>
      <ModalHeader title={`Eliminar lote ${lote.id}`} />
      <div className="info-box" style={{ background: 'var(--red-bg)', border: '0.5px solid var(--red)', marginBottom: 16 }}>
        <div style={{ fontWeight: 700, color: 'var(--red)', marginBottom: 4 }}>¿Estás seguro?</div>
        <div style={{ fontSize: 13, color: 'var(--red-dark)' }}>
          Esta acción eliminará el lote <strong>{lote.id}</strong> ({lote.especie}) y todos sus productos.
          Solo se permite si no hay despachos registrados.
        </div>
      </div>
      <div className="factions">
        <button type="button" className="btn btn-ghost" onClick={closeModal}>Cancelar</button>
        <button type="button" className="btn" style={{ background: 'var(--red)', color: '#fff' }} disabled={loading} onClick={confirmar}>
          {loading ? 'Eliminando...' : <><i className="ti ti-trash" />Eliminar lote</>}
        </button>
      </div>
    </div>
  )
}

// ───── PAGE ─────

function LotesPageContent() {
  const { lotes, loading, recargar } = useLotes()
  const { openModal } = useModal()
  const [open, setOpen] = useState({})
  const [busqueda, setBusqueda] = useState('')

  const toggle = (id) => setOpen(o => ({ ...o, [id]: !o[id] }))
  const isOpen = (id) => open[id] !== false

  const lotesFiltrados = busqueda.trim()
    ? lotes.filter(l =>
        l.id.toLowerCase().includes(busqueda.toLowerCase()) ||
        l.especie.toLowerCase().includes(busqueda.toLowerCase()) ||
        l.responsable.toLowerCase().includes(busqueda.toLowerCase())
      )
    : lotes

  const stats = {
    disp: lotes.reduce((a, l) => a + l.productos.reduce((b, p) => b + p.disponible, 0), 0),
    proc: lotes.reduce((a, l) => a + l.productos.filter(p => p.estado === 'En proceso').reduce((b, p) => b + p.disponible, 0), 0),
    sal: lotes.reduce((a, l) => a + l.productos.reduce((b, p) => b + p.despachado, 0), 0),
    act: lotes.filter(l => l.productos.some(p => p.disponible > 0)).length,
  }

  return (
    <>
      <div className="stats-grid">
        <StatCard label="Disponible" value={stats.disp} note="cajas listas para mover" color="green" delay={0} />
        <StatCard label="En proceso" value={stats.proc} note="parcialmente despachado" color="amber" delay={50} />
        <StatCard label="Despachado" value={stats.sal} note="cajas fuera de planta" color="blue" delay={100} />
        <StatCard label="Lotes activos" value={stats.act} note="con stock disponible" color="purple" delay={150} />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: 340 }}>
          <i className="ti ti-search" style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', fontSize: 14, color: 'var(--t3)' }} />
          <input
            className="fi"
            style={{ paddingLeft: 30 }}
            placeholder="Buscar por ID, especie o responsable..."
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
          />
        </div>
        {busqueda && (
          <button className="btn btn-ghost btn-xs" onClick={() => setBusqueda('')}>
            <i className="ti ti-x" />Limpiar
          </button>
        )}
        {busqueda && <span style={{ fontSize: 12, color: 'var(--t3)' }}>{lotesFiltrados.length} resultado(s)</span>}
      </div>

      {loading ? <Spinner /> : lotesFiltrados.length === 0 ? (
        <div className="empty-state">{busqueda ? 'Sin resultados para la búsqueda.' : 'Sin lotes registrados. Crea el primero con "+ Nuevo lote".'}</div>
      ) : lotesFiltrados.map((l, i) => {
        const totP = l.productos.reduce((a, p) => a + p.procesadas, 0)
        const totD = l.productos.reduce((a, p) => a + p.disponible, 0)
        const totS = l.productos.reduce((a, p) => a + p.despachado, 0)
        const dc = totD === 0 ? 'c-red' : totD < totP * 0.3 ? 'c-amber' : 'c-green'
        const opened = isOpen(l.id)

        return (
          <div key={l.id} className="lote-block fade-up" style={{ animationDelay: `${i * 40}ms` }}>
            <div className="lote-hdr" onClick={() => toggle(l.id)}>
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
                <button
                  type="button"
                  className="btn btn-ghost btn-xs"
                  style={{ color: 'var(--red)', opacity: 0.7 }}
                  onClick={e => { e.stopPropagation(); openModal(<EliminarLoteModal lote={l} onDone={recargar} />) }}
                  title="Eliminar lote"
                >
                  <i className="ti ti-trash" />
                </button>
                <i className="ti ti-chevron-down" style={{ fontSize: 16, color: 'var(--t3)', transition: 'transform .2s', transform: opened ? 'rotate(180deg)' : 'rotate(0)' }} />
              </div>
            </div>

            {opened && (
              <div className="lote-body">
                <table>
                  <thead>
                    <tr><th>Producto</th><th>Tipo</th><th>Procesadas</th><th>Disponible</th><th>Despachado</th><th>Estado</th><th>Avance</th><th /></tr>
                  </thead>
                  <tbody>
                    {l.productos.map(p => {
                      const pct = p.procesadas > 0 ? Math.round(p.despachado / p.procesadas * 100) : 0
                      const dc2 = p.estado === 'Agotado' ? 'c-red' : p.estado === 'En proceso' ? 'c-amber' : 'c-green'
                      return (
                        <tr key={p.id} className="data-row">
                          <td style={{ fontWeight: 600 }}>{p.nombre}</td>
                          <td style={{ fontSize: 12, color: 'var(--t2)' }}>{p.tipo_caja}</td>
                          <td className="mono">{p.procesadas}</td>
                          <td><span className={`mono ${dc2}`} style={{ fontWeight: 700, fontSize: 14 }}>{p.disponible}</span></td>
                          <td className="mono" style={{ color: 'var(--t2)' }}>{p.despachado}</td>
                          <td><Badge label={p.estado} /></td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <div className="prog" style={{ width: 80 }}>
                                <div className="prog-fill" style={{ width: `${pct}%`, background: pct === 100 ? 'var(--blue)' : pct > 60 ? 'var(--amber)' : 'var(--green)' }} />
                              </div>
                              <span style={{ fontSize: 11, color: 'var(--t3)' }}>{pct}%</span>
                            </div>
                          </td>
                          <td>
                            {p.estado !== 'Agotado' ? (
                              <button className="btn btn-ghost btn-xs" onClick={() => openModal(<DespachoRapidoModal prod={p} loteId={l.id} onDone={recargar} />)}>
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

function LotesActions() {
  const { openModal } = useModal()
  const { lotes, recargar } = useLotes()
  return <>
    <button className="btn btn-ghost btn-sm" onClick={() => openModal(<MovProdModal lotes={lotes} onDone={recargar} />)}>
      <i className="ti ti-arrows-exchange" />Registrar movimiento
    </button>
    <button className="btn btn-blue btn-sm" onClick={() => openModal(<NuevoLoteModal onDone={recargar} />)}>
      <i className="ti ti-plus" />Nuevo lote
    </button>
  </>
}

LotesPageContent.Actions = LotesActions
export default LotesPageContent
