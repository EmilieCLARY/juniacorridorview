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

const getRoomDetails = async (id_rooms) => {
    try {
        const response = await axios.get(`${url}/room/${id_rooms}`);
        return response.data;
    } catch (error) {
        console.error('Error fetching room details', error);
        return {};
    }
};

const getPicturesByRoomId = async (id_rooms) => {
  try {
    const response = await axios.get(`${url}/pictures-by-room/${id_rooms}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching pictures by room ID', error);
    return [];
  }
};

const getFirstPictureByRoomId = async (id_rooms) => {
  try {
    const response = await axios.get(`${url}/first-picture-by-room/${id_rooms}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching first picture by room ID', error);
    return null;
  }
};

const getImage = async (id) => {
  try {
    const response = await axios.get(`http://localhost:8000/fetch/${id}`, { responseType: 'blob' });
    const imageUrl = URL.createObjectURL(response.data);
    return imageUrl;
  } catch (error) {
    console.error('Error fetching image:', error);
  }
};

export {
    getTables,
    getTours,
    getTourSteps,
    getRoomDetails,
    getPicturesByRoomId,
    getFirstPictureByRoomId,
    getImage
};