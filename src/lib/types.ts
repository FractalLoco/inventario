export interface Lote {
  id: string
  especie: string
  fecha: string
  responsable: string
  nota: string
  created_at?: string
}

export interface ProductoLote {
  id: number
  lote_id: string
  nombre: string
  tipo_caja: string
  procesadas: number
  disponible: number
  despachado: number
  estado: 'Disponible' | 'En proceso' | 'Agotado'
}

export interface LoteConProductos extends Lote {
  productos: ProductoLote[]
}

export interface Movimiento {
  id: number
  lote_id: string
  producto_id: number
  producto_nombre: string
  tipo: 'Entrada' | 'Salida'
  cajas: number
  responsable: string
  nota: string
  created_at: string
}

export interface Recurso {
  id: number
  nombre: string
  proveedor: string
  descripcion: string
  categoria: string
  cantidad: number
  unidad: string
  stock_minimo: number
  color: string
  created_at?: string
}

export interface MovimientoRecurso {
  id: number
  recurso_id: number
  recurso_nombre: string
  tipo: 'Entrada' | 'Salida'
  cantidad: number
  unidad: string
  responsable: string
  nota: string
  created_at: string
}
