const { supabase } = require('../config/supabase')
const { ok, created, badRequest, notFound, serverError } = require('../helpers/response.helper')
const { registrarCambio } = require('../helpers/historial.helper')

const getRecursos = async (_req, res) => {
  const { data, error } = await supabase
    .from('recursos').select('*').order('nombre', { ascending: true })
  if (error) return serverError(res, error.message)
  return ok(res, data)
}

const crearRecurso = async (req, res) => {
  const { nombre, proveedor, descripcion, categoria, cantidad, unidad, stock_minimo, color } = req.body

  const { data: existing } = await supabase
    .from('recursos').select('id').ilike('nombre', nombre).maybeSingle()
  if (existing) return badRequest(res, `Ya existe un recurso llamado "${nombre}"`)

  const { data, error } = await supabase
    .from('recursos')
    .insert({ nombre, proveedor, descripcion, categoria, cantidad, unidad, stock_minimo, color })
    .select().single()

  if (error) return serverError(res, error.message)

  if (cantidad > 0) {
    await supabase.from('movimientos_recursos').insert({
      recurso_id: data.id, recurso_nombre: nombre, tipo: 'Entrada',
      cantidad, unidad, responsable: 'Registro inicial', nota: 'Recurso agregado al sistema',
    })
  }

  await registrarCambio({
    usuario_email: req.user.email,
    accion: 'CREAR_RECURSO',
    tabla: 'recursos',
    registro_id: data.id,
    descripcion: `Recurso "${nombre}" creado — ${cantidad} ${unidad} (mín: ${stock_minimo})`,
  })

  return created(res, data)
}

const actualizarRecurso = async (req, res) => {
  const { id } = req.params
  const updates = req.body

  const { data: recurso, error: recErr } = await supabase
    .from('recursos').select('*').eq('id', id).single()
  if (recErr || !recurso) return notFound(res, 'Recurso no encontrado')

  if (updates.nombre && updates.nombre.toLowerCase() !== recurso.nombre.toLowerCase()) {
    const { data: dup } = await supabase
      .from('recursos').select('id').ilike('nombre', updates.nombre).neq('id', id).maybeSingle()
    if (dup) return badRequest(res, `Ya existe un recurso llamado "${updates.nombre}"`)
  }

  if (updates.stock_minimo !== undefined && updates.stock_minimo > recurso.cantidad) {
    return badRequest(res, `El stock mínimo (${updates.stock_minimo}) no puede superar el stock actual (${recurso.cantidad})`)
  }

  const allowed = ['nombre', 'proveedor', 'descripcion', 'stock_minimo', 'color']
  const safeUpdates = Object.fromEntries(Object.entries(updates).filter(([k]) => allowed.includes(k)))

  const { data, error } = await supabase
    .from('recursos').update(safeUpdates).eq('id', id).select().single()
  if (error) return serverError(res, error.message)

  await registrarCambio({
    usuario_email: req.user.email,
    accion: 'EDITAR_RECURSO',
    tabla: 'recursos',
    registro_id: id,
    descripcion: `Recurso "${recurso.nombre}" actualizado — campos: ${Object.keys(safeUpdates).join(', ')}`,
  })

  return ok(res, data)
}

const eliminarRecurso = async (req, res) => {
  const { id } = req.params

  const { data: recurso, error: recErr } = await supabase
    .from('recursos').select('id, nombre').eq('id', id).single()
  if (recErr || !recurso) return notFound(res, 'Recurso no encontrado')

  const { count, error: movErr } = await supabase
    .from('movimientos_recursos').select('*', { count: 'exact', head: true })
    .eq('recurso_id', id).neq('responsable', 'Registro inicial')
  if (movErr) return serverError(res, movErr.message)

  if (count > 0) {
    return badRequest(res, `No se puede eliminar "${recurso.nombre}": tiene ${count} movimiento(s) registrado(s)`)
  }

  const { error: delErr } = await supabase.from('recursos').delete().eq('id', id)
  if (delErr) return serverError(res, delErr.message)

  await registrarCambio({
    usuario_email: req.user.email,
    accion: 'ELIMINAR_RECURSO',
    tabla: 'recursos',
    registro_id: id,
    descripcion: `Recurso "${recurso.nombre}" eliminado`,
  })

  return ok(res, { ok: true })
}

module.exports = { getRecursos, crearRecurso, actualizarRecurso, eliminarRecurso }
