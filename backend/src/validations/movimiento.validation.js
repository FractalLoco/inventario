const { z } = require('zod')

const CrearMovimientoSchema = z.object({
  lote_id: z.string().min(1),
  producto_id: z.number().int().positive(),
  producto_nombre: z.string().min(1),
  tipo: z.enum(['Entrada', 'Salida']),
  cajas: z.number().int().positive('Debe ser mayor a 0'),
  responsable: z.string().min(1, 'Responsable requerido'),
  nota: z.string().optional().default(''),
})

module.exports = { CrearMovimientoSchema }
