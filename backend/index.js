require('dotenv').config()
const express = require('express')
const cors = require('cors')
const { errorHandler } = require('./src/middleware/errorHandler')

const lotesRouter = require('./src/routes/lotes.routes')
const movimientosRouter = require('./src/routes/movimientos.routes')
const recursosRouter = require('./src/routes/recursos.routes')
const movRecursosRouter = require('./src/routes/movRecursos.routes')

const app = express()
const PORT = process.env.PORT || 4000

app.use(cors({ origin: process.env.FRONTEND_URL || '*' }))
app.use(express.json())

app.get('/api/health', (_req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }))

app.use('/api/lotes', lotesRouter)
app.use('/api/movimientos', movimientosRouter)
app.use('/api/recursos', recursosRouter)
app.use('/api/mov-recursos', movRecursosRouter)

app.use(errorHandler)

app.listen(PORT, () => {
  console.log(`Servidor Tres al Mar corriendo en http://localhost:${PORT}`)
})
