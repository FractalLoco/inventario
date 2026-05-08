const { Router } = require('express')
const { getMovRecursos, crearMovRecurso } = require('../controllers/movRecursos.controller')
const { validate } = require('../middleware/validate')
const { MovRecursoSchema } = require('../validations/recurso.validation')

const router = Router()

router.get('/', getMovRecursos)
router.post('/', validate(MovRecursoSchema), crearMovRecurso)

module.exports = router
