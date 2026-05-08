const { z } = require('zod')

const CrearRecursoSchema = z.object({
  nombre: z.string().min(1),
  proveedor: z.string().min(1),
  descripcion: z.string().optional().default(''),
  categoria: z.string().optional().default('General'),
  cantidad: z.number().int().min(0).optional().default(0),
  unidad: z.string().min(1),
  stock_minimo: z.number().int().min(0).optional().default(0),
  color: z.string().optional().default('blue'),
})

const MovRecursoSchema = z.object({
  recurso_id: z.number().int().positive(),
  tipo: z.enum(['Entrada', 'Salida']),
  cantidad: z.number().int().positive('Debe ser mayor a 0'),
  responsable: z.string().min(1),
  nota: z.string().optional().default(''),
})

module.exports = { CrearRecursoSchema, MovRecursoSchema }
