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

const createRoom = async (formData) => {
  try {
    const response = await api.post('/add-room', formData);
    const id_rooms = response.data.id_rooms;

    // Create a picture for each uploaded image
    console.log(formData.getAll('images'));
    const imageUploadPromises = formData.getAll('images').map((image) => {
      const imageFormData = new FormData();
      imageFormData.append('id_rooms', id_rooms);
      imageFormData.append('pic', image);
      return api.post('/upload', imageFormData);
    });

    await Promise.all(imageUploadPromises);

    return id_rooms;
  } catch (error) {
    console.error('Error creating room:', error);
    return null;
  }
};

const updateRoom = async (formData) => {
    try {
        const response = await api.post('/update-room', formData);
        const id_rooms = formData.get('id_rooms');

        // Create a picture for each uploaded image
        const imageUploadPromises = formData.getAll('images').map((image) => {
            const imageFormData = new FormData();
            imageFormData.append('id_rooms', id_rooms);
            imageFormData.append('pic', image);
            return api.post('/upload', imageFormData);
        });

        await Promise.all(imageUploadPromises);

        return id_rooms;
    } catch (error) {
        console.error('Error updating room:', error);
        return null;
    }
}

const deleteRoom = async (id_rooms) => {
    try {
        await api.delete(`/delete-room/${id_rooms}`);
    } catch (error) {
        console.error('Error deleting room:', error);
    }
}

const updateImage = async (formData) => {
  try {
    await api.post('/update-image', formData);
  } catch (error) {
    console.error('Error updating image:', error);
  }
};

const deleteImage = async (id_pictures) => {
    try {
        await api.delete(`/delete-image/${id_pictures}`);
    } catch (error) {
        console.error('Error deleting image:', error);
    }
}

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
  updateRoom,
  deleteRoom,
  updateImage,
  deleteImage
};
