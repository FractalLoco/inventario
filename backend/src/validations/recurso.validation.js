const { z } = require('zod')

const CrearRecursoSchema = z.object({
  nombre: z.string().min(2, 'Nombre muy corto').max(100, 'Nombre muy largo'),
  proveedor: z.string().min(2, 'Proveedor requerido').max(100),
  descripcion: z.string().max(300).optional().default(''),
  categoria: z.string().max(50).optional().default('General'),
  cantidad: z.number().int().min(0).max(999999).optional().default(0),
  unidad: z.string().min(1, 'Unidad requerida').max(20),
  stock_minimo: z.number().int().min(0).max(999999).optional().default(0),
  color: z.string().optional().default('blue'),
}).superRefine((data, ctx) => {
  if (data.cantidad > 0 && data.stock_minimo > data.cantidad) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'El stock mínimo no puede superar la cantidad inicial',
      path: ['stock_minimo'],
    })
  }
})

const EditarRecursoSchema = z.object({
  nombre: z.string().min(2).max(100).optional(),
  proveedor: z.string().min(2).max(100).optional(),
  descripcion: z.string().max(300).optional(),
  stock_minimo: z.number().int().min(0).max(999999).optional(),
  color: z.string().optional(),
})

const MovRecursoSchema = z.object({
  recurso_id: z.number().int().positive(),
  tipo: z.enum(['Entrada', 'Salida']),
  cantidad: z.number().int().min(1, 'Mínimo 1 unidad').max(999999),
  responsable: z.string().min(2, 'Mínimo 2 caracteres').max(100),
  nota: z.string().max(300).optional().default(''),
})

module.exports = { CrearRecursoSchema, EditarRecursoSchema, MovRecursoSchema }
