/**
 * Entidad Movimiento
 * Registra entradas y salidas de productos por lote
 */
const MovimientoEntity = {
  tabla: 'movimientos',

  tipos: ['Entrada', 'Salida'],

  campos: ['id', 'lote_id', 'producto_id', 'producto_nombre', 'tipo', 'cajas', 'responsable', 'nota', 'created_at'],
}

module.exports = { MovimientoEntity }
