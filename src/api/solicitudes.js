import { apiRequest, buildQuery, API_BASE_URL } from './client.js';

export function createSolicitud({ titulo, descripcion, id_tipo_solicitud } = {}) {
  return apiRequest('/api/solicitudes', {
    method: 'POST',
    body: { titulo, descripcion, id_tipo_solicitud },
  });
}

export async function uploadSolicitudArchivos(id_solicitud, files = []) {
  const id = Number.parseInt(String(id_solicitud), 10);
  if (!Number.isFinite(id)) throw new Error('id_solicitud inválido');
  if (!Array.isArray(files) || files.length === 0) return [];

  const form = new FormData();
  for (const file of files) {
    if (file) form.append('files', file);
  }

  const token = localStorage.getItem('token');
  const res = await fetch(`${API_BASE_URL}/api/solicitudes/${id}/archivos`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    body: form,
  });

  let payload;
  try {
    payload = await res.json();
  } catch {
    payload = null;
  }

  if (!res.ok) {
    const message = payload?.error || payload?.message || `HTTP ${res.status}`;
    const err = new Error(message);
    err.status = res.status;
    err.payload = payload;
    throw err;
  }

  return payload ?? [];
}

export function listSolicitudes({
  id_estudiante,
  id_estado_solicitud,
  id_tipo_solicitud,
  view = 'full',
  limit = 50,
  offset = 0,
  ...rest
} = {}) {
  const qs = buildQuery({
    id_estudiante,
    id_estado_solicitud,
    id_tipo_solicitud,
    view,
    limit,
    offset,
    ...rest
  });
  return apiRequest(`/api/solicitudes${qs}`);
}

export function getSolicitud(id_solicitud, { view = 'full' } = {}) {
  const qs = buildQuery({ view });
  return apiRequest(`/api/solicitudes/${id_solicitud}${qs}`);
}

export function getSolicitudComentarios(id_solicitud, { limit = 50, offset = 0 } = {}) {
  const qs = buildQuery({ limit, offset });
  return apiRequest(`/api/solicitudes/${id_solicitud}/comentarios${qs}`);
}

export function getSolicitudHistorial(id_solicitud, { limit = 50, offset = 0 } = {}) {
  const qs = buildQuery({ limit, offset });
  return apiRequest(`/api/solicitudes/${id_solicitud}/historial${qs}`);
}

export function getSolicitudArchivos(
  id_solicitud,
  { limit = 50, offset = 0, signed = true } = {}
) {
  const qs = buildQuery({
    limit,
    offset,
    signed: signed ? 1 : 0,
  });
  return apiRequest(`/api/solicitudes/${id_solicitud}/archivos${qs}`);
}

export function updateSolicitud(id_solicitud, updates) {
  return apiRequest(`/api/solicitudes/${id_solicitud}`, { method: 'PATCH', body: updates });
}

export function createSolicitudComentario(id_solicitud, comentario) {
  return apiRequest(`/api/solicitudes/${id_solicitud}/comentarios`, {
    method: 'POST',
    body: { comentario },
  });
}
export function deleteSolicitud(id_solicitud) {
  // Hardcoding de la URL de Render para descartar fallos de configuración
  const BASE = "https://solicitudes-farmacia.onrender.com";
  
  console.log(`[DEBUG] Intentando borrar en: ${BASE}/api/solicitudes/${id_solicitud}`);
  
  return apiRequest(`${BASE}/api/solicitudes/${id_solicitud}`, { 
    method: 'DELETE' 
  });
}
export async function deleteSolicitudesMultiple(ids) {
  // Validamos que sea un array para evitar errores antes de la petición
  if (!Array.isArray(ids) || ids.length === 0) {
    throw new Error("Se requiere un array de IDs para eliminar.");
  }

  try {
    // Usamos la instancia de axios o apiRequest que tengas configurada
    // Se envía como POST según tu definición de Express
    const response = await apiRequest(`/api/solicitudes/borrar-multiples`, {
      method: 'POST',
      body: JSON.stringify({ ids }), // Enviamos los IDs en el cuerpo
    });

    return response;
  } catch (error) {
    console.error("[API] Error en deleteSolicitudesMultiple:", error);
    throw error;
  }
}
