import axios from "axios";

const API_BASE_URL = import.meta.env.DEV
    ? "http://localhost:9753/api"
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
    const host = import.meta.env.DEV ? "127.0.0.1:9753" : window.location.host;
    return `${protocol}//${host}`;
};
