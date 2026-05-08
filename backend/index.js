require('dotenv').config()
const express = require('express')
const cors = require('cors')
const { errorHandler } = require('./src/middleware/errorHandler')
const { auth } = require('./src/middleware/auth')

const lotesRouter = require('./src/routes/lotes.routes')
const movimientosRouter = require('./src/routes/movimientos.routes')
const recursosRouter = require('./src/routes/recursos.routes')
const movRecursosRouter = require('./src/routes/movRecursos.routes')
const historialRouter = require('./src/routes/historial.routes')

const app = express()
const PORT = process.env.PORT || 4000

app.use(cors({ origin: process.env.FRONTEND_URL || '*' }))
app.use(express.json())

app.get('/api/health', (_req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }))

app.use('/api/lotes', auth, lotesRouter)
app.use('/api/movimientos', auth, movimientosRouter)
app.use('/api/recursos', auth, recursosRouter)
app.use('/api/mov-recursos', auth, movRecursosRouter)
app.use('/api/historial', auth, historialRouter)

app.use(errorHandler)

app.listen(PORT, () => {
  console.log(`Servidor Tres al Mar corriendo en http://localhost:${PORT}`)
})
