import React, { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import * as api from '../api/AxiosAdminRoom';
import Panorama360 from './Panorama360';
import { Buffer } from 'buffer';
import { toast } from "sonner";
import Loader from "./Loader";

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
  const [addImageModalOpen, setAddImageModalOpen] = useState(false);
  const [newImage, setNewImage] = useState(null);
  const [modalSelectedPicture, setModalSelectedPicture] = useState('');
  const [modalInfoPopups, setModalInfoPopups] = useState([]);
  const [modalLinks, setModalLinks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingModal, setIsLoadingModal] = useState(true);
  const [disableBackgroundClick, setDisableBackgroundClick] = useState(false);

  const [loading, setLoading] = useState(true);
  const [textLoading, setTextLoading] = useState("Chargement des données...");

  const showLoading = (promises, textLoading, textSuccess, textError) => {
    setLoading(true);
    setTextLoading(textLoading);
    // Return a toaster success after all promises are resolved
    Promise.all(promises)
        .then(() => {
          setLoading(false);
          toast.success(textSuccess);
        })
        .catch((error) => {
          setLoading(false);
          console.error('Error fetching data:', error);
          toast.error(textError);
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
    if (formData.get('pic').size === 0) {
        alert('Veuillez sélectionner une image pour l\'infobulle');
        return;
    }

    await api.insertInfoPopUp(formData);
    
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
  };

  const handleNewLinkSubmit = async (event) => {
    event.preventDefault();
    const formData = new FormData(event.target);
    await api.insertLink(formData);
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
    
    if (pictures.length > 0) {
      const firstPicture = pictures[0];
      setIsLoadingModal(true);
      setModalSelectedPicture(firstPicture.imageUrl);
      setSelectedImageId(firstPicture.id_pictures);
      
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

    if (pictures.length > 0) {
      const firstPicture = pictures[0];
      setIsLoadingModal(true);
      setModalSelectedPicture(firstPicture.imageUrl);
      setSelectedImageId(firstPicture.id_pictures);
      
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
    const imageUrl = pictures.find(pic => pic.id_pictures === popup.id_pictures).imageUrl;
    handleModalPictureClick(imageUrl, popup.id_pictures);
    setNewInfospotModalOpen(true);
  }

  const handleEditInfospotSubmit = async (event) => {
    event.preventDefault();
    const formData = new FormData(event.target);
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

  const handleImageChange = (e) => {
    setNewImage(e.target.files[0]);
  };

  const handleImageUpload = async (event) => {
    event.preventDefault();
    if (!newImage) {
      toast.error('Veuillez sélectionner une image');
      return;
    }

    const formData = new FormData();
    formData.append('id_rooms', id);
    formData.append('pic', newImage);

    try {
      const uploadPromise = api.uploadFile(formData);
      const fetchDataPromise = uploadPromise.then(async () => {
        await fetchAllData();
        setAddImageModalOpen(false);
        setNewImage(null);
      });

      showLoading([uploadPromise, fetchDataPromise], 'Chargement de l\'image...', 'Image ajoutée avec succès', 'Erreur lors du chargement de l\'image');
    } catch (error) {
      console.error('Error uploading image:', error);
    }
  };

  return (
    <div className="flex flex-col items-center">
      <Loader show={loading} text={textLoading} />
      <h1 className="text-2xl font-bold mt-4">{roomName}</h1>
      <div className="flex w-full h-[500px] mt-5">
        <div className="flex-1 flex flex-col overflow-y-auto p-2.5 border-r border-gray-300">
          <div className="flex justify-center mb-4 w-full">
            <button onClick={() => setAddImageModalOpen(true)} className="bg-orange-600 text-white border-none py-2 px-4 rounded font-bold hover:bg-orange-700 transition-colors">
              Ajouter une image 360°
            </button>
          </div>
        </div>
      </div>
    <div className="admin-room-details-container">
      <h1>{roomName}</h1>
      <div className="image-panorama-container">
        <div className="image-list">
          {pictures.map(picture => (
            <div key={picture.id_pictures} className="mb-2.5">
              <p className="text-sm">ID : {picture.id_pictures}</p>
              <img
                src={picture.imageUrl}
                alt={`Aperçu de ${picture.id_pictures}`}
                onClick={() => handlePictureClick(picture.imageUrl, picture.id_pictures)}
                className="w-full h-auto mb-2.5 cursor-pointer transition-transform duration-200 hover:scale-105"
              />
            </div>
          ))}
        </div>
        <div className={`flex-3 relative ${newInfospotModalOpen || newLinkModalOpen ? 'pointer-events-none opacity-50' : ''}`} style={{flex: '3'}}>
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
      <div className="flex justify-between items-center w-full mt-5">
        <h2 className="text-xl font-semibold">Infobulles</h2>
        <button onClick={handleModalInfopopup} className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">Ajouter une infobulle</button>
      </div>
      <div className="flex items-center mb-5 w-full">
        <input
          type="text"
          placeholder="Recherche par titre"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-2.5 py-2.5 mb-5 border border-gray-300 rounded"
        />
        <label className="relative inline-block w-[60px] h-[34px] ml-2.5">
          <input
            type="checkbox"
            className="opacity-0 w-0 h-0"
            checked={showAllInfospots}
            onChange={() => setShowAllInfospots(!showAllInfospots)}
          />
          <span className="absolute cursor-pointer inset-0 bg-gray-300 transition-all duration-300 rounded-full before:absolute before:content-[''] before:h-[26px] before:w-[26px] before:left-1 before:bottom-1 before:bg-white before:transition-all before:duration-300 before:rounded-full peer-checked:bg-blue-500 peer-checked:before:translate-x-[26px]"></span>
        </label>
        <span className="ml-2">{showAllInfospots ? "Toutes les infobulles" : "Infobulles de l'image affichée"}</span>
      </div>
      <div className="w-full mt-5">
        {displayedInfoPopups.map((popup) => (
          <div key={popup.id_info_popup} className="flex justify-between items-center border border-gray-300 p-2.5 mb-2.5">
            <div className="flex-1">
              <h3 className="font-semibold">Titre : {popup.title}</h3>
              <p>Description : {popup.text}</p>
              <p>ID du panorama : {popup.id_pictures}</p>
            </div>
            {popup.image && (
              <div className="flex-1 flex justify-center">
                <img src={`data:image/jpeg;base64,${Buffer.from(popup.image).toString('base64')}`} alt={`Aperçu de ${popup.title}`} className="max-w-[100px] max-h-[100px]" />
              </div>
            )}
            <div className="flex">
              <button onClick={(event) => handleDeleteInfoPopup(event, popup.id_info_popup)} className="bg-red-500 text-white px-4 py-2 rounded mr-2 hover:bg-red-600">Supprimer</button>
              <button onClick={(event) => handleEditInfoPopup(event, popup)} className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600">Modifier</button>
            </div>
          </div>
        ))}
      </div>
      <div className="flex justify-between items-center w-full mt-5">
        <h2 className="text-xl font-semibold">Liens</h2>
        <button onClick={handleModalLink} className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">Ajouter un lien</button>
      </div>
      <div className="flex items-center mb-5 w-full">
        <input
          type="text"
          placeholder="Recherche par ID de destination"
          value={searchLinkTerm}
          onChange={(e) => setSearchLinkTerm(e.target.value)}
          className="w-full px-2.5 py-2.5 mb-5 border border-gray-300 rounded"
        />
        <label className="relative inline-block w-[60px] h-[34px] ml-2.5">
          <input
            type="checkbox"
            className="opacity-0 w-0 h-0 peer"
            checked={showAllLinks}
            onChange={() => setShowAllLinks(!showAllLinks)}
          />
          <span className="absolute cursor-pointer inset-0 bg-gray-300 transition-all duration-300 rounded-full before:absolute before:content-[''] before:h-[26px] before:w-[26px] before:left-1 before:bottom-1 before:bg-white before:transition-all before:duration-300 before:rounded-full peer-checked:bg-blue-500 peer-checked:before:translate-x-[26px]"></span>
        </label>
        <span className="ml-2">{showAllLinks ? "Tous les liens" : "Liens de l'image affichée"}</span>
      </div>
      <div className="w-full mt-5">
        {displayedLinks.map((link) => (
          <div key={link.id_links} className="flex justify-between items-center border border-gray-300 p-2.5 mb-2.5">
            <div className="flex-1">
              <h3 className="font-semibold">ID : {link.id_links}</h3>
              <p>Destination ID : {link.id_pictures_destination}</p>
            </div>
            <div className="flex-1 flex justify-center">
              <img src={pictures.find(pic => pic.id_pictures === link.id_pictures_destination)?.imageUrl} alt={`Destination ${link.id_pictures_destination}`} className="max-w-[100px] max-h-[100px]" />
            </div>
            <div className="flex">
              <button onClick={(event) => handleDeleteLink(event, link.id_links)} className="bg-red-500 text-white px-4 py-2 rounded mr-2 hover:bg-red-600">Supprimer</button>
              <button onClick={(event) => handleEditLink(event, link)} className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600">Modifier</button>
            </div>
          </div>
        ))}
      </div>
      </div>
      {newInfospotModalOpen && (
        <div className="fixed inset-0 flex justify-center items-center bg-black bg-opacity-40 z-10">
          <div className="bg-white p-5 border border-gray-400 w-4/5 max-w-6xl">
            <span className="float-right text-2xl font-bold cursor-pointer text-gray-500 hover:text-black" onClick={closeModalInfospot}>&times;</span>
            <h2 className="text-xl mb-4">{editInfospotMod ? 'Modifier l\'infobulle' : 'Ajouter une nouvelle infobulle'}</h2>
            <div className="flex">
              {!editInfospotMod && (
                <div className="flex-1 flex flex-col overflow-y-auto p-2.5 border-r border-gray-300">
                  {pictures.map(picture => (
                    <div key={picture.id_pictures} className="mb-2.5 cursor-pointer" onClick={() => handleModalPictureClick(picture.imageUrl, picture.id_pictures)}>
                      <img src={picture.imageUrl} alt={`Aperçu de ${picture.id_pictures}`} className="w-full h-auto" />
                    </div>
                  ))}
                </div>
              )}
              <div className="flex-2 p-2.5" style={{flex: '2'}}>
                <Panorama360
                  infoPopups={modalInfoPopups}
                  selectedPicture={modalSelectedPicture}
                  links={modalLinks}
                  onLinkClick={() => {}}
                  onPositionSelect={handlePositionSelect}
                  isLoading={isLoadingModal}
                />
              </div>
              <div className="flex-1 p-2.5">
                <button type="button" onClick={(event) => handleSelectPositionClick(event)} className="mb-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">Positionner</button>
                <form onSubmit={editInfospotMod ? handleEditInfospotSubmit : handleNewInfospotSubmit} className="flex flex-col gap-2">
                  <input type="hidden" name="id_pictures" value={selectedImageId || ''} />
                  <input type="text" name="posX" placeholder="Position X" value={parseFloat(posX).toFixed(4) || ''} onChange={(e) => setPosX(e.target.value)} required readOnly className="p-2 border border-gray-300 rounded" />
                  <input type="text" name="posY" placeholder="Position Y" value={parseFloat(posY).toFixed(4) || ''} onChange={(e) => setPosY(e.target.value)} required readOnly className="p-2 border border-gray-300 rounded" />
                  <input type="text" name="posZ" placeholder="Position Z" value={parseFloat(posZ).toFixed(4) || ''} onChange={(e) => setPosZ(e.target.value)} required readOnly className="p-2 border border-gray-300 rounded" />
                  <input type="text" name="text" placeholder="Texte" required defaultValue={editInfospotMod ? infospotToEdit.text : ''} maxLength="300" className="p-2 border border-gray-300 rounded" />
                  <input type="text" name="title" placeholder="Titre" required defaultValue={editInfospotMod ? infospotToEdit.title : ''} maxLength="40" className="p-2 border border-gray-300 rounded" />
                  <input type="file" name="pic" className="p-2 border border-gray-300 rounded" />
                  <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">{editInfospotMod ? "Modifier" : "Ajouter"}</button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {newLinkModalOpen && (
        <div className="fixed inset-0 flex justify-center items-center bg-black bg-opacity-40 z-10">
          <div className="bg-white p-5 border border-gray-400 w-4/5 max-w-6xl">
            <span className="float-right text-2xl font-bold cursor-pointer text-gray-500 hover:text-black" onClick={closeModalLink}>&times;</span>
            <h2 className="text-xl mb-4">{editLinkMod ? 'Modifier le lien' : 'Ajouter un nouveau lien'}</h2>
            <div className="flex">
              <div className="flex-1 flex flex-col overflow-y-auto p-2.5 border-r border-gray-300">
                {pictures.map(picture => (
                  <div key={picture.id_pictures} className="mb-2.5 cursor-pointer" onClick={() => handleModalPictureClick(picture.imageUrl, picture.id_pictures)}>
                    <p className="text-sm">ID : {picture.id_pictures}</p>
                    <img src={picture.imageUrl} alt={`Preview of ${picture.id_pictures}`} className="w-full h-auto" />
                  </div>
                ))}
              </div>
              <div className="flex-2 p-2.5" style={{flex: '2'}}>
                <Panorama360
                  infoPopups={modalInfoPopups}
                  selectedPicture={modalSelectedPicture}
                  links={modalLinks}
                  onLinkClick={() => {}}
                  onPositionSelect={handlePositionSelect}
                  isLoading={isLoadingModal}
                />
              </div>
              <div className="flex-1 p-2.5">
                <button type="button" onClick={(event) => handleSelectPositionClick(event)} className="mb-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">Positionner</button>
                <form onSubmit={editLinkMod ? handleEditLinkSubmit : handleNewLinkSubmit} className="flex flex-col gap-2">
                  <input type="hidden" name="id_pictures" value={selectedImageId || ''} />
                  <input type="text" name="posX" placeholder="Position X" value={parseFloat(posX).toFixed(4) || ''} onChange={(e) => setPosX(e.target.value)} required readOnly className="p-2 border border-gray-300 rounded" />
                  <input type="text" name="posY" placeholder="Position Y" value={parseFloat(posY).toFixed(4) || ''} onChange={(e) => setPosY(e.target.value)} required readOnly className="p-2 border border-gray-300 rounded" />
                  <input type="text" name="posZ" placeholder="Position Z" value={parseFloat(posZ).toFixed(4) || ''} onChange={(e) => setPosZ(e.target.value)} required readOnly className="p-2 border border-gray-300 rounded" />
                  <input type="text" name="id_pictures_destination" placeholder="Picture Destination ID" required defaultValue={editLinkMod ? linkToEdit.id_pictures_destination : ''} className="p-2 border border-gray-300 rounded" />
                  <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">{editLinkMod ? "Modifier" : "Ajouter"}</button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {addImageModalOpen && (
        <div className="fixed inset-0 flex justify-center items-center bg-black bg-opacity-40 z-10">
          <div className="bg-white p-5 border border-gray-400 w-4/5 max-w-lg">
            <span className="float-right text-2xl font-bold cursor-pointer text-gray-500 hover:text-black" onClick={() => setAddImageModalOpen(false)}>&times;</span>
            <h2 className="text-xl mb-4">Ajouter une nouvelle image 360°</h2>
            <div>
              <form onSubmit={handleImageUpload} className="flex flex-col gap-2">
                <div className="mb-4">
                  <label className="block mb-2">Image panoramique (360°)</label>
                  <input 
                    type="file" 
                    name="pic" 
                    accept="image/*" 
                    onChange={handleImageChange} 
                    required 
                    className="w-full p-2 border border-gray-300 rounded"
                  />
                </div>
                <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">Ajouter l'image</button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminRoomDetails;