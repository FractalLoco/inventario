const { Router } = require('express')
const { getLotes, getLoteById, crearLote, eliminarLote } = require('../controllers/lotes.controller')
const { validate } = require('../middleware/validate')
const { CrearLoteSchema } = require('../validations/lote.validation')

const router = Router()

router.get('/', getLotes)
router.get('/:id', getLoteById)
router.post('/', validate(CrearLoteSchema), crearLote)
router.delete('/:id', eliminarLote)

module.exports = router
