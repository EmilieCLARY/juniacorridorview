import axios from "axios";


const getTables = async () => {
    try {
        const response = await axios.get('/api/tables');
        return response.data;
    } catch (error) {
        console.error('Error fetching tables', error);
        return [];
    }
};

const getTours = async () => {
    try {
        const response = await axios.get('/api/tours');
        return response.data;
    } catch (error) {
        console.error('Error fetching tours', error);
        return [];
    }
};

const getTourSteps = async (tourId) => {
    try {
        const response = await axios.get(`/api/tour-steps/${tourId}`);
        return response.data;
    } catch (error) {
        console.error('Error fetching tour steps', error);
        return [];
    }
};

const updateTourSteps = async (data) => {
    try {
        const stepsWithNumbers = data.steps.map((step, index) => ({
            ...step,
            step_number: index + 1
        }));
        await axios.post('/api/update-tour-steps', { id_tours: data.id_tours, steps: stepsWithNumbers, title: data.title, description: data.description });
    } catch (error) {
        console.error('Error updating tour steps:', error);
    }
};

const addTourStep = async (data) => {
    try {
        await axios.post('/api/add-tour-step', data);
    } catch (error) {
        console.error('Error adding tour step:', error);
    }
};

const createTour = async (data) => {
    try {
        const stepsWithNumbers = data.steps.map((step, index) => ({
            ...step,
            step_number: index + 1
        }));
        await axios.post('/api/create-tour', { ...data, steps: stepsWithNumbers });
    } catch (error) {
        console.error('Error creating tour:', error);
    }
};

const updateTourVisibility = async (id_tours, hidden) => {
    try {
        await axios.post('/api/update-tour-visibility', { id_tours, hidden });
    } catch (error) {
        console.error('Error updating tour visibility:', error);
    }
}

const deleteTour = async (id_tours) => {
    try {
        await axios.delete(`/api/delete-tour/${id_tours}`);
    } catch (error) {
        console.error('Error deleting tour:', error);
    }
};

const getRoomDetails = async (id_rooms) => {
    try {
        const response = await axios.get(`/api/room/${id_rooms}`);
        return response.data;
    } catch (error) {
        console.error('Error fetching plan details', error);
        return {};
    }
};

const getPicturesByRoomId = async (id_rooms) => {
  try {
    const response = await axios.get(`/api/pictures-by-room/${id_rooms}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching pictures by plan ID', error);
    return [];
  }
};

const getFirstPictureByRoomId = async (id_rooms) => {
  try {
    const response = await axios.get(`/api/first-picture-by-room/${id_rooms}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching first picture by plan ID', error);
    return null;
  }
};

const getImage = async (id) => {
  try {
    const response = await axios.get(`/api/fetch/${id}`, { responseType: 'blob' });
    const imageUrl = URL.createObjectURL(response.data);
    return imageUrl;
  } catch (error) {
    console.error('Error fetching image:', error);
  }
};

const getRooms = async () => {
    try {
        const response = await axios.get('/api/rooms');
        return response.data;
    } catch (error) {
        console.error('Error fetching rooms', error);
        return [];
    }
};

const getRoomPreview = async (id_rooms) => {
  try {
    const response = await axios.get(`/api/room-preview/${id_rooms}`, { 
      responseType: 'blob',
      validateStatus: status => {
        // Consider both 200 and 404 as valid responses
        return status === 200 || status === 404;
      }
    });
    
    // If we got a successful response with image data
    if (response.status === 200) {
      const imageUrl = URL.createObjectURL(response.data);
      return imageUrl;
    }
    
    // If we got a 404, return null (no preview image available)
    return null;
  } catch (error) {
    // Only log errors that aren't 404s
    if (error.response && error.response.status !== 404) {
      console.error('Error fetching plan preview image:', error);
    }
    return null;
  }
};

const getFloors = async () => {
  try {
    const response = await axios.get('/api/floors');
    return response.data;
  } catch (error) {
    console.error('Error fetching floors:', error);
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
    getRooms,
    getRoomPreview,
    getFloors,
    updateTourVisibility,
};