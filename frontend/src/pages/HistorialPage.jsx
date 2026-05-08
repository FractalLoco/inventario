import { useState, useEffect } from 'react'
import { historialService } from '../services/api'
import Spinner from '../components/Spinner'

const ACCION_CONFIG = {
  CREAR_LOTE:       { color: 'var(--green)',  bg: 'var(--green-bg)',  icon: 'ti-plus',          label: 'Crear lote' },
  ELIMINAR_LOTE:    { color: 'var(--red)',    bg: 'var(--red-bg)',    icon: 'ti-trash',         label: 'Eliminar lote' },
  SALIDA_PRODUCTO:  { color: 'var(--blue)',   bg: 'var(--blue-bg)',   icon: 'ti-arrow-up-right',label: 'Salida producto' },
  ENTRADA_PRODUCTO: { color: 'var(--teal)',   bg: 'var(--teal-bg)',   icon: 'ti-arrow-down-left',label: 'Entrada producto' },
  CREAR_RECURSO:    { color: 'var(--purple)', bg: 'var(--purple-bg)', icon: 'ti-package',       label: 'Crear recurso' },
  EDITAR_RECURSO:   { color: 'var(--amber)',  bg: 'var(--amber-bg)',  icon: 'ti-pencil',        label: 'Editar recurso' },
  ELIMINAR_RECURSO: { color: 'var(--red)',    bg: 'var(--red-bg)',    icon: 'ti-trash',         label: 'Eliminar recurso' },
  SALIDA_RECURSO:   { color: 'var(--blue)',   bg: 'var(--blue-bg)',   icon: 'ti-arrow-up',      label: 'Salida recurso' },
  ENTRADA_RECURSO:  { color: 'var(--green)',  bg: 'var(--green-bg)',  icon: 'ti-arrow-down',    label: 'Entrada recurso' },
}

const TABLAS = ['lotes', 'movimientos', 'recursos', 'movimientos_recursos']

function AccionBadge({ accion }) {
  const cfg = ACCION_CONFIG[accion] || { color: 'var(--t2)', bg: 'var(--s3)', icon: 'ti-point', label: accion }
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 20,
      color: cfg.color, background: cfg.bg,
    }}>
      <i className={`ti ${cfg.icon}`} style={{ fontSize: 11 }} />
      {cfg.label}
    </span>
  )
}

function HistorialPageContent() {
  const [historial, setHistorial] = useState([])
  const [loading, setLoading] = useState(true)
  const [filtroTabla, setFiltroTabla] = useState('')
  const [filtroUsuario, setFiltroUsuario] = useState('')
  const [fechaDesde, setFechaDesde] = useState('')
  const [fechaHasta, setFechaHasta] = useState('')

  useEffect(() => {
    setLoading(true)
    const params = {}
    if (filtroTabla) params.tabla = filtroTabla
    if (filtroUsuario) params.usuario = filtroUsuario
    if (fechaDesde) params.fecha_desde = fechaDesde
    if (fechaHasta) params.fecha_hasta = fechaHasta
    historialService.getAll(params)
      .then(d => { setHistorial(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [filtroTabla, filtroUsuario, fechaDesde, fechaHasta])

  const limpiar = () => { setFiltroTabla(''); setFiltroUsuario(''); setFechaDesde(''); setFechaHasta('') }
  const hayFiltros = filtroTabla || filtroUsuario || fechaDesde || fechaHasta

  return (
    <>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 16, flexWrap: 'wrap' }}>
        <select
          className="fi"
          style={{ width: 180, padding: '5px 8px', fontSize: 12 }}
          value={filtroTabla}
          onChange={e => setFiltroTabla(e.target.value)}
        >
          <option value="">Todas las tablas</option>
          {TABLAS.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <input
          className="fi"
          style={{ width: 180, padding: '5px 8px', fontSize: 12 }}
          placeholder="Buscar usuario..."
          value={filtroUsuario}
          onChange={e => setFiltroUsuario(e.target.value)}
        />
        <input className="fi" type="date" style={{ width: 140, padding: '5px 8px', fontSize: 12 }} value={fechaDesde} onChange={e => setFechaDesde(e.target.value)} title="Desde" />
        <input className="fi" type="date" style={{ width: 140, padding: '5px 8px', fontSize: 12 }} value={fechaHasta} onChange={e => setFechaHasta(e.target.value)} title="Hasta" />
        {hayFiltros && (
          <button className="btn btn-ghost btn-xs" onClick={limpiar}>
            <i className="ti ti-x" />Limpiar
          </button>
        )}
      </div>

      <div className="card">
        <div className="card-head">
          <div className="card-title">
            <i className="ti ti-shield-check" style={{ color: 'var(--purple)' }} />Registro de auditoría
          </div>
          <span className="badge b-blue">{historial.length} registros</span>
        </div>
        <table>
          <thead>
            <tr>
              <th>Fecha / Hora</th>
              <th>Usuario</th>
              <th>Acción</th>
              <th>Tabla</th>
              <th>ID Registro</th>
              <th>Descripción</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6}><Spinner /></td></tr>
            ) : historial.length === 0 ? (
              <tr><td colSpan={6}><div className="empty-state">Sin registros{hayFiltros ? ' para los filtros aplicados' : ''}.</div></td></tr>
            ) : historial.map((h, i) => (
              <tr key={h.id} className="data-row" style={{ animationDelay: `${i * 15}ms` }}>
                <td className="mono" style={{ fontSize: 11, color: 'var(--t2)', whiteSpace: 'nowrap' }}>
                  {new Date(h.created_at).toLocaleString('es-CL')}
                </td>
                <td style={{ fontSize: 12, color: 'var(--t2)', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  <i className="ti ti-user-circle" style={{ fontSize: 12, marginRight: 4, color: 'var(--t3)' }} />
                  {h.usuario_email}
                </td>
                <td><AccionBadge accion={h.accion} /></td>
                <td>
                  <span style={{ fontSize: 11, fontFamily: 'DM Mono,monospace', color: 'var(--t3)', background: 'var(--s3)', padding: '2px 6px', borderRadius: 4 }}>
                    {h.tabla}
                  </span>
                </td>
                <td className="mono" style={{ fontSize: 12, color: 'var(--blue-dark)' }}>
                  {h.registro_id || '—'}
                </td>
                <td style={{ fontSize: 12, color: 'var(--t2)', maxWidth: 300 }}>
                  {h.descripcion}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}

function HistorialActions() {
  return null
}

HistorialPageContent.Actions = HistorialActions
export default HistorialPageContent
