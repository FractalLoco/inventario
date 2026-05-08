import { useState, useEffect, useCallback } from 'react'
import { recursosService, movRecursosService } from '../services/api'

export function useRecursos() {
  const [recursos, setRecursos] = useState([])
  const [movimientos, setMovimientos] = useState([])
  const [loading, setLoading] = useState(true)

  const cargar = useCallback(async () => {
    setLoading(true)
    try {
      const [r, m] = await Promise.all([recursosService.getAll(), movRecursosService.getAll()])
      setRecursos(r)
      setMovimientos(m)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { cargar() }, [cargar])

  return { recursos, movimientos, loading, recargar: cargar }
}
