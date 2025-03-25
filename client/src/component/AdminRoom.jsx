import React, { useEffect, useState, useRef } from "react";
import { useHistory } from "react-router-dom";
import * as api from '../api/AxiosAdminRoom';
import Select from 'react-select';
import '../style/AdminRoom.css';
import { Buffer } from 'buffer';
import { toast } from "sonner"; // Add this line

const AdminRoom = () => {
  Buffer.from = Buffer.from || require('buffer').Buffer;
  const [rooms, setRooms] = useState([]);
  const [buildings, setBuildings] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    building: [],
    name: [],
    number: [],
    id: []
  });
  const [newRoomModalOpen, setNewRoomModalOpen] = useState(false);
  const [editRoomModalOpen, setEditRoomModalOpen] = useState(false);
  const [newRoomData, setNewRoomData] = useState({
    number: '',
    name: '',
    building: '',
    buildingId: '',
    images: []
  });
  const [debugInfo, setDebugInfo] = useState({ error: null, buildingData: null });
  const [editRoomData, setEditRoomData] = useState({
    id_rooms: '',
    number: '',
    name: '',
    building: '',
    images: []
  });
  const history = useHistory();
  const dataFetchedRef = useRef(false);

  const showLoading = (promises, textLoading, textSuccess, textError) => {
    return toast.promise(Promise.all(promises), {
        loading: textLoading,
        success: textSuccess,
        error: textError,
    });
  }

  const fetchBuildings = async () => {
    try {
      const buildingsData = await api.getBuildings();
        
      if (!buildingsData || buildingsData.length === 0) {
        setDebugInfo(prev => ({ ...prev, error: "No building data received" }));
        toast.error('Aucun bâtiment trouvé. Veuillez en créer un.');
        return [];
      }
      
      // Improved check for id_buildings that properly handles value 0
      if (buildingsData[0].id_buildings === undefined || 
          buildingsData[0].id_buildings === null || 
          buildingsData[0].name === undefined) {
        setDebugInfo(prev => ({ 
          ...prev, 
          error: "Building data doesn't have expected fields", 
          buildingData: buildingsData 
        }));
        toast.error('Format de données des bâtiments incorrect');
        return [];
      }
      
      setBuildings(buildingsData);
      setDebugInfo(prev => ({ ...prev, buildingData: buildingsData, error: null }));
      return buildingsData;
    } catch (error) {
      console.error('Error fetching buildings:', error);
      setDebugInfo(prev => ({ ...prev, error: error.toString() }));
      toast.error('Erreur lors du chargement des bâtiments');
      return [];
    }
  };
  
  const fetchRooms = async () => {
    try {
      const roomsData = await api.getRooms();
      // Ensure we have building data before processing rooms
      let buildingsData = buildings;
      if (!buildingsData || buildingsData.length === 0) {
        buildingsData = await fetchBuildings();
      }
      
      const roomsWithImages = await Promise.all(
        roomsData.map(async room => {
          const pictures = await api.getPicturesByRoomId(room.id_rooms);
          const imageUrl = pictures.length > 0 ? await api.getImage(pictures[0].id_pictures) : null;
          
          // Find the building name that corresponds to this room's building_id
          const building = buildingsData.find(b => b.id_buildings === room.id_buildings);
          const building_name = building ? building.name : 'Bâtiment inconnu';

          return { ...room, imageUrl, building_name };
        })
      );
      setRooms(roomsWithImages);
    } catch (error) {
      console.error('Error fetching rooms:', error);
      toast.error('Erreur lors du chargement des salles');
    }
  };

  useEffect(() => {
    if (!dataFetchedRef.current) {
        // Modify loading sequence to ensure buildings load first, then rooms
        showLoading(
          [
            fetchBuildings().then(buildingsData => {
              if (buildingsData && buildingsData.length > 0) {
                return fetchRooms();
              }
            })
          ], 
          'Chargement des données...', 
          'Chargement réussi', 
          'Erreur lors du chargement'
        );
        dataFetchedRef.current = true; 
    }
  }, []);

  const handleFilterChange = (selectedOptions, { name }) => {
    setFilters(prevFilters => ({
      ...prevFilters,
      [name]: selectedOptions.map(option => option.value)
    }));
  };

  const getUniqueOptions = (key) => {
    const uniqueValues = [...new Set(rooms.map(room => room[key]))];
    return uniqueValues.map(value => ({ value, label: value }));
  };

  const filteredRooms = rooms.filter(room =>
    (room.name.toLowerCase().includes(searchTerm.toLowerCase()) || room.number.includes(searchTerm)) &&
    (filters.name.length === 0 || filters.name.some(name => room.name.toLowerCase().includes(name.toLowerCase()))) &&
    (filters.number.length === 0 || filters.number.some(number => room.number.includes(number))) &&
    (filters.building.length === 0 || filters.building.some(building => room.building_name.toLowerCase().includes(building.toLowerCase()))) &&
    (filters.id.length === 0 || filters.id.some(id => room.id_rooms.toString().includes(id)))
  );

  const handleRoomClick = (id) => {
    history.push(`/admin/room/${id}`);
  };

  const handleNewRoomChange = (e) => {
    const { name, value } = e.target;
    setNewRoomData(prevData => ({
      ...prevData,
      [name]: value
    }));
  };

  const handleNewRoomImagesChange = (e) => {
    const files = Array.from(e.target.files);
    setNewRoomData(prevData => ({
      ...prevData,
      images: files
    }));
  };

  const getBuildingOptions = () => {
    if (!buildings || buildings.length === 0) {
      return [{ value: "manual", label: "Aucun bâtiment disponible" }];
    }
  
    return buildings.map(building => ({ 
      value: building.id_buildings.toString(), 
      label: building.name 
    }));
  };

  const handleNewRoomSubmit = async (e) => {
    e.preventDefault();
    
    if (!newRoomData.buildingId && newRoomData.buildingId !== "manual" && newRoomData.buildingId !== "0") {
      toast.error('Veuillez sélectionner un bâtiment');
      return;
    }
    
    const formData = new FormData();
    formData.append('number', newRoomData.number);
    formData.append('name', newRoomData.name);
    
    // Handle the case when building selection is "manual"
    if (newRoomData.buildingId === "manual") {
      // If your API supports creating a building on the fly
      if (!newRoomData.building || newRoomData.building.trim() === '') {
        toast.error('Veuillez entrer un nom pour le bâtiment');
        return;
      }
      
      try {
        // Try to create a new building first
        const createBuildingResponse = await api.createBuilding({ name: newRoomData.building });
        formData.append('id_buildings', createBuildingResponse.id_buildings);
      } catch (error) {
        console.error('Error creating building:', error);
        toast.error('Erreur lors de la création du bâtiment');
        return;
      }
    } else {
      // Make sure to also include the building name if your API requires it
      formData.append('id_buildings', newRoomData.buildingId);
      formData.append('building_name', newRoomData.building);
      console.log(`Using building ID: ${newRoomData.buildingId} with name: ${newRoomData.building} for new room`);
    }
    
    // Log all form data for debugging
    console.log("Form data entries:");
    for (let [key, value] of formData.entries()) {
      console.log(`${key}: ${value}`);
    }
    
    // Add images to form data
    newRoomData.images.forEach(image => {
      formData.append('images', image);
    });
    
    try {
      await api.createRoom(formData);
      setNewRoomModalOpen(false);
      setNewRoomData({
        number: '',
        name: '',
        building: '',
        buildingId: '',
        images: []
      });
      showLoading([fetchRooms()], 'Ajout de la salle...', 'Salle ajoutée avec succès', 'Erreur lors de l\'ajout de la salle');
    } catch (error) {
      console.error('Error creating room:', error);
      toast.error('Erreur lors de la création de la salle');
    }
  };

  const handleDeleteRoom = async (event, id) => {
    event.stopPropagation();
    event.preventDefault();
    if (!window.confirm('Etes-vous sûr de vouloir supprimer la salle ?')) return;
    try {
      await api.deleteRoom(id);
      showLoading([fetchRooms()], 'Suppression de la salle...', 'Salle supprimée avec succès', 'Erreur lors de la suppression de la salle');
    } catch (error) {
      console.error('Error deleting room:', error);
    }
  }

  const handleEditRoom = async (event, room) => {
    event.stopPropagation();
    event.preventDefault();
    console.log(room);
    setEditRoomData({
      id_rooms: room.id_rooms,
      number: room.number,
      name: room.name,
      building: room.building_name,
      images: []
    });
    setEditRoomModalOpen(true);
  };

  const handleEditRoomChange = (e) => {
    const { name, value } = e.target;
    setEditRoomData(prevData => ({
      ...prevData,
      [name]: value
    }));
  };

  const handleEditRoomImagesChange = (e) => {
    const files = Array.from(e.target.files);
    setEditRoomData(prevData => ({
      ...prevData,
      images: files
    }));
  };

  const handleEditRoomSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('id_rooms', editRoomData.id_rooms);
    formData.append('number', editRoomData.number);
    formData.append('name', editRoomData.name);
    const building = rooms.find(room => room.building_name === editRoomData.building);
    formData.append('id_buildings', building.id_buildings);
    // Add images to form data
    editRoomData.images.forEach(image => {
      formData.append('images', image);
    });
    try {
      const updatePromise = api.updateRoom(formData);
      updatePromise.then(() => {
        setEditRoomModalOpen(false);
        setEditRoomData({
          id_rooms: '',
          number: '',
          name: '',
          building: '',
        });
      });
      showLoading([updatePromise, fetchRooms()], 'Modification de la salle...', 'Salle modifiée avec succès', 'Erreur lors de la modification de la salle');
    } catch (error) {
      console.error('Error updating room:', error);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <button 
        onClick={() => history.push('/admin/tour')}
        className="mb-4 p-2 bg-blue-500 text-white rounded"
      >
        Page d'administration des parcours
      </button>
      <button 
        onClick={() => setNewRoomModalOpen(true)}
        className="mb-4 p-2 bg-red-500 text-white rounded"
      >
        Ajouter une nouvelle salle
      </button>
      <input
        type="text"
        placeholder="Rechercher une salle..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="w-full p-2 mb-4 border border-gray-300 rounded"
      />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
        <Select
          isMulti
          name="building"
          options={getUniqueOptions('building_name')}
          className="basic-multi-select"
          classNamePrefix="select"
          placeholder="Filtrer par bâtiment"
          onChange={handleFilterChange}
        />
        <Select
          isMulti
          name="name"
          options={getUniqueOptions('name')}
          className="basic-multi-select"
          classNamePrefix="select"
          placeholder="Filtrer par nom"
          onChange={handleFilterChange}
        />
        <Select
          isMulti
          name="number"
          options={getUniqueOptions('number')}
          className="basic-multi-select"
          classNamePrefix="select"
          placeholder="Filtrer par numéro"
          onChange={handleFilterChange}
        />
        <Select
          isMulti
          name="id"
          options={rooms.map(room => ({ value: room.id_rooms.toString(), label: room.id_rooms.toString() }))}
          className="basic-multi-select"
          classNamePrefix="select"
          placeholder="Filtrer par ID"
          onChange={handleFilterChange}
        />
      </div>
      <div className="grid grid-cols-3 gap-4">
        {filteredRooms.map(room => (
          <div 
            key={room.id_rooms} 
            className="p-4 border border-gray-300 rounded shadow hover:shadow-lg transition-shadow duration-300"
            onClick={() => handleRoomClick(room.id_rooms)}
          >
            <div className="mb-2">
              <h3 className="text-xl font-bold">{room.name}</h3>
              <p>Numéro de salle : {room.number}</p>
              <p>Bâtiment : {room.building_name}</p>
              <p>ID Salle: {room.id_rooms}</p>
            </div>
            {room.imageUrl && (
              <div className="w-full h-48 overflow-hidden rounded">
                <img src={room.imageUrl} alt={`Preview of ${room.name}`} className="object-cover w-full h-full" />
              </div>
            )}

            <button onClick={(event) => handleDeleteRoom(event, room.id_rooms)} className="bg-red-500 text-white px-4 py-2 rounded mr-2">Supprimer</button>
            <button onClick={(event) => handleEditRoom(event, room)} className="bg-red-500 text-white px-4 py-2 rounded">Modifier</button>
          </div>
        ))}
      </div>

      {debugInfo.error && (
        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-4">
          <p className="font-bold">Debugging Information</p>
          <p>Error: {debugInfo.error}</p>
          <p>Building Data: {debugInfo.buildingData ? JSON.stringify(debugInfo.buildingData, null, 2) : 'None'}</p>
          <button 
            onClick={fetchBuildings}
            className="mt-2 p-2 bg-blue-500 text-white rounded"
          >
            Retry Fetching Buildings
          </button>
        </div>
      )}

      {newRoomModalOpen && (
        <div className="modal">
          <div className="modal-content">
            <span className="close" onClick={() => setNewRoomModalOpen(false)}>&times;</span>
            <h2>Ajouter une nouvelle salle</h2>
            <form onSubmit={handleNewRoomSubmit}>
              <input 
                type="text" 
                name="number" 
                placeholder="Numéro de salle" 
                value={newRoomData.number} 
                onChange={handleNewRoomChange} 
                required 
              />
              <input 
                type="text" 
                name="name" 
                placeholder="Nom de la salle" 
                value={newRoomData.name} 
                onChange={handleNewRoomChange} 
                required 
              />
              <Select
                name="building"
                options={getBuildingOptions()}
                className="basic-single-select"
                classNamePrefix="select"
                placeholder="Sélectionner un bâtiment"
                onChange={(selectedOption) => {
                  console.log("Building selected:", selectedOption);
                  if (selectedOption.value === "manual") {
                    // Show a manual input field if "manual" is selected
                    setNewRoomData(prevData => ({
                      ...prevData,
                      building: "",
                      buildingId: "manual",
                      showManualBuildingInput: true
                    }));
                  } else {
                    setNewRoomData(prevData => {
                      console.log("Setting building data:", {
                        label: selectedOption.label,
                        value: selectedOption.value
                      });
                      return {
                        ...prevData,
                        building: selectedOption.label,
                        buildingId: selectedOption.value,
                        showManualBuildingInput: false
                      };
                    });
                  }
                }}
                required
              />
              
              {newRoomData.showManualBuildingInput && (
                <input 
                  type="text" 
                  name="manualBuilding" 
                  placeholder="Nom du nouveau bâtiment" 
                  value={newRoomData.building} 
                  onChange={(e) => setNewRoomData(prev => ({ ...prev, building: e.target.value }))}
                  required 
                />
              )}
              <input 
                type="file" 
                name="images" 
                accept="image/*" 
                multiple 
                onChange={handleNewRoomImagesChange} 
                required 
              />
              <button type="submit">Ajouter une salle</button>
            </form>
          </div>
        </div>
      )}
      {editRoomModalOpen && (
        <div className="modal">
          <div className="modal-content">
            <span className="close" onClick={() => setEditRoomModalOpen(false)}>&times;</span>
            <h2>Modifier la salle</h2>
            <form onSubmit={handleEditRoomSubmit}>
              <input
                type="text"
                name="number"
                placeholder="Numéro de salle"
                value={editRoomData.number}
                onChange={handleEditRoomChange}
                required
              />
              <input
                type="text"
                name="name"
                placeholder="Nom de la salle"
                value={editRoomData.name}
                onChange={handleEditRoomChange}
                required
              />
              <Select
                name="building"
                options={getUniqueOptions('building_name')}
                className="basic-single-select"
                classNamePrefix="select"
                placeholder="Sélectionner un bâtiment"
                defaultValue={{ value: editRoomData.building, label: editRoomData.building }}
                onChange={(selectedOption) => setEditRoomData(prevData => ({
                  ...prevData,
                  building: selectedOption.value
                }))}
                required
              />
              <input
                type="file"
                name="images"
                accept="image/*"
                multiple
                onChange={handleEditRoomImagesChange}
              />
              <button type="submit">Modifier la salle</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminRoom;
