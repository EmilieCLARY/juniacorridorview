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
};

const getTours = async () => {
    try {
        const response = await axios.get(`${url}/tours`);
        return response.data;
    } catch (error) {
        console.error('Error fetching tours', error);
        return [];
    }
};

const getTourSteps = async (tourId) => {
    try {
        const response = await axios.get(`${url}/tour-steps/${tourId}`);
        return response.data;
    } catch (error) {
        console.error('Error fetching tour steps', error);
        return [];
    }
};

export {
    getTables,
    getTours,
    getTourSteps
};