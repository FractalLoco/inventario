import { useState, useEffect, useCallback } from 'react'
import { lotesService } from '../services/api'

export function useLotes() {
  const [lotes, setLotes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const cargar = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await lotesService.getAll()
      setLotes(data)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { cargar() }, [cargar])

  return { lotes, loading, error, recargar: cargar }
}
