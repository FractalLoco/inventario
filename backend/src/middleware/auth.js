const { supabase } = require('../config/supabase')

const auth = async (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '')
  if (!token) return res.status(401).json({ error: 'Token de acceso requerido' })

  const { data: { user }, error } = await supabase.auth.getUser(token)
  if (error || !user) return res.status(401).json({ error: 'Sesión inválida o expirada' })

  req.user = user
  next()
}

module.exports = { auth }
