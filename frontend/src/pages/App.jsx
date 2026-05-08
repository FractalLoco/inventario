import { useState } from 'react'
import { ToastProvider } from '../context/ToastContext'
import { ModalProvider } from '../context/ModalContext'
import Sidebar from '../components/Sidebar'
import Topbar from '../components/Topbar'
import LotesPage from './LotesPage'
import MovimientosPage from './MovimientosPage'
import RecursosPage from './RecursosPage'

const TITLES = {
  lotes: 'Lotes en planta',
  movimientos: 'Movimientos · Entradas & Salidas',
  recursos: 'Recursos externos',
}

export default function App() {
  const [page, setPage] = useState('lotes')

  return (
    <ToastProvider>
      <ModalProvider>
        <div className="app">
          <Sidebar page={page} setPage={setPage} />
          <main className="main">
            <Topbar
              title={TITLES[page]}
              actions={
                page === 'lotes' ? <LotesPage.Actions /> :
                page === 'movimientos' ? <MovimientosPage.Actions /> :
                <RecursosPage.Actions />
              }
            />
            <div className="content">
              {page === 'lotes' && <LotesPage />}
              {page === 'movimientos' && <MovimientosPage />}
              {page === 'recursos' && <RecursosPage />}
            </div>
          </main>
        </div>
      </ModalProvider>
    </ToastProvider>
  )
}
