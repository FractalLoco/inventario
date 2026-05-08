const { supabase } = require('../config/supabase')
const { ok, created, badRequest, notFound, serverError } = require('../helpers/response.helper')

const getLotes = async (_req, res) => {
  const { data: lotes, error: lotesErr } = await supabase
    .from('lotes')
    .select('*')
    .order('created_at', { ascending: false })

  if (lotesErr) return serverError(res, lotesErr.message)

  const { data: productos, error: prodsErr } = await supabase
    .from('productos_lote')
    .select('*')
    .order('id', { ascending: true })

  if (prodsErr) return serverError(res, prodsErr.message)

  const result = lotes.map((l) => ({
    ...l,
    productos: productos.filter((p) => p.lote_id === l.id),
  }))

  return ok(res, result)
}

const getLoteById = async (req, res) => {
  const { id } = req.params

  const { data: lote, error: loteErr } = await supabase
    .from('lotes').select('*').eq('id', id).single()

  if (loteErr || !lote) return notFound(res, `Lote ${id} no encontrado`)

  const { data: productos, error: prodsErr } = await supabase
    .from('productos_lote').select('*').eq('lote_id', id).order('id')

  if (prodsErr) return serverError(res, prodsErr.message)

  return ok(res, { ...lote, productos })
}

const crearLote = async (req, res) => {
  const { id, especie, fecha, responsable, nota, productos } = req.body

  const { error: existeErr } = await supabase.from('lotes').select('id').eq('id', id).single()
  if (!existeErr) return badRequest(res, `Ya existe un lote con ID ${id}`)

  const { error: loteErr } = await supabase
    .from('lotes')
    .insert({ id, especie, fecha, responsable, nota })

  if (loteErr) return serverError(res, loteErr.message)

  const prodsToInsert = productos.map((p) => ({
    lote_id: id,
    nombre: p.nombre,
    tipo_caja: p.tipo_caja || 'Caja',
    procesadas: p.procesadas,
    disponible: p.procesadas,
    despachado: 0,
    estado: 'Disponible',
  }))

  const { data: insertedProds, error: prodsErr } = await supabase
    .from('productos_lote')
    .insert(prodsToInsert)
    .select()

  if (prodsErr) return serverError(res, prodsErr.message)

  const movs = insertedProds.map((p) => ({
    lote_id: id,
    producto_id: p.id,
    producto_nombre: p.nombre,
    tipo: 'Entrada',
    cajas: p.procesadas,
    responsable,
    nota: 'Lote registrado',
  }))

  await supabase.from('movimientos').insert(movs)

  return created(res, { ok: true, lote_id: id, productos: insertedProds.length })
}

const eliminarLote = async (req, res) => {
  const { id } = req.params

  const { data: lote, error: loteErr } = await supabase
    .from('lotes').select('id').eq('id', id).single()

  if (loteErr || !lote) return notFound(res, `Lote ${id} no encontrado`)

  const { count, error: movErr } = await supabase
    .from('movimientos')
    .select('*', { count: 'exact', head: true })
    .eq('lote_id', id)
    .eq('tipo', 'Salida')

  if (movErr) return serverError(res, movErr.message)

  if (count > 0) {
    return badRequest(res, `No se puede eliminar el lote ${id}: tiene ${count} despacho(s) registrado(s)`)
  }

  const { error: delErr } = await supabase.from('lotes').delete().eq('id', id)
  if (delErr) return serverError(res, delErr.message)

  return ok(res, { ok: true, message: `Lote ${id} eliminado` })
}

module.exports = { getLotes, getLoteById, crearLote, eliminarLote }
