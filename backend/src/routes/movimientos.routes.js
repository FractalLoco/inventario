const { Router } = require('express')
const { getMovimientos, crearMovimiento } = require('../controllers/movimientos.controller')
const { validate } = require('../middleware/validate')
const { CrearMovimientoSchema } = require('../validations/movimiento.validation')

const router = Router()

router.get('/', getMovimientos)
router.post('/', validate(CrearMovimientoSchema), crearMovimiento)

module.exports = router
