import axios from "axios";

const defaultApiUrl = `${window.location.protocol}//${window.location.hostname || "localhost"}:5000`;

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || defaultApiUrl,
  withCredentials: true
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
