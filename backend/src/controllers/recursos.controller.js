const { supabase } = require('../config/supabase')
const { ok, created, badRequest, notFound, serverError } = require('../helpers/response.helper')

const getRecursos = async (_req, res) => {
  const { data, error } = await supabase
    .from('recursos')
    .select('*')
    .order('nombre', { ascending: true })

  if (error) return serverError(res, error.message)
  return ok(res, data)
}

const crearRecurso = async (req, res) => {
  const { nombre, proveedor, descripcion, categoria, cantidad, unidad, stock_minimo, color } = req.body

  const { data, error } = await supabase
    .from('recursos')
    .insert({ nombre, proveedor, descripcion, categoria, cantidad, unidad, stock_minimo, color })
    .select()
    .single()

  if (error) return serverError(res, error.message)

  if (cantidad > 0) {
    await supabase.from('movimientos_recursos').insert({
      recurso_id: data.id,
      recurso_nombre: nombre,
      tipo: 'Entrada',
      cantidad,
      unidad,
      responsable: 'Registro inicial',
      nota: 'Recurso agregado al sistema',
    })
  }

  return created(res, data)
}

module.exports = { getRecursos, crearRecurso }
