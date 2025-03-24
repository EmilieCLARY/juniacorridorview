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
    images: []
  });
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

  
  const fetchRooms = async () => {
    try {
      const roomsData = await api.getRooms();
      const roomsWithImages = await Promise.all(
        roomsData.map(async room => {
          const pictures = await api.getPicturesByRoomId(room.id_rooms);
          const imageUrl = pictures.length > 0 ? await api.getImage(pictures[0].id_pictures) : null;
          return { ...room, imageUrl };
        })
      );
      setRooms(roomsWithImages);
    } catch (error) {
      console.error('Error fetching rooms:', error);
    }
  };

  useEffect(() => {
    if (!dataFetchedRef.current) {
        showLoading([fetchRooms()], 'Chargement des salles...', 'Chargement des salles réussi', 'Erreur lors du chargement des salles');
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

  const handleNewRoomSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('number', newRoomData.number);
    formData.append('name', newRoomData.name);
    const building = rooms.find(room => room.building_name === newRoomData.building);
    formData.append('id_buildings', building.id_buildings);
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
      });
      showLoading([fetchRooms()], 'Ajout de la salle...', 'Salle ajoutée avec succès', 'Erreur lors de l\'ajout de la salle');
    } catch (error) {
      console.error('Error creating room:', error);
    }
  };

  const handleDeleteRoom = async (event, id) => {
    event.stopPropagation();
    event.preventDefault();
    if (!window.confirm('Etes-vous sûr de vouloir supprimer la salle ?')) return;
    console.log(id);
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
                options={getUniqueOptions('building_name')}
                className="basic-single-select"
                classNamePrefix="select"
                placeholder="Sélectionner un bâtiment"
                onChange={(selectedOption) => setNewRoomData(prevData => ({
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
