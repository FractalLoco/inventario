/**
 * Entidad Recurso
 * Recursos externos: hielo, guantes, pallets, etc.
 */
const RecursoEntity = {
  tabla: 'recursos',
  tablaMovimientos: 'movimientos_recursos',

  campos: ['id', 'nombre', 'proveedor', 'descripcion', 'categoria', 'cantidad', 'unidad', 'stock_minimo', 'color', 'created_at'],

  categorias: ['Conservación', 'EPP', 'Embalaje', 'Logística', 'Trazabilidad', 'Limpieza', 'Otro'],

  colores: ['blue', 'teal', 'purple', 'amber', 'green', 'red'],

  getEstado(cantidad, stockMinimo) {
    if (cantidad <= stockMinimo) return 'crítico'
    if (cantidad <= stockMinimo * 1.5) return 'bajo'
    return 'ok'
  },
}

module.exports = { RecursoEntity }
