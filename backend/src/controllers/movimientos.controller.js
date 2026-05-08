const { supabase } = require('../config/supabase')
const { ok, created, badRequest, notFound, serverError } = require('../helpers/response.helper')

const getMovimientos = async (req, res) => {
  const { tipo, lote, fecha_desde, fecha_hasta, limite = 300, offset = 0 } = req.query

  let query = supabase
    .from('movimientos')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(parseInt(limite))
    .range(parseInt(offset), parseInt(offset) + parseInt(limite) - 1)

  if (tipo) query = query.eq('tipo', tipo)
  if (lote) query = query.eq('lote_id', lote)
  if (fecha_desde) query = query.gte('created_at', fecha_desde)
  if (fecha_hasta) query = query.lte('created_at', fecha_hasta + 'T23:59:59')

  const { data, error } = await query
  if (error) return serverError(res, error.message)

  return ok(res, data)
}

const crearMovimiento = async (req, res) => {
  const { lote_id, producto_id, producto_nombre, tipo, cajas, responsable, nota } = req.body

  const { data: prod, error: prodErr } = await supabase
    .from('productos_lote')
    .select('*')
    .eq('id', producto_id)
    .single()

  if (prodErr || !prod) return notFound(res, 'Producto no encontrado')

  if (prod.lote_id !== lote_id) {
    return badRequest(res, 'El producto no pertenece al lote indicado')
  }

  if (tipo === 'Salida') {
    if (prod.estado === 'Agotado') {
      return badRequest(res, `El producto "${prod.nombre}" está agotado`)
    }
    if (cajas > prod.disponible) {
      return badRequest(res, `Solo hay ${prod.disponible} cajas disponibles de "${producto_nombre}"`)
    }
  }

  const nuevaDisp = tipo === 'Salida' ? prod.disponible - cajas : prod.disponible + cajas
  const nuevoDesp = tipo === 'Salida' ? prod.despachado + cajas : Math.max(0, prod.despachado - cajas)
  const nuevoProc = tipo === 'Entrada' ? prod.procesadas + cajas : prod.procesadas

  let nuevoEstado
  if (nuevaDisp === 0) {
    nuevoEstado = 'Agotado'
  } else if (nuevoDesp > 0) {
    nuevoEstado = 'En proceso'
  } else {
    nuevoEstado = 'Disponible'
  }

  const { error: updErr } = await supabase
    .from('productos_lote')
    .update({ disponible: nuevaDisp, despachado: nuevoDesp, procesadas: nuevoProc, estado: nuevoEstado })
    .eq('id', producto_id)

  if (updErr) return serverError(res, updErr.message)

  const { error: movErr } = await supabase.from('movimientos').insert({
    lote_id, producto_id, producto_nombre, tipo, cajas, responsable, nota: nota || '',
  })

  if (movErr) return serverError(res, movErr.message)

  const alertaStock = nuevaDisp === 0
    ? 'agotado'
    : nuevaDisp <= Math.ceil(nuevoProc * 0.1)
    ? 'critico'
    : null

  return created(res, { ok: true, disponible: nuevaDisp, despachado: nuevoDesp, estado: nuevoEstado, alerta: alertaStock })
}

module.exports = { getMovimientos, crearMovimiento }
