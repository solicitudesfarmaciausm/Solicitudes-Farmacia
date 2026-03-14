import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import supabase from '../supabaseClient.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    const err = new Error('Falta JWT_SECRET en el entorno');
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
// Body: { cedula, nombre, apellido, correo_electronico, password, telefono?, semestre? }
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
    } = req.body ?? {};

    if (!cedula || !nombre || !apellido || !correo_electronico || !password) {
      return res.status(400).json({
        error: 'Faltan campos requeridos: cedula, nombre, apellido, correo_electronico, password',
      });
    }

    if (typeof password !== 'string' || password.length < 8) {
      return res.status(400).json({ error: 'La contraseña debe tener al menos 8 caracteres' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    // IMPORTANT: never allow clients to choose their own role at signup.
    // Default role to 1 (typically estudiante). Adjust if your DB uses a different id.
    const roleId = 1;

    let semestreValue = undefined;
    if (semestre !== undefined && semestre !== null && semestre !== '') {
      const n = Number.parseInt(String(semestre), 10);
      if (!Number.isFinite(n)) return res.status(400).json({ error: 'Semestre debe ser un número válido' });
      semestreValue = n;
    }

    const { data, error } = await supabase
      .from('usuario')
      .insert({
        cedula: String(cedula),
        nombre: String(nombre),
        apellido: String(apellido),
        correo_electronico: String(correo_electronico).trim().toLowerCase(),
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
    return res.status(err?.status ?? 500).json({ error: err?.message ?? 'Error al registrarse' });
  }
});

// POST /api/auth/signup-admin
// Body: { cedula, nombre, apellido, correo_electronico, password, telefono? }
// Requires Coordinador role (id_rol = 3)
router.post('/signup-admin', requireAuth, async (req, res) => {
  try {
    if (req.user?.id_rol !== 3) {
      return res.status(403).json({ error: 'Acceso denegado. Solo coordinadores pueden crear administradores.' });
    }

    const {
      cedula,
      nombre,
      apellido,
      correo_electronico,
      password,
      telefono,
    } = req.body ?? {};

    if (!cedula || !nombre || !apellido || !correo_electronico || !password) {
      return res.status(400).json({
        error: 'Faltan campos requeridos: cedula, nombre, apellido, correo_electronico, password',
      });
    }

    if (typeof password !== 'string' || password.length < 8) {
      return res.status(400).json({ error: 'La contraseña debe tener al menos 8 caracteres' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const roleId = 2; // Administrador

    const { data, error } = await supabase
      .from('usuario')
      .insert({
        cedula: String(cedula),
        nombre: String(nombre),
        apellido: String(apellido),
        correo_electronico: String(correo_electronico).trim().toLowerCase(),
        contrasena_hash: passwordHash,
        telefono: telefono ? String(telefono) : null,
        id_rol: roleId,
        semestre: null,
      })
      .select('id_usuario, cedula, nombre, apellido, correo_electronico, telefono, id_rol')
      .maybeSingle();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    return res.status(201).json(publicUser(data));
  } catch (err) {
    console.error('POST /api/auth/signup-admin error:', err);
    return res.status(err?.status ?? 500).json({ error: err?.message ?? 'Error al registrar administrador' });
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
      return res.status(400).json({ error: 'Información incompleta' });
    }

    const identifierStr = String(identifier).trim();
    const looksLikeEmail = identifierStr.includes('@');

    const query = supabase.from('usuario').select('*');
    const { data: user, error } = looksLikeEmail
      ? await query.eq('correo_electronico', identifierStr.toLowerCase()).maybeSingle()
      : await query.eq('cedula', identifierStr).maybeSingle();

    if (error) throw error;
    if (!user) return res.status(401).json({ error: 'Correo y/o contraseña incorrectos' });

    if (!user.contrasena_hash) return res.status(401).json({ error: 'Correo y/o contraseña incorrectos' });

    const ok = await bcrypt.compare(String(password), String(user.contrasena_hash));
    if (!ok) return res.status(401).json({ error: 'Correo y/o contraseña incorrectos' });

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
    return res.status(err?.status ?? 500).json({ error: err?.message ?? 'Error al iniciar sesión' });
  }
});

// POST /api/auth/logout
// For JWT auth, logout is client-side (delete token). This endpoint exists for completeness.
router.post('/logout', async (req, res) => {
  return res.status(200).json({ ok: true });
});

// POST /api/auth/change-password
router.post('/change-password', requireAuth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body ?? {};
    const userId = Number(req.user?.id_usuario);

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Información incompleta' });
    }

    if (typeof newPassword !== 'string' || newPassword.length < 8) {
      return res.status(400).json({ error: 'La nueva contraseña debe tener al menos 8 caracteres' });
    }

    // Fetch user hash
    const { data: user, error } = await supabase
      .from('usuario')
      .select('contrasena_hash')
      .eq('id_usuario', userId)
      .maybeSingle();

    if (error) throw error;
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

    // Verify current
    const ok = await bcrypt.compare(String(currentPassword), String(user.contrasena_hash));
    if (!ok) return res.status(401).json({ error: 'Contraseña actual incorrecta' });

    // Hash new
    const newHash = await bcrypt.hash(newPassword, 10);

    // Update
    const { error: updateErr } = await supabase
      .from('usuario')
      .update({ contrasena_hash: newHash })
      .eq('id_usuario', userId);

    if (updateErr) throw updateErr;

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('POST /api/auth/change-password error:', err);
    return res.status(err?.status ?? 500).json({ error: err?.message ?? 'Error al cambiar la contraseña' });
  }
});

export default router;
