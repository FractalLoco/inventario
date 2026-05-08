import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function LoginPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const submit = async (e) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithPassword({
      email: fd.get('email'),
      password: fd.get('password'),
    })
    if (error) setError(error.message === 'Invalid login credentials' ? 'Correo o contraseña incorrectos' : error.message)
    setLoading(false)
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--s1)',
    }}>
      <div style={{ width: 360 }}>
        <div className="card" style={{ padding: 32 }}>
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <div className="logo-box" style={{ margin: '0 auto 14px', width: 48, height: 48, fontSize: 17, borderRadius: 14 }}>3M</div>
            <div style={{ fontWeight: 700, fontSize: 20, color: 'var(--t1)' }}>Tres al Mar</div>
            <div style={{ fontSize: 13, color: 'var(--t3)', marginTop: 4 }}>Control de inventario · Ingreso</div>
          </div>

          <form onSubmit={submit}>
            <div className="fg">
              <label className="fl">Correo electrónico</label>
              <input
                className="fi"
                name="email"
                type="email"
                placeholder="operador@tresalmar.cl"
                required
                autoFocus
                autoComplete="email"
              />
            </div>
            <div className="fg">
              <label className="fl">Contraseña</label>
              <input
                className="fi"
                name="password"
                type="password"
                placeholder="••••••••"
                required
                autoComplete="current-password"
              />
            </div>

            {error && (
              <div style={{
                fontSize: 12,
                color: 'var(--red)',
                marginBottom: 14,
                padding: '9px 12px',
                background: 'var(--red-bg)',
                borderRadius: 'var(--r1)',
                border: '0.5px solid var(--red)',
              }}>
                <i className="ti ti-alert-circle" style={{ marginRight: 6, verticalAlign: -1 }} />
                {error}
              </div>
            )}

            <button
              type="submit"
              className="btn btn-blue"
              style={{ width: '100%', justifyContent: 'center', marginTop: 4, padding: '10px 0' }}
              disabled={loading}
            >
              {loading
                ? <><div className="spinner" style={{ width: 14, height: 14 }} />Ingresando...</>
                : <><i className="ti ti-login" />Ingresar</>
              }
            </button>
          </form>
        </div>

        <div style={{ textAlign: 'center', marginTop: 16, fontSize: 12, color: 'var(--t3)' }}>
          Los usuarios son creados por el administrador del sistema.
        </div>
      </div>
    </div>
  )
}
