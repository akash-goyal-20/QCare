import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Track whether a 401 redirect is already in progress so we don't fire twice
let isRedirecting = false;

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && !isRedirecting) {
      // Only redirect on 401 if we actually had a token (genuine session expiry)
      const hadToken = !!localStorage.getItem('token');
      if (hadToken) {
        isRedirecting = true;
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        // Use a custom event so React Router handles navigation cleanly
        // instead of window.location.href which causes a hard reload + blank flash
        window.dispatchEvent(new CustomEvent('auth:logout'));
        // Reset flag after a short delay to allow future auth attempts
        setTimeout(() => { isRedirecting = false; }, 3000);
      }
    }
    return Promise.reject(error);
  }
);

export default api;
