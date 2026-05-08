const ahoraISO = () => new Date().toISOString()

const formatearFecha = (iso) =>
  new Date(iso).toLocaleString('es-CL', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })

const fechaHoy = () => new Date().toISOString().split('T')[0]

module.exports = { ahoraISO, formatearFecha, fechaHoy }
