import axios from 'axios';

const api = axios.create({
  baseURL: process.env.BASE_URL, // Use the environment variable
  timeout: 180000, // Increase the timeout to 180 seconds
  withCredentials: true // Si vous utilisez des cookies ou des sessions
});

/**
 * GET
 */
const getPictures = async () => {
    try {
        const response = await api.get('/pictures');
        return response.data;
    } catch (error) {
        console.error('Error fetching pictures', error);
        return [];
    }
};

const getTables = async () => {
    try {
        const response = await api.get('/tables');
        return response.data;
    } catch (error) {
        console.error('Error fetching tables', error);
        return [];
    }
}

const getInfoPopup = async (imageId) => {
    try {
        const response = await api.post('/retrieveInfoPopUpByIdPicture', { id_pictures: imageId });
        return response.data;
    } catch (error) {
        if (axios.isCancel(error)) {
            console.error('Request canceled:', error.message);
        } else {
            console.error('Error retrieving info popup:', error);
            alert('Info popup retrieval failed');
        }
        return [];
    }
}

const getLinks = async (imageId) => {
    try {
        const response = await api.post('/retrieveLinkByIdPicture', { id_pictures: imageId });
        return response.data;
    } catch (error) {
        if (axios.isCancel(error)) {
            console.error('Request canceled:', error.message);
        } else {
            console.error('Error retrieving links:', error);
            alert('Link retrieval failed');
        }
        return [];
    }
}

export const getImage = async (id, retries = 3, delay = 1000) => {
  try {
    const response = await api.get(`/fetch/${id}`, { responseType: 'blob' });
    return response.data;
  } catch (error) {
    if (error.code === 'ECONNABORTED') {
      console.error('Request timed out:', error.message);
    } else {
      console.error('Error fetching image:', error);
    }
    if (retries > 0) {
      console.log(`Retrying... (${3 - retries + 1})`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return getImage(id, retries - 1, delay * 2); // Exponential backoff
    }
    throw error;
  }
};

const getRoomName = async (id_rooms) => {
  try {
    const response = await api.get(`/room/${id_rooms}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching room name', error);
    return {};
  }
};

const getRoomIdByPictureId = async (id_pictures) => {
  try {
    const response = await api.get(`/room-id/${id_pictures}`);
    return response.data.id_rooms;
  } catch (error) {
    console.error('Error fetching room ID by picture ID', error);
    return null;
  }
};

const getRoomDetails = async (id_rooms) => {
  try {
    const response = await api.get(`/room/${id_rooms}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching room details', error);
    return {};
  }
};

const getRooms = async () => {
  try {
    const response = await api.get('/rooms');
    return response.data;
  } catch (error) {
    console.error('Error fetching rooms', error);
    return [];
  }
};

const getPicturesByRoomId = async (id_rooms) => {
  try {
    const response = await api.get(`/pictures-by-room/${id_rooms}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching pictures by room ID', error);
    return [];
  }
};

const getFirstPictureByRoomId = async (id_rooms) => {
  try {
    const response = await api.get(`/first-picture-by-room/${id_rooms}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching first picture by room ID', error);
    return null;
  }
};

/**
 * POST
 */
const uploadFile = async (formData) => {
    try {
        await api.post('/upload', formData);
        alert('File uploaded successfully');
    } catch (error) {
        console.error('Error uploading file:', error);
        alert('File upload failed');
    }
};

const insertInfoPopUp = async (formData) => {
    try {
        await api.post('/insertInfoPopUp', formData);
        alert('Info popup inserted successfully');
    } catch (error) {
        console.error('Error inserting info popup:', error);
        alert('Info popup insertion failed');
    }
};

const insertLink = async (data) => {
    try {
        await api.post('/insertLink', data);
        alert('Link inserted successfully');
    } catch (error) {
        console.error('Error inserting link:', error);
        alert('Link insertion failed');
    }
};

export { 
  getInfoPopup, 
  getLinks, 
  getPictures, 
  getTables, 
  insertInfoPopUp, 
  insertLink, 
  uploadFile, 
  getRoomDetails, 
  getRoomName, 
  getRoomIdByPictureId, 
  getRooms, 
  getPicturesByRoomId, 
  getFirstPictureByRoomId 
};

