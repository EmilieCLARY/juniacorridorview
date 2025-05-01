import axios from 'axios';

const getLogin = async () => {
    const response = await axios.get('/api/login');
    return response.data;
};

const postLogin = async (data) => {
    const response = await axios.post('/api/login', data);
    return response.data;
}

export { 
    getLogin,
    postLogin
};