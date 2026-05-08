const { supabase } = require('../config/supabase')
const { ok, serverError } = require('../helpers/response.helper')

const getHistorial = async (req, res) => {
  const { tabla, usuario, fecha_desde, fecha_hasta, limite = 200 } = req.query

  let query = supabase
    .from('historial_cambios')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(parseInt(limite))

  if (tabla) query = query.eq('tabla', tabla)
  if (usuario) query = query.ilike('usuario_email', `%${usuario}%`)
  if (fecha_desde) query = query.gte('created_at', fecha_desde)
  if (fecha_hasta) query = query.lte('created_at', fecha_hasta + 'T23:59:59')

  const { data, error } = await query
  if (error) return serverError(res, error.message)
  return ok(res, data)
}

module.exports = { getHistorial }
