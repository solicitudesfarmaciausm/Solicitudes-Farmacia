import { apiRequest, buildQuery } from './client.js';

export function listSolicitudes({
  id_estudiante,
  id_estado_solicitud,
  id_tipo_solicitud,
  view = 'full',
  limit = 50,
  offset = 0,
} = {}) {
  const qs = buildQuery({
    id_estudiante,
    id_estado_solicitud,
    id_tipo_solicitud,
    view,
    limit,
    offset,
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
