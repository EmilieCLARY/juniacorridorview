import React, { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import * as api from '../api/AxiosAdminRoom';
import Panorama360 from './Panorama360';
import '../style/AdminRoomDetails.css';
import { Buffer } from 'buffer';
import { toast } from "sonner";

const AdminRoomDetails = () => {
  const { id } = useParams();
  const [pictures, setPictures] = useState([]);
  const [selectedPicture, setSelectedPicture] = useState('');
  const [infoPopups, setInfoPopups] = useState([]);
  const [links, setLinks] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAllInfospots, setShowAllInfospots] = useState(true);
  const [allInfoPopups, setAllInfoPopups] = useState([]);
  const [searchLinkTerm, setSearchLinkTerm] = useState('');
  const [showAllLinks, setShowAllLinks] = useState(true);
  const [allLinks, setAllLinks] = useState([]);
  const [newInfospotModalOpen, setNewInfospotModalOpen] = useState(false);
  const [newLinkModalOpen, setNewLinkModalOpen] = useState(false);
  const [posX, setPosX] = useState('');
  const [posY, setPosY] = useState('');
  const [posZ, setPosZ] = useState('');
  const [isSelectingPosition, setIsSelectingPosition] = useState(false);
  const [selectedImageId, setSelectedImageId] = useState('');
  const [roomName, setRoomName] = useState('');
  const dataFetchedRef = useRef(false);
  const firstLoad = useRef(true);
  const [linkToEdit, setLinkToEdit] = useState(null);
  const [editLinkMod, setEditLinkMod] = useState(false);
  const [infospotToEdit, setInfospotToEdit] = useState(null);
  const [editInfospotMod, setEditInfospotMod] = useState(false);

  // Separate state for modal panorama
  const [modalSelectedPicture, setModalSelectedPicture] = useState('');
  const [modalInfoPopups, setModalInfoPopups] = useState([]);
  const [modalLinks, setModalLinks] = useState([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingModal, setIsLoadingModal] = useState(true);
  const [disableBackgroundClick, setDisableBackgroundClick] = useState(false);

  const showLoading = (promises, textLoading, textSuccess, textError) => {
    return toast.promise(Promise.all(promises), {
        loading: textLoading,
        success: textSuccess,
        error: textError,
    });
  }

  const fetchAllData = async () => {
    try {
      const roomData = await api.getRoomDetails(id);
      setRoomName(roomData.name);

      const picturesData = await api.getPicturesByRoomId(id);
      const picturesWithUrls = await Promise.all(
        picturesData.map(async (pic) => ({
          ...pic,
          imageUrl: await api.getImage(pic.id_pictures),
        }))
      );
      setPictures(picturesWithUrls);
      if (picturesWithUrls.length > 0) {
        const firstPicture = picturesWithUrls[0];
        setSelectedPicture(firstPicture.imageUrl);
        
        handlePictureClick(firstPicture.imageUrl, firstPicture.id_pictures);
      }
      const allInfoPopups = await Promise.all(
        picturesData.map(async (pic) => await api.getInfoPopup(pic.id_pictures))
      );
      setAllInfoPopups(allInfoPopups.flat());

      const allLinks = await Promise.all(
        picturesData.map(async (pic) => await api.getLinks(pic.id_pictures))
      );
      setAllLinks(allLinks.flat());
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  useEffect(() => {
    if (!dataFetchedRef.current) {
      const fetchAllDataPromise = fetchAllData();
      showLoading([fetchAllDataPromise], 'Chargement des détails de la pièce...', 'Chargement des détails réussi', 'Erreur lors du chargement des détails');
      fetchAllDataPromise.then(() => {
        setIsLoading(false);
        firstLoad.current = false;
      });
      dataFetchedRef.current = true;
    }
  }, [id]);

  const handlePictureClick = async (imageUrl, pictureId) => {
    setIsLoading(true);
    const getInfoPopupPromise = getInfoPopup(pictureId);
    const getLinksPromise = getLinks(pictureId);
    if(!firstLoad.current) {
      showLoading([getInfoPopupPromise, getLinksPromise], 'Chargement des détails de la pièce...', 'Chargement des détails réussi', 'Erreur lors du chargement des détails');
    }
    Promise.all([getInfoPopupPromise,getLinksPromise]).then(() => {
    setSelectedPicture(imageUrl);
    setIsLoading(false);
    });
  };

  const getInfoPopup = async (id_pictures) => {
    const infoPopups = await api.getInfoPopup(id_pictures);
    setInfoPopups(infoPopups);
    return infoPopups;
  };

  const getLinks = async (id_pictures) => {
    const links = await api.getLinks(id_pictures);
    setLinks(links);
    return links;
  }

  const handleLinkClick = async (pictureId) => {
    const imageUrl = pictures.find(pic => pic.id_pictures === pictureId).imageUrl;
    handlePictureClick(imageUrl, pictureId);
  };

  const filteredInfoPopups = infoPopups.filter(popup =>
    popup.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredLinks = links.filter(link =>
    link.id_pictures_destination.toString().includes(searchLinkTerm)
  );

  const displayedInfoPopups = showAllInfospots 
    ? allInfoPopups.filter(popup => popup.title.toLowerCase().includes(searchTerm.toLowerCase()))
    : filteredInfoPopups;

  const displayedLinks = showAllLinks 
    ? allLinks.filter(link => link.id_pictures_destination.toString().includes(searchLinkTerm))
    : filteredLinks;

  const handleNewInfospotSubmit = async (event) => {
    event.preventDefault();
    const formData = new FormData(event.target);
    // If input file is empty, alert the user
    if (formData.get('pic').size === 0) {
        alert('Veuillez sélectionner une image pour l\'infobulle');
        return;
    }

    await api.insertInfoPopUp(formData);
    
    // Mettre à jour les infopopups pour l'image sélectionnée
    const updatedInfoPopups = await getInfoPopup(selectedImageId);
    setInfoPopups(updatedInfoPopups);
    
    // Mettre à jour tous les infopopups
    const allImageInfoPopups = await Promise.all(
      pictures.map(async (pic) => await api.getInfoPopup(pic.id_pictures))
    );
    setAllInfoPopups(allImageInfoPopups.flat());
    
    // Forcer le rechargement du panorama en réinitialisant temporairement l'état
    if (selectedPicture) {
      const currentImage = selectedPicture;
      const currentId = selectedImageId;
      setSelectedPicture('');
      setIsLoading(true);
      
      // Utiliser setTimeout pour permettre au DOM de se mettre à jour
      setTimeout(() => {
        handlePictureClick(currentImage, currentId);
      }, 100);
    }
    
    setNewInfospotModalOpen(false);
    setDisableBackgroundClick(false);
  };

  const handleNewLinkSubmit = async (event) => {
    event.preventDefault();
    const formData = new FormData(event.target);
    await api.insertLink(formData);
    const updatedLinks = await getLinks(selectedImageId);
    setLinks(updatedLinks);

    // Mettre à jour tous les liens
    const allImageLinks = await Promise.all(
      pictures.map(async (pic) => await api.getLinks(pic.id_pictures))
    );
    setAllLinks(allImageLinks.flat());

    // Forcer le rechargement du panorama en réinitialisant temporairement l'état
    if (selectedPicture) {
      const currentImage = selectedPicture;
      const currentId = selectedImageId;
      setSelectedPicture('');
      setIsLoading(true);
      
      // Utiliser setTimeout pour permettre au DOM de se mettre à jour
      setTimeout(() => {
        handlePictureClick(currentImage, currentId);
      }, 100);
    }

    setNewLinkModalOpen(false);
    setDisableBackgroundClick(false);
  };

  const handlePositionSelect = (position) => {
    setPosX(position.x);
    setPosY(position.y);
    setPosZ(position.z);
    setIsSelectingPosition(false);
  };

  const handleModalInfopopup = () => {
    console.log('Opening new infospot modal');
    setNewInfospotModalOpen(true);
    setDisableBackgroundClick(true);
    
    // Automatically select and display the first image in the panorama
    if (pictures.length > 0) {
      const firstPicture = pictures[0];
      setIsLoadingModal(true);
      setModalSelectedPicture(firstPicture.imageUrl);
      setSelectedImageId(firstPicture.id_pictures);
      
      // Load info popups and links for the first image
      const infospotsPromise = getInfoPopup(firstPicture.id_pictures);
      const linksPromise = getLinks(firstPicture.id_pictures);
      
      infospotsPromise.then((infospots) => {
        setModalInfoPopups(infospots);
      });
      
      linksPromise.then((links) => {
        setModalLinks(links);
      });
      
      Promise.all([infospotsPromise, linksPromise]).then(() => {
        setIsLoadingModal(false);
      });
    }
  }

  const closeModalInfospot = () => {
    setNewInfospotModalOpen(false);
    setDisableBackgroundClick(false);
    setEditInfospotMod(false);
    setInfospotToEdit(null);
    setPosX('');
    setPosY('');
    setPosZ('');
  }

  const handleModalLink = () => {
    setNewLinkModalOpen(true)
    setDisableBackgroundClick(true);

    // Automatically select and display the first image in the panorama
    if (pictures.length > 0) {
      const firstPicture = pictures[0];
      setIsLoadingModal(true);
      setModalSelectedPicture(firstPicture.imageUrl);
      setSelectedImageId(firstPicture.id_pictures);
      
      // Load info popups and links for the first image
      const infospotsPromise = getInfoPopup(firstPicture.id_pictures);
      const linksPromise = getLinks(firstPicture.id_pictures);
      
      infospotsPromise.then((infospots) => {
        setModalInfoPopups(infospots);
      });
      
      linksPromise.then((links) => {
        setModalLinks(links);
      });
      
      Promise.all([infospotsPromise, linksPromise]).then(() => {
        setIsLoadingModal(false);
      });
    }
  }

  const closeModalLink = () => {
    setNewLinkModalOpen(false);
    setDisableBackgroundClick(false);
    setEditLinkMod(false);
    setLinkToEdit(null);
    setPosX('');
    setPosY('');
    setPosZ('');
  }

  const handleSelectPositionClick = (e) => {
    setIsSelectingPosition(true);
    window.isSelectingPosition = true;
    window.isFirstClick = true;
  };

  const handleModalPictureClick = async (imageUrl, pictureId) => {
    setIsLoadingModal(true);
    setModalSelectedPicture(imageUrl);
    setSelectedImageId(pictureId);
    const infospotsPromise = getInfoPopup(pictureId);
    const linksPromise = getLinks(pictureId);
    showLoading([infospotsPromise, linksPromise], 'Chargement des détails de la pièce...', 'Chargement des détails réussi', 'Erreur lors du chargement des détails');
    infospotsPromise.then((infospots) => {
        setModalInfoPopups(infospots);
    });
    linksPromise.then((links) => {
        setModalLinks(links);
    });
    Promise.all([infospotsPromise, linksPromise]).then(() => {
      setIsLoadingModal(false);
    });
  };

  const handleDeleteInfoPopup = async (event, id) => {
    event.stopPropagation();
    event.preventDefault();
    if (!window.confirm('Etes-vous sûr de vouloir supprimer l\'infobulle ?')) return;
    try {
        const deletePromise = api.deleteInfospot(id);
        deletePromise.then(() => {
            const updatedInfoPopups = infoPopups.filter(popup => popup.id_info_popup !== id);
            setInfoPopups(updatedInfoPopups);
            const updatedAllInfoPopups = allInfoPopups.filter(popup => popup.id_info_popup !== id);
            setAllInfoPopups(updatedAllInfoPopups);
            toast.success('Infobulle supprimée');
        });
    } catch (error) {
        console.error('Error deleting infopopup:', error);
    }
  }

  const handleEditInfoPopup = async (event, popup) => {
    console.log('Editing infopopup', popup);
    setDisableBackgroundClick(true);
    setInfospotToEdit(popup);
    setEditInfospotMod(true);
    setPosX(popup.position_x);
    setPosY(popup.position_y);
    setPosZ(popup.position_z);
    // Display the image of current picture containing the infopopup
    const imageUrl = pictures.find(pic => pic.id_pictures === popup.id_pictures).imageUrl;
    handleModalPictureClick(imageUrl, popup.id_pictures);
    setNewInfospotModalOpen(true);
  }

  const handleEditInfospotSubmit = async (event) => {
    event.preventDefault();
    const formData = new FormData(event.target);
    // If input file is empty, delete the image from the form data
    if (formData.get('pic').size === 0) {
        formData.delete('pic');
    }
    formData.append('id_info_popup', infospotToEdit.id_info_popup);
    await api.updateInfospot(formData);
    const updatedInfoPopups = await getInfoPopup(selectedImageId);
    setInfoPopups(updatedInfoPopups);
    const allImageInfoPopups = await Promise.all(
        pictures.map(async (pic) => await api.getInfoPopup(pic.id_pictures))
    );
    setAllInfoPopups(allImageInfoPopups.flat());
    if (selectedPicture) {
        const currentImage = selectedPicture;
        const currentId = selectedImageId;
        setSelectedPicture('');
        setIsLoading(true);
        setTimeout(() => {
            handlePictureClick(currentImage, currentId);
        }, 100);
    }
    setNewInfospotModalOpen(false);
    setDisableBackgroundClick(false);
    setEditInfospotMod(false);
  }

  const handleDeleteLink = async (event, id) => {
    event.stopPropagation();
    event.preventDefault();
    if (!window.confirm('Etes-vous sûr de vouloir supprimer le lien ?')) return;
    try {
      const deletePromise = api.deleteLink(id);
      deletePromise.then(() => {
        const updatedLinks = links.filter(link => link.id_links !== id);
        setLinks(updatedLinks);
        const updatedAllLinks = allLinks.filter(link => link.id_links !== id);
        setAllLinks(updatedAllLinks);
        toast.success('Lien supprimé');
      });
    } catch (error) {
        console.error('Error deleting link:', error);
    }
  }

  const handleEditLink = async (event, link) => {
    console.log('Editing link', link);
    setDisableBackgroundClick(true);
    setLinkToEdit(link);
    setEditLinkMod(true);
    // Display the image of current link
    const imageUrl = pictures.find(pic => pic.id_pictures === link.id_pictures).imageUrl;
    handleModalPictureClick(imageUrl, link.id_pictures);
    setNewLinkModalOpen(true);
  }

  const handleEditLinkSubmit = async (event) => {
    event.preventDefault();
    const formData = new FormData(event.target);
    formData.append('id_links', linkToEdit.id_links);
    await api.updateLink(formData);
    const updatedLinks = await getLinks(selectedImageId);
    setLinks(updatedLinks);
    const allImageLinks = await Promise.all(
      pictures.map(async (pic) => await api.getLinks(pic.id_pictures))
    );
    setAllLinks(allImageLinks.flat());
    if (selectedPicture) {
      const currentImage = selectedPicture;
      const currentId = selectedImageId;
      setSelectedPicture('');
      setIsLoading(true);
      setTimeout(() => {
        handlePictureClick(currentImage, currentId);
      }, 100);
    }
    setNewLinkModalOpen(false);
    setDisableBackgroundClick(false);
    setEditLinkMod(false);
  }

  return (
    <div className="admin-room-details-container">
      <h1>{roomName}</h1>
      <div className="image-panorama-container">
        <div className="image-list">
          {pictures.map(picture => (
            <div key={picture.id_pictures}>
              <p>ID : {picture.id_pictures}</p>
              <img
                src={picture.imageUrl}
                alt={`Aperçu de ${picture.id_pictures}`}
                onClick={() => handlePictureClick(picture.imageUrl, picture.id_pictures)}
                className="thumbnail"
              />
            </div>
          ))}
        </div>
        <div className={`panorama-viewer ${newInfospotModalOpen || newLinkModalOpen ? 'disabled' : ''}`}>
          {selectedPicture && (
            <Panorama360
              infoPopups={infoPopups}
              selectedPicture={selectedPicture}
              links={links}
              onLinkClick={handleLinkClick}
              onPositionSelect={() => {}}
              isLoading={isLoading}
              disableClick={disableBackgroundClick}
            />
          )}
        </div>
      </div>
      <div className="section-header">
        <h2 className="">Infobulles</h2>
        <button onClick={handleModalInfopopup}>Ajouter une infobulle</button>
      </div>
      <div className="search-container">
        <input
          type="text"
          placeholder="Recherche par titre"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-bar"
        />
        <label className="toggle-switch">
          <input
            type="checkbox"
            checked={showAllInfospots}
            onChange={() => setShowAllInfospots(!showAllInfospots)}
          />
          <span className="slider"></span>
        </label>
        <span>{showAllInfospots ? "Toutes les infobulles" : "Infobulles de l'image affichée"}</span>
      </div>
      <div className="infospots-container">
        {displayedInfoPopups.map((popup) => (
          <div key={popup.id_info_popup} className="infospot-card">
            <div className="infospot-details">
              <h3>Titre : {popup.title}</h3>
              <p>Description : {popup.text}</p>
              <p>ID du panorama : {popup.id_pictures}</p>
            </div>
            {popup.image && (
              <div className="infospot-image">
                <img src={`data:image/jpeg;base64,${Buffer.from(popup.image).toString('base64')}`} alt={`Aperçu de ${popup.title}`} />
              </div>
            )}
            <button onClick={(event) => handleDeleteInfoPopup(event, popup.id_info_popup)} className="bg-red-500 text-white px-4 py-2 rounded mr-2">Supprimer</button>
            <button onClick={(event) => handleEditInfoPopup(event, popup)} className="bg-red-500 text-white px-4 py-2 rounded">Modifier</button>
          </div>
        ))}
      </div>
      <div className="section-header">
        <h2>Liens</h2>
        <button onClick={handleModalLink}>Ajouter un lien</button>
      </div>
      <div className="search-container">
        <input
          type="text"
          placeholder="Recherche par ID de destination"
          value={searchLinkTerm}
          onChange={(e) => setSearchLinkTerm(e.target.value)}
          className="search-bar"
        />
        <label className="toggle-switch">
          <input
            type="checkbox"
            checked={showAllLinks}
            onChange={() => setShowAllLinks(!showAllLinks)}
          />
          <span className="slider"></span>
        </label>
        <span>{showAllLinks ? "Tous les liens" : "Liens de l'image affichée"}</span>
      </div>
      <div className="links-container">
        {displayedLinks.map((link) => (
          <div key={link.id_links} className="link-card">
            <div className="link-details">
              <h3>ID : {link.id_links}</h3>
              <p>Destination ID : {link.id_pictures_destination}</p>
            </div>
            <div className="link-image">
              <img src={pictures.find(pic => pic.id_pictures === link.id_pictures_destination)?.imageUrl} alt={`Destination ${link.id_pictures_destination}`} />
            </div>
            <button onClick={(event) => handleDeleteLink(event, link.id_links)} className="bg-red-500 text-white px-4 py-2 rounded mr-2">Supprimer</button>
            <button onClick={(event) => handleEditLink(event, link)} className="bg-red-500 text-white px-4 py-2 rounded">Modifier</button>
          </div>
        ))}
      </div>

      {newInfospotModalOpen && (
        <div className="modal">
          <div className="modal-content">
            <span className="close" onClick={closeModalInfospot}>&times;</span>
            <h2>{editInfospotMod ? 'Modifier l\'infobulle' : 'Ajouter une nouvelle infobulle'}</h2>
            <div className="modal-body">
              {!editInfospotMod && (
                <div className="image-preview-column">
                  {pictures.map(picture => (
                    <div key={picture.id_pictures} className="image-preview" onClick={() => handleModalPictureClick(picture.imageUrl, picture.id_pictures)}>
                      <img src={picture.imageUrl} alt={`Aperçu de ${picture.id_pictures}`} />
                    </div>
                  ))}
                </div>
              )}
              <div className="viewer-column panorama-container">
                <Panorama360
                  infoPopups={modalInfoPopups}
                  selectedPicture={modalSelectedPicture}
                  links={modalLinks}
                  onLinkClick={() => {}}
                  onPositionSelect={handlePositionSelect}
                  isLoading={isLoadingModal}
                />
              </div>
              <div className="form-column">
                <button type="button" onClick={( event ) => handleSelectPositionClick(event)}>Positionner</button>
                <form onSubmit={editInfospotMod ? handleEditInfospotSubmit : handleNewInfospotSubmit}>
                  <input type="hidden" name="id_pictures" value={selectedImageId || ''} />
                  <input type="text" name="posX" placeholder="Position X" value={parseFloat(posX).toFixed(4) || ''} onChange={(e) => setPosX(e.target.value)} required readOnly />
                  <input type="text" name="posY" placeholder="Position Y" value={parseFloat(posY).toFixed(4) || ''} onChange={(e) => setPosY(e.target.value)} required readOnly />
                  <input type="text" name="posZ" placeholder="Position Z" value={parseFloat(posZ).toFixed(4) || ''} onChange={(e) => setPosZ(e.target.value)} required readOnly />
                  <input type="text" name="text" placeholder="Texte" required defaultValue={editInfospotMod ? infospotToEdit.text : ''}/>
                  <input type="text" name="title" placeholder="Titre" required defaultValue={editInfospotMod ? infospotToEdit.title : ''}/>
                  <input type="file" name="pic" />
                  <button type="submit">{editInfospotMod ? "Modifier" : "Ajouter"}</button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {newLinkModalOpen && (
        <div className="modal">
          <div className="modal-content">
            <span className="close" onClick={closeModalLink}>&times;</span>
            <h2>{editLinkMod ? 'Modifier le lien' : 'Ajouter un nouveau lien'}</h2>
            <div className="modal-body">
              <div className="image-preview-column">
                {pictures.map(picture => (
                  <div key={picture.id_pictures} className="image-preview" onClick={() => handleModalPictureClick(picture.imageUrl, picture.id_pictures)}>
                    <p>ID : {picture.id_pictures}</p>
                    <img src={picture.imageUrl} alt={`Preview of ${picture.id_pictures}`} />
                  </div>
                ))}
              </div>
              <div className="viewer-column panorama-container">
                <Panorama360
                  infoPopups={modalInfoPopups}
                  selectedPicture={modalSelectedPicture}
                  links={modalLinks}
                  onLinkClick={() => {}}
                  onPositionSelect={handlePositionSelect}
                  isLoading={isLoadingModal}
                />
              </div>
              <div className="form-column">
                <button type="button" onClick={( event ) => handleSelectPositionClick(event)}>Positionner</button>
                <form onSubmit={editLinkMod ? handleEditLinkSubmit : handleNewLinkSubmit}>
                  <input type="hidden" name="id_pictures" value={selectedImageId || ''} />
                  <input type="text" name="posX" placeholder="Position X" value={parseFloat(posX).toFixed(4) || ''} onChange={(e) => setPosX(e.target.value)} required readOnly />
                  <input type="text" name="posY" placeholder="Position Y" value={parseFloat(posY).toFixed(4) || ''} onChange={(e) => setPosY(e.target.value)} required readOnly />
                  <input type="text" name="posZ" placeholder="Position Z" value={parseFloat(posZ).toFixed(4) || ''} onChange={(e) => setPosZ(e.target.value)} required readOnly />
                  <input type="text" name="id_pictures_destination" placeholder="Picture Destination ID" required defaultValue={editLinkMod ? linkToEdit.id_pictures_destination : ''} />
                  <button type="submit">{editLinkMod ? "Modifier" : "Ajouter"}</button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminRoomDetails;