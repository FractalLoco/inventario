/**
 * Entidad Lote
 * Representa una faena completa (ej: toda la jibia del día)
 * Un lote contiene múltiples productos con sus propias cantidades
 */
const LoteEntity = {
  tabla: 'lotes',
  tablaProductos: 'productos_lote',

  campos: ['id', 'especie', 'fecha', 'responsable', 'nota', 'created_at'],

  estadosProducto: ['Disponible', 'En proceso', 'Agotado'],
}

module.exports = { LoteEntity }
