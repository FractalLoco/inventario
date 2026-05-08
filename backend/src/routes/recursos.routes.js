const { Router } = require('express')
const { getRecursos, crearRecurso } = require('../controllers/recursos.controller')
const { validate } = require('../middleware/validate')
const { CrearRecursoSchema } = require('../validations/recurso.validation')

const router = Router()

router.get('/', getRecursos)
router.post('/', validate(CrearRecursoSchema), crearRecurso)

module.exports = router
