import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  const { data: lotes, error: lotesErr } = await supabase
    .from('lotes')
    .select('*')
    .order('created_at', { ascending: false })

  if (lotesErr) return NextResponse.json({ error: lotesErr.message }, { status: 500 })

  const { data: productos, error: prodsErr } = await supabase
    .from('productos_lote')
    .select('*')
    .order('id', { ascending: true })

  if (prodsErr) return NextResponse.json({ error: prodsErr.message }, { status: 500 })

  const result = lotes.map((l: any) => ({
    ...l,
    productos: productos.filter((p: any) => p.lote_id === l.id),
  }))

  return NextResponse.json(result)
}

export async function POST(req: Request) {
  const body = await req.json()
  const { id, especie, fecha, responsable, nota, productos } = body

  if (!id || !especie || !productos?.length) {
    return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 })
  }

  const { error: loteErr } = await supabase
    .from('lotes')
    .insert({ id, especie, fecha, responsable, nota: nota || '' })

  if (loteErr) return NextResponse.json({ error: loteErr.message }, { status: 500 })

  const prodsToInsert = productos.map((p: any) => ({
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

  if (prodsErr) return NextResponse.json({ error: prodsErr.message }, { status: 500 })

  // Registrar movimientos de entrada iniciales
  const movs = (insertedProds as any[]).map((p) => ({
    lote_id: id,
    producto_id: p.id,
    producto_nombre: p.nombre,
    tipo: 'Entrada',
    cajas: p.procesadas,
    responsable,
    nota: 'Lote registrado',
  }))

  await supabase.from('movimientos').insert(movs)

  return NextResponse.json({ ok: true }, { status: 201 })
}
