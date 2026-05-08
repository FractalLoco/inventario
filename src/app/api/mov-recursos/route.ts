import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const tipo = searchParams.get('tipo')

  let query = supabase
    .from('movimientos_recursos')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(200)

  if (tipo) query = query.eq('tipo', tipo)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: Request) {
  const body = await req.json()
  const { recurso_id, tipo, cantidad, responsable, nota } = body

  if (!recurso_id || !tipo || !cantidad || !responsable) {
    return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 })
  }

  const { data: recurso, error: recErr } = await supabase
    .from('recursos')
    .select('*')
    .eq('id', recurso_id)
    .single()

  if (recErr || !recurso) return NextResponse.json({ error: 'Recurso no encontrado' }, { status: 404 })

  if (tipo === 'Salida' && cantidad > recurso.cantidad) {
    return NextResponse.json({ error: `Solo hay ${recurso.cantidad} ${recurso.unidad} disponibles` }, { status: 400 })
  }

  const nuevaCantidad = tipo === 'Salida' ? recurso.cantidad - cantidad : recurso.cantidad + cantidad

  const { error: updErr } = await supabase
    .from('recursos')
    .update({ cantidad: nuevaCantidad })
    .eq('id', recurso_id)

  if (updErr) return NextResponse.json({ error: updErr.message }, { status: 500 })

  await supabase.from('movimientos_recursos').insert({
    recurso_id, recurso_nombre: recurso.nombre, tipo, cantidad,
    unidad: recurso.unidad, responsable, nota: nota || '',
  })

  return NextResponse.json({ ok: true, cantidad: nuevaCantidad })
}
