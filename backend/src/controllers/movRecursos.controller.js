const { supabase } = require('../config/supabase')
const { ok, created, badRequest, notFound, serverError } = require('../helpers/response.helper')
const { registrarCambio } = require('../helpers/historial.helper')

const getMovRecursos = async (req, res) => {
  const { tipo, recurso_id, fecha_desde, fecha_hasta, limite = 300, offset = 0 } = req.query

  let query = supabase
    .from('movimientos_recursos').select('*')
    .order('created_at', { ascending: false })
    .limit(parseInt(limite))
    .range(parseInt(offset), parseInt(offset) + parseInt(limite) - 1)

  if (tipo) query = query.eq('tipo', tipo)
  if (recurso_id) query = query.eq('recurso_id', recurso_id)
  if (fecha_desde) query = query.gte('created_at', fecha_desde)
  if (fecha_hasta) query = query.lte('created_at', fecha_hasta + 'T23:59:59')

  const { data, error } = await query
  if (error) return serverError(res, error.message)
  return ok(res, data)
}

const crearMovRecurso = async (req, res) => {
  const { recurso_id, tipo, cantidad, responsable, nota } = req.body

  const { data: recurso, error: recErr } = await supabase
    .from('recursos').select('*').eq('id', recurso_id).single()
  if (recErr || !recurso) return notFound(res, 'Recurso no encontrado')

  if (tipo === 'Salida' && recurso.cantidad === 0) {
    return badRequest(res, `"${recurso.nombre}" no tiene stock disponible`)
  }
  if (tipo === 'Salida' && cantidad > recurso.cantidad) {
    return badRequest(res, `Solo hay ${recurso.cantidad} ${recurso.unidad} disponibles de "${recurso.nombre}"`)
  }

  const nuevaCantidad = tipo === 'Salida' ? recurso.cantidad - cantidad : recurso.cantidad + cantidad

  const { error: updErr } = await supabase
    .from('recursos').update({ cantidad: nuevaCantidad }).eq('id', recurso_id)
  if (updErr) return serverError(res, updErr.message)

  await supabase.from('movimientos_recursos').insert({
    recurso_id, recurso_nombre: recurso.nombre, tipo, cantidad,
    unidad: recurso.unidad, responsable, nota: nota || '',
  })

  await registrarCambio({
    usuario_email: req.user.email,
    accion: tipo === 'Salida' ? 'SALIDA_RECURSO' : 'ENTRADA_RECURSO',
    tabla: 'movimientos_recursos',
    registro_id: recurso_id,
    descripcion: `${tipo} de ${cantidad} ${recurso.unidad} de "${recurso.nombre}" — ${nota || 'sin nota'}`,
  })

  const alertaStock = nuevaCantidad === 0 ? 'agotado'
    : nuevaCantidad <= recurso.stock_minimo ? 'critico'
    : nuevaCantidad <= recurso.stock_minimo * 1.5 ? 'bajo'
    : null

  return created(res, { ok: true, cantidad: nuevaCantidad, alerta: alertaStock, nombre: recurso.nombre, unidad: recurso.unidad })
}

module.exports = { getMovRecursos, crearMovRecurso }
