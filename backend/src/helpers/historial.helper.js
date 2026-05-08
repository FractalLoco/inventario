const { supabase } = require('../config/supabase')

const registrarCambio = async ({ usuario_email, accion, tabla, registro_id, descripcion }) => {
  try {
    await supabase.from('historial_cambios').insert({
      usuario_email,
      accion,
      tabla,
      registro_id: registro_id != null ? String(registro_id) : null,
      descripcion,
    })
  } catch (e) {
    console.error('Error registrando historial:', e.message)
  }
}

module.exports = { registrarCambio }
