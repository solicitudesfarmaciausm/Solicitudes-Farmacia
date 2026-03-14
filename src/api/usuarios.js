import { apiRequest } from './client.js';

export function getUsuarios(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return apiRequest(`/api/usuarios?${queryString}`);
}

export function updateUser(id_usuario, updates) {
  return apiRequest(`/api/usuarios/${id_usuario}`, {
    method: 'PATCH',
    body: updates,
  });
}
