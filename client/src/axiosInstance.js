import axios from 'axios'

const axiosInstance = axios.create({
    baseURL: process.env.VUE_APP_BACKEND_BACKEND_URL,
    withCredentials: true,
    headers: {
        'Access-Control-Request-Origin': process.env.VUE_APP_FRONTEND_URL
    }
});

export default axiosInstance;
