const BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000'

const req = async (url, options = {}) => {
  const res = await fetch(`${BASE}${url}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Error en la petición')
  return data
}

export const lotesService = {
  getAll: () => req('/api/lotes'),
  crear: (body) => req('/api/lotes', { method: 'POST', body: JSON.stringify(body) }),
}

export const movimientosService = {
  getAll: (params = {}) => {
    const qs = new URLSearchParams(params).toString()
    return req(`/api/movimientos${qs ? '?' + qs : ''}`)
  },
  crear: (body) => req('/api/movimientos', { method: 'POST', body: JSON.stringify(body) }),
}

export const recursosService = {
  getAll: () => req('/api/recursos'),
  crear: (body) => req('/api/recursos', { method: 'POST', body: JSON.stringify(body) }),
}

export const movRecursosService = {
  getAll: (params = {}) => {
    const qs = new URLSearchParams(params).toString()
    return req(`/api/mov-recursos${qs ? '?' + qs : ''}`)
  },
  crear: (body) => req('/api/mov-recursos', { method: 'POST', body: JSON.stringify(body) }),
}
