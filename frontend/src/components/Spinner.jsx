export default function Spinner({ text = 'Cargando...' }) {
  return (
    <div className="loading-row">
      <div className="spinner" />
      {text}
    </div>
  )
}
