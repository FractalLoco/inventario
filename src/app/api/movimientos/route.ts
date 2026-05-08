import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const tipo = searchParams.get('tipo')
  const lote = searchParams.get('lote')

  let query = supabase
    .from('movimientos')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(200)

  if (tipo) query = query.eq('tipo', tipo)
  if (lote) query = query.eq('lote_id', lote)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json(data)
}

export async function POST(req: Request) {
  const body = await req.json()
  const { lote_id, producto_id, producto_nombre, tipo, cajas, responsable, nota } = body

  if (!lote_id || !producto_id || !tipo || !cajas || !responsable) {
    return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 })
  }

  // Leer producto actual
  const { data: prod, error: prodErr } = await supabase
    .from('productos_lote')
    .select('*')
    .eq('id', producto_id)
    .single()

  if (prodErr || !prod) return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 })

  let nuevaDisp = prod.disponible
  let nuevoDesp = prod.despachado
  let nuevoProc = prod.procesadas

  if (tipo === 'Salida') {
    if (cajas > prod.disponible) {
      return NextResponse.json({ error: `Solo hay ${prod.disponible} cajas disponibles` }, { status: 400 })
    }
    nuevaDisp -= cajas
    nuevoDesp += cajas
  } else {
    nuevaDisp += cajas
    nuevoProc += cajas
  }

  const nuevoEstado = nuevaDisp === 0 && tipo === 'Salida' ? 'Agotado' : nuevaDisp > 0 ? 'Disponible' : prod.estado

  const { error: updErr } = await supabase
    .from('productos_lote')
    .update({ disponible: nuevaDisp, despachado: nuevoDesp, procesadas: nuevoProc, estado: nuevoEstado })
    .eq('id', producto_id)

  if (updErr) return NextResponse.json({ error: updErr.message }, { status: 500 })

  const { error: movErr } = await supabase.from('movimientos').insert({
    lote_id, producto_id, producto_nombre, tipo, cajas, responsable, nota: nota || '',
  })

  if (movErr) return NextResponse.json({ error: movErr.message }, { status: 500 })

  return NextResponse.json({ ok: true, disponible: nuevaDisp, despachado: nuevoDesp })
}
