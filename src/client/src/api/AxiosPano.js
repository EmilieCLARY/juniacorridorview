import axios from 'axios';
import {toast} from "sonner";

/**
 * GET
 */
const getPictures = async () => {
    try {
        const response = await axios.get('/api/pictures');
        return response.data;
    } catch (error) {
        console.error('Error fetching pictures', error);
        return [];
    }
};

const getTables = async () => {
    try {
        const response = await axios.get('/api/tables');
        return response.data;
    } catch (error) {
        console.error('Error fetching tables', error);
        return [];
    }
}

const getInfoPopup = async (imageId) => {
    try {
        const response = await axios.post('/api/retrieveInfoPopUpByIdPicture', { id_pictures: imageId });
        return response.data;
    } catch (error) {
        if (axios.isCancel(error)) {
            console.error('Request canceled:', error.message);
        } else {
            console.error('Error retrieving info popup:', error);
            toast.error('La récupération de la bulle d\'information a échouée');
        }
        return [];
    }
}

const getLinks = async (imageId) => {
    try {
        const response = await axios.post('/api/retrieveLinkByIdPicture', { id_pictures: imageId });
        return response.data;
    } catch (error) {
        if (axios.isCancel(error)) {
            console.error('Request canceled:', error.message);
        } else {
            console.error('Error retrieving links:', error);
            toast.error('La récupération des liens a échouée');
        }
        return [];
    }
}

export const getImage = async (id, retries = 3, delay = 1000) => {
  try {
    const response = await axios.get(`/api/fetch/${id}`, { responseType: 'blob' });
    return response.data;
  } catch (error) {
    if (error.code === 'ECONNABORTED') {
      console.error('Request timed out:', error.message);
    } else {
      console.error('Error fetching image:', error);
    }
    if (retries > 0) {
      await new Promise(resolve => setTimeout(resolve, delay));
      return getImage(id, retries - 1, delay * 2); // Exponential backoff
    }
    throw error;
  }
};

const getRoomName = async (id_rooms) => {
  try {
    const response = await axios.get(`/api/room/${id_rooms}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching plan name', error);
    return {};
  }
};

const getRoomIdByPictureId = async (id_pictures) => {
  try {
    const response = await axios.get(`/api/room-id/${id_pictures}`);
    return response.data.id_rooms;
  } catch (error) {
    console.error('Error fetching plan ID by picture ID', error);
    return null;
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

const getRooms = async () => {
  try {
    const response = await axios.get('/api/rooms');
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

const getFirstPictureByRoomId = async (id_rooms) => {
  try {
    const response = await axios.get(`/api/first-picture-by-room/${id_rooms}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching first picture by plan ID', error);
    return null;
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

/**
 * POST
 */
const uploadFile = async (formData) => {
    try {
        await axios.post('/api/upload', formData);
        toast.success('Fichier téléversé avec succès');
    } catch (error) {
        console.error('Error uploading file:', error);
        toast.error('Le téléversement du fichier a échoué');
    }
};

const insertInfoPopUp = async (formData) => {
    try {
        await axios.post('/api/insertInfoPopUp', formData);
        toast.success('Bulle d\'information ajoutée avec succès');
    } catch (error) {
        console.error('Error inserting info popup:', error);
        toast.error('L\'ajout de la bulle d\'information a échoué');
    }
};

const insertLink = async (data) => {
    try {
        await axios.post('/api/insertLink', data);
        toast.success('Lien ajouté avec succès');
    } catch (error) {
        console.error('Error inserting link:', error);
        toast.error('L\'ajout du lien a échoué');
    }
};

const getFloorById = async (id_rooms) => {
    try {
        const response = await axios.get(`/api/floors/${id_rooms}`);
        return response.data;
    } catch (error) {
        console.error('Error fetching floor by room ID', error);
        return null;
    }
}

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
  getFirstPictureByRoomId,
  getRoomPreview,
  getFloorById,
};

