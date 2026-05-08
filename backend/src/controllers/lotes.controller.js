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

module.exports = { getLotes, crearLote }
