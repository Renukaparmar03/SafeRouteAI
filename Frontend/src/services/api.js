import axios from 'axios';

export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
export const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || API_URL.replace(/\/api\/?$/, '');

/** Error thrown by every service call, with a user-friendly message. */
export class ApiError extends Error {
  constructor(message, status, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true, // JWT lives in an HTTP-only cookie
  timeout: 45000,
  headers: { 'Content-Type': 'application/json' },
});

let unauthorizedHandler = null;
/** Lets the auth context react to expired sessions. */
export const onUnauthorized = (handler) => {
  unauthorizedHandler = handler;
};

api.interceptors.response.use(
  (response) => response.data?.data ?? response.data,
  (error) => {
    if (error.response) {
      const { status, data } = error.response;
      if (status === 401 && unauthorizedHandler && !error.config?.skipAuthRedirect) unauthorizedHandler();
      return Promise.reject(new ApiError(data?.message || 'Something went wrong. Please try again.', status, data?.details));
    }
    if (error.code === 'ECONNABORTED') {
      return Promise.reject(new ApiError('The server took too long to respond. Please try again.', 0));
    }
    return Promise.reject(new ApiError('Cannot reach the server. Check your connection and try again.', 0));
  }
);

export default api;
