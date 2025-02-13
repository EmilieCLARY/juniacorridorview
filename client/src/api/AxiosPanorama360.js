import axios from "axios";
import { toast } from "sonner";

const api = axios.create({
  baseURL: process.env.BASE_URL, // Use the environment variable
  timeout: 180000, // Increase the timeout to 180 seconds
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

const getInfoPopup = async (imageId) => {
  try {
    const response = await api.post('/retrieveInfoPopUpByIdPicture', { id_pictures: imageId });
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
};

const getImage = async (id, retries = 3, delay = 1000) => {
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

/**
 * POST
 */
const insertInfoPopUp = async (formData) => {
  try {
    await api.post('/insertInfoPopUp', formData);
    toast.success('Bulle d\'information ajoutée avec succès');
  } catch (error) {
    console.error('Error inserting info popup:', error);
    toast.error('L\'ajout de la bulle d\'information a échoué');
  }
};

export {
  getPictures,
  getInfoPopup,
  getImage,
  insertInfoPopUp
};