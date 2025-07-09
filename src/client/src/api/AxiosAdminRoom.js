import axios from "axios";

const getRooms = async () => {
  try {
    const response = await axios.get('/api/rooms'); // Add '/api' prefix
    if (!Array.isArray(response.data)) {
      console.error('Unexpected rooms data format:', response.data);
      return [];
    }
    return response.data;
  } catch (error) {
    console.error('Error fetching rooms', error);
    return [];
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

const getImage = async (id) => {
  try {
    const response = await axios.get(`/api/fetch/${id}`, { responseType: 'blob' });
    const imageUrl = URL.createObjectURL(response.data);
    return imageUrl;
  } catch (error) {
    console.error('Error fetching image:', error);
  }
};

const getInfoPopup = async (id_pictures) => {
  try {
    const response = await axios.post('/api/retrieveInfoPopUpByIdPicture', { id_pictures });
    return response.data;
  } catch (error) {
    console.error('Error fetching info popups', error);
    return [];
  }
};

const getLinks = async (id_pictures) => {
  try {
    const response = await axios.post('/api/retrieveLinkByIdPicture', { id_pictures });
    return response.data;
  } catch (error) {
    console.error('Error fetching links', error);
    return [];
  }
};


const insertInfoPopUp = async (formData) => {
  try {
      await axios.post('/api/insertInfoPopUp', formData);
  } catch (error) {
      console.error('Error inserting info popup:', error);
  }
};

const insertLink = async (data) => {
  try {
      await axios.post('/api/insertLink', data);
  } catch (error) {
      console.error('Error inserting link:', error);
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

const createRoom = async (formData) => {
  try {
    const response = await axios.post('/api/add-room', formData);
    const id_rooms = response.data.id_rooms;

    const imageUploadPromises = formData.getAll('images').map((image) => {
      const imageFormData = new FormData();
      imageFormData.append('id_rooms', id_rooms);
      imageFormData.append('pic', image);
      return axios.post('/api/upload', imageFormData);
    });

    await Promise.all(imageUploadPromises);

    return id_rooms;
  } catch (error) {
    console.error('Error creating plan:', error);
    if (error.response) {
      console.error('Server response:', error.response.data);
    }
    return null;
  }
};

const getBuildings = async () => {
  try {
    const response = await axios.get('/api/buildings');
    if (!Array.isArray(response.data)) {
      console.error('Unexpected buildings data format:', response.data);
      return [];
    }
    return response.data;
  } catch (error) {
    console.error('Error fetching buildings:', error.response || error.message); // Log error
    throw error;
  }
};

const createBuilding = async (buildingData) => {
  try {
    const response = await axios.post('/api/buildings', buildingData);
    return response.data;
  } catch (error) {
    console.error('Error creating building:', error);
    throw error;
  }
};

const updateRoom = async (formData) => {
    try {
        const response = await axios.post('/api/update-room', formData);
        const id_rooms = formData.get('id_rooms');

        // Create a picture for each uploaded image
        const imageUploadPromises = formData.getAll('images').map((image) => {
            const imageFormData = new FormData();
            imageFormData.append('id_rooms', id_rooms);
            imageFormData.append('pic', image);
            return axios.post('/api/upload', imageFormData);
        });

        await Promise.all(imageUploadPromises);

        return id_rooms;
    } catch (error) {
        console.error('Error updating plan:', error);
        return null;
    }
}

const deleteRoom = async (id_rooms) => {
    try {
        await axios.delete(`/api/delete-room/${id_rooms}`);
    } catch (error) {
        console.error('Error deleting plan:', error);
    }
}

const updateImage = async (formData) => {
  try {
    await axios.post('/api/update-image', formData);
  } catch (error) {
    console.error('Error updating image:', error);
  }
};

const deleteImage = async (id_pictures) => {
    try {
        await axios.delete(`/api/delete-image/${id_pictures}`);
    } catch (error) {
        console.error('Error deleting image:', error);
    }
};


const updateRoomVisibility = async (id_rooms, hidden) => {
  try {
    await axios.post('/api/update-room-visibility', { id_rooms, hidden });
  } catch (error) {
    console.error('Error updating plan visibility:', error);
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

const updateInfospot = async (formData) => {
    try {
        await axios.post('/api/update-infospot', formData);
    } catch (error) {
        console.error('Error updating infospot:', error);
    }
};

const updateLink = async (formData) => {
    try {
        await axios.post('/api/update-link', formData);
    } catch (error) {
        console.error('Error updating link:', error);
    }
};

const deleteLink = async (id_links) => {
    try {
        await axios.delete(`/api/delete-link/${id_links}`);
    } catch (error) {
        console.error('Error deleting link:', error);
    }
};

const deleteInfospot = async (id_infospots) => {
    try {
        await axios.delete(`/api/delete-infospot/${id_infospots}`);
    } catch (error) {
        console.error('Error deleting infospot:', error);
    }

};

const getFloors = async () => {
    try {
        const response = await axios.get('/api/floors'); // Add '/api' prefix
        if (!Array.isArray(response.data)) {
          console.error('Unexpected floors data format:', response.data);
          return [];
        }
        return response.data;
    } catch (error) {
        console.error('Error fetching floors:', error);
        return [];
    }
}

const uploadFile = async (formData) => {
  try {
    await axios.post('/api/upload', formData);
  } catch (error) {
    console.error('Error uploading file:', error);
  }
};

export {
  getRooms,
  getPicturesByRoomId,
  getImage,
  getInfoPopup,
  getLinks,
  insertInfoPopUp,
  insertLink,
  getRoomDetails,
  createRoom,
  getBuildings,
  createBuilding,
  updateRoom,
  deleteRoom,
  updateImage,
  deleteImage,
  updateRoomVisibility,
  getRoomPreview,
  updateInfospot,
  updateLink,
  deleteLink,
  deleteInfospot,
  getFloors,
  uploadFile
};
