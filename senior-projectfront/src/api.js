import axios from "axios";

// In dev the CRA proxy forwards /api → localhost:5000.
// In production set REACT_APP_API_URL to your Railway backend URL (e.g. https://xyz.railway.app/api).
const api = axios.create({ baseURL: process.env.REACT_APP_API_URL || "/api" });

// Attach the saved login token (if any) to every request.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("ck_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;
