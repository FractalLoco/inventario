const { supabase } = require('../config/supabase')
const { ok, created, badRequest, notFound, serverError } = require('../helpers/response.helper')

const getMovRecursos = async (req, res) => {
  const { tipo } = req.query

  let query = supabase
    .from('movimientos_recursos')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(300)

  if (tipo) query = query.eq('tipo', tipo)

  const { data, error } = await query
  if (error) return serverError(res, error.message)
  return ok(res, data)
}

const crearMovRecurso = async (req, res) => {
  const { recurso_id, tipo, cantidad, responsable, nota } = req.body

  const { data: recurso, error: recErr } = await supabase
    .from('recursos')
    .select('*')
    .eq('id', recurso_id)
    .single()

  if (recErr || !recurso) return notFound(res, 'Recurso no encontrado')

  if (tipo === 'Salida' && cantidad > recurso.cantidad) {
    return badRequest(res, `Solo hay ${recurso.cantidad} ${recurso.unidad} disponibles de "${recurso.nombre}"`)
  }

  const nuevaCantidad = tipo === 'Salida'
    ? recurso.cantidad - cantidad
    : recurso.cantidad + cantidad

  const { error: updErr } = await supabase
    .from('recursos')
    .update({ cantidad: nuevaCantidad })
    .eq('id', recurso_id)

  if (updErr) return serverError(res, updErr.message)

  await supabase.from('movimientos_recursos').insert({
    recurso_id,
    recurso_nombre: recurso.nombre,
    tipo,
    cantidad,
    unidad: recurso.unidad,
    responsable,
    nota: nota || '',
  })

  return created(res, { ok: true, cantidad: nuevaCantidad })
}

module.exports = { getMovRecursos, crearMovRecurso }
