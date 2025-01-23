import axios from "axios";

const url = 'http://localhost:8000';

const getTables = async () => {
    try {
        const response = await axios.get(`${url}/tables`);
        return response.data;
    } catch (error) {
        console.error('Error fetching tables', error);
        return [];
    }
}

export {
    getTables
};