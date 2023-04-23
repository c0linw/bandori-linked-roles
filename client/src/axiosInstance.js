import axios from 'axios'

const axiosInstance = axios.create({
    baseURL: process.env.VUE_APP_BACKEND_URL,
    withCredentials: true,
});

export default axiosInstance;
