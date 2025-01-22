import axios from "axios";

const url = 'http://localhost:8000';

/**
 * GET
 */
const getPictures = async () => {
    try {
        const response = await axios.get(`${url}/pictures`);
        return response.data;
    } catch (error) {
        console.error('Error fetching pictures', error);
        return [];
    }
};

const getTables = async () => {
    try {
        const response = await axios.get(`${url}/tables`);
        return response.data;
    } catch (error) {
        console.error('Error fetching tables', error);
        return [];
    }
}

const getInfoPopup = async (imageId) => {
    try {
        const response = await axios.post('http://localhost:8000/retrieveInfoPopUpByIdPicture', { id_pictures: imageId });
        return response.data;
    } catch (error) {
        console.error('Error retrieving info popup:', error);
        alert('Info popup retrieval failed');
        return [];
    }
}

const getLinks = async (imageId) => {
    try {
        const response = await axios.post('http://localhost:8000/retrieveLinkByIdPicture', { id_pictures: imageId });
        return response.data;
    } catch (error) {
        console.error('Error retrieving links:', error);
        alert('Link retrieval failed');
        return [];
    }
}

const getImage = async (id) => {
    try {
        const response = await axios.get(`http://localhost:8000/fetch/${id}`, { responseType: 'blob' });
        const imageUrl = URL.createObjectURL(response.data);
        return imageUrl;
  
    } catch (error) {
        console.error('Error fetching image:', error);
    }
}

/**
 * POST
 */
const uploadFile = async (formData) => {
    try {
        await axios.post('http://localhost:8000/upload', formData);
        alert('File uploaded successfully');
    } catch (error) {
        console.error('Error uploading file:', error);
        alert('File upload failed');
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

export { getImage, getInfoPopup, getLinks, getPictures, getTables, insertInfoPopUp, insertLink, uploadFile };

