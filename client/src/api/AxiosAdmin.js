import axios from "axios";

const url = 'http://localhost:8000';

const getRooms = async () => {
  try {
    const response = await axios.get(`${url}/rooms`);
    return response.data;
  } catch (error) {
    console.error('Error fetching rooms', error);
    return [];
  }
};

const getPicturesByRoomId = async (id_rooms) => {
  try {
    const response = await axios.get(`${url}/pictures-by-room/${id_rooms}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching pictures by room ID', error);
    return [];
  }
};

const getInfoPopup = async (id_pictures) => {
  try {
    const response = await axios.post(`${url}/retrieveInfoPopUpByIdPicture`, { id_pictures });
    return response.data;
  } catch (error) {
    console.error('Error fetching info popups', error);
    return [];
  }
};

const getLinks = async (id_pictures) => {
  try {
    const response = await axios.post(`${url}/retrieveLinkByIdPicture`, { id_pictures });
    return response.data;
  } catch (error) {
    console.error('Error fetching links', error);
    return [];
  }
};

const getImage = async (id) => {
  try {
    const response = await axios.get(`http://localhost:8000/fetch/${id}`, { responseType: 'blob' });
    const imageUrl = URL.createObjectURL(response.data);
    return imageUrl;
  } catch (error) {
    console.error('Error fetching image:', error);
  }
};

const updateImage = async (formData) => {
  try {
    await axios.post(`${url}/update-image`, formData);
    alert('Image updated successfully');
  } catch (error) {
    console.error('Error updating image:', error);
    alert('Image update failed');
  }
};

const updateInfospot = async (formData) => {
  try {
    await axios.post(`${url}/update-infospot`, formData);
    alert('Infospot updated successfully');
  } catch (error) {
    console.error('Error updating infospot:', error);
    alert('Infospot update failed');
  }
};

const updateLink = async (formData) => {
  try {
    await axios.post(`${url}/update-link`, formData);
    alert('Link updated successfully');
  } catch (error) {
    console.error('Error updating link:', error);
    alert('Link update failed');
  }
};

const addRoom = async (formData) => {
  try {
    const data = Object.fromEntries(formData.entries());
    const response = await axios.post(`${url}/add-room`, data);
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
      await axios.post('http://localhost:8000/insertInfoPopUp', formData);
      alert('Info popup inserted successfully');
  } catch (error) {
      console.error('Error inserting info popup:', error);
      alert('Info popup insertion failed');
  }
};

const insertLink = async (data) => {
  try {
      await axios.post('http://localhost:8000/insertLink', data);
      alert('Link inserted successfully');
  } catch (error) {
      console.error('Error inserting link:', error);
      alert('Link insertion failed');
  }
};

const uploadFile = async (formData) => {
  try {
      await axios.post('http://localhost:8000/upload', formData);
      alert('File uploaded successfully');
  } catch (error) {
      console.error('Error uploading file:', error);
      alert('File upload failed');
  }
};

const getBuildings = async () => {
  try {
    const response = await axios.get(`${url}/buildings`);
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