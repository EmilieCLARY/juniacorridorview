import axios from "axios";
import {toast} from "sonner";

const api = axios.create({
  baseURL: process.env.BASE_URL, // Use the environment variable
  timeout: 180000, // Increase the timeout to 180 seconds
  withCredentials: true // Si vous utilisez des cookies ou des sessions
});

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

const getInfoPopup = async (id_pictures) => {
  try {
    const response = await api.post('/retrieveInfoPopUpByIdPicture', { id_pictures });
    return response.data;
  } catch (error) {
    console.error('Error fetching info popups', error);
    return [];
  }
};

const getLinks = async (id_pictures) => {
  try {
    const response = await api.post('/retrieveLinkByIdPicture', { id_pictures });
    return response.data;
  } catch (error) {
    console.error('Error fetching links', error);
    return [];
  }
};

const getImage = async (id) => {
  try {
    const response = await api.get(`/fetch/${id}`, { responseType: 'blob' });
    const imageUrl = URL.createObjectURL(response.data);
    return imageUrl;
  } catch (error) {
    console.error('Error fetching image:', error);
  }
};

const updateImage = async (formData) => {
  try {
    await api.post('/update-image', formData);
    toast.success('Image mise à jour avec succès');
  } catch (error) {
    console.error('Error updating image:', error);
    toast.error('La mise à jour de l\'image a échoué');
  }
};

const updateInfospot = async (formData) => {
  try {
    await api.post('/update-infospot', formData);
    toast.success('Bulle d\'information mise à jour avec succès');
  } catch (error) {
    console.error('Error updating infospot:', error);
    toast.error('La mise à jour de la bulle d\'information a échoué');
  }
};

const updateLink = async (formData) => {
  try {
    await api.post('/update-link', formData);
    toast.success('Lien mis à jour avec succès');
  } catch (error) {
    console.error('Error updating link:', error);
    toast.error('La mise à jour du lien a échoué');
  }
};

const addRoom = async (formData) => {
  try {
    const data = Object.fromEntries(formData.entries());
    const response = await api.post('/add-room', data);
    toast.success('Salle ajoutée avec succès');
    return response.data.id_rooms; // Ensure roomId is returned from the API
  } catch (error) {
    console.error('Error adding room:', error);
    toast.error('L\'ajout de la salle a échoué');
    return null;
  }
};

const insertInfoPopUp = async (formData) => {
  try {
      await api.post('/insertInfoPopUp', formData);
      toast.success('Bulle d\'information ajoutée avec succès');
  } catch (error) {
      console.error('Error inserting info popup:', error);
      toast.error('L\'ajout de la bulle d\'information a échoué');
  }
};

const insertLink = async (data) => {
  try {
      await api.post('/insertLink', data);
      toast.success('Lien ajouté avec succès');
  } catch (error) {
      console.error('Error inserting link:', error);
      toast.error('L\'ajout du lien a échoué');
  }
};

const uploadFile = async (formData) => {
  try {
      await api.post('/upload', formData);
      toast.success('Fichier téléversé avec succès');
  } catch (error) {
      console.error('Error uploading file:', error);
      toast.error('Le téléversement du fichier a échoué');
  }
};

const getBuildings = async () => {
  try {
    const response = await api.get('/buildings');
    return response.data;
  } catch (error) {
    console.error('Error fetching buildings', error);
    return [];
  }
};

export {
  getRooms,
  getPicturesByRoomId,
  getInfoPopup,
  getLinks,
  getImage,
  updateImage,
  updateInfospot,
  updateLink,
  addRoom,
  insertInfoPopUp,
  insertLink,
  uploadFile,
  getBuildings
};