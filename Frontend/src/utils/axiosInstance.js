import axios from 'axios';

// Create an Axios instance
const axiosInstance = axios.create({
  // Use environment variable for base URL, fallback to json-server for now
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3130',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach the token to every request if it exists
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Handle global responses (e.g., 401 Unauthorized)
axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response && error.response.status === 401) {
      // Token might be expired, clear local storage and redirect to login
      // We check if it's an access_token related error to avoid clearing mock admin logins yet
      if (localStorage.getItem('access_token')) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
