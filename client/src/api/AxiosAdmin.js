import axios from "axios";

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
    alert('Image updated successfully');
  } catch (error) {
    console.error('Error updating image:', error);
    alert('Image update failed');
  }
};

const updateInfospot = async (formData) => {
  try {
    await api.post('/update-infospot', formData);
    alert('Infospot updated successfully');
  } catch (error) {
    console.error('Error updating infospot:', error);
    alert('Infospot update failed');
  }
};

const updateLink = async (formData) => {
  try {
    await api.post('/update-link', formData);
    alert('Link updated successfully');
  } catch (error) {
    console.error('Error updating link:', error);
    alert('Link update failed');
  }
};

const addRoom = async (formData) => {
  try {
    const data = Object.fromEntries(formData.entries());
    const response = await api.post('/add-room', data);
    alert('Room added successfully');
    return response.data.id_rooms; // Ensure roomId is returned from the API
  } catch (error) {
    console.error('Error adding room:', error);
    alert('Room addition failed');
    return null;
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

const uploadFile = async (formData) => {
  try {
      await api.post('/upload', formData);
      alert('File uploaded successfully');
  } catch (error) {
      console.error('Error uploading file:', error);
      alert('File upload failed');
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