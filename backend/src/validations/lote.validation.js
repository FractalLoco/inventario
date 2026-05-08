const { z } = require('zod')

const hoy = () => new Date().toISOString().split('T')[0]

const ProductoSchema = z.object({
  nombre: z.string().min(2, 'Nombre muy corto').max(100, 'Nombre muy largo'),
  tipo_caja: z.string().max(50).optional().default('Caja'),
  procesadas: z.number().int().min(1, 'Debe ser al menos 1 caja').max(9999, 'Máximo 9999 cajas'),
})

const CrearLoteSchema = z.object({
  id: z.string().min(1, 'ID requerido').max(30, 'ID muy largo').toUpperCase(),
  especie: z.string().min(2, 'Especie requerida').max(100),
  fecha: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de fecha inválido (YYYY-MM-DD)')
    .refine(f => f <= hoy(), 'La fecha no puede ser futura'),
  responsable: z.string().min(2, 'Mínimo 2 caracteres').max(100),
  nota: z.string().max(300).optional().default(''),
  productos: z.array(ProductoSchema)
    .min(1, 'Agrega al menos un producto')
    .max(50, 'Máximo 50 productos por lote'),
}).superRefine((data, ctx) => {
  const names = data.productos.map(p => p.nombre.toLowerCase().trim())
  const dupes = names.filter((n, i) => names.indexOf(n) !== i)
  if (dupes.length > 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `Nombres de producto duplicados: ${[...new Set(dupes)].join(', ')}`,
      path: ['productos'],
    })
  }
})

module.exports = { CrearLoteSchema }
