import { apiRequest } from './client.js';

export function login({ cedulaOrEmail, password, cedula, correo_electronico } = {}) {
  const identifier = cedulaOrEmail ?? cedula ?? correo_electronico;
  return apiRequest('/api/auth/login', {
    method: 'POST',
    body: {
      cedulaOrEmail: identifier,
      password,
    },
  });
}

export function signup({
  cedula,
  nombre,
  apellido,
  correo_electronico,
  password,
  telefono,
  semestre,
} = {}) {
  return apiRequest('/api/auth/signup', {
    method: 'POST',
    body: {
      cedula,
      nombre,
      apellido,
      correo_electronico,
      password,
      telefono,
      semestre,
    },
  });
}

export function changePassword({ currentPassword, newPassword }) {
  return apiRequest('/api/auth/change-password', {
    method: 'POST',
    body: { currentPassword, newPassword },
  });
}

export function signupAdmin({
  cedula,
  nombre,
  apellido,
  correo_electronico,
  password,
  telefono,
} = {}) {
  return apiRequest('/api/auth/signup-admin', {
    method: 'POST',
    body: {
      cedula,
      nombre,
      apellido,
      correo_electronico,
      password,
      telefono,
    },
  });
}
