import axios from 'axios';

// In-memory access token (NOT localStorage - keeps it out of reach of XSS
// reading storage APIs). It's lost on hard refresh, which is exactly why
// AuthContext calls /auth/refresh on app load to silently restore it using
// the httpOnly refresh cookie.
let accessToken = null;
export const setAccessToken = (token) => {
  accessToken = token;
};
export const getAccessToken = () => accessToken;

export const axiosClient = axios.create({
  baseURL: '/api',
  withCredentials: true, // sends the httpOnly refresh cookie automatically
});

axiosClient.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

// On a 401 (expired access token), try exactly one silent refresh, then
// replay the original request. Avoids infinite retry loops via the
// `_retry` flag, and avoids trying to refresh the refresh call itself.
let refreshPromise = null;

axiosClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;

    if (status === 401 && !originalRequest._retry && !originalRequest.url.includes('/auth/')) {
      originalRequest._retry = true;
      try {
        refreshPromise = refreshPromise || axiosClient.post('/auth/refresh');
        const { data } = await refreshPromise;
        refreshPromise = null;
        setAccessToken(data.data.accessToken);
        originalRequest.headers.Authorization = `Bearer ${data.data.accessToken}`;
        return axiosClient(originalRequest);
      } catch (refreshError) {
        refreshPromise = null;
        setAccessToken(null);
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);
