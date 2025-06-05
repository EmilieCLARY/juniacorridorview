import { Buffer } from 'buffer';
import React, { useEffect, useRef, useState } from "react";
import { useHistory } from "react-router-dom";
import Select from 'react-select';
import { toast } from "sonner";
import * as api from '../api/AxiosAdminRoom';
import '../style/AdminRoom.css';
import Loader from "./Loader";
import {TbMapPinPlus} from "react-icons/tb";
import ModalPlanPlacement from "./plan/ModalPlanPlacement"; // Add this line
import { FaPen, FaTrash, FaPlusCircle  } from "react-icons/fa"; // Add FaPlus import
import { ImLocation2 } from "react-icons/im";
import { MdOutlineFileUpload } from "react-icons/md";

const customSelectStyles = {
  control: (provided, state) => ({
    ...provided,
    backgroundColor: 'white',
    borderColor: state.isFocused ? '#3B82F6' : '#fb8500',
    borderWidth: '2px',
    borderRadius: '0.375rem',
    boxShadow: state.isFocused ? '0 0 0 2px #93C5FD' : 'none',
    '&:hover': {
      borderColor: '#3B82F6'
    },
    padding: '2px',
    width: '100%'
  }),
  option: (provided, state) => ({
    ...provided,
    backgroundColor: state.isSelected ? '#fb8500' : state.isFocused ? '#FDE68A' : 'white',
    color: state.isSelected ? 'white' : '#333',
    cursor: 'pointer',
    '&:hover': {
      backgroundColor: state.isSelected ? '#fb8500' : '#FDE68A',
    }
  }),
  placeholder: (provided) => ({
    ...provided,
    color: '#9CA3AF'
  }),
  singleValue: (provided) => ({
    ...provided,
    color: '#111827'
  }),
  menu: (provided) => ({
    ...provided,
    zIndex: 9999,
  }),
  menuPortal: (provided) => ({
    ...provided,
    zIndex: 9999
  }),
};

const AdminRoom = () => {
  Buffer.from = Buffer.from || require('buffer').Buffer;
  const [rooms, setRooms] = useState([]);
  const [buildings, setBuildings] = useState([]);
  const [floors, setFloors] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    building: [],
    name: [],
    number: [],
    id: [],
    floor: []
  });
  const [newRoomModalOpen, setNewRoomModalOpen] = useState(false);
  const [editRoomModalOpen, setEditRoomModalOpen] = useState(false);
  const [newRoomData, setNewRoomData] = useState({
    number: '',
    name: '',
    building: '',
    buildingId: '',
    floor: '',
    floorId: '',
    images: [],
    previewImage: null,
    plan_x: '',
    plan_y: ''
  });
  const [debugInfo, setDebugInfo] = useState({ error: null, buildingData: null });
  const [editRoomData, setEditRoomData] = useState({
    id_rooms: '',
    number: '',
    name: '',
    building: '',
    floor: '',
    floorId: '',
    images: [],
    previewImage: null,
    plan_x: '',
    plan_y: ''
  });
  const history = useHistory();
  const dataFetchedRef = useRef(false);
  const [showPlanPlacement, setShowPlanPlacement] = useState(false);
  const [planPlacementEditMode, setPlanPlacementEditMode] = useState(false);
  const [floorPlan, setFloorPlan] = useState(null);

  const [isLoading, setIsLoading] = useState(true);
  const [textLoading, setTextLoading] = useState("Chargement des données...");

  const showLoading = (promises, textLoading, textSuccess, textError) => {
    setIsLoading(true);
    setTextLoading(textLoading);
    // Return a toaster success after all promises are resolved
    Promise.all(promises)
      .then(() => {
        setIsLoading(false);
        toast.success(textSuccess);
      })
      .catch((error) => {
        setIsLoading(false);
        console.error('Error fetching data:', error);
        toast.error(textError);
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

  const fetchFloors = async () => {
    try {
      const floorsData = await api.getFloors();
      console.log('Fetched floors:', floorsData);
      setFloors(floorsData);
      return floorsData;
    } catch (error) {
      console.error('Error fetching floors:', error);
      toast.error('Erreur lors du chargement des étages');
      return [];
    }
  }

  const fetchRooms = async () => {
    try {
      console.log('Fetching rooms...');
      const roomsData = await api.getRooms();

      // Ensure we have building data before processing rooms
      let buildingsData = buildings;
      if (!buildingsData || buildingsData.length === 0) {
        buildingsData = await fetchBuildings();
      }
      // Ensure we have floors data before processing rooms
      let floorsData = floors;
      if (!floorsData || floorsData.length === 0) {
        floorsData = await fetchFloors();
      }

      const roomsWithImages = await Promise.all(
        roomsData.map(async room => {
          // First try to get the preview image
          let previewUrl = null;
          let hasPreview = false;

          try {
            previewUrl = await api.getRoomPreview(room.id_rooms);
            console.log(`Preview URL for room ${room.id_rooms}:`, previewUrl);
            // If we got a valid URL back, set hasPreview to true
            hasPreview = !!previewUrl;
          } catch (error) {
            // Just silently continue if preview fetch fails
            console.log(`No preview found for room ${room.id_rooms}`);
          }

          // If no preview, fall back to the panoramic image
          let imageUrl = null;
          if (!previewUrl) {
            try {
              const pictures = await api.getPicturesByRoomId(room.id_rooms);
              if (pictures.length > 0) {
                imageUrl = await api.getImage(pictures[0].id_pictures);
              }
            } catch (error) {
              console.log(`Error fetching panoramic image for room ${room.id_rooms}:`, error);
            }
          } else {
            imageUrl = previewUrl;
          }

          // Find the building name that corresponds to the plan floors id that contains the id_buildings
          const floor = floorsData.find(f => f.id_floors === room.id_floors);
          const building = buildingsData.find(b => b.id_buildings === floor.id_buildings);
          const building_name = building ? building.name : 'Bâtiment inconnu';

          return {
            ...room,
            imageUrl,
            building_name,
            hasPreview
          };
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
      // Modify isLoading sequence to ensure buildings load first, then rooms
      //const fetchBuildingsPromise = fetchBuildings();
      //const fetchFloorsPromise = fetchBuildingsPromise.then(() => fetchFloors());

      // Then fetch rooms
      const fetchRoomsPromise = fetchRooms();

      showLoading([fetchRoomsPromise], 'Chargement des données...', 'Chargement réussi', 'Erreur lors du chargement');

      dataFetchedRef.current = true;
    }
  }, []);

  const handleFilterChange = (selectedOptions, { name }) => {
    console.log('Selected options:', selectedOptions);
    setFilters(prevFilters => ({
      ...prevFilters,
      [name]: selectedOptions.map(option => option.value)
    }));
  };

  const getUniqueOptions = (key) => {
    const uniqueValues = [...new Set(rooms.map(room => room[key]))];
    // Sort values alphabetically
    return uniqueValues
      .sort((a, b) => String(a).localeCompare(String(b), undefined, { numeric: true, sensitivity: 'base' }))
      .map(value => ({ value, label: value }));
  };

  const filteredRooms = rooms.filter(room =>
    (room.name.toLowerCase().includes(searchTerm.toLowerCase()) || room.number.includes(searchTerm)) &&
    (filters.name.length === 0 || filters.name.some(name => room.name.toLowerCase().includes(name.toLowerCase()))) &&
    (filters.number.length === 0 || filters.number.some(number => room.number.includes(number))) &&
    (filters.building.length === 0 || filters.building.some(building => room.building_name.toLowerCase().includes(building.toLowerCase()))) &&
    (filters.id.length === 0 || filters.id.some(id => room.id_rooms.toString().includes(id))) &&
    (filters.floor.length === 0 || filters.floor.some(floor => room.id_floors.toString().includes(floor)))
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
    // For each file, check if it's an image
    files.forEach(file => {
        if (!file.type.startsWith("image/")) {
            alert("Tous les fichiers doivent être des images.");
            e.target.value = ""; // Clear the input
            return;
        }
    });

    setNewRoomData(prevData => ({
      ...prevData,
      images: files
    }));
  };

  const handleNewRoomPreviewChange = (e) => {
    const file = e.target.files[0];
    if (!file.type.startsWith("image/")) {
      alert("Veuillez sélectionner un fichier image valide.");
      e.target.value = ""; // Clear the input
      return;
    }
    setNewRoomData(prevData => ({
      ...prevData,
      previewImage: file
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

    if (!newRoomData.floorId && newRoomData.floorId !== "manual" && newRoomData.floorId !== "0") {
      toast.error('Veuillez sélectionner un étage');
      return;
    }

    if (newRoomData.plan_x === '' || newRoomData.plan_y === '') {
        toast.error('Veuillez placer la salle sur le plan');
        return;
    }

    const formData = new FormData();
    formData.append('number', newRoomData.number);
    formData.append('name', newRoomData.name);

    // Handle the case when building selection is "manual"
    /*if (newRoomData.buildingId === "manual") {
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
    } else {*/
      // Make sure to also include the building name if your API requires it
      formData.append('id_buildings', newRoomData.buildingId);
      formData.append('building_name', newRoomData.building);
      formData.append('floor', newRoomData.floor);
      formData.append('id_floors', newRoomData.floorId);
      formData.append('plan_x', newRoomData.plan_x);
      formData.append('plan_y', newRoomData.plan_y);
    //}
    
    // Add preview image to form data
    if (newRoomData.previewImage) {
      formData.append('previewImage', newRoomData.previewImage);
    }

    // Add images to form data
    newRoomData.images.forEach(image => {
      formData.append('images', image);
    });

    try {
      const createRoomPromise = api.createRoom(formData);
      const fetchRoomsPromise = createRoomPromise.then(async () => {
        await fetchRooms()
        setNewRoomModalOpen(false);
        setNewRoomData({
          number: '',
          name: '',
          building: '',
          buildingId: '',
          floor: '',
          floorId: '',
          images: [],
          previewImage: null,
          plan_x: '',
          plan_y: ''
        });
      });
      showLoading([createRoomPromise, fetchRoomsPromise], 'Ajout de la salle...', 'Salle ajoutée avec succès', 'Erreur lors de l\'ajout de la salle');
    } catch (error) {
      console.error('Error creating plan:', error);
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
      console.error('Error deleting plan:', error);
    }
  }

  const handleEditRoom = async (event, room) => {
    event.stopPropagation();
    event.preventDefault();
    
    // Find the building for this room
    const floor = floors.find(floor => floor.id_floors === room.id_floors);
    const building = buildings.find(b => b.id_buildings === floor?.id_buildings);
    
    setEditRoomData({
      id_rooms: room.id_rooms,
      number: room.number,
      name: room.name,
      building: building?.name || room.building_name,
      buildingId: building?.id_buildings?.toString() || '',
      floor: floors.find(floor => floor.id_floors === room.id_floors)?.name || '',
      floorId: room.id_floors,
      images: [],
      plan_x: room.plan_x,
      plan_y: room.plan_y,
    });
    setEditRoomModalOpen(true);
    setPlanPlacementEditMode(true);
    setFloorPlan(floors.find(floor => floor.id_floors === room.id_floors));
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

  const handleEditRoomPreviewChange = (e) => {
    const file = e.target.files[0];
    if (!file.type.startsWith("image/")) {
        alert("Veuillez sélectionner un fichier image valide.");
        e.target.value = ""; // Clear the input
        return;
    }
    setEditRoomData(prevData => ({
      ...prevData,
      previewImage: file
    }));
  };

  const handleEditRoomSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('id_rooms', editRoomData.id_rooms);
    formData.append('number', editRoomData.number);
    formData.append('name', editRoomData.name);
    formData.append('plan_x', editRoomData.plan_x);
    formData.append('plan_y', editRoomData.plan_y);

    // Use the buildingId directly from editRoomData
    if (!editRoomData.buildingId) {
      toast.error('Veuillez sélectionner un bâtiment');
      return;
    }

    formData.append('id_buildings', editRoomData.buildingId);
    formData.append('id_floors', editRoomData.floorId);

    // Add preview image to form data if it exists
    if (editRoomData.previewImage) {
      formData.append('previewImage', editRoomData.previewImage);
    }

    try {
      const updatePromise = api.updateRoom(formData);
      const fetchRoomsPromise = updatePromise.then(async () => {
        await fetchRooms();
        setEditRoomModalOpen(false);
        setEditRoomData({
          id_rooms: '',
          number: '',
          name: '',
          building: '',
          buildingId: '',
          floor: '',
          floorId: '',
          images: [],
          previewImage: null,
          plan_x: '',
          plan_y: ''
        });
      });
      showLoading([updatePromise, fetchRoomsPromise], 'Modification de la salle...', 'Salle modifiée avec succès', 'Erreur lors de la modification de la salle');
    } catch (error) {
      console.error('Error updating plan:', error);
      toast.error('Erreur lors de la modification de la salle');
    }

    // Remove the try-catch block that's causing the error
    // The plan data will be refreshed by the fetchRooms call above
  };

  const toggleRoomVisibility = async (event, room) => {
    event.stopPropagation();
    event.preventDefault();
    try {
      const updatedRoom = { ...room, hidden: !room.hidden };
      await api.updateRoomVisibility(updatedRoom.id_rooms, updatedRoom.hidden);
      setRooms(prevRooms => prevRooms.map(r => r.id_rooms === room.id_rooms ? updatedRoom : r));
      toast.success(`La salle a été ${updatedRoom.hidden ? 'désactivée' : 'activée'}`);
    } catch (error) {
      console.error('Error toggling plan visibility:', error);
      toast.error('Erreur lors du changement de visibilité de la salle');
    }
  };

  const togglePlanPlacement = () => {
    setShowPlanPlacement(!showPlanPlacement);
    setPlanPlacementEditMode(false);
    setFloorPlan(null);
  }

  return (
    <div className="mx-auto p-3 bg-junia-salmon">
      <div className="flex justify-center">
        <Loader show={isLoading} text={textLoading} />

        
        
        
      </div>

      <div className="flex gap-3 justify-between mb-4">
        <div className="flex gap-4 items-center ">
          <input
          type="text"
          placeholder="Rechercher une salle..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full p-2  research-input bg-white rounded-full" />

        <Select
          isMulti
          name="building"
          options={ buildings.map(building => ({ value: building.name, label: building.name })).sort((a, b) => a.value.localeCompare(b.value))}
          className="basic-multi-select"
          classNamePrefix="select"
          placeholder="Bâtiment"
          isDisabled={buildings.length === 0}
          isSearchable
          menuPlacement="auto"
          menuPosition="fixed"
          styles={customSelectStyles}
          menuPortalTarget={document.body}
          onChange={handleFilterChange}
        />
        <Select
          isMulti
          name="floor"
          options={floors.map(floor => ({ value: floor.id_floors.toString(), label: floor.name })).sort((a, b) => a.value - b.value)}
          className="basic-multi-select"
          styles={customSelectStyles}
          classNamePrefix="select"
          placeholder="Étage"
          isSearchable
          menuPlacement="auto"
          menuPosition="fixed"
          menuPortalTarget={document.body}
          onChange={handleFilterChange}
        />
        <Select
          isMulti
          name="name"
          options={getUniqueOptions('name')}
          className="basic-multi-select"
          classNamePrefix="select"
          placeholder="Nom"
          isSearchable
          styles={customSelectStyles}
          menuPlacement="auto"
          menuPosition="fixed"
          menuPortalTarget={document.body}
          onChange={handleFilterChange}
        />
        <Select
          isMulti
          name="number"
          options={getUniqueOptions('number')}
          className="basic-multi-select flex"
          classNamePrefix="select"
          placeholder="Numéro"
          isSearchable
          styles={customSelectStyles}
          menuPlacement="auto"
          menuPosition="fixed"
          menuPortalTarget={document.body}
          onChange={handleFilterChange}
        />
        <Select
          isMulti
          name="id"
          options={rooms.map(room => ({ value: room.id_rooms.toString(), label: room.id_rooms.toString() })).sort((a, b) => a.value - b.value)}
          className="basic-multi-select"
          classNamePrefix="select"
          placeholder="ID"
          isSearchable
          styles={customSelectStyles}
          menuPlacement="auto"
          menuPosition="fixed"
          menuPortalTarget={document.body}
          onChange={handleFilterChange}
        />
        
        </div>
        <div class="flex gap-4">
          <button
              onClick={() => {
                setNewRoomModalOpen(true);
                setPlanPlacementEditMode(false);
              }}
              className="px-3 py-2 font-title font-bold button-type flex items-center gap-2"
          >
            <FaPlusCircle /> Ajouter une salle
          </button>
          
          <button
              onClick={() => history.push('/admin/tour')}
              className="px-4 py-2  button-type font-title font-bold">
              Parcours
          </button>
          
          <button
              onClick={() => history.push('/admin/building')}
              className="px-4 py-2  button-type font-title font-bold">
              Bâtiments
          </button>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        {filteredRooms.map(room => (
          <div
            key={room.id_rooms}
            className="room-card px-4 py-2 rounded-3xl shadow hover:shadow-lg transition-shadow duration-300 bg-white flex flex-col justify-between"
            onClick={() => handleRoomClick(room.id_rooms)}>

            <div className="mb-2 flex justify-between gap-2 py-2">
              <div className="flex py-2 flex-col justify-between">
                <div>
                  <div className="text-junia-purple font-bold">Salle : </div>
                  <div className="text-junia-orange font-title text-2xl font-semibold"> {room.name} </div>
                </div>
                <div>
                  <div className="text-junia-purple font-bold"> Numéro : </div>
                  <div className="text-junia-orange font-title text-2xl font-semibold"> {room.number} </div>
                </div>
                <div>
                  <div className="text-junia-purple font-bold">Bâtiment : </div>
                  <div className="text-junia-orange font-title text-2xl font-semibold"> {room.building_name} </div>
                </div>
                <div>
                  <div className="text-junia-purple font-bold">Etage : </div>
                  <div className="text-junia-orange font-title text-2xl font-semibold"> {floors.find(floor => floor.id_floors === room.id_floors).name} </div>
                </div>
                <div>
                  <div className="text-junia-purple font-bold">ID Salle: </div>
                  <div className="text-junia-orange font-title text-2xl font-semibold"> {room.id_rooms} </div>
                </div> 
                
                <div
                  className="flex flex-row align-center"
                  onClick={(event) => {
                    event.stopPropagation();  // Prevent click from bubbling up to the parent div
                  }}
                >
                  <div className="text-junia-purple font-bold">Visibilité : </div>
                  <label className="toggle-switch mx-2">
                    <input
                      type="checkbox"
                      checked={!room.hidden}
                      className="sr-only "
                      onChange={() => { }} // Required for React controlled components
                      onClick={(event) => {
                        event.stopPropagation(); // Still needed for the toggle itself
                        toggleRoomVisibility(event, room);
                      }}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
              </div>


              
              {room.imageUrl && (
                <div className="overflow-hidden w-80 rounded flex items-center justify-center">
                  <img src={room.imageUrl} alt={`Preview of ${room.name}`} className="object-cover h-90% rounded-3xl " />
                </div>
              )}
            </div>

            <div className="flex justify-between pb-2">
              <button onClick={(event) => handleEditRoom(event, room)} className="button-type font-title font-bold px-3 py-2 flex items-center gap-2">
                <FaPen /> Modifier
              </button>
              <button onClick={(event) => handleDeleteRoom(event, room.id_rooms)} className="button-type2 font-title font-bold px-3 py-2 flex items-center gap-2">
                <FaTrash /> Supprimer
              </button>
            </div>

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
            <div className="flex justify-between items-center pb-4">
              <div className="text-3xl font-bold font-title text-center">Ajouter une nouvelle salle</div>
              <span className="close items-center" onClick={() => setNewRoomModalOpen(false)}>&times;</span>
            </div>
            <form onSubmit={handleNewRoomSubmit}>
              <div className="flex items-center gap-4">
                <div className="fonts-title text-junia-purple font-bold w-1/3">Numéro de la salle :</div>
                <input
                  type="text"
                  name="number"
                  placeholder="Numéro de salle"
                  value={newRoomData.number}
                  onChange={handleNewRoomChange}
                  className="w-2/3 p-2 border border-junia-orange rounded-md bg-white font-texts"
                  required
                />
              </div>
              
              <div className="flex items-center gap-4">
                <div className="fonts-title text-junia-purple font-bold w-1/3">Nom de la salle :</div>
                <input
                  type="text"
                  name="name"
                  placeholder="Nom de la salle"
                  value={newRoomData.name}
                  onChange={handleNewRoomChange}
                  className="w-2/3 p-2 border border-junia-orange rounded-md bg-white font-texts"
                  required
                />
              </div>
              
              <div className="flex items-center gap-4">
                <div className="fonts-title text-junia-purple font-bold w-1/3">Bâtiment :</div>
                <div className="w-2/3">
                  <Select
                    name="building"
                    options={getBuildingOptions()}
                    className="basic-single-select"
                    classNamePrefix="select"
                    placeholder="Sélectionner un bâtiment"
                    styles={customSelectStyles}
                    menuPlacement="auto"
                    menuPosition="fixed"
                    menuPortalTarget={document.body}
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
                </div>
              </div>

              {newRoomData.showManualBuildingInput && (
                <div className="flex items-center gap-4">
                  <div className="fonts-title text-junia-purple font-bold w-1/3">Nouveau bâtiment :</div>
                  <input
                    type="text"
                    name="manualBuilding"
                    placeholder="Nom du nouveau bâtiment"
                    value={newRoomData.building}
                    onChange={(e) => setNewRoomData(prev => ({ ...prev, building: e.target.value }))}
                    className="w-2/3 p-2 border border-junia-orange rounded-md bg-white font-texts"
                    required
                  />
                </div>
              )}
              
              <div className="flex items-center gap-4">
                <div className="fonts-title text-junia-purple font-bold w-1/3">Etage :</div>
                <div className="w-2/3 flex flex-row gap-4 items-center">
                  <Select
                    name="floor"
                    options={floors.filter(floor => floor.id_buildings === parseInt(newRoomData.buildingId)).map(floor => ({ value: floor.id_floors.toString(), label: floor.name })).sort((a, b) => a.value - b.value)}
                    className="basic-single-select"
                    classNamePrefix="select"
                    placeholder="Sélectionner un étage"
                    styles={customSelectStyles}
                    menuPlacement="auto"
                    menuPosition="fixed"
                    menuPortalTarget={document.body}
                    onChange={(selectedOption) => setNewRoomData(prevData => ({ ...prevData, floor: selectedOption.label, floorId: selectedOption.value }))}
                    required
                  />
                  {newRoomData.floorId && newRoomData.floor && (
                    <button
                      type="button"
                      className="px-4 py-2 button-type flex flex-row gap-2 items-center"
                      onClick={(e) => {
                        setShowPlanPlacement(true);
                        setPlanPlacementEditMode(false);
                        setFloorPlan(floors.find(floor => floor.id_floors === parseInt(newRoomData.floorId)));
                      }}
                    >
                      <TbMapPinPlus /> Placer sur le plan
                    </button>
                    )}

                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <label className="block font-bold text-junia-purple w-1/3">Images panoramiques (360°) :</label>
                <div className="w-2/3">
                  <div className="w-full rounded-md bg-white flex items-center">
                    <input
                      type="file"
                      name="images"
                      accept="image/*"
                      multiple
                      onChange={handleNewRoomImagesChange}
                      className="w-full font-texts"
                      required
                    />
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <label className="block font-bold text-junia-purple w-1/3">Image de prévisualisation :</label>
                <div className="w-2/3">
                  <div className="w-full rounded-md bg-white flex items-center">
                    <input
                      type="file"
                      name="previewImage"
                      accept="image/*"
                      onChange={handleNewRoomPreviewChange}
                      className="w-full font-texts bg-junia-salmon"
                    />
                  </div>
                </div>
              </div>
              
              <button 
                type="submit" 
                className="mt-4 p-2 button-type"
              >
                Ajouter une salle
              </button>
            </form>
          </div>
        </div>
      )}
      
      {editRoomModalOpen && (
        <div className="modal">
          <div className="modal-content">
            <div className="flex justify-between items-center pb-4">
              <div className="text-3xl font-bold font-title text-center">Modifier la salle</div>
              <span className="close items-center" onClick={() => setEditRoomModalOpen(false)}>&times;</span>
            </div>
            <form onSubmit={handleEditRoomSubmit}>
              <div className="flex items-center gap-4">
                <div className="fonts-title text-junia-purple font-bold w-1/3">Numéro de la salle :</div>
                <input
                  type="text"
                  name="number"
                  placeholder="Numéro de salle"
                  value={editRoomData.number}
                  onChange={handleEditRoomChange}
                  className="w-2/3 p-2 border border-junia-orange rounded-md bg-white font-texts"
                  required
                />
              </div>
              
              <div className="flex items-center gap-4">
                <div className="fonts-title text-junia-purple font-bold w-1/3">Nom de la salle :</div>
                <input
                  type="text"
                  name="name"
                  placeholder="Nom de la salle"
                  value={editRoomData.name}
                  onChange={handleEditRoomChange}
                  className="w-2/3 p-2 border border-junia-orange rounded-md bg-white font-texts"
                  required
                />
              </div>
              
              <div className="flex items-center gap-4">
                <div className="fonts-title text-junia-purple font-bold w-1/3">Bâtiment :</div>
                <div className="w-2/3">
                  <Select
                    name="building"
                    options={getBuildingOptions()}
                    className="basic-single-select"
                    classNamePrefix="select"
                    placeholder="Sélectionner un bâtiment"
                    value={editRoomData.buildingId ? { value: editRoomData.buildingId, label: editRoomData.building } : null}
                    styles={customSelectStyles}
                    menuPlacement="auto"
                    menuPosition="fixed"
                    menuPortalTarget={document.body}
                    onChange={(selectedOption) => {
                        setEditRoomData(prevData => ({
                          ...prevData,
                          building: selectedOption.label,
                          buildingId: selectedOption.value,
                          floor: '',
                          floorId: '',
                          plan_x: '',
                          plan_y: ''
                        }))
                    }}
                    required
                  />
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="fonts-title text-junia-purple font-bold w-1/3">Etage :</div>
                <div className="w-2/3 flex flex-row gap-4 items-center">
                  <Select
                    name="floor"
                    options={floors.filter(floor => floor.id_buildings === parseInt(editRoomData.buildingId)).map(floor => ({ value: floor.id_floors.toString(), label: floor.name })).sort((a, b) => a.value - b.value)}
                    className="basic-single-select"
                    classNamePrefix="select"
                    placeholder="Sélectionner un étage"
                    value={editRoomData.floorId ? { value: editRoomData.floorId.toString(), label: editRoomData.floor } : null}
                    styles={customSelectStyles}
                    menuPlacement="auto"
                    menuPosition="fixed"
                    menuPortalTarget={document.body}
                    onChange={(selectedOption) => setEditRoomData(prevData => ({ ...prevData, floor: selectedOption.label, floorId: selectedOption.value }))
                    }
                    required
                  />
                  {editRoomData.floorId && editRoomData.floor && (
                      <button
                          type="button"
                          className="px-4 py-2 button-type flex flex-row gap-2 items-center"
                          onClick={(e) => {
                            setShowPlanPlacement(true);
                            setPlanPlacementEditMode(true);
                            setFloorPlan(floors.find(floor => floor.id_floors === parseInt(editRoomData.floorId)));
                          }}
                      >
                        <TbMapPinPlus /> Placer sur le plan
                      </button>
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <label className="block font-bold text-junia-purple w-1/3">Image de prévisualisation :</label>
                <div className="w-2/3">
                  <div className="w-full rounded-md bg-white flex items-center">
                    <input
                      type="file"
                      name="previewImage"
                      accept="image/*"
                      onChange={handleEditRoomPreviewChange}
                      className="w-full font-texts bg-junia-salmon"
                    />
                  </div>
                </div>
              </div>
              
              <button 
                type="submit"
                className="mt-4 p-2 bg-junia-orange hover:bg-junia-orange-dark rounded-3xl text-white font-bold shadow-md font-title text-center transition flex items-center gap-2 justify-center"
              >
                <FaPen /> Modifier la salle
              </button>
            </form>
          </div>
        </div>
      )}
      <ModalPlanPlacement isOpen={showPlanPlacement} toggle={togglePlanPlacement} setNewRoomData={setNewRoomData} setEditRoomData={setEditRoomData} newRoomData={newRoomData} editRoomData={editRoomData} editMode={planPlacementEditMode} floor={floorPlan}/>
    </div>
  );
};

export default AdminRoom;