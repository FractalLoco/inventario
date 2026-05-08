import { useState, useEffect } from 'react'
import { movimientosService, lotesService } from '../services/api'
import { useModal } from '../context/ModalContext'
import { useToast } from '../context/ToastContext'
import Badge from '../components/Badge'
import ModalHeader from '../components/ModalHeader'
import Spinner from '../components/Spinner'

function MovimientosActions() {
  const { openModal } = useModal()
  const toast = useToast()
  return (
    <button className="btn btn-blue btn-sm" onClick={() => openModal(<NuevoMovModal toast={toast} />)}>
      <i className="ti ti-plus" />Nuevo movimiento
    </button>
  )
}

function NuevoMovModal({ toast }) {
  const { closeModal } = useModal()
  const [lotes, setLotes] = useState([])
  const [loteId, setLoteId] = useState('')
  const [prod, setProd] = useState(null)
  const [tipo, setTipo] = useState('Salida')
  const [loading, setLoading] = useState(false)

  useEffect(() => { lotesService.getAll().then(setLotes) }, [])

  const prods = lotes.find(l => l.id === loteId)?.productos ?? []

  const submit = async (e) => {
    e.preventDefault()
    if (!prod) { toast('Selecciona un producto', 'err'); return }
    const fd = new FormData(e.currentTarget)
    const cajas = parseInt(fd.get('cajas'))
    const nota = fd.get('nota') || ''
    if (tipo === 'Salida' && nota.trim().length < 3) { toast('La nota es obligatoria para salidas', 'err'); return }
    setLoading(true)
    try {
      await movimientosService.crear({ lote_id: loteId, producto_id: prod.id, producto_nombre: prod.nombre, tipo, cajas, responsable: fd.get('responsable'), nota })
      toast(`${tipo} registrada: ${cajas} cajas`, 'ok')
      closeModal()
    } catch (err) { toast(err.message, 'err') }
    finally { setLoading(false) }
  }

  return (
    <form onSubmit={submit}>
      <ModalHeader title="Nuevo movimiento" />
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
      <div className="frow">
        <div className="fg">
          <label className="fl">Tipo</label>
          <select className="fi" value={tipo} onChange={e => setTipo(e.target.value)}>
            <option value="Salida">Salida (despacho)</option>
            <option value="Entrada">Entrada (más cajas)</option>
          </select>
        </div>
        <div className="fg"><label className="fl">Cajas</label><input className="fi" name="cajas" type="number" min={1} max={tipo === 'Salida' ? prod?.disponible : 9999} placeholder="0" required /></div>
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

const exportCSV = (movs) => {
  const headers = ['Fecha', 'Lote', 'Producto', 'Tipo', 'Cajas', 'Responsable', 'Nota']
  const rows = movs.map(m => [
    new Date(m.created_at).toLocaleString('es-CL'),
    m.lote_id,
    m.producto_nombre,
    m.tipo,
    m.cajas,
    m.responsable,
    m.nota || '',
  ])
  const csv = [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n')
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `movimientos_${new Date().toISOString().split('T')[0]}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

function MovimientosPageContent() {
  const [movs, setMovs] = useState([])
  const [lotes, setLotes] = useState([])
  const [loading, setLoading] = useState(true)
  const [filtroTipo, setFiltroTipo] = useState('')
  const [filtroLote, setFiltroLote] = useState('')
  const [fechaDesde, setFechaDesde] = useState('')
  const [fechaHasta, setFechaHasta] = useState('')

  useEffect(() => { lotesService.getAll().then(d => setLotes(d.map(l => ({ id: l.id, especie: l.especie })))) }, [])

  useEffect(() => {
    setLoading(true)
    const params = {}
    if (filtroTipo) params.tipo = filtroTipo
    if (filtroLote) params.lote = filtroLote
    if (fechaDesde) params.fecha_desde = fechaDesde
    if (fechaHasta) params.fecha_hasta = fechaHasta
    movimientosService.getAll(params).then(d => { setMovs(d); setLoading(false) })
  }, [filtroTipo, filtroLote, fechaDesde, fechaHasta])

  const limpiarFiltros = () => { setFiltroTipo(''); setFiltroLote(''); setFechaDesde(''); setFechaHasta('') }
  const hayFiltros = filtroTipo || filtroLote || fechaDesde || fechaHasta

  return (
    <>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 16, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--t2)' }}>Filtrar:</span>
        {[['', 'Todos'], ['Entrada', 'Entradas'], ['Salida', 'Salidas']].map(([val, label]) => (
          <button key={val} className={`chip ${filtroTipo === val ? 'chip-active' : 'chip-inactive'}`} onClick={() => setFiltroTipo(val)}>
            {val === 'Entrada' && <i className="ti ti-arrow-down" style={{ fontSize: 12 }} />}
            {val === 'Salida' && <i className="ti ti-arrow-up" style={{ fontSize: 12 }} />}
            {label}
          </button>
        ))}
        <select className="fi" style={{ width: 160, padding: '5px 8px', fontSize: 12 }} value={filtroLote} onChange={e => setFiltroLote(e.target.value)}>
          <option value="">Todos los lotes</option>
          {lotes.map(l => <option key={l.id} value={l.id}>{l.id} — {l.especie}</option>)}
        </select>
        <input className="fi" type="date" style={{ width: 140, padding: '5px 8px', fontSize: 12 }} value={fechaDesde} onChange={e => setFechaDesde(e.target.value)} title="Desde" />
        <input className="fi" type="date" style={{ width: 140, padding: '5px 8px', fontSize: 12 }} value={fechaHasta} onChange={e => setFechaHasta(e.target.value)} title="Hasta" />
        {hayFiltros && (
          <button className="btn btn-ghost btn-xs" onClick={limpiarFiltros}>
            <i className="ti ti-x" />Limpiar
          </button>
        )}
      </div>

      <div className="card">
        <div className="card-head">
          <div className="card-title"><i className="ti ti-arrows-exchange" style={{ color: 'var(--blue)' }} />Registro de movimientos</div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span className="badge b-blue">{movs.length} registros</span>
            {movs.length > 0 && (
              <button className="btn btn-ghost btn-xs" onClick={() => exportCSV(movs)} title="Exportar CSV">
                <i className="ti ti-download" />CSV
              </button>
            )}
          </div>
        </div>
        <table>
          <thead><tr><th>Fecha / Hora</th><th>Lote</th><th>Producto</th><th>Tipo</th><th>Cajas</th><th>Responsable</th><th>Nota</th></tr></thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7}><Spinner /></td></tr>
            ) : movs.length === 0 ? (
              <tr><td colSpan={7}><div className="empty-state">Sin movimientos{hayFiltros ? ' para los filtros aplicados' : ''}.</div></td></tr>
            ) : movs.map((m, i) => (
              <tr key={m.id} className="data-row slide-in" style={{ animationDelay: `${i * 20}ms` }}>
                <td className="mono" style={{ fontSize: 11, color: 'var(--t2)' }}>{new Date(m.created_at).toLocaleString('es-CL')}</td>
                <td><span style={{ fontFamily: 'DM Mono,monospace', fontSize: 12, fontWeight: 700, color: 'var(--blue-dark)', background: 'var(--blue-bg)', padding: '2px 7px', borderRadius: 20 }}>{m.lote_id}</span></td>
                <td style={{ fontWeight: 500 }}>{m.producto_nombre}</td>
                <td><Badge label={m.tipo} /></td>
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

MovimientosPageContent.Actions = MovimientosActions
export default MovimientosPageContent
