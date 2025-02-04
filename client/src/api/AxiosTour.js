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

const updateTourSteps = async (data) => {
    try {
        await axios.post(`${url}/update-tour-steps`, data);
        alert('Tour steps updated successfully');
    } catch (error) {
        console.error('Error updating tour steps:', error);
        alert('Tour steps update failed');
    }
};

const addTourStep = async (data) => {
    try {
        await axios.post(`${url}/add-tour-step`, data);
        alert('Tour step added successfully');
    } catch (error) {
        console.error('Error adding tour step:', error);
        alert('Tour step addition failed');
    }
};

const createTour = async (data) => {
    try {
        await axios.post(`${url}/create-tour`, data);
        alert('Tour created successfully');
    } catch (error) {
        console.error('Error creating tour:', error);
        alert('Tour creation failed');
    }
};

const deleteTour = async (id_tours) => {
    try {
        await axios.delete(`${url}/delete-tour/${id_tours}`);
        alert('Tour deleted successfully');
    } catch (error) {
        console.error('Error deleting tour:', error);
        alert('Tour deletion failed');
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

const getRooms = async () => {
    try {
        const response = await axios.get(`${url}/rooms`);
        return response.data;
    } catch (error) {
        console.error('Error fetching rooms', error);
        return [];
    }
};

export {
    getTables,
    getTours,
    getTourSteps,
    updateTourSteps,
    addTourStep,
    createTour,
    deleteTour, // Ensure this is exported
    getRoomDetails,
    getPicturesByRoomId,
    getFirstPictureByRoomId,
    getImage,
    getRooms
};