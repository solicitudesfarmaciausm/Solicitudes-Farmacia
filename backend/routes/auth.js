import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import supabase from '../supabaseClient.js';

const router = Router();

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    const err = new Error('Missing JWT_SECRET in environment');
    err.status = 500;
    throw err;
  }
  return secret;
}

function publicUser(userRow) {
  if (!userRow) return null;
  const { contrasena_hash, ...safe } = userRow;
  return safe;
}

// POST /api/auth/signup
// Body: { cedula, nombre, apellido, correo_electronico, password, telefono?, semestre?, id_rol? }
router.post('/signup', async (req, res) => {
  try {
    const {
      cedula,
      nombre,
      apellido,
      correo_electronico,
      password,
      telefono,
      semestre,
      id_rol,
    } = req.body ?? {};

    if (!cedula || !nombre || !apellido || !correo_electronico || !password) {
      return res.status(400).json({
        error: 'Missing required fields: cedula, nombre, apellido, correo_electronico, password',
      });
    }

    if (typeof password !== 'string' || password.length < 8) {
      return res.status(400).json({ error: 'password must be at least 8 characters' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    // Default role to 1 (typically estudiante). Adjust if your DB uses a different id.
    const roleId = id_rol === undefined || id_rol === null ? 1 : Number.parseInt(String(id_rol), 10);
    if (!Number.isFinite(roleId)) {
      return res.status(400).json({ error: 'id_rol must be a number' });
    }

    let semestreValue = undefined;
    if (semestre !== undefined && semestre !== null && semestre !== '') {
      const n = Number.parseInt(String(semestre), 10);
      if (!Number.isFinite(n)) return res.status(400).json({ error: 'semestre must be a number' });
      semestreValue = n;
    }

    const { data, error } = await supabase
      .from('usuario')
      .insert({
        cedula: String(cedula),
        nombre: String(nombre),
        apellido: String(apellido),
        correo_electronico: String(correo_electronico),
        contrasena_hash: passwordHash,
        telefono: telefono ? String(telefono) : null,
        id_rol: roleId,
        semestre: semestreValue ?? null,
      })
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

    if (error) {
      // common: unique constraint violations for cedula/correo
      return res.status(400).json({ error: error.message });
    }

    return res.status(201).json(publicUser(data));
  } catch (err) {
    console.error('POST /api/auth/signup error:', err);
    return res.status(err?.status ?? 500).json({ error: err?.message ?? 'Failed to signup' });
  }
});

// POST /api/auth/login
// Body: { cedulaOrEmail, password } OR { cedula, password } OR { correo_electronico, password }
router.post('/login', async (req, res) => {
  try {
    const { password } = req.body ?? {};
    const identifier =
      req.body?.cedulaOrEmail ??
      req.body?.cedula ??
      req.body?.correo_electronico;

    if (!identifier || !password) {
      return res.status(400).json({ error: 'Missing credentials' });
    }

    const { data: user, error } = await supabase
      .from('usuario')
      .select('*')
      .or(`cedula.eq.${identifier},correo_electronico.eq.${identifier}`)
      .maybeSingle();

    if (error) throw error;
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const ok = await bcrypt.compare(String(password), String(user.contrasena_hash));
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign(
      { id_usuario: user.id_usuario, id_rol: user.id_rol },
      getJwtSecret(),
      { expiresIn: '7d' }
    );

    return res.status(200).json({
      token,
      user: publicUser({
        id_usuario: user.id_usuario,
        cedula: user.cedula,
        nombre: user.nombre,
        apellido: user.apellido,
        correo_electronico: user.correo_electronico,
        telefono: user.telefono,
        id_rol: user.id_rol,
        semestre: user.semestre,
      }),
    });
  } catch (err) {
    console.error('POST /api/auth/login error:', err);
    return res.status(err?.status ?? 500).json({ error: err?.message ?? 'Failed to login' });
  }
});

// POST /api/auth/logout
// For JWT auth, logout is client-side (delete token). This endpoint exists for completeness.
router.post('/logout', async (req, res) => {
  return res.status(200).json({ ok: true });
});

export default router;
