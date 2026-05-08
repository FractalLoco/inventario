const { Router } = require('express')
const { getHistorial } = require('../controllers/historial.controller')

const router = Router()

router.get('/', getHistorial)

module.exports = router
