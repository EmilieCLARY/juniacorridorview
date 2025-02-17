import axios from "axios";

const api = axios.create({
  baseURL: process.env.BASE_URL, // Use the environment variable
  timeout: 180000, // Increase the timeout to 180 seconds

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
  } catch (error) {
    console.error('Error updating image:', error);
  }
};

const updateInfospot = async (formData) => {
  try {
    await api.post('/update-infospot', formData);
  } catch (error) {
    console.error('Error updating infospot:', error);
  }
};

const updateLink = async (formData) => {
  try {
    await api.post('/update-link', formData);
  } catch (error) {
    console.error('Error updating link:', error);
  }
};

const addRoom = async (formData) => {
  try {
    const data = Object.fromEntries(formData.entries());
    const response = await api.post('/add-room', data);
    return response.data.id_rooms; // Ensure roomId is returned from the API
  } catch (error) {
    console.error('Error adding room:', error);
    return null;
  }
};

const insertInfoPopUp = async (formData) => {
  try {
      await api.post('/insertInfoPopUp', formData);
  } catch (error) {
      console.error('Error inserting info popup:', error);
  }
};

const insertLink = async (data) => {
  try {
      await api.post('/insertLink', data);
  } catch (error) {
      console.error('Error inserting link:', error);
  }
};

const uploadFile = async (formData) => {
  try {
      await api.post('/upload', formData);
  } catch (error) {
      console.error('Error uploading file:', error);
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

const getFirstPictureByRoomId = async (id_rooms) => {
  try {
    const response = await api.get(`/first-picture-by-room/${id_rooms}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching first picture by room ID', error);
    return null;
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
  getBuildings,
  getFirstPictureByRoomId
};