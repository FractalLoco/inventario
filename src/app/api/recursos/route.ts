import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  const { data, error } = await supabase
    .from('recursos')
    .select('*')
    .order('nombre', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: Request) {
  const body = await req.json()
  const { nombre, proveedor, descripcion, categoria, cantidad, unidad, stock_minimo, color } = body

  if (!nombre || !proveedor || !unidad) {
    return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('recursos')
    .insert({ nombre, proveedor, descripcion: descripcion || '', categoria: categoria || 'General', cantidad: cantidad || 0, unidad, stock_minimo: stock_minimo || 0, color: color || 'blue' })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  if (cantidad > 0) {
    await supabase.from('movimientos_recursos').insert({
      recurso_id: data.id, recurso_nombre: nombre, tipo: 'Entrada',
      cantidad, unidad, responsable: 'Registro inicial', nota: 'Recurso agregado',
    })
  }

  return NextResponse.json(data, { status: 201 })
}
