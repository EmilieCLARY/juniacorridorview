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

const getImage = async (id) => {
  try {
    const response = await api.get(`/fetch/${id}`, { responseType: 'blob' });
    const imageUrl = URL.createObjectURL(response.data);
    return imageUrl;
  } catch (error) {
    console.error('Error fetching image:', error);
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

const getRoomDetails = async (id_rooms) => {
    try {
        const response = await api.get(`/room/${id_rooms}`);
        return response.data;
    } catch (error) {
        console.error('Error fetching room details', error);
        return {};
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
  getRoomDetails
};
