const { z } = require('zod')

const ProductoSchema = z.object({
  nombre: z.string().min(1, 'Nombre requerido'),
  tipo_caja: z.string().optional().default('Caja'),
  procesadas: z.number().int().positive('Debe ser mayor a 0'),
})

const CrearLoteSchema = z.object({
  id: z.string().min(1).toUpperCase(),
  especie: z.string().min(1, 'Especie requerida'),
  fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato fecha inválido'),
  responsable: z.string().min(1, 'Responsable requerido'),
  nota: z.string().optional().default(''),
  productos: z.array(ProductoSchema).min(1, 'Agrega al menos un producto'),
})

module.exports = { CrearLoteSchema }
