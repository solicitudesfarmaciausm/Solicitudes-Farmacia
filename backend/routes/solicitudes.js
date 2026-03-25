import { Router } from 'express';
import supabase from '../supabaseClient.js';
import { parsePagination, parseIntParam, setPaginationHeaders } from '../utils/http.js';
import { requireAuth } from '../middleware/auth.js';
import multer from 'multer';

const router = Router();

const REQUIRE_AUTH_FOR_ARCHIVOS = String(process.env.REQUIRE_AUTH_FOR_ARCHIVOS ?? '0') === '1';
const authIfEnabled = (req, res, next) => (REQUIRE_AUTH_FOR_ARCHIVOS ? requireAuth(req, res, next) : next());

const STORAGE_BUCKET = process.env.SUPABASE_STORAGE_BUCKET;
const SIGNED_URL_EXPIRES_IN = Number.parseInt(
  process.env.SUPABASE_SIGNED_URL_EXPIRES_IN ?? '3600',
  10
);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: Number.parseInt(process.env.MAX_UPLOAD_FILE_SIZE ?? String(10 * 1024 * 1024), 10), // 10MB
    files: Number.parseInt(process.env.MAX_UPLOAD_FILES ?? '10', 10),
  },
});

function sanitizeFilename(name) {
  const raw = String(name ?? 'file').trim() || 'file';
  // remove path separators and weird chars
  return raw
    .replace(/[/\\]+/g, '_')
    .replace(/\s+/g, ' ')
    .replace(/[^a-zA-Z0-9._ -]/g, '_')
    .slice(0, 150);
}

function isHttpUrl(value) {
  if (typeof value !== 'string') return false;
  return value.startsWith('http://') || value.startsWith('https://');
}

function parseStorageRef(ruta_archivo) {
  const raw = String(ruta_archivo ?? '').trim();
  if (!raw) return null;
  if (isHttpUrl(raw)) return { kind: 'url', url: raw };

  const cleanedRaw = raw.replace(/^\/+/, '');
  const parts = cleanedRaw.split('/').filter(Boolean);

  // If the first segment looks like a bucket and differs from env bucket, treat it as bucket.
  if (parts.length >= 2 && (!STORAGE_BUCKET || parts[0] !== STORAGE_BUCKET)) {
    return { kind: 'storage', bucket: parts[0], path: parts.slice(1).join('/') };
  }

  if (!STORAGE_BUCKET) return { kind: 'unknown', raw };

  // Accept both formats:
  // - "<bucket>/<path>" (legacy or user-supplied)
  // - "<path>" (preferred)
  const cleaned = cleanedRaw.startsWith(`${STORAGE_BUCKET}/`)
    ? cleanedRaw.slice(STORAGE_BUCKET.length + 1)
    : cleanedRaw;

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

    // Notify admins (roles 2 and 3)
    const { data: admins } = await supabase.from('usuario').select('id_usuario').in('id_rol', [2, 3]);
    if (admins && admins.length > 0) {
      const notificaciones = admins.map(admin => ({
        id_usuario: admin.id_usuario,
        titulo: 'Nueva solicitud',
        mensaje: `Se ha creado una nueva solicitud: '${solicitud.titulo}'`,
        enlace: `/solicitud-admin/${solicitud.id_solicitud}`
      }));
      await supabase.from('notificacion').insert(notificaciones);
    }

    return res.status(201).json(solicitud);
  } catch (err) {
    console.error('POST /api/solicitudes error:', err);
    return res.status(err?.status ?? 500).json({ error: err?.message ?? 'Failed to create solicitud' });
  }
});

// GET /api/solicitudes
// Optional query params: id_estudiante, id_estado_solicitud, id_tipo_solicitud, view=lite|full, limit, offset
// Visibility rules:
// - role 1 (estudiante): can only list their own solicitudes (id_estudiante = token user id)
// - other roles (e.g. 2 staff, 3 coordinador): can list all (and optionally filter)
// GET /api/solicitudes
// Optional query params: id_estudiante, id_estado_solicitud, id_tipo_solicitud, id_personal_asignado, fecha_inicio, fecha_fin, q, view=lite|full, limit, offset
router.get('/', requireAuth, async (req, res) => {
  try {


    const { from, to } = parsePagination(req.query);

    const userId = Number(req.user?.id_usuario);
    const roleId = Number(req.user?.id_rol);
    if (!Number.isFinite(userId) || !Number.isFinite(roleId)) {
      return res.status(401).json({ error: 'Invalid token payload' });
    }

    // Filtros originales usando tu util
    const id_estudiante = req.query.id_estudiante ? parseInt(req.query.id_estudiante, 10) : undefined;
    const id_estado_solicitud = req.query.id_estado_solicitud ? parseInt(req.query.id_estado_solicitud, 10) : undefined;
    const id_tipo_solicitud = req.query.id_tipo_solicitud ? parseInt(req.query.id_tipo_solicitud, 10) : undefined;

    // === FILTROS NUEVOS (Conversión manual segura) ===
    const id_personal_asignado = req.query.id_personal_asignado ? parseInt(req.query.id_personal_asignado, 10) : undefined;
    const fecha_inicio = req.query.fecha_inicio || req.query.fecha_creacion_gte;
    const fecha_fin = req.query.fecha_fin || req.query.fecha_creacion_lte;
    const q = req.query.q;
    // =================================================

    const view = String(req.query.view ?? 'full').toLowerCase();
    const selectClause = view === 'lite' ? SOLICITUD_SELECT_LITE : SOLICITUD_SELECT_FULL;

    let query = supabase
      .from('solicitud')
      .select(selectClause, { count: 'exact' })
      .order('fecha_creacion', { ascending: false })
      .range(from, to);

    // Permisos por rol (Estudiantes solo ven las suyas)
    if (roleId === 1) {
      query = query.eq('id_estudiante', userId);
    } else {
      if (id_estudiante !== undefined) query = query.eq('id_estudiante', id_estudiante);
    }

    // Filtros originales
    if (id_estado_solicitud !== undefined && !isNaN(id_estado_solicitud)) {
      query = query.eq('id_estado_solicitud', id_estado_solicitud);
    }
    if (id_tipo_solicitud !== undefined && !isNaN(id_tipo_solicitud)) {
      query = query.eq('id_tipo_solicitud', id_tipo_solicitud);
    }

    // === APLICACIÓN DE LOS FILTROS NUEVOS ===
    
    // 1. Asignado A
    if (id_personal_asignado !== undefined && !isNaN(id_personal_asignado)) {
      query = query.eq('id_personal_asignado', id_personal_asignado);
    }

    // 2. Fechas
    if (fecha_inicio) {
      query = query.gte('fecha_creacion', fecha_inicio); 
    }
    if (fecha_fin) {
      query = query.lte('fecha_creacion', fecha_fin); 
    }

    // 3. Búsqueda (q)
    if (q && q.trim() !== '') {
      const term = q.trim();
      const numTerm = parseInt(term, 10);
      
      if (!isNaN(numTerm)) {
        // Si escribe un número, busca por ID de solicitud
        query = query.eq('id_solicitud', numTerm);
      } else {
        // Si escribe texto, busca por título
        query = query.ilike('titulo', `%${term}%`);
      }
    }
    // =================================================

    const { data, error, count } = await query;
    if (error) {
      console.error("❌ Error de Supabase:", error);
      throw error;
    }

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

// POST /api/solicitudes/:id_solicitud/comentarios
router.post('/:id_solicitud/comentarios', requireAuth, async (req, res) => {
  try {
    const idSolicitud = parseIntParam(req.params.id_solicitud, 'id_solicitud');
    const { comentario } = req.body;
    const userId = Number(req.user?.id_usuario);

    if (typeof comentario !== 'string' || comentario.trim().length === 0) {
      return res.status(400).json({ error: 'comentario is required' });
    }

    const { data, error } = await supabase
      .from('comentario')
      .insert({
        id_solicitud: idSolicitud,
        id_usuario: userId,
        comentario: comentario.trim(),
        fecha_creacion: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;

    await supabase.from('historial_solicitud').insert({
      id_solicitud: idSolicitud,
      id_usuario: userId,
      accion: 'COMENTAR',
      descripcion: 'Agregó un comentario',
      fecha_evento: new Date().toISOString(),
    });

    // Notify the other party
    const { data: sol } = await supabase.from('solicitud').select('id_estudiante, id_personal_asignado').eq('id_solicitud', idSolicitud).single();
    if (sol) {
      const targetUserId = userId === sol.id_estudiante ? sol.id_personal_asignado : sol.id_estudiante;
      if (targetUserId) {
        let enlace = '/solicitud/';
        // The frontend distinguishes routes based on role or type. Let's redirect correctly:
        // Actually, we can just send "solicitud-admin/:id" or "solicitud/:id" based on role? Or just standard link relative to what user sees.
        // Wait, the client determines if it goes to /solicitud (alumno) or /solicitud-admin (admin).
        // Let's use simple frontend routes.
        if (targetUserId === sol.id_estudiante) {
          enlace = `/solicitud/${idSolicitud}`;
        } else {
          enlace = `/solicitud-admin/${idSolicitud}`;
        }

        await supabase.from('notificacion').insert({
          id_usuario: targetUserId,
          titulo: 'Nuevo comentario',
          mensaje: userId === sol.id_estudiante ? 'El estudiante ha respondido a la solicitud.' : 'Un administrador ha comentado tu solicitud.',
          enlace: enlace,
        });
      }
    }

    return res.status(201).json(data);
  } catch (err) {
    console.error('POST /api/solicitudes/:id_solicitud/comentarios error:', err);
    return res.status(err?.status ?? 500).json({ error: err?.message ?? 'Failed to create comentario' });
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

// POST /api/solicitudes/:id_solicitud/archivos
// multipart/form-data: files[]
router.post('/:id_solicitud/archivos', requireAuth, upload.array('files'), async (req, res) => {
  try {
    const idSolicitud = parseIntParam(req.params.id_solicitud, 'id_solicitud');
    await assertCanAccessSolicitud(req, idSolicitud);

    if (!STORAGE_BUCKET) {
      return res.status(500).json({ error: 'Missing SUPABASE_STORAGE_BUCKET in environment' });
    }

    const files = Array.isArray(req.files) ? req.files : [];
    if (files.length === 0) {
      return res.status(400).json({ error: 'No files provided' });
    }

    const nowIso = new Date().toISOString();
    const uploadedRows = [];

    for (const file of files) {
      const original = sanitizeFilename(file.originalname);
      const safeBase = `${Date.now()}_${Math.random().toString(16).slice(2)}_${original}`;
      const storagePath = `solicitudes/${idSolicitud}/${safeBase}`;

      const { error: upErr } = await supabase
        .storage
        .from(STORAGE_BUCKET)
        .upload(storagePath, file.buffer, {
          contentType: file.mimetype || 'application/octet-stream',
          upsert: false,
        });

      if (upErr) {
        const err = new Error(upErr.message);
        err.status = 400;
        throw err;
      }

      uploadedRows.push({
        id_solicitud: idSolicitud,
        nombre_archivo: original,
        // Store only the path inside the bucket (parseStorageRef can still handle legacy "bucket/path")
        ruta_archivo: storagePath,
        tipo_archivo: file.mimetype || null,
        fecha_subida: nowIso,
      });
    }

    const { data, error } = await supabase
      .from('archivo_adjunto')
      .insert(uploadedRows)
      .select(
        `
        id_archivo,
        id_solicitud,
        nombre_archivo,
        ruta_archivo,
        tipo_archivo,
        fecha_subida
      `
      );

    if (error) throw error;

    return res.status(201).json(data ?? []);
  } catch (err) {
    console.error('POST /api/solicitudes/:id_solicitud/archivos error:', err);
    return res.status(err?.status ?? 500).json({ error: err?.message ?? 'Failed to upload archivos adjuntos' });
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
router.patch('/:id_solicitud', requireAuth, async (req, res) => {
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
    const changes = [];

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
      changes.push('título');
    }

    if (Object.prototype.hasOwnProperty.call(updates, 'descripcion')) {
      if (typeof updates.descripcion !== 'string' || updates.descripcion.trim().length === 0) {
        return res.status(400).json({ error: 'descripcion must be a non-empty string' });
      }
      updates.descripcion = updates.descripcion.trim();
      changes.push('descripción');
    }

    if (Object.prototype.hasOwnProperty.call(updates, 'id_tipo_solicitud')) {
      updates.id_tipo_solicitud = parseIntParam(updates.id_tipo_solicitud, 'id_tipo_solicitud');
       changes.push('tipo de solicitud');
    }
    if (Object.prototype.hasOwnProperty.call(updates, 'id_estado_solicitud')) {
      updates.id_estado_solicitud = parseIntParam(updates.id_estado_solicitud, 'id_estado_solicitud');
      changes.push('estado');
    }
    if (Object.prototype.hasOwnProperty.call(updates, 'id_personal_asignado')) {
      if (updates.id_personal_asignado === null) {
        // allowed (nullable)
      } else {
        updates.id_personal_asignado = parseIntParam(updates.id_personal_asignado, 'id_personal_asignado');
      }
      changes.push('asignación');
    }

    updates.fecha_actualizacion = new Date().toISOString();

    const { data, error } = await supabase
      .from('solicitud')
      .update(updates)
      .eq('id_solicitud', idSolicitud)
      .select(
        SOLICITUD_SELECT_FULL
      )
      .maybeSingle();

    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Solicitud not found' });

    if (changes.length > 0) {
      const detailedChanges = changes.map(ch => {
        if (ch === 'estado') {
          return `estado a '${data.estado?.nombre || data.id_estado_solicitud}'`;
        }
        if (ch === 'asignación') {
          const fullName = data.personal_asignado 
            ? [data.personal_asignado.nombre, data.personal_asignado.apellido].filter(Boolean).join(' ') 
            : 'Sin asignar';
          return `asignación a '${fullName}'`;
        }
        if (ch === 'tipo de solicitud') {
          return `tipo de solicitud a '${data.tipo?.nombre || data.id_tipo_solicitud}'`;
        }
        return ch;
      });

      await supabase.from('historial_solicitud').insert({
        id_solicitud: idSolicitud,
        id_usuario: req.user.id_usuario,
        accion: 'ACTUALIZAR',
        descripcion: `Actualizó: ${detailedChanges.join(', ')}`,
        fecha_evento: updates.fecha_actualizacion,
      });

      // Notification logic
      if (changes.includes('estado')) {
        await supabase.from('notificacion').insert({
          id_usuario: data.id_estudiante,
          titulo: 'Actualización de estado',
          mensaje: `Tu solicitud '${data.titulo}' ahora está en estado '${data.estado?.nombre || data.id_estado_solicitud}'.`,
          enlace: `/solicitud/${idSolicitud}`
        });
      }
      
      if (changes.includes('asignación') && data.id_personal_asignado && req.user.id_usuario !== data.id_personal_asignado) {
        await supabase.from('notificacion').insert({
          id_usuario: data.id_personal_asignado,
          titulo: 'Nueva asignación',
          mensaje: `Se te ha asignado la solicitud '${data.titulo}'.`,
          enlace: `/solicitud-admin/${idSolicitud}`
        });
      }
    }

    return res.status(200).json(data);
  } catch (err) {
    console.error('PATCH /api/solicitudes/:id_solicitud error:', err);
    return res.status(err?.status ?? 500).json({ error: err?.message ?? 'Failed to update solicitud' });
  }
});

export default router;
