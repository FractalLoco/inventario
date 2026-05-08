const colorMap = {
  Disponible: 'b-green',
  'En proceso': 'b-amber',
  Agotado: 'b-gray',
  Entrada: 'b-green',
  Salida: 'b-blue',
  ok: 'b-green',
  bajo: 'b-amber',
  crítico: 'b-red',
}

const iconMap = {
  Disponible: 'ti-circle-check',
  'En proceso': 'ti-clock',
  Entrada: 'ti-arrow-down',
  Salida: 'ti-arrow-up',
}

export default function Badge({ label }) {
  const cls = colorMap[label] || 'b-gray'
  const icon = iconMap[label]
  return (
    <span className={`badge ${cls}`}>
      {icon && <i className={`ti ${icon}`} style={{ fontSize: 11 }} />}
      {label}
    </span>
  )
}
