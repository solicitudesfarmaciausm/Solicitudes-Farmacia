import { Router } from 'express';
import supabase from '../supabaseClient.js';
import { parsePagination, parseIntParam, setPaginationHeaders } from '../utils/http.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// GET /api/usuarios
// Returns users WITHOUT contrasena_hash
router.get('/', requireAuth, async (req, res) => {
  try {
    const { from, to } = parsePagination(req.query);

    let query = supabase
      .from('usuario')
      .select(
        [
          'id_usuario',
          'cedula',
          'nombre',
          'apellido',
          'correo_electronico',
          'telefono',
          'id_rol',
          'semestre',
        ].join(','),
        { count: 'exact' }
      );

    if (req.query.id_rol) {
      query = query.eq('id_rol', req.query.id_rol);
    }

    const paged = await query
      .order('id_usuario', { ascending: true })
      .range(from, to);

    if (paged.error) throw paged.error;

    setPaginationHeaders(res, { from, to, count: paged.count });
    return res.status(200).json(paged.data ?? []);
  } catch (err) {
    console.error('GET /api/usuarios error:', err);
    return res.status(err?.status ?? 500).json({ error: err?.message ?? 'Failed to fetch users' });
  }
});

// PATCH /api/usuarios/:id_usuario
// Partial update of a user (does NOT allow updating contrasena_hash here)
router.patch('/:id_usuario', requireAuth, async (req, res) => {
  try {
    const idUsuario = parseIntParam(req.params.id_usuario, 'id_usuario');
    const myId = Number(req.user?.id_usuario);
    const myRole = Number(req.user?.id_rol);

    // Only allow update if:
    // 1. User is updating themselves
    // 2. User is admin (role 2)
    // 3. (Optional) Coordinator (role 3) might update students? Let's stick to 1 & 2 for now.
    if (idUsuario !== myId && myRole !== 2) {
      return res.status(403).json({ error: 'You can only update your own profile' });
    }

    const allowedFields = [
      'cedula',
      'nombre',
      'apellido',
      'correo_electronico',
      'telefono',
      'id_rol',
      'semestre',
    ];

    const updates = {};
    for (const field of allowedFields) {
      if (Object.prototype.hasOwnProperty.call(req.body, field)) {
        updates[field] = req.body[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        error: `No updatable fields provided. Allowed: ${allowedFields.join(', ')}`,
      });
    }

    if (Object.prototype.hasOwnProperty.call(updates, 'id_rol') && updates.id_rol !== null) {
      updates.id_rol = parseIntParam(updates.id_rol, 'id_rol');
    }
    if (Object.prototype.hasOwnProperty.call(updates, 'semestre') && updates.semestre !== null) {
      updates.semestre = parseIntParam(updates.semestre, 'semestre');
    }

    const { data, error } = await supabase
      .from('usuario')
      .update(updates)
      .eq('id_usuario', idUsuario)
      .select(
        [
          'id_usuario',
          'cedula',
          'nombre',
          'apellido',
          'correo_electronico',
          'telefono',
          'id_rol',
          'semestre',
        ].join(',')
      )
      .maybeSingle();

    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'User not found' });

    return res.status(200).json(data);
  } catch (err) {
    console.error('PATCH /api/usuarios/:id_usuario error:', err);
    return res.status(err?.status ?? 500).json({ error: err?.message ?? 'Failed to update user' });
  }
});

export default router;
