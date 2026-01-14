import { Router } from 'express';
import supabase from '../supabaseClient.js';
import { parsePagination, parseIntParam, setPaginationHeaders } from '../utils/http.js';

const router = Router();

// GET /api/usuarios
// Returns users WITHOUT contrasena_hash
router.get('/', async (req, res) => {
  try {
    const { from, to } = parsePagination(req.query);

    const paged = await supabase
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
      )
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
router.patch('/:id_usuario', async (req, res) => {
  try {
    const idUsuario = parseIntParam(req.params.id_usuario, 'id_usuario');

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
