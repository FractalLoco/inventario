import { useState } from 'react'
import { ToastProvider } from '../context/ToastContext'
import { ModalProvider } from '../context/ModalContext'
import { AuthProvider, useAuth } from '../context/AuthContext'
import Sidebar from '../components/Sidebar'
import Topbar from '../components/Topbar'
import Spinner from '../components/Spinner'
import LoginPage from './LoginPage'
import LotesPage from './LotesPage'
import MovimientosPage from './MovimientosPage'
import RecursosPage from './RecursosPage'
import HistorialPage from './HistorialPage'

const TITLES = {
  lotes: 'Lotes en planta',
  movimientos: 'Movimientos · Entradas & Salidas',
  recursos: 'Recursos externos',
  historial: 'Historial de cambios',
}

function AppContent() {
  const { user, loading } = useAuth()
  const [page, setPage] = useState('lotes')

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--s1)' }}>
        <Spinner />
      </div>
    )
  }

  if (!user) return <LoginPage />

  return (
    <div className="app">
      <Sidebar page={page} setPage={setPage} />
      <main className="main">
        <Topbar
          title={TITLES[page]}
          actions={
            page === 'lotes' ? <LotesPage.Actions /> :
            page === 'movimientos' ? <MovimientosPage.Actions /> :
            page === 'recursos' ? <RecursosPage.Actions /> :
            <HistorialPage.Actions />
          }
        />
        <div className="content">
          {page === 'lotes' && <LotesPage />}
          {page === 'movimientos' && <MovimientosPage />}
          {page === 'recursos' && <RecursosPage />}
          {page === 'historial' && <HistorialPage />}
        </div>
      </main>
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <ModalProvider>
          <AppContent />
        </ModalProvider>
      </ToastProvider>
    </AuthProvider>
  )
}
