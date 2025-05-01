import axios from "axios";

/*
   _____ ______ _______
  / ____|  ____|__   __|
 | |  __| |__     | |
 | | |_ |  __|    | |
 | |__| | |____   | |
  \_____|______|  |_|
*/

const getBuildings = async () => {
    try {
        const response = await axios.get('/api/buildings');
        return response.data;
    } catch (error) {
        console.error('Error fetching buildings', error);
        return [];
    }
}

const getFloors = async () => {
    try {
        const response = await axios.get('/api/floors');
        return response.data;
    } catch (error) {
        console.error('Error fetching floors', error);
        return [];
    }
}

/*
  _____ _   _  _____ ______ _____ _______
 |_   _| \ | |/ ____|  ____|  __ \__   __|
   | | |  \| | (___ | |__  | |__) | | |
   | | | . ` |\___ \|  __| |  _  /  | |
  _| |_| |\  |____) | |____| | \ \  | |
 |_____|_| \_|_____/|______|_|  \_\ |_|
 */

const insertBuilding = async (formData) => {
    try {
        const response = await axios.post('/api/add-building', formData);
    } catch (error) {
        console.error('Error inserting building', error);
    }
}

const insertFloor = async (formData) => {
    try {
        const response = await axios.post('/api/add-floor', formData);
    } catch (error) {
        console.error('Error inserting floor', error);
    }
}

/*
  _    _ _____  _____       _______ ______
 | |  | |  __ \|  __ \   /\|__   __|  ____|
 | |  | | |__) | |  | | /  \  | |  | |__
 | |  | |  ___/| |  | |/ /\ \ | |  |  __|
 | |__| | |    | |__| / ____ \| |  | |____
  \____/|_|    |_____/_/    \_\_|  |______|
 */

const updateBuilding = async (formData) => {
    try {
        const response = await axios.post('/api/update-building', formData);
    } catch (error) {
        console.error('Error updating building', error);
    }
}

const updateFloor = async (formData) => {
    try {
        const response = await axios.post('/api/update-floor', formData);
    } catch (error) {
        console.error('Error updating floor', error);
    }
}

/*
  _____  ______ _      ______ _______ ______
 |  __ \|  ____| |    |  ____|__   __|  ____|
 | |  | | |__  | |    | |__     | |  | |__
 | |  | |  __| | |    |  __|    | |  |  __|
 | |__| | |____| |____| |____   | |  | |____
 |_____/|______|______|______|  |_|  |______|
 */

const deleteBuilding = async (id_buildings) => {
    try {
        const response = await axios.delete(`/api/building/${id_buildings}`);
    } catch (error) {
        console.error('Error deleting building', error);
    }
}

const deleteFloor = async (id_floors) => {
    try {
        const response = await axios.delete(`/api/floor/${id_floors}`);
    } catch (error) {
        console.error('Error deleting floor', error);
    }
}

export {
    getBuildings,
    getFloors,
    insertBuilding,
    insertFloor,
    updateBuilding,
    updateFloor,
    deleteBuilding,
    deleteFloor,
};