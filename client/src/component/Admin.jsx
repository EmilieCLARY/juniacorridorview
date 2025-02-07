import React, { useEffect, useState, useRef } from "react";
import * as api from '../api/AxiosAdmin';
import * as tourApi from '../api/AxiosTour';
import '../style/Admin.css';
import { NavLink } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { Buffer } from 'buffer';
import { Viewer, ImagePanorama, Infospot } from 'panolens';
import * as THREE from 'three';

const Admin = () => {
  Buffer.from = Buffer.from || require('buffer').Buffer;
  const [rooms, setRooms] = useState([]);
  const [expandedRoom, setExpandedRoom] = useState(null);
  const [expandedCategory, setExpandedCategory] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedPictureId, setSelectedPictureId] = useState(null);
  const [selectedInfospot, setSelectedInfospot] = useState(null);
  const [selectedLink, setSelectedLink] = useState(null);
  const [newRoomModalOpen, setNewRoomModalOpen] = useState(false);
  const [newTourModalOpen, setNewTourModalOpen] = useState(false);
  const [view, setView] = useState('room');
  const [tours, setTours] = useState([]);
  const [tourSteps, setTourSteps] = useState({});
  const [editTourModalOpen, setEditTourModalOpen] = useState(false);
  const [selectedTour, setSelectedTour] = useState(null);
  const [newStepCount, setNewStepCount] = useState(0);
  const [newTourSteps, setNewTourSteps] = useState([]);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'ascending' });
  const [newInfospotModalOpen, setNewInfospotModalOpen] = useState(false);
  const [newLinkModalOpen, setNewLinkModalOpen] = useState(false);
  const [selectedRoomId, setSelectedRoomId] = useState(null);
  const [roomPictures, setRoomPictures] = useState([]);
  const [selectedPreviewImage, setSelectedPreviewImage] = useState(null);
  const viewerRef = useRef(null);
  const [viewer, setViewer] = useState(null);
  const [posX, setPosX] = useState('');
  const [posY, setPosY] = useState('');
  const [posZ, setPosZ] = useState('');

  const fetchRoomsInfo = async () => {
    try {
      console.log('Fetching rooms info...');
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

  const fetchRooms = async () => {
    try {
        const roomsData = await api.getRooms();
        setRooms(roomsData);
    } catch (error) {
        console.error('Error fetching rooms:', error);
    }
};

  const fetchToursInfo = async () => {
    try {
      const toursData = await tourApi.getTours();
      setTours(toursData);
      const stepsData = await Promise.all(toursData.map(tour => tourApi.getTourSteps(tour.id_tours)));
      const steps = stepsData.reduce((acc, steps, index) => {
        acc[toursData[index].id_tours] = steps;
        return acc;
      }, {});
      setTourSteps(steps);
    } catch (error) {
      console.error('Error fetching tours info:', error);
    }
  };

  useEffect(() => {
    fetchRooms();
    fetchRoomsInfo();
    fetchToursInfo();
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

  const handleNewTour = async (event) => {
    event.preventDefault();
    const formData = new FormData(event.target);
    const data = Object.fromEntries(formData.entries());
    data.steps = newTourSteps; // Ensure steps are correctly formatted as an array
    await tourApi.createTour(data);
    setNewTourModalOpen(false);
    fetchToursInfo(); // Refresh the tours info to reflect the new tour
  };

  const handleEditTour = async (tour) => {
    setSelectedTour(tour);
    if (!tourSteps[tour.id_tours]) {
        const stepsData = await tourApi.getTourSteps(tour.id_tours);
        setTourSteps(prevSteps => ({
            ...prevSteps,
            [tour.id_tours]: stepsData
        }));
    }
    setEditTourModalOpen(true);
};

const handleEditTourSubmit = async (event) => {
    event.preventDefault();
    const formData = new FormData(event.target);
    const steps = Array.from(formData.entries()).reduce((acc, [key, value]) => {
        const match = key.match(/steps\[(\d+)\]\[(\w+)\]/);
        if (match) {
            const [_, index, field] = match;
            if (!acc[index]) acc[index] = {};
            acc[index][field] = value;
        }
        return acc;
    }, []);
    const title = formData.get('title');
    const description = formData.get('description');
    await tourApi.updateTourSteps({ id_tours: selectedTour.id_tours, steps, title, description });
    setEditTourModalOpen(false);
    setNewStepCount(0);
    fetchToursInfo(); // Refresh the tours info to reflect the updated steps
};

  const handleDeleteTour = async (tourId) => {
    await tourApi.deleteTour(tourId);
    fetchToursInfo(); // Refresh the tours info to reflect the deleted tour
  };

  const handleAddStep = () => {
    setNewStepCount(newStepCount + 1);
  };

  const handleAddNewTourStep = () => {
    setNewTourSteps([...newTourSteps, { id_rooms: '' }]);
  };

  const handleNewTourStepChange = (index, field, value) => {
    const updatedSteps = [...newTourSteps];
    updatedSteps[index][field] = value;
    setNewTourSteps(updatedSteps);
  };

  const openNewTourModal = () => {
    setNewTourSteps([]); // Reset steps
    setNewTourModalOpen(true);
  };

  const onDragEnd = (result) => {
    if (!result.destination) return;

    const reorderedSteps = Array.from(tourSteps[selectedTour.id_tours]);
    const [removed] = reorderedSteps.splice(result.source.index, 1);
    reorderedSteps.splice(result.destination.index, 0, removed);

    setTourSteps(prevSteps => ({
        ...prevSteps,
        [selectedTour.id_tours]: reorderedSteps
    }));
};

  const sortedRooms = React.useMemo(() => {
    let sortableRooms = [...rooms];
    if (sortConfig.key !== null) {
      sortableRooms.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableRooms;
  }, [rooms, sortConfig]);

  const requestSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key) => {
    if (sortConfig.key === key) {
      return sortConfig.direction === 'ascending' ? '▲' : '▼';
    }
    return '⇅';
  };

  const handleNewInfospot = async (roomId) => {
    setSelectedRoomId(roomId);
    const pictures = await api.getPicturesByRoomId(roomId);
    const picturesWithUrls = await Promise.all(pictures.map(async pic => {
      const imageUrl = await api.getImage(pic.id_pictures);
      return { ...pic, imageUrl };
    }));
    setRoomPictures(picturesWithUrls);
    setNewInfospotModalOpen(true);
  };

  const handleNewInfospotSubmit = async (event) => {
    event.preventDefault();
    const formData = new FormData(event.target);
    await api.insertInfoPopUp(formData);
    setNewInfospotModalOpen(false);
    fetchRoomsInfo(); // Refresh the rooms info to reflect the new infospot
  };

  const handleNewLink = async (roomId) => {
    setSelectedRoomId(roomId);
    const pictures = await api.getPicturesByRoomId(roomId);
    const picturesWithUrls = await Promise.all(pictures.map(async pic => {
      const imageUrl = await api.getImage(pic.id_pictures);
      return { ...pic, imageUrl };
    }));
    setRoomPictures(picturesWithUrls);
    setNewLinkModalOpen(true);
  };

  const handleNewLinkSubmit = async (event) => {
    event.preventDefault();
    const formData = new FormData(event.target);
    await api.insertLink(formData);
    setNewLinkModalOpen(false);
    fetchRoomsInfo(); // Refresh the rooms info to reflect the new link
  };

  const handlePreviewClick = async (imageUrl, pictureId) => {
    setSelectedPreviewImage(imageUrl);
    if (viewer) {
      const panorama = new ImagePanorama(imageUrl);

      // Retrieve and add infospots
      const infospots = await api.getInfoPopup(pictureId);
      infospots.forEach(infospot => {
        const position = new THREE.Vector3(infospot.position_x, infospot.position_y, infospot.position_z);
        const spot = new Infospot(350);
        spot.position.copy(position);
        spot.addHoverText(infospot.title);
        panorama.add(spot);
      });

      // Retrieve and add links
      const links = await api.getLinks(pictureId);
      links.forEach(link => {
        const position = new THREE.Vector3(link.position_x, link.position_y, link.position_z);
        const spot = new Infospot(350, '/img/chain.png');
        spot.position.copy(position);
        spot.addHoverText(`Go to panorama ${link.id_pictures_destination}`);
        spot.addEventListener('click', async () => {
          const newImageUrl = await api.getImage(link.id_pictures_destination);
          handlePreviewClick(newImageUrl, link.id_pictures_destination);
        });
        panorama.add(spot);
      });
      viewer.add(panorama);
      viewer.setPanorama(panorama);
    }
  };

  const handlePanoramaClick = (event) => {
    if (!viewer || !viewer.panorama) return;

    const intersects = viewer.raycaster.intersectObject(viewer.panorama, true);
    
    if (intersects.length > 0) {
      const { x, y, z } = intersects[0].point;

      console.log(`Clicked Position: X: ${-x}, Y: ${y}, Z: ${z}`);
      setPosX(-x);
      setPosY(y);
      setPosZ(z);
    }
  };

  useEffect(() => {
    if (viewer) {
      viewer.container.addEventListener('click', handlePanoramaClick);
    }
    return () => {
      if (viewer) {
        viewer.container.removeEventListener('click', handlePanoramaClick);
      }
    };
  }, [viewer]);

  useEffect(() => {
    if (newInfospotModalOpen && !viewer) {
      const viewerInstance = new Viewer({
        container: viewerRef.current,
        autoRotate: false,
        autoRotateSpeed: 0.3,
      });
      setViewer(viewerInstance);
    }
  }, [newInfospotModalOpen]);

  useEffect(() => {
    if (newLinkModalOpen && !viewer) {
      const viewerInstance = new Viewer({
        container: viewerRef.current,
        autoRotate: false,
        autoRotateSpeed: 0.3,
      });
      setViewer(viewerInstance);
    }
  }, [newLinkModalOpen]);

  return (
    <div>
      <div className="header">
        <h1>Admin Panel</h1>
        <button onClick={() => setView('room')}>Room Information</button>
        <button onClick={() => setView('tour')}>Tour Information</button>
      </div>
      {view === 'room' ? (
        <div>
          <button onClick={() => setNewRoomModalOpen(true)}>Add New Room</button>
          <table>
            <thead>
              <tr>
                <th onClick={() => requestSort('id_rooms')}>Room ID {getSortIcon('id_rooms')}</th>
                <th onClick={() => requestSort('name')}>Name {getSortIcon('name')}</th>
                <th onClick={() => requestSort('number')}>Number {getSortIcon('number')}</th>
                <th onClick={() => requestSort('numberOfPictures')}>Number of Pictures {getSortIcon('numberOfPictures')}</th>
                <th onClick={() => requestSort('numberOfInfoSpots')}>Number of Info Spots {getSortIcon('numberOfInfoSpots')}</th>
                <th onClick={() => requestSort('numberOfLinks')}>Number of Links {getSortIcon('numberOfLinks')}</th>
                <th onClick={() => requestSort('building')}>Building {getSortIcon('building')}</th>
              </tr>
            </thead>
            <tbody>
              {sortedRooms.map(room => (
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
                    <td>
                      <button onClick={() => handleNewInfospot(room.id_rooms)}>Add Infospot</button>
                      <button onClick={() => handleNewLink(room.id_rooms)}>Add Link</button>
                    </td>
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
        </div>
      ) : (
        <div>
          <button onClick={openNewTourModal}>Add New Tour</button>
          <h2>Tours</h2>
          {tours.map(tour => (
            <div key={tour.id_tours}>
              <h3>{tour.title}</h3>
              <p>{tour.description}</p>
              <button onClick={() => handleEditTour(tour)}>Edit Tour</button>
              <button onClick={() => handleDeleteTour(tour.id_tours)}>Delete Tour</button>
              <ul>
                {tourSteps[tour.id_tours]?.map(step => (
                  <li key={step.id_tour_steps}>
                    Step {step.step_number}: {step.room_name} ({step.room_number})
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

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

      {newTourModalOpen && (
        <div className="modal">
          <div className="modal-content">
            <span className="close" onClick={() => setNewTourModalOpen(false)}>&times;</span>
            <h2>Add New Tour</h2>
            <form onSubmit={handleNewTour}>
              <input type="text" name="title" placeholder="Tour Title" required />
              <textarea name="description" placeholder="Tour Description" required></textarea>
              <DragDropContext onDragEnd={onDragEnd}>
                <Droppable droppableId="steps">
                  {(provided) => (
                    <div {...provided.droppableProps} ref={provided.innerRef}>
                      {newTourSteps.map((step, index) => (
                        <Draggable key={index} draggableId={`step-${index}`} index={index}>
                          {(provided) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className="draggable-step"
                            >
                              <h4>Step {index + 1}</h4>
                              <select
                                name={`steps[${index}][id_rooms]`}
                                value={step.id_rooms}
                                onChange={(e) => handleNewTourStepChange(index, 'id_rooms', e.target.value)}
                                required
                              >
                                <option value="">Select Room</option>
                                {rooms.map(room => (
                                    <option key={room.id_rooms} value={room.id_rooms}>
                                        {room.name} ({room.number})
                                    </option>
                                ))}
                              </select>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </DragDropContext>
              <button type="button" onClick={handleAddNewTourStep}>Add Step</button>
              <button type="submit">Add Tour</button>
            </form>
          </div>
        </div>
      )}

      {editTourModalOpen && selectedTour && (
        <div className="modal">
          <div className="modal-content">
            <span className="close" onClick={() => setEditTourModalOpen(false)}>&times;</span>
            <h2>Edit Tour</h2>
            <form onSubmit={handleEditTourSubmit}>
                <input type="hidden" name="id_tours" value={selectedTour.id_tours} />
                <input type="text" name="title" defaultValue={selectedTour.title} placeholder="Tour Title" required />
                <textarea name="description" defaultValue={selectedTour.description} placeholder="Tour Description" required></textarea>
                <DragDropContext onDragEnd={onDragEnd}>
                    <Droppable droppableId="steps">
                        {(provided) => (
                            <div {...provided.droppableProps} ref={provided.innerRef}>
                                {tourSteps[selectedTour.id_tours]?.map((step, index) => (
                                    <Draggable key={step.id_tour_steps} draggableId={`step-${step.id_tour_steps}`} index={index}>
                                        {(provided) => (
                                            <div
                                                ref={provided.innerRef}
                                                {...provided.draggableProps}
                                                {...provided.dragHandleProps}
                                                className="draggable-step"
                                            >
                                                <span className="drag-icon">☰</span>
                                                <h4>Step {index + 1}</h4>
                                                <input type="hidden" name={`steps[${index}][id_tour_steps]`} value={step.id_tour_steps} />
                                                <select
                                                    name={`steps[${index}][id_rooms]`}
                                                    defaultValue={step.id_rooms}
                                                    required
                                                >
                                                    <option value="">Select Room</option>
                                                    {rooms.map(room => (
                                                        <option key={room.id_rooms} value={room.id_rooms}>
                                                            {room.name} ({room.number})
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                        )}
                                    </Draggable>
                                ))}
                                {[...Array(newStepCount)].map((_, index) => (
                                    <Draggable key={`new_${index}`} draggableId={`new-step-${index}`} index={index}>
                                        {(provided) => (
                                            <div
                                                ref={provided.innerRef}
                                                {...provided.draggableProps}
                                                {...provided.dragHandleProps}
                                                className="draggable-step"
                                            >
                                                <span className="drag-icon">☰</span>
                                                <h4>New Step {tourSteps[selectedTour.id_tours]?.length + index + 1}</h4>
                                                <input type="hidden" name={`steps[${tourSteps[selectedTour.id_tours]?.length + index}][id_tour_steps]`} value={`new_${index}`} />
                                                <select
                                                    name={`steps[${tourSteps[selectedTour.id_tours]?.length + index}][id_rooms]`}
                                                    required
                                                >
                                                    <option value="">Select Room</option>
                                                    {rooms.map(room => (
                                                        <option key={room.id_rooms} value={room.id_rooms}>
                                                            {room.name} ({room.number})
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                        )}
                                    </Draggable>
                                ))}
                                {provided.placeholder}
                            </div>
                        )}
                    </Droppable>
                </DragDropContext>
                <button type="button" onClick={handleAddStep}>Add Step</button>
                <button type="submit">Update Tour</button>
            </form>
          </div>
        </div>
      )}

      {newInfospotModalOpen && (
        <div className="modal">
          <div className="modal-content">
            <span className="close" onClick={() => setNewInfospotModalOpen(false)}>&times;</span>
            <h2>Add New Infospot</h2>
            <div className="modal-body">
              <div className="image-preview-column">
                {roomPictures.map(picture => (
                  <div key={picture.id_pictures} className="image-preview" onClick={() => handlePreviewClick(picture.imageUrl, picture.id_pictures)}>
                    <img src={picture.imageUrl} alt={`Preview of ${picture.id_pictures}`} />
                  </div>
                ))}
              </div>
              <div className="viewer-column">
                <div ref={viewerRef} className="panorama-viewer"></div>
              </div>
              <div className="form-column">
                <form onSubmit={handleNewInfospotSubmit}>
                  <input type="hidden" name="id_pictures" value={selectedRoomId} />
                  <input type="text" name="posX" placeholder="Position X" value={Math.round(posX)} onChange={(e) => setPosX(e.target.value)} required />
                  <input type="text" name="posY" placeholder="Position Y" value={Math.round(posY)} onChange={(e) => setPosY(e.target.value)} required />
                  <input type="text" name="posZ" placeholder="Position Z" value={Math.round(posZ)} onChange={(e) => setPosZ(e.target.value)} required />
                  <input type="text" name="text" placeholder="Text" required />
                  <input type="text" name="title" placeholder="Title" required />
                  <input type="file" name="pic" />
                  <button type="submit">Add Infospot</button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {newLinkModalOpen && (
        <div className="modal">
          <div className="modal-content">
            <span className="close" onClick={() => setNewLinkModalOpen(false)}>&times;</span>
            <h2>Add New Link</h2>
            <div className="modal-body">
              <div className="image-preview-column">
                {roomPictures.map(picture => (
                  <div key={picture.id_pictures} className="image-preview" onClick={() => handlePreviewClick(picture.imageUrl, picture.id_pictures)}>
                    <img src={picture.imageUrl} alt={`Preview of ${picture.id_pictures}`} />
                  </div>
                ))}
              </div>
              <div className="viewer-column">
                <div ref={viewerRef} className="panorama-viewer"></div>
              </div>
              <div className="form-column">
                <form onSubmit={handleNewLinkSubmit}>
                  <input type="hidden" name="id_pictures" value={selectedRoomId} />
                  <input type="text" name="posX" placeholder="Position X" value={Math.round(posX)} onChange={(e) => setPosX(e.target.value)} required />
                  <input type="text" name="posY" placeholder="Position Y" value={Math.round(posY)} onChange={(e) => setPosY(e.target.value)} required />
                  <input type="text" name="posZ" placeholder="Position Z" value={Math.round(posZ)} onChange={(e) => setPosZ(e.target.value)} required />
                  <input type="text" name="id_pictures_destination" placeholder="Picture Destination ID" required />
                  <button type="submit">Add Link</button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Admin;
