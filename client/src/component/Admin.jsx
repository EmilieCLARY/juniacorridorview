import React, { useEffect, useState, useRef } from "react";
import * as api from '../api/AxiosAdmin';
import '../style/Admin.css';
import { Buffer } from 'buffer';
import { toast } from "sonner";
import Panorama360 from './Panorama360';
import AdminTour from './AdminTour'; // Add this line
import { useHistory } from 'react-router-dom'; // Add this line

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
  const [view, setView] = useState('room');
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'ascending' });
  const [newInfospotModalOpen, setNewInfospotModalOpen] = useState(false);
  const [newLinkModalOpen, setNewLinkModalOpen] = useState(false);
  const [selectedRoomId, setSelectedRoomId] = useState(null);
  const [roomPictures, setRoomPictures] = useState([]);
  const [selectedPreviewImage, setSelectedPreviewImage] = useState('');
  const [selectedImageId, setSelectedImageId] = useState('');
  const [selectedPicture, setSelectedPicture] = useState('');
  const [infoPopups, setInfoPopups] = useState([]);
  const [links, setLinks] = useState([]);
  const viewerRef = useRef(null);
  const [posX, setPosX] = useState('');
  const [posY, setPosY] = useState('');
  const [posZ, setPosZ] = useState('');
  const [isSelectingPosition, setIsSelectingPosition] = useState(false);
  const [fromNewRoom, setFromNewRoom] = useState(false);
  const [buildings, setBuildings] = useState([]);
  const [selectedPosition, setSelectedPosition] = useState({ x: '', y: '', z: '' });
  const history = useHistory(); // Add this line

  const loading = useRef(false);

  const showLoading = (promises, textLoading, textSuccess, textError) => {
    return toast.promise(Promise.all(promises), {
        loading: textLoading,
        success: textSuccess,
        error: textError,
    });
  }

  const fetchAllInfos = async () => {
    try {
      console.time('Fetching all infos');

      const [roomsData, buildingsData] = await Promise.all([
        api.getRooms(),
        api.getBuildings()
      ]);

      const roomsInfo = await Promise.all(roomsData.map(async (room) => {
        const pictures = await api.getPicturesByRoomId(room.id_rooms);

        const [picturesWithUrls, infoPopups, links] = await Promise.all([
          Promise.all(pictures.map(async (pic) => ({
            ...pic,
            imageUrl: await api.getImage(pic.id_pictures),
          }))),
          Promise.all(pictures.map((pic) => api.getInfoPopup(pic.id_pictures))),
          Promise.all(pictures.map((pic) => api.getLinks(pic.id_pictures))),
        ]);

        return {
          ...room,
          pictures: picturesWithUrls,
          infoPopups: infoPopups.flat(),
          links: links.flat(),
          numberOfPictures: pictures.length,
          numberOfInfoSpots: infoPopups.reduce((acc, val) => acc + val.length, 0),
          numberOfLinks: links.reduce((acc, val) => acc + val.length, 0),
          building: room.building_name || 'Unknown',
        };
      }));

      setRooms(roomsInfo);
      setBuildings(buildingsData);

      console.timeEnd('Fetching all infos');
    } catch (error) {
      console.error('Error fetching all infos:', error);
    }
  };

  useEffect(() => {
    if (loading.current) return;
    loading.current = true;

    showLoading([fetchAllInfos()], 'Chargement...', 'Chargement des données réussi', 'Erreur lors du chargement des données');
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
    if (infospot.image) {
      const imageUrl = `data:image/jpeg;base64,${Buffer.from(infospot.image).toString('base64')}`;
      setSelectedInfospot(prev => ({ ...prev, imageUrl }));
    }
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

  const handleImageUploadOnChange = async (event) => {
    event.preventDefault();
    const formData = new FormData(event.target);
    formData.append('id_pictures', selectedPictureId);

    const updateImagePromise = api.updateImage(formData);
    const fetchImagePromise = updateImagePromise.then(() => api.getImage(selectedPictureId));

    showLoading([updateImagePromise, fetchImagePromise], 'Mise à jour de l\'image...', 'Image mise à jour avec succès', 'La mise à jour de l\'image a échoué');

    fetchImagePromise.then((imageUrl) => {
      setRooms(prevRooms => prevRooms.map(room => ({
        ...room,
        pictures: room.pictures.map(picture =>
            picture.id_pictures === selectedPictureId ? { ...picture, imageUrl } : picture
        )
      })));
      handleModalClose();
    });
  };


  const handleInfospotUpdate = async (event) => {
    event.preventDefault();
    const formData = new FormData(event.target);
    if (!formData.get('pic')) {
      formData.append('pic', selectedInfospot.image);
    }
    const updateInfospotPromise = api.updateInfospot(formData);
    const updatedInfospotPromise = updateInfospotPromise.then(() => api.getInfoPopup(selectedInfospot.id_pictures));

    showLoading([updateInfospotPromise, updatedInfospotPromise], 'Mise à jour de l\'infobulle...', 'Infobulle mise à jour avec succès', 'La mise à jour de l\'infobulle a échoué');

    updatedInfospotPromise.then((updatedInfospots) => {
      setRooms(prevRooms => prevRooms.map(room => ({
        ...room,
        infoPopups: room.infoPopups.map(infospot =>
            infospot.id_info_popup === selectedInfospot.id_info_popup ? updatedInfospots.find(i => i.id_info_popup === selectedInfospot.id_info_popup) : infospot
        )
      })));
      handleModalClose();
    });
  };

  const handleLinkUpdate = async (event) => {
    event.preventDefault();
    const formData = new FormData(event.target);
    const updateLinkPromise = api.updateLink(formData);
    const fetchLinksPromise = updateLinkPromise.then(() => api.getLinks(selectedLink.id_pictures));

    showLoading([updateLinkPromise, fetchLinksPromise], 'Mise à jour du lien...', 'Lien mis à jour avec succès', 'La mise à jour du lien a échoué');

    fetchLinksPromise.then((links) => {
      setRooms(prevRooms => prevRooms.map(room => ({
        ...room,
        links: room.links.map(link =>
            link.id_links === selectedLink.id_links ? links.find(l => l.id_links === selectedLink.id_links) : link
        )
      })));
      handleModalClose();
    });
  };

  const handleNewRoom = async (event, nextStep = false) => {
    event.preventDefault();
    const form = event.target.closest('form');
    const formData = new FormData(form);

    let roomId;
    const addRoomPromise = api.addRoom(formData).then(id => {
      if (!id) {
        console.error('Failed to add room');
        return Promise.reject('Failed to add room');
      }
      roomId = id;

      const pictures = formData.getAll('pictures');
      const uploadPromises = pictures.map(picture => {
        const pictureFormData = new FormData();
        pictureFormData.append('id_rooms', roomId);
        pictureFormData.append('pic', picture);
        return api.uploadFile(pictureFormData);
      });

      return Promise.all(uploadPromises).then(() => fetchRoomsInfo());
    });

    showLoading([addRoomPromise], 'Ajout de la salle...', 'Salle ajoutée avec succès', 'L\'ajout de la salle a échoué');

    addRoomPromise.then(() => {
      if (nextStep) {
        setFromNewRoom(true); // Set the flag to true
        setNewRoomModalOpen(false); // Close the new room modal
        handleNewLink(roomId);
      } else {
        setNewRoomModalOpen(false);
      }
    });
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
    const picturesPromise = api.getPicturesByRoomId(roomId);
    const picturesWithUrlsPromise = picturesPromise.then(picturesPromise => {
      const picturesWithUrls = Promise.all(picturesPromise.map(async pic => {
        const imageUrl = await api.getImage(pic.id_pictures);
        return {...pic, imageUrl};
      }));
      return picturesWithUrls;
    });

    showLoading([picturesPromise, picturesWithUrlsPromise], 'Chargement des images...', 'Images chargées avec succès', 'Le chargement des images a échoué');

    picturesWithUrlsPromise.then(picturesWithUrlsPromise => {
      setRoomPictures(picturesWithUrlsPromise);
      if (picturesWithUrlsPromise.length > 0) {
        const firstPicture = picturesWithUrlsPromise[0];
        setSelectedPicture(firstPicture.imageUrl);
        setSelectedImageId(firstPicture.id_pictures);
        // Fetch infospots
        const infospotsPromise = api.getInfoPopup(firstPicture.id_pictures);
        // Fetch links
        const linksPromise = api.getLinks(firstPicture.id_pictures);
        showLoading([infospotsPromise, linksPromise], 'Chargement...', 'Chargement des données réussi', 'Erreur lors du chargement des données');
        infospotsPromise.then(infospotsPromise => {
          setInfoPopups(infospotsPromise);
        });
        linksPromise.then(linksPromise => {
          setLinks(linksPromise);
        });
      }
      setNewLinkModalOpen(false); // Close the new link modal
      setNewInfospotModalOpen(true);
    });
  };

  const handleNewInfospotSubmit = async (event) => {
    event.preventDefault();
    const formData = new FormData(event.target);
    const insertInfoPopupPromise = api.insertInfoPopUp(formData);
    const fetchInfospotPromise = insertInfoPopupPromise.then(() => api.getInfoPopup(selectedImageId));
    showLoading([insertInfoPopupPromise, fetchInfospotPromise], 'Ajout de l\'infobulle...', 'Infobulle ajoutée avec succès', 'L\'ajout de l\'infobulle a échoué');
    fetchInfospotPromise.then((infospots) => {
      setRooms(prevRooms => prevRooms.map(room => ({
        ...room,
        infoPopups: room.id_rooms === selectedRoomId ? infospots : room.infoPopups,
        numberOfInfoSpots: room.id_rooms === selectedRoomId ? infospots.length : room.numberOfInfoSpots
      })));
      if (!fromNewRoom) { // Check the flag
        setNewInfospotModalOpen(false);
      }
    });
};

  const handleNewLink = async (roomId) => {
    setSelectedRoomId(roomId);
    const picturesPromise = api.getPicturesByRoomId(roomId);
    const picturesWithUrlsPromise = picturesPromise.then(picturesPromise => {
      const picturesWithUrls = Promise.all(picturesPromise.map(async pic => {
        const imageUrl = await api.getImage(pic.id_pictures);
        return {...pic, imageUrl};
      }));
      return picturesWithUrls;
    });

    showLoading([picturesPromise, picturesWithUrlsPromise], 'Chargement des images...', 'Images chargées avec succès', 'Le chargement des images a échoué');

    picturesWithUrlsPromise.then(picturesWithUrlsPromise => {
      setRoomPictures(picturesWithUrlsPromise);
      if (picturesWithUrlsPromise.length > 0) {
        const firstPicture = picturesWithUrlsPromise[0];
        setSelectedPicture(firstPicture.imageUrl);
        setSelectedImageId(firstPicture.id_pictures);
      }

      // Fetch infospots
      const infospotsPromise = api.getInfoPopup(selectedImageId);
      // Fetch links
      const linksPromise = api.getLinks(selectedImageId);
      showLoading([infospotsPromise, linksPromise], 'Chargement...', 'Chargement des données réussi', 'Erreur lors du chargement des données');
      infospotsPromise.then(infospotsPromise => {
        setInfoPopups(infospotsPromise);
      });
      linksPromise.then(linksPromise => {
        setLinks(linksPromise);
      });
      setNewInfospotModalOpen(false); // Close the new infospot modal
      setNewLinkModalOpen(true);
    });
  };

  const handleNewLinkSubmit = async (event) => {
    event.preventDefault();
    const formData = new FormData(event.target);
    const insertLinkPromise = api.insertLink(formData);
    const fetchLinksPromise = insertLinkPromise.then(() => api.getLinks(selectedImageId));
    showLoading([insertLinkPromise, fetchLinksPromise], 'Ajout du lien...', 'Lien ajouté avec succès', 'L\'ajout du lien a échoué');
    fetchLinksPromise.then((links) => {
      setRooms(prevRooms => prevRooms.map(room => ({
        ...room,
        links: room.id_rooms === selectedRoomId ? links : room.links,
        numberOfLinks: room.id_rooms === selectedRoomId ? links.length : room.numberOfLinks
      })));
      if (!fromNewRoom) { // Check the flag
        setNewLinkModalOpen(false);
      }
    });
};

  const handlePreviewClick = async (imageUrl, pictureId) => {
    setSelectedPreviewImage(imageUrl);
    setSelectedImageId(pictureId || ''); // Modify this line
    setSelectedPicture(imageUrl); // Add this line

    // Retrieve infospots
    const infospotsPromise = api.getInfoPopup(pictureId);
    // Retrieve links
    const linksPromise = api.getLinks(pictureId);

    showLoading([infospotsPromise, linksPromise], 'Chargement...', 'Chargement des données réussi', 'Erreur lors du chargement des données');

    infospotsPromise.then(infospotsPromise => {
      setInfoPopups(infospotsPromise); // Add this line
    });

    linksPromise.then(linksPromise => {
      setLinks(linksPromise); // Add this line
    });
  };

const handlePositionSelect = (position) => {
  console.log("Position received in Admin.jsx:", position); // Debugging line

    setPosX(position.x);
    setPosY(position.y);
    setPosZ(position.z);
    setIsSelectingPosition(false);

};

const handleSelectPositionClick = () => {
  setIsSelectingPosition(true); 
  window.isSelectingPosition = true; // Enable selection mode globally
  window.isFirstClick = true; // Reset the first click flag
};
  

  useEffect(() => {
  }, [newInfospotModalOpen, roomPictures]);

  useEffect(() => {
  }, [newLinkModalOpen, roomPictures]);

  return (
    <div>
      <div className="header">
        <h1>Admin Panel</h1>
        <button onClick={() => setView('room')}>Room Information</button>
        <button onClick={() => history.push('/admin-tour')}>Admin Tour</button> {/* Add this line */}
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
        <AdminTour /> // Add this line
      )}

      {modalOpen && selectedPictureId && (
        <div className="modal">
          <div className="modal-content">
            <span className="close" onClick={handleModalClose}>&times;</span>
            <h2>Change Image</h2>
            <form onSubmit={handleImageUploadOnChange}>
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
                <div>
                {selectedInfospot.imageUrl && (
                  <img src={selectedInfospot.imageUrl} alt="Infospot" />
                )}

                  <input type="file" name="pic" />
                </div>
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
            <form onSubmit={(e) => handleNewRoom(e, false)}>
              <input type="text" name="name" placeholder="Room Name" required />
              <input type="text" name="number" placeholder="Room Number" required />
              <select name="id_buildings" required>
                <option value="">Select Building</option>
                {buildings.map(building => (
                  <option key={building.id_buildings} value={building.id_buildings}>
                    {building.name}
                  </option>
                ))}
              </select>
              <input type="file" name="pictures" multiple />
              <button type="submit">Valider et fermer</button>
              <button type="button" onClick={(e) => handleNewRoom(e, true)}>Valider et Suivant : Liens</button>
            </form>
          </div>
        </div>
      )}

      {newInfospotModalOpen && (
        <div className="modal">
          <div className="modal-content">
            <span className="close" onClick={() => { setNewInfospotModalOpen(false); setFromNewRoom(false); }}>&times;</span>
            <h2>Add New Infospot</h2>
            <div className="modal-body">
              <div className="image-preview-column">
                {roomPictures.map(picture => (
                  <div key={picture.id_pictures} className="image-preview" onClick={() => handlePreviewClick(picture.imageUrl, picture.id_pictures)}>
                    <img src={picture.imageUrl} alt={`Preview of ${picture.id_pictures}`} />
                  </div>
                ))}
              </div>
              <div className="viewer-column panorama-container"> {/* Add panorama-container class */}
                <Panorama360
                  infoPopups={infoPopups}
                  selectedPicture={selectedPicture}
                  links={links}
                  onLinkClick={(id) => handlePreviewClick(api.getImage(id), id)}
                  onPositionSelect={handlePositionSelect}
                />
              </div>
              <div className="form-column">
                <button type="button" onClick={handleSelectPositionClick}>Select Position</button>
                <form onSubmit={handleNewInfospotSubmit}>
                  <input type="hidden" name="id_pictures" value={selectedImageId || ''} />
                  <input type="text" name="posX" placeholder="Position X" value={parseFloat(posX).toFixed(4) || ''} onChange={(e) => setPosX(e.target.value)} required readOnly/>
                  <input type="text" name="posY" placeholder="Position Y" value={parseFloat(posY).toFixed(4) || ''} onChange={(e) => setPosY(e.target.value)} required readOnly/>
                  <input type="text" name="posZ" placeholder="Position Z" value={parseFloat(posZ).toFixed(4) || ''} onChange={(e) => setPosZ(e.target.value)} required readOnly/>
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
            <span className="close" onClick={() => { setNewLinkModalOpen(false); setFromNewRoom(false); }}>&times;</span>
            <h2>Add New Link</h2>
            <div className="modal-body">
              <div className="image-preview-column">
              {roomPictures.map(picture => (
                <div key={picture.id_pictures} className="image-preview" onClick={() => handlePreviewClick(picture.imageUrl, picture.id_pictures)}>
                  <img src={picture.imageUrl} alt={`Preview of ${picture.id_pictures}`} />
                  <p>ID : {picture.id_pictures}</p>
                </div>
              ))}
              </div>
              <div className="viewer-column panorama-container"> {/* Add panorama-container class */}
                <Panorama360
                  infoPopups={infoPopups}
                  selectedPicture={selectedPicture}
                  links={links}
                  onLinkClick={(id) => handlePreviewClick(api.getImage(id), id)}
                  onPositionSelect={isSelectingPosition ? handlePositionSelect : null}
                />
              </div>
              <div className="form-column">
                <button type="button" onClick={handleSelectPositionClick}>Select Position</button>
                <form onSubmit={handleNewLinkSubmit}>
                  <input type="hidden" name="id_pictures" value={selectedImageId || ''} />
                  <input type="text" name="posX" placeholder="Position X" value={parseFloat(posX).toFixed(4) || ''} onChange={(e) => setPosX(e.target.value)} required readOnly/>
                  <input type="text" name="posY" placeholder="Position Y" value={parseFloat(posY).toFixed(4) || ''} onChange={(e) => setPosY(e.target.value)} required readOnly/>
                  <input type="text" name="posZ" placeholder="Position Z" value={parseFloat(posZ).toFixed(4) || ''} onChange={(e) => setPosZ(e.target.value)} required readOnly/>
                  <input type="text" name="id_pictures_destination" placeholder="Picture Destination ID" required/>
                  <button type="submit">Add Link</button>
                </form>
                {fromNewRoom && (
                    <button type="button" onClick={() => handleNewInfospot(selectedRoomId)}>Valider et Suivant : Infospot</button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Admin;
