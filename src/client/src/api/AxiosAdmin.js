import axios from "axios";

export const getRooms = async () => {
  try {
    const response = await axios.get('/api/rooms');
    return response.data;
  } catch (error) {
    console.error('Error fetching rooms:', error);
    console.error('Error details:', error.response?.data || 'No details available');
    return [];
  }
};

export const getPicturesByRoomId = async (id_rooms) => {
  try {
    const response = await axios.get(`/api/pictures-by-room/${id_rooms}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching pictures by plan ID', error);
    return [];
  }
};

export const getInfoPopup = async (id_pictures) => {
  try {
    const response = await axios.post('/api/retrieveInfoPopUpByIdPicture', { id_pictures });
    return response.data;
  } catch (error) {
    console.error('Error fetching info popups', error);
    return [];
  }
};

export const getLinks = async (id_pictures) => {
  try {
    const response = await axios.post('/api/retrieveLinkByIdPicture', { id_pictures });
    return response.data;
  } catch (error) {
    console.error('Error fetching links', error);
    return [];
  }
};

export const getImage = async (id) => {
  try {
    const response = await axios.get(`/api/fetch/${id}`, { responseType: 'blob' });
    const imageUrl = URL.createObjectURL(response.data);
    return imageUrl;
  } catch (error) {
    console.error('Error fetching image:', error);
  }
};

export const updateImage = async (formData) => {
  try {
    await axios.post('/api/update-image', formData);
  } catch (error) {
    console.error('Error updating image:', error);
  }
};

export const updateInfospot = async (formData) => {
  try {
    await axios.post('/api/update-infospot', formData);
  } catch (error) {
    console.error('Error updating infospot:', error);
  }
};

export const updateLink = async (formData) => {
  try {
    await axios.post('/api/update-link', formData);
  } catch (error) {
    console.error('Error updating link:', error);
  }
};

export const addRoom = async (formData) => {
  try {
    const data = Object.fromEntries(formData.entries());
    const response = await axios.post('/api/add-room', data);
    return response.data.id_rooms; // Ensure roomId is returned from the API
  } catch (error) {
    console.error('Error adding plan:', error);
    return null;
  }
};

export const insertInfoPopUp = async (formData) => {
  try {
      await axios.post('/api/insertInfoPopUp', formData);
  } catch (error) {
      console.error('Error inserting info popup:', error);
  }
};

export const insertLink = async (data) => {
  try {
      await axios.post('/api/insertLink', data);
  } catch (error) {
      console.error('Error inserting link:', error);
  }
};

export const uploadFile = async (formData) => {
  try {
      await axios.post('/api/upload', formData);
  } catch (error) {
      console.error('Error uploading file:', error);
  }
};

export const getBuildings = async () => {
  try {
    const response = await axios.get('/api/buildings');
    return response.data;
  } catch (error) {
    console.error('Error fetching buildings', error);
    return [];
  }
};

export const getFirstPictureByRoomId = async (id_rooms) => {
  try {
    const response = await axios.get(`/api/first-picture-by-room/${id_rooms}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching first picture by plan ID', error);
    return null;
  }
};
