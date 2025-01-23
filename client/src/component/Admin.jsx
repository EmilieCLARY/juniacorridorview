import React, { useEffect, useState } from "react";
import * as api from '../api/AxiosAdmin';
import '../style/Admin.css';
import { NavLink } from 'react-router-dom';

const Admin = () => {
  const [rooms, setRooms] = useState([]);
  const [expandedRoom, setExpandedRoom] = useState(null);
  const [expandedCategory, setExpandedCategory] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedPictureId, setSelectedPictureId] = useState(null);
  const [selectedInfospot, setSelectedInfospot] = useState(null);
  const [selectedLink, setSelectedLink] = useState(null);
  const [newRoomModalOpen, setNewRoomModalOpen] = useState(false);

  const fetchRoomsInfo = async () => {
    try {
      const roomsData = await api.getRooms();
      const roomsInfo = await Promise.all(roomsData.map(async room => {
        const pictures = await api.getPicturesByRoomId(room.id_rooms);
        const picturesWithUrls = await Promise.all(pictures.map(async pic => {
          const imageUrl = await api.getImage(pic.id_pictures);
          return { ...pic, imageUrl };
        }));
        const infoPopups = await Promise.all(pictures.map(pic => api.getInfoPopup(pic.id_pictures)));
        const links = await Promise.all(pictures.map(pic => api.getLinks(pic.id_pictures)));
        return {
          ...room,
          pictures: picturesWithUrls,
          infoPopups: infoPopups.flat(),
          links: links.flat(),
          numberOfPictures: pictures.length,
          numberOfInfoSpots: infoPopups.flat().length,
          numberOfLinks: links.flat().length,
          building: room.building_name || 'Unknown'
        };
      }));
      setRooms(roomsInfo);
    } catch (error) {
      console.error('Error fetching rooms info:', error);
    }
  };

  useEffect(() => {
    fetchRoomsInfo();
  }, []);

  const toggleExpand = (roomId, category) => {
    if (expandedRoom === roomId && expandedCategory === category) {
      setExpandedRoom(null);
      setExpandedCategory(null);
    } else {
      setExpandedRoom(roomId);
      setExpandedCategory(category);
    }
  };

  const handleChangeImage = (pictureId) => {
    setSelectedPictureId(pictureId);
    setModalOpen(true);
  };

  const handleChangeInfospot = (infospot) => {
    setSelectedInfospot(infospot);
    setModalOpen(true);
  };

  const handleChangeLink = (link) => {
    setSelectedLink(link);
    setModalOpen(true);
  };

  const handleModalClose = () => {
    setModalOpen(false);
    setSelectedPictureId(null);
    setSelectedInfospot(null);
    setSelectedLink(null);
  };

  const handleImageUpload = async (event) => {
    event.preventDefault();
    const formData = new FormData(event.target);
    formData.append('id_pictures', selectedPictureId);
    await api.updateImage(formData);
    handleModalClose();
    fetchRoomsInfo(); // Refresh the rooms info to reflect the updated image
  };

  const handleInfospotUpdate = async (event) => {
    event.preventDefault();
    const formData = new FormData(event.target);
    await api.updateInfospot(formData);
    handleModalClose();
    fetchRoomsInfo(); // Refresh the rooms info to reflect the updated infospot
  };

  const handleLinkUpdate = async (event) => {
    event.preventDefault();
    const formData = new FormData(event.target);
    await api.updateLink(formData);
    handleModalClose();
    fetchRoomsInfo(); // Refresh the rooms info to reflect the updated link
  };

  const handleNewRoom = async (event) => {
    event.preventDefault();
    const formData = new FormData(event.target);
    await api.addRoom(formData);
    setNewRoomModalOpen(false);
    fetchRoomsInfo(); // Refresh the rooms info to reflect the new room
  };

  return (
    <div>
      <div className="header">
        <h1>Rooms Information</h1>
        <button onClick={() => setNewRoomModalOpen(true)}>Add New Room</button>
      </div>
      <table>
        <thead>
          <tr>
            <th>Room ID</th>
            <th>Name</th>
            <th>Number</th>
            <th>Number of Pictures</th>
            <th>Number of Info Spots</th>
            <th>Number of Links</th>
            <th>Building</th>
          </tr>
        </thead>
        <tbody>
          {rooms.map(room => (
            <React.Fragment key={room.id_rooms}>
              <tr>
                <td>{room.id_rooms}</td>
                <td>{room.name}</td>
                <td>{room.number}</td>
                <td>
                  <span onClick={() => toggleExpand(room.id_rooms, 'pictures')}>
                    {room.numberOfPictures} {expandedRoom === room.id_rooms && expandedCategory === 'pictures' ? '▲' : '▼'}
                  </span>
                </td>
                <td>
                  <span onClick={() => toggleExpand(room.id_rooms, 'infoSpots')}>
                    {room.numberOfInfoSpots} {expandedRoom === room.id_rooms && expandedCategory === 'infoSpots' ? '▲' : '▼'}
                  </span>
                </td>
                <td>
                  <span onClick={() => toggleExpand(room.id_rooms, 'links')}>
                    {room.numberOfLinks} {expandedRoom === room.id_rooms && expandedCategory === 'links' ? '▲' : '▼'}
                  </span>
                </td>
                <td>{room.building}</td>
              </tr>
              {expandedRoom === room.id_rooms && expandedCategory === 'pictures' && (
                <tr>
                  <td colSpan="7">
                    <div className="expanded-content">
                      <h4>Pictures</h4>
                      <ul>
                        {room.pictures.map(picture => (
                          <li key={picture.id_pictures}>
                            <div>ID: {picture.id_pictures}</div>
                            <img src={picture.imageUrl} alt={`Preview of ${room.name}`} />
                            <button onClick={() => handleChangeImage(picture.id_pictures)}>Change Image for this Picture</button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </td>
                </tr>
              )}
              {expandedRoom === room.id_rooms && expandedCategory === 'infoSpots' && (
                <tr>
                  <td colSpan="7">
                    <div className="expanded-content">
                      <h4>Info Spots</h4>
                      <ul>
                        {room.infoPopups.map(infoPopup => (
                          <li key={infoPopup.id_info_popup}>
                            <div>ID: {infoPopup.id_info_popup}</div>
                            <div>Picture ID: {infoPopup.id_pictures}</div>
                            <div>Position X: {infoPopup.position_x}</div>
                            <div>Position Y: {infoPopup.position_y}</div>
                            <div>Position Z: {infoPopup.position_z}</div>
                            <div>Title: {infoPopup.title}</div>
                            <div>Text: {infoPopup.text}</div>
                            {infoPopup.image && (
                              <img src={`data:image/jpeg;base64,${Buffer.from(infoPopup.image).toString('base64')}`} alt={`Preview of ${infoPopup.title}`} />
                            )}
                            <button onClick={() => handleChangeInfospot(infoPopup)}>Change Infospot Infos</button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </td>
                </tr>
              )}
              {expandedRoom === room.id_rooms && expandedCategory === 'links' && (
                <tr>
                  <td colSpan="7">
                    <div className="expanded-content">
                      <h4>Links</h4>
                      <ul>
                        {room.links.map(link => (
                          <li key={link.id_links}>
                            <div>ID: {link.id_links}</div>
                            <div>Picture Destination ID: {link.id_pictures_destination}</div>
                            <div>Position X: {link.position_x}</div>
                            <div>Position Y: {link.position_y}</div>
                            <div>Position Z: {link.position_z}</div>
                            <button onClick={() => handleChangeLink(link)}>Change Link Infos</button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </td>
                </tr>
              )}
            </React.Fragment>
          ))}
        </tbody>
      </table>

      {modalOpen && selectedPictureId && (
        <div className="modal">
          <div className="modal-content">
            <span className="close" onClick={handleModalClose}>&times;</span>
            <h2>Change Image</h2>
            <form onSubmit={handleImageUpload}>
              <input type="file" name="pic" required />
              <button type="submit">Upload</button>
            </form>
          </div>
        </div>
      )}

      {modalOpen && selectedInfospot && (
        <div className="modal">
          <div className="modal-content">
            <span className="close" onClick={handleModalClose}>&times;</span>
            <h2>Change Infospot Infos</h2>
            <form onSubmit={handleInfospotUpdate}>
              <input type="hidden" name="id_info_popup" value={selectedInfospot.id_info_popup} />
              <input type="text" name="id_pictures" defaultValue={selectedInfospot.id_pictures} placeholder="Picture ID" required />
              <input type="text" name="posX" defaultValue={selectedInfospot.position_x} placeholder="Position X" required />
              <input type="text" name="posY" defaultValue={selectedInfospot.position_y} placeholder="Position Y" required />
              <input type="text" name="posZ" defaultValue={selectedInfospot.position_z} placeholder="Position Z" required />
              <input type="text" name="title" defaultValue={selectedInfospot.title} placeholder="Title" required />
              <input type="text" name="text" defaultValue={selectedInfospot.text} placeholder="Text" required />
              <input type="file" name="pic" />
              <button type="submit">Update</button>
            </form>
          </div>
        </div>
      )}

      {modalOpen && selectedLink && (
        <div className="modal">
          <div className="modal-content">
            <span className="close" onClick={handleModalClose}>&times;</span>
            <h2>Change Link Infos</h2>
            <form onSubmit={handleLinkUpdate}>
              <input type="hidden" name="id_links" value={selectedLink.id_links} />
              <input type="text" name="id_pictures" defaultValue={selectedLink.id_pictures} placeholder="Picture ID" required />
              <input type="text" name="posX" defaultValue={selectedLink.position_x} placeholder="Position X" required />
              <input type="text" name="posY" defaultValue={selectedLink.position_y} placeholder="Position Y" required />
              <input type="text" name="posZ" defaultValue={selectedLink.position_z} placeholder="Position Z" required />
              <input type="text" name="id_pictures_destination" defaultValue={selectedLink.id_pictures_destination} placeholder="Picture Destination ID" required />
              <button type="submit">Update</button>
            </form>
          </div>
        </div>
      )}

      {newRoomModalOpen && (
        <div className="modal">
          <div className="modal-content">
            <span className="close" onClick={() => setNewRoomModalOpen(false)}>&times;</span>
            <h2>Add New Room</h2>
            <form onSubmit={handleNewRoom}>
              <input type="text" name="name" placeholder="Room Name" required />
              <input type="text" name="number" placeholder="Room Number" required />
              <input type="text" name="id_buildings" placeholder="Building ID" required />
              <button type="submit">Add Room</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Admin;
