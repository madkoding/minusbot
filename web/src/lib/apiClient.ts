import axios from "axios";

const isDev = import.meta.env.DEV;
const BACKEND_PORT = "9753";

const API_BASE_URL = isDev
    ? `${window.location.protocol}//127.0.0.1:${BACKEND_PORT}/api`
    : "/api";

export const apiClient = axios.create({
    baseURL: API_BASE_URL,
});

apiClient.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export const getWSUrl = () => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const host = isDev ? `127.0.0.1:${BACKEND_PORT}` : window.location.host;
    return `${protocol}//${host}`;
};
