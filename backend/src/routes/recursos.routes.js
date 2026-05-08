const { Router } = require('express')
const { getRecursos, crearRecurso, actualizarRecurso, eliminarRecurso } = require('../controllers/recursos.controller')
const { validate } = require('../middleware/validate')
const { CrearRecursoSchema, EditarRecursoSchema } = require('../validations/recurso.validation')

const router = Router()

router.get('/', getRecursos)
router.post('/', validate(CrearRecursoSchema), crearRecurso)
router.patch('/:id', validate(EditarRecursoSchema), actualizarRecurso)
router.delete('/:id', eliminarRecurso)

module.exports = router
