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
  const history = useHistory();
  const dataFetchedRef = useRef(false);

  const showLoading = (promises, textLoading, textSuccess, textError) => {
    return toast.promise(Promise.all(promises), {
        loading: textLoading,
        success: textSuccess,
        error: textError,
    });
  }

  useEffect(() => {

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
    (filters.name.length === 0 || filters.name.some(name => room.name.toLowerCase().includes(name.toLowerCase()))) &&
    (filters.number.length === 0 || filters.number.some(number => room.number.includes(number))) &&
    (filters.building.length === 0 || filters.building.some(building => room.building_name.toLowerCase().includes(building.toLowerCase()))) &&
    (filters.id.length === 0 || filters.id.some(id => room.id_rooms.toString().includes(id)))
  );

  const handleRoomClick = (id) => {
    history.push(`/admin-room/${id}`);
  };

  return (
    <div className="admin-room-container">
      <input
        type="text"
        placeholder="Rechercher une salle..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="search-bar"
      />
      <div className="filter-tab">
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
      <button onClick={() => history.push('/admin-tour')}>Page d'administration des parcours</button>
      {filteredRooms.map(room => (
        <div key={room.id_rooms} className="room-card" onClick={() => handleRoomClick(room.id_rooms)}>
          <div className="room-details">
            <h3>{room.name}</h3>
            <p>Numéro de salle : {room.number}</p>
            <p>Bâtiment : {room.building_name}</p>
            <p>ID Salle: {room.id_rooms}</p>
          </div>
          {room.imageUrl && (
            <div className="room-image">
              <img src={room.imageUrl} alt={`Preview of ${room.name}`} />
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default AdminRoom;
