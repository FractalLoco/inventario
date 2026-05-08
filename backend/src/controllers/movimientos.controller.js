const { supabase } = require('../config/supabase')
const { ok, created, badRequest, notFound, serverError } = require('../helpers/response.helper')

const getMovimientos = async (req, res) => {
  const { tipo, lote } = req.query

  let query = supabase
    .from('movimientos')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(300)

  if (tipo) query = query.eq('tipo', tipo)
  if (lote) query = query.eq('lote_id', lote)

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

  if (tipo === 'Salida' && cajas > prod.disponible) {
    return badRequest(res, `Solo hay ${prod.disponible} cajas disponibles de "${producto_nombre}"`)
  }

  const nuevaDisp = tipo === 'Salida' ? prod.disponible - cajas : prod.disponible + cajas
  const nuevoDesp = tipo === 'Salida' ? prod.despachado + cajas : prod.despachado
  const nuevoProc = tipo === 'Entrada' ? prod.procesadas + cajas : prod.procesadas
  const nuevoEstado = nuevaDisp === 0 ? 'Agotado' : 'Disponible'

  const { error: updErr } = await supabase
    .from('productos_lote')
    .update({ disponible: nuevaDisp, despachado: nuevoDesp, procesadas: nuevoProc, estado: nuevoEstado })
    .eq('id', producto_id)

  if (updErr) return serverError(res, updErr.message)

  const { error: movErr } = await supabase.from('movimientos').insert({
    lote_id, producto_id, producto_nombre, tipo, cajas, responsable, nota: nota || '',
  })

  if (movErr) return serverError(res, movErr.message)

  return created(res, { ok: true, disponible: nuevaDisp, despachado: nuevoDesp })
}

module.exports = { getMovimientos, crearMovimiento }
