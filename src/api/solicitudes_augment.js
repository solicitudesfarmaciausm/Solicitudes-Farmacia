
export function createSolicitudComentario(id_solicitud, comentario) {
  return apiRequest(`/api/solicitudes/${id_solicitud}/comentarios`, {
    method: 'POST',
    body: { comentario },
  });
}
