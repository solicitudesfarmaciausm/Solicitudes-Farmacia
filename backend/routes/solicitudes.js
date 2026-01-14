import { Router } from 'express';
import supabase from '../supabaseClient.js';
import { parsePagination, parseIntParam, setPaginationHeaders } from '../utils/http.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

const REQUIRE_AUTH_FOR_ARCHIVOS = String(process.env.REQUIRE_AUTH_FOR_ARCHIVOS ?? '0') === '1';
const authIfEnabled = (req, res, next) => (REQUIRE_AUTH_FOR_ARCHIVOS ? requireAuth(req, res, next) : next());

const STORAGE_BUCKET = process.env.SUPABASE_STORAGE_BUCKET;
const SIGNED_URL_EXPIRES_IN = Number.parseInt(
  process.env.SUPABASE_SIGNED_URL_EXPIRES_IN ?? '3600',
  10
);

function isHttpUrl(value) {
  if (typeof value !== 'string') return false;
  return value.startsWith('http://') || value.startsWith('https://');
}

function parseStorageRef(ruta_archivo) {
  const raw = String(ruta_archivo ?? '').trim();
  if (!raw) return null;
  if (isHttpUrl(raw)) return { kind: 'url', url: raw };

  const cleaned = raw.replace(/^\/+/, '');
  const parts = cleaned.split('/').filter(Boolean);

  // If the first segment looks like a bucket and differs from env bucket, treat it as bucket.
  if (parts.length >= 2 && (!STORAGE_BUCKET || parts[0] !== STORAGE_BUCKET)) {
    return { kind: 'storage', bucket: parts[0], path: parts.slice(1).join('/') };
  }

  if (!STORAGE_BUCKET) return { kind: 'unknown', raw };
  return { kind: 'storage', bucket: STORAGE_BUCKET, path: cleaned };
}

async function signIfPossible(ruta_archivo) {
  const ref = parseStorageRef(ruta_archivo);
  if (!ref) return { ruta_archivo };
  if (ref.kind === 'url') return { ruta_archivo, url: ref.url };
  if (ref.kind !== 'storage') return { ruta_archivo };

  const expiresIn = Number.isFinite(SIGNED_URL_EXPIRES_IN) ? SIGNED_URL_EXPIRES_IN : 3600;
  const { data, error } = await supabase.storage.from(ref.bucket).createSignedUrl(ref.path, expiresIn);
  if (error) return { ruta_archivo, bucket: ref.bucket, path: ref.path };
  return { ruta_archivo, bucket: ref.bucket, path: ref.path, signed_url: data?.signedUrl };
}

async function assertCanAccessSolicitud(req, idSolicitud) {
  const userId = Number(req.user?.id_usuario);
  const roleId = Number(req.user?.id_rol);

  const { data: solicitud, error } = await supabase
    .from('solicitud')
    .select('id_solicitud,id_estudiante,id_personal_asignado')
    .eq('id_solicitud', idSolicitud)
    .maybeSingle();

  if (error) throw error;
  if (!solicitud) {
    const err = new Error('Solicitud not found');
    err.status = 404;
    throw err;
  }

  const isOwner = Number(solicitud.id_estudiante) === userId;
  const isAssigned = solicitud.id_personal_asignado !== null && Number(solicitud.id_personal_asignado) === userId;

  // Convention: role 1 = estudiante. Any other role is treated as staff/admin.
  const isStaff = Number.isFinite(roleId) && roleId !== 1;

  if (!isOwner && !isAssigned && !isStaff) {
    const err = new Error('Forbidden');
    err.status = 403;
    throw err;
  }

  return solicitud;
}

const SOLICITUD_SELECT_FULL = `
  id_solicitud,
  titulo,
  descripcion,
  id_estudiante,
  id_personal_asignado,
  id_tipo_solicitud,
  id_estado_solicitud,
  fecha_creacion,
  fecha_actualizacion,
  estudiante:usuario!fk_estudiante(
    id_usuario,
    cedula,
    nombre,
    apellido,
    correo_electronico
  ),
  personal_asignado:usuario!fk_personal_asignado(
    id_usuario,
    nombre,
    apellido,
    correo_electronico
  ),
  tipo:tipo_solicitud(
    id_tipo_solicitud,
    nombre
  ),
  estado:estado_solicitud(
    id_estado_solicitud,
    nombre
  )
`;

const SOLICITUD_SELECT_LITE = `
  id_solicitud,
  titulo,
  descripcion,
  id_estudiante,
  id_personal_asignado,
  id_tipo_solicitud,
  id_estado_solicitud,
  fecha_creacion,
  fecha_actualizacion
`;

// POST /api/solicitudes
// Creates a solicitud for the logged-in user
// Body: { titulo, descripcion, id_tipo_solicitud }
router.post('/', requireAuth, async (req, res) => {
  try {
    const { titulo, descripcion, id_tipo_solicitud } = req.body ?? {};

    if (typeof titulo !== 'string' || titulo.trim().length === 0) {
      return res.status(400).json({ error: 'titulo must be a non-empty string' });
    }
    if (typeof descripcion !== 'string' || descripcion.trim().length === 0) {
      return res.status(400).json({ error: 'descripcion must be a non-empty string' });
    }

    const idTipo = parseIntParam(id_tipo_solicitud, 'id_tipo_solicitud');
    if (!Number.isFinite(idTipo)) {
      return res.status(400).json({ error: 'id_tipo_solicitud is required and must be a number' });
    }

    const idEstudiante = req.user?.id_usuario;
    if (!Number.isFinite(idEstudiante)) {
      return res.status(401).json({ error: 'Invalid token payload' });
    }

    const nowIso = new Date().toISOString();

    const { data: solicitud, error } = await supabase
      .from('solicitud')
      .insert({
        id_estudiante: idEstudiante,
        titulo: titulo.trim(),
        descripcion: descripcion.trim(),
        id_tipo_solicitud: idTipo,
        // id_estado_solicitud defaults to 1 in DB
        fecha_actualizacion: nowIso,
      })
      .select(SOLICITUD_SELECT_LITE)
      .maybeSingle();

    if (error) throw error;
    if (!solicitud) return res.status(500).json({ error: 'Failed to create solicitud' });

    // Best-effort history entry
    await supabase.from('historial_solicitud').insert({
      id_solicitud: solicitud.id_solicitud,
      id_usuario: idEstudiante,
      accion: 'CREAR',
      descripcion: 'Solicitud creada',
      fecha_evento: nowIso,
    });

    return res.status(201).json(solicitud);
  } catch (err) {
    console.error('POST /api/solicitudes error:', err);
    return res.status(err?.status ?? 500).json({ error: err?.message ?? 'Failed to create solicitud' });
  }
});

// GET /api/solicitudes
// Optional query params: id_estudiante, id_estado_solicitud, id_tipo_solicitud, view=lite|full, limit, offset
router.get('/', async (req, res) => {
  try {
    const { from, to } = parsePagination(req.query);

    const id_estudiante = parseIntParam(req.query.id_estudiante, 'id_estudiante');
    const id_estado_solicitud = parseIntParam(req.query.id_estado_solicitud, 'id_estado_solicitud');
    const id_tipo_solicitud = parseIntParam(req.query.id_tipo_solicitud, 'id_tipo_solicitud');

    const view = String(req.query.view ?? 'full').toLowerCase();
    const selectClause = view === 'lite' ? SOLICITUD_SELECT_LITE : SOLICITUD_SELECT_FULL;

    let query = supabase
      .from('solicitud')
      .select(selectClause, { count: 'exact' })
      .order('fecha_creacion', { ascending: false })
      .range(from, to);

    if (id_estudiante !== undefined) query = query.eq('id_estudiante', id_estudiante);
    if (id_estado_solicitud !== undefined) query = query.eq('id_estado_solicitud', id_estado_solicitud);
    if (id_tipo_solicitud !== undefined) query = query.eq('id_tipo_solicitud', id_tipo_solicitud);

    const { data, error, count } = await query;
    if (error) throw error;

    setPaginationHeaders(res, { from, to, count });
    return res.status(200).json(data ?? []);
  } catch (err) {
    console.error('GET /api/solicitudes error:', err);
    return res.status(err?.status ?? 500).json({ error: err?.message ?? 'Failed to fetch solicitudes' });
  }
});

// GET /api/solicitudes/:id_solicitud
// Query params: view=lite|full
router.get('/:id_solicitud', async (req, res) => {
  try {
    const idSolicitud = parseIntParam(req.params.id_solicitud, 'id_solicitud');

    const view = String(req.query.view ?? 'full').toLowerCase();
    const selectClause = view === 'lite' ? SOLICITUD_SELECT_LITE : SOLICITUD_SELECT_FULL;

    const { data, error } = await supabase
      .from('solicitud')
      .select(selectClause)
      .eq('id_solicitud', idSolicitud)
      .maybeSingle();

    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Solicitud not found' });

    return res.status(200).json(data);
  } catch (err) {
    console.error('GET /api/solicitudes/:id_solicitud error:', err);
    return res.status(err?.status ?? 500).json({ error: err?.message ?? 'Failed to fetch solicitud' });
  }
});

// GET /api/solicitudes/:id_solicitud/comentarios
router.get('/:id_solicitud/comentarios', async (req, res) => {
  try {
    const idSolicitud = parseIntParam(req.params.id_solicitud, 'id_solicitud');
    const { from, to } = parsePagination(req.query);

    const { data, error, count } = await supabase
      .from('comentario')
      .select(
        `
        id_comentario,
        id_solicitud,
        id_usuario,
        comentario,
        fecha_creacion,
        usuario:usuario!fk_usuario(
          id_usuario,
          cedula,
          nombre,
          apellido,
          correo_electronico
        )
      `
      ,
      { count: 'exact' }
      )
      .eq('id_solicitud', idSolicitud)
      .order('fecha_creacion', { ascending: true })
      .range(from, to);

    if (error) throw error;

    setPaginationHeaders(res, { from, to, count });
    return res.status(200).json(data ?? []);
  } catch (err) {
    console.error('GET /api/solicitudes/:id_solicitud/comentarios error:', err);
    return res.status(err?.status ?? 500).json({ error: err?.message ?? 'Failed to fetch comentarios' });
  }
});

// GET /api/solicitudes/:id_solicitud/historial
router.get('/:id_solicitud/historial', async (req, res) => {
  try {
    const idSolicitud = parseIntParam(req.params.id_solicitud, 'id_solicitud');
    const { from, to } = parsePagination(req.query);

    const { data, error, count } = await supabase
      .from('historial_solicitud')
      .select(
        `
        id_historial,
        id_solicitud,
        id_usuario,
        accion,
        descripcion,
        fecha_evento,
        usuario:usuario!fk_historial_usuario(
          id_usuario,
          cedula,
          nombre,
          apellido,
          correo_electronico
        )
      `
      ,
      { count: 'exact' }
      )
      .eq('id_solicitud', idSolicitud)
      .order('fecha_evento', { ascending: true })
      .range(from, to);

    if (error) throw error;

    setPaginationHeaders(res, { from, to, count });
    return res.status(200).json(data ?? []);
  } catch (err) {
    console.error('GET /api/solicitudes/:id_solicitud/historial error:', err);
    return res.status(err?.status ?? 500).json({ error: err?.message ?? 'Failed to fetch historial' });
  }
});

// GET /api/solicitudes/:id_solicitud/archivos
// Query params: limit, offset, signed=1
router.get('/:id_solicitud/archivos', authIfEnabled, async (req, res) => {
  try {
    const idSolicitud = parseIntParam(req.params.id_solicitud, 'id_solicitud');
    const { from, to } = parsePagination(req.query);

    if (REQUIRE_AUTH_FOR_ARCHIVOS) {
      await assertCanAccessSolicitud(req, idSolicitud);
    }

    const signed = String(req.query.signed ?? '0') === '1';

    const { data, error, count } = await supabase
      .from('archivo_adjunto')
      .select(
        `
        id_archivo,
        id_solicitud,
        nombre_archivo,
        ruta_archivo,
        tipo_archivo,
        fecha_subida
      `,
        { count: 'exact' }
      )
      .eq('id_solicitud', idSolicitud)
      .order('fecha_subida', { ascending: false })
      .range(from, to);

    if (error) throw error;

    setPaginationHeaders(res, { from, to, count });

    const rows = data ?? [];
    if (!signed) return res.status(200).json(rows);

    const withUrls = await Promise.all(rows.map(async (row) => ({
      ...row,
      ...(await signIfPossible(row.ruta_archivo)),
    })));

    return res.status(200).json(withUrls);
  } catch (err) {
    console.error('GET /api/solicitudes/:id_solicitud/archivos error:', err);
    return res.status(err?.status ?? 500).json({ error: err?.message ?? 'Failed to fetch archivos adjuntos' });
  }
});

// GET /api/solicitudes/:id_solicitud/archivos/:id_archivo
// Query params: signed=1
router.get('/:id_solicitud/archivos/:id_archivo', authIfEnabled, async (req, res) => {
  try {
    const idSolicitud = parseIntParam(req.params.id_solicitud, 'id_solicitud');
    const idArchivo = parseIntParam(req.params.id_archivo, 'id_archivo');

    if (REQUIRE_AUTH_FOR_ARCHIVOS) {
      await assertCanAccessSolicitud(req, idSolicitud);
    }

    const { data, error } = await supabase
      .from('archivo_adjunto')
      .select(
        `
        id_archivo,
        id_solicitud,
        nombre_archivo,
        ruta_archivo,
        tipo_archivo,
        fecha_subida
      `
      )
      .eq('id_solicitud', idSolicitud)
      .eq('id_archivo', idArchivo)
      .maybeSingle();

    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Archivo adjunto not found' });

    const signed = String(req.query.signed ?? '0') === '1';
    if (!signed) return res.status(200).json(data);

    return res.status(200).json({
      ...data,
      ...(await signIfPossible(data.ruta_archivo)),
    });
  } catch (err) {
    console.error('GET /api/solicitudes/:id_solicitud/archivos/:id_archivo error:', err);
    return res.status(err?.status ?? 500).json({ error: err?.message ?? 'Failed to fetch archivo adjunto' });
  }
});

// PATCH /api/solicitudes/:id_solicitud
// Partial update of a solicitud
router.patch('/:id_solicitud', async (req, res) => {
  try {
    const idSolicitud = parseIntParam(req.params.id_solicitud, 'id_solicitud');

    const allowedFields = [
      'titulo',
      'descripcion',
      'id_tipo_solicitud',
      'id_estado_solicitud',
      'id_personal_asignado',
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

    if (Object.prototype.hasOwnProperty.call(updates, 'titulo')) {
      if (typeof updates.titulo !== 'string' || updates.titulo.trim().length === 0) {
        return res.status(400).json({ error: 'titulo must be a non-empty string' });
      }
      updates.titulo = updates.titulo.trim();
    }

    if (Object.prototype.hasOwnProperty.call(updates, 'descripcion')) {
      if (typeof updates.descripcion !== 'string' || updates.descripcion.trim().length === 0) {
        return res.status(400).json({ error: 'descripcion must be a non-empty string' });
      }
      updates.descripcion = updates.descripcion.trim();
    }

    if (Object.prototype.hasOwnProperty.call(updates, 'id_tipo_solicitud')) {
      updates.id_tipo_solicitud = parseIntParam(updates.id_tipo_solicitud, 'id_tipo_solicitud');
    }
    if (Object.prototype.hasOwnProperty.call(updates, 'id_estado_solicitud')) {
      updates.id_estado_solicitud = parseIntParam(updates.id_estado_solicitud, 'id_estado_solicitud');
    }
    if (Object.prototype.hasOwnProperty.call(updates, 'id_personal_asignado')) {
      if (updates.id_personal_asignado === null) {
        // allowed (nullable)
      } else {
        updates.id_personal_asignado = parseIntParam(updates.id_personal_asignado, 'id_personal_asignado');
      }
    }

    updates.fecha_actualizacion = new Date().toISOString();

    const { data, error } = await supabase
      .from('solicitud')
      .update(updates)
      .eq('id_solicitud', idSolicitud)
      .select(
        SOLICITUD_SELECT_LITE
      )
      .maybeSingle();

    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Solicitud not found' });

    return res.status(200).json(data);
  } catch (err) {
    console.error('PATCH /api/solicitudes/:id_solicitud error:', err);
    return res.status(err?.status ?? 500).json({ error: err?.message ?? 'Failed to update solicitud' });
  }
});

export default router;
