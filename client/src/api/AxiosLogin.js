import axios from 'axios';

const url = 'http://localhost:8000';

const getLogin = async () => {
    const response = await axios.get(`${url}/login`);
    return response.data;
};

const postLogin = async (data) => {
    const response = await axios.post(`${url}/login`, data);
    return response.data;
}

export { 
    getLogin,
    postLogin
};