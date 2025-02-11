import axios from 'axios';

const api = axios.create({
  baseURL: process.env.BASE_URL, // Use the environment variable
  timeout: 180000, // Increase the timeout to 180 seconds
  withCredentials: true // Si vous utilisez des cookies ou des sessions
});

const getLogin = async () => {
    const response = await api.get('/login');
    return response.data;
};

const postLogin = async (data) => {
    const response = await api.post('/login', data);
    return response.data;
}

export { 
    getLogin,
    postLogin
};