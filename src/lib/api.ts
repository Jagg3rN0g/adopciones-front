import axios from 'axios';

export const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL,
    withCredentials: false,
});


// Opcional: auth token / logging
import { useAuthStore } from '@/app/store/auth.store';

api.interceptors.request.use((config) => {
    // const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    const { token } = useAuthStore.getState();
    if (token) config.headers.Authorization = `Bearer ${token}`;
    if (process.env.NODE_ENV !== 'production') {
        // eslint-disable-next-line no-console
        console.log(`[REQ] ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
    }
    return config;
});


api.interceptors.response.use(
    (res) => res,
    (err) => {
        // eslint-disable-next-line no-console
        console.error('AXIOS ERROR →', {
            status: err.response?.status,
            data: err.response?.data,
            url: err.config?.url,
            method: err.config?.method,
            code: err.code,
            message: err.message,
        });
        return Promise.reject(err);
    }
);