import { apiRequest } from './client.js'

export const obtenerNotificaciones = async (unreadOnly = false) => {
    return apiRequest(`/api/notificaciones?unreadOnly=${unreadOnly}`)
}

export const marcarNotificacionLeida = async (id_notificacion) => {
    return apiRequest(`/api/notificaciones/${id_notificacion}/leida`, { method: 'PATCH' })
}

export const marcarTodasComoLeidas = async () => {
    return apiRequest(`/api/notificaciones/marcar-todas`, { method: 'PATCH' })
}