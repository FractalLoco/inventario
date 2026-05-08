const { z } = require('zod')

const CrearMovimientoSchema = z.object({
  lote_id: z.string().min(1, 'Lote requerido'),
  producto_id: z.number().int().positive(),
  producto_nombre: z.string().min(1).max(100),
  tipo: z.enum(['Entrada', 'Salida']),
  cajas: z.number().int().min(1, 'Mínimo 1 caja').max(9999, 'Máximo 9999 cajas'),
  responsable: z.string().min(2, 'Mínimo 2 caracteres').max(100),
  nota: z.string().max(300).optional().default(''),
}).superRefine((data, ctx) => {
  if (data.tipo === 'Salida' && (!data.nota || data.nota.trim().length < 3)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'La nota es obligatoria en salidas (indica el destino o pedido)',
      path: ['nota'],
    })
  }
})

module.exports = { CrearMovimientoSchema }
