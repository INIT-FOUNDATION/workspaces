import axios, { AxiosInstance, AxiosResponse, AxiosError } from 'axios';
import toastUtils from '../utils/toastUtils';

const api: AxiosInstance = axios.create({
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    },
});

api.interceptors.request.use(
    (config) => {
        if (config.url?.startsWith("/api/v1/sessions")) {
            config.baseURL = process.env.REACT_APP_WORKSPACES_SESSIONS_BASE_URL;
        }

        const token = localStorage.getItem('token');
        if (token) {
            config.headers = config.headers || {};
            config.headers['Authorization'] = `Bearer ${token}`;
        }

        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

api.interceptors.response.use(
    (response: AxiosResponse) => {
        return response;
    },
    (error: any) => {
        if (error.response && error.response.data && error.response.data) {
            const errorMessage = error.response.data.message;
            toastUtils.error(errorMessage);
        } else {
            toastUtils.error('Request failed');
        }
        return Promise.reject(error);
    }
);

export default api;
