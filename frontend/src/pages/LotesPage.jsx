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
            <input className="fi" style={{ padding: '5px 8px', fontSize: 12 }} placeholder="Nombre producto" value={p.nombre} onChange={e => update(i, 'nombre', e.target.value)} />
            <input className="fi" style={{ padding: '5px 8px', fontSize: 12 }} placeholder="Tipo caja" value={p.tipo} onChange={e => update(i, 'tipo', e.target.value)} />
            <input className="fi" type="number" style={{ padding: '5px 8px', fontSize: 12 }} placeholder="Cajas" value={p.cajas} min={0} onChange={e => update(i, 'cajas', e.target.value)} />
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
    if (!cajas || cajas <= 0) { toast('Cantidad inválida', 'err'); return }
    setLoading(true)
    try {
      await movimientosService.crear({ lote_id: loteId, producto_id: prod.id, producto_nombre: prod.nombre, tipo, cajas, responsable: fd.get('responsable'), nota: fd.get('nota') || '' })
      toast(`${tipo} registrada: ${cajas} cajas de "${prod.nombre}"`, 'ok')
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
          {prods.map(p => <option key={p.id} value={p.id}>{p.nombre} ({p.disponible} disp.)</option>)}
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

function DespachoRapidoModal({ prod, loteId, onDone }) {
  const { closeModal } = useModal()
  const toast = useToast()
  const [loading, setLoading] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const cajas = parseInt(fd.get('cajas'))
    setLoading(true)
    try {
      const res = await movimientosService.crear({ lote_id: loteId, producto_id: prod.id, producto_nombre: prod.nombre, tipo: 'Salida', cajas, responsable: fd.get('responsable'), nota: fd.get('nota') || '' })
      toast(`Salida: ${cajas} cajas de "${prod.nombre}". Quedan ${res.disponible}.`, 'ok')
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
      <div className="fg"><label className="fl">Destino / Nota</label><input className="fi" name="nota" placeholder="Ej: Pedido RM-442" /></div>
      <div className="factions">
        <button type="button" className="btn btn-ghost" onClick={closeModal}>Cancelar</button>
        <button type="submit" className="btn btn-blue" disabled={loading}><i className="ti ti-arrow-up-right" />Confirmar salida</button>
      </div>
    </form>
  )
}

// ───── PAGE ─────

function LotesPageContent() {
  const { lotes, loading, recargar } = useLotes()
  const { openModal } = useModal()
  const [open, setOpen] = useState({})

  const toggle = (id) => setOpen(o => ({ ...o, [id]: !o[id] }))
  const isOpen = (id) => open[id] !== false

  const stats = {
    disp: lotes.reduce((a, l) => a + l.productos.reduce((b, p) => b + p.disponible, 0), 0),
    proc: lotes.reduce((a, l) => a + l.productos.filter(p => p.estado === 'En proceso').reduce((b, p) => b + p.procesadas, 0), 0),
    sal: lotes.reduce((a, l) => a + l.productos.reduce((b, p) => b + p.despachado, 0), 0),
    act: lotes.filter(l => l.productos.some(p => p.disponible > 0)).length,
  }

  return (
    <>
      <div className="stats-grid">
        <StatCard label="Disponible" value={stats.disp} note="cajas listas para mover" color="green" delay={0} />
        <StatCard label="En proceso" value={stats.proc} note="no disponibles aún" color="amber" delay={50} />
        <StatCard label="Despachado" value={stats.sal} note="cajas fuera de planta" color="blue" delay={100} />
        <StatCard label="Lotes activos" value={stats.act} note="con stock disponible" color="purple" delay={150} />
      </div>

      {loading ? <Spinner /> : lotes.length === 0 ? (
        <div className="empty-state">Sin lotes registrados. Crea el primero con "+ Nuevo lote".</div>
      ) : lotes.map((l, i) => {
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
                      const dc2 = p.estado === 'En proceso' ? 'c-amber' : p.disponible === 0 ? 'c-red' : 'c-green'
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
                            {p.estado !== 'Agotado' && p.estado !== 'En proceso' ? (
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
