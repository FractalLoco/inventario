const ok = (res, data, status = 200) => res.status(status).json(data)

const created = (res, data) => res.status(201).json(data)

const badRequest = (res, message) => res.status(400).json({ error: message })

const notFound = (res, message = 'No encontrado') => res.status(404).json({ error: message })

const serverError = (res, message = 'Error interno del servidor') => res.status(500).json({ error: message })

module.exports = { ok, created, badRequest, notFound, serverError }
