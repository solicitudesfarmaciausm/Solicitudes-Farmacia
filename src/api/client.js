import axios from 'axios';

const RAW_BASE_URL = import.meta.env.VITE_API_URL;

// If VITE_API_URL is undefined, default to local backend.
// If it is set to an empty string, requests will go to same-origin (useful with Vite proxy).
export const API_BASE_URL = RAW_BASE_URL === undefined ? '' : RAW_BASE_URL;

const http = axios.create({
  baseURL: API_BASE_URL,
});

http.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export async function apiRequest(path, { method = 'GET', headers, body } = {}) {
  try {
    const response = await http.request({
      url: path,
      method,
      headers,
      data: body,
    });

    return response.data;
  } catch (e) {
    // Axios error shape: https://axios-http.com/docs/handling_errors
    const status = e?.response?.status;
    const payload = e?.response?.data;
    const message = payload?.error || payload?.message || e?.message || (status ? `HTTP ${status}` : 'Request failed');

    const err = new Error(message);
    err.status = status;
    err.payload = payload;
    throw err;
  }
}

export function buildQuery(params = {}) {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    searchParams.set(key, String(value));
  });
  const qs = searchParams.toString();
  return qs ? `?${qs}` : '';
}
