import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import supabase from '../supabaseClient.js';

const router = express.Router();

// GET /api/notificaciones - Obtiene las notificaciones del usuario autenticado
router.get('/', requireAuth, async (req, res) => {
  try {
    const userId = Number(req.user.id_usuario);
    const { unreadOnly } = req.query;

    let query = supabase
      .from('notificacion')
      .select('*')
      .eq('id_usuario', userId)
      .order('fecha_creacion', { ascending: false })
      .limit(50);

    if (unreadOnly === 'true') {
      query = query.eq('leida', false);
    }

    const { data, error } = await query;

    if (error) throw error;

    return res.status(200).json(data);
  } catch (err) {
    console.error('GET /api/notificaciones error:', err);
    return res.status(err?.status ?? 500).json({ error: err?.message ?? 'Failed to fetch notificaciones' });
  }
});

// PATCH /api/notificaciones/:id/leida - Marca una notificación como leída
router.patch('/:id/leida', requireAuth, async (req, res) => {
  try {
    const userId = Number(req.user.id_usuario);
    const idNotificacion = Number(req.params.id);

    const { data, error } = await supabase
      .from('notificacion')
      .update({ leida: true })
      .eq('id_notificacion', idNotificacion)
      .eq('id_usuario', userId)
      .select()
      .single();

    if (error) throw error;

    return res.status(200).json(data);
  } catch (err) {
    console.error('PATCH /api/notificaciones/:id/leida error:', err);
    return res.status(err?.status ?? 500).json({ error: err?.message ?? 'Failed to update notification' });
  }
});

// PATCH /api/notificaciones/marcar-todas - Marca todas las notificaciones como leídas
router.patch('/marcar-todas', requireAuth, async (req, res) => {
  try {
    const userId = Number(req.user.id_usuario);

    const { data, error } = await supabase
      .from('notificacion')
      .update({ leida: true })
      .eq('id_usuario', userId)
      .eq('leida', false)
      .select();

    if (error) throw error;

    return res.status(200).json(data);
  } catch (err) {
    console.error('PATCH /api/notificaciones/marcar-todas error:', err);
    return res.status(err?.status ?? 500).json({ error: err?.message ?? 'Failed to update notifications' });
  }
});

export default router;