const { Router } = require('express')
const { getLotes, crearLote } = require('../controllers/lotes.controller')
const { validate } = require('../middleware/validate')
const { CrearLoteSchema } = require('../validations/lote.validation')

const router = Router()

router.get('/', getLotes)
router.post('/', validate(CrearLoteSchema), crearLote)

module.exports = router
