import React, { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import * as api from '../api/AxiosAdminRoom';
import Panorama360 from './Panorama360';
import { Buffer } from 'buffer';
import { toast } from "sonner";
import Loader from "./Loader";
import Masonry from 'react-masonry-css';
import '../style/AdminRoomDetails.css';
import {FaPen, FaTrash} from "react-icons/fa";
import ModalAddEditImage from "./room_details/ModalAddEditImage";

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
  const [modalSelectedPicture, setModalSelectedPicture] = useState('');
  const [modalInfoPopups, setModalInfoPopups] = useState([]);
  const [modalLinks, setModalLinks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingModal, setIsLoadingModal] = useState(true);
  const [disableBackgroundClick, setDisableBackgroundClick] = useState(false);
  const [imageToUpdate, setImageToUpdate] = useState(null);

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
      console.log('allInfoPopups', allInfoPopups.flat());

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

    const insertPromise = api.insertInfoPopUp(formData);

    const updatedInfoPopupsPromise = insertPromise.then(async () => {
      await getInfoPopup(selectedImageId);

      const allImageInfoPopups = await Promise.all(
          pictures.map(async (pic) => await api.getInfoPopup(pic.id_pictures))
      );
      setAllInfoPopups(allImageInfoPopups.flat());
    });

    Promise.all([insertPromise, updatedInfoPopupsPromise]).then(() => {
      setSelectedPicture('');
    });

    showLoading([insertPromise, updatedInfoPopupsPromise], 'Ajout de l\'infobulle...', 'Infobulle ajoutée avec succès', 'Erreur lors de l\'ajout de l\'infobulle');

    setNewInfospotModalOpen(false);
    setDisableBackgroundClick(false);
  };

  const handleNewLinkSubmit = async (event) => {
    event.preventDefault();
    const formData = new FormData(event.target);
    const insertPromise = api.insertLink(formData);

    const updateLinksPromise = insertPromise.then(async () => {
        await getLinks(selectedImageId);
        const allImageLinks = await Promise.all(
            pictures.map(async (pic) => await api.getLinks(pic.id_pictures))
        );
        setAllLinks(allImageLinks.flat());
    });

    Promise.all([insertPromise, updateLinksPromise]).then(() => {
        setSelectedPicture('');
    });

    showLoading([insertPromise, updateLinksPromise], 'Ajout du lien...', 'Lien ajouté avec succès', 'Erreur lors de l\'ajout du lien');

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
      showLoading([infospotsPromise, linksPromise], 'Chargement des détails de la pièce...', 'Chargement des détails réussi', 'Erreur lors du chargement des détails');
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
        showLoading([infospotsPromise, linksPromise], 'Chargement des détails de la pièce...', 'Chargement des détails réussi', 'Erreur lors du chargement des détails');
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

    const updatePromise = api.updateInfospot(formData);

    const updatedInfoPopupsPromise = updatePromise.then(async () => {
      await getInfoPopup(selectedImageId);
      const allImageInfoPopups = await Promise.all(
          pictures.map(async (pic) => await api.getInfoPopup(pic.id_pictures))
      );
      setAllInfoPopups(allImageInfoPopups.flat());
    });

    Promise.all([updatePromise, updatedInfoPopupsPromise]).then(() => {
        setSelectedPicture('');
    });

    showLoading([updatePromise, updatedInfoPopupsPromise], 'Mise à jour de l\'infobulle...', 'Infobulle mise à jour avec succès', 'Erreur lors de la mise à jour de l\'infobulle');

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
    const insertPromise = api.updateLink(formData);

    const updatedLinksPromise = insertPromise.then(async () => {
        await getLinks(selectedImageId);
        const allImageLinks = await Promise.all(
            pictures.map(async (pic) => await api.getLinks(pic.id_pictures))
        );
        setAllLinks(allImageLinks.flat());
    });

    Promise.all([insertPromise, updatedLinksPromise]).then(() => {
      setSelectedPicture('');
    });

    showLoading([insertPromise, updatedLinksPromise], 'Mise à jour du lien...', 'Lien mis à jour avec succès', 'Erreur lors de la mise à jour du lien');

    setNewLinkModalOpen(false);
    setDisableBackgroundClick(false);
    setEditLinkMod(false);
  }

  const handleEditPicture = async (id) => {
    console.log('Editing picture', id);
    setImageToUpdate(pictures.find(pic => pic.id_pictures === id));
    setAddImageModalOpen(true);
  }

  const handleDeletePicture = async (id) => {
    if (!window.confirm('Etes-vous sûr de vouloir supprimer l\'image ?')) return;
    const deletePromise = api.deleteImage(id);
    const updatedPicturesPromise = deletePromise.then(async () => {
      await fetchAllData();
    });
    showLoading([deletePromise, updatedPicturesPromise], 'Suppression de l\'image...', 'Image supprimée avec succès', 'Erreur lors de la suppression de l\'image');
  }

  const reloadAfterAddEditImage = async (type) => {
    if (type === 'add') {
      const reloadPromise = fetchAllData();
      setAddImageModalOpen(false);
      showLoading([reloadPromise], 'Ajout de l\'image...', 'Image ajoutée avec succès', 'Erreur lors de l\'ajout de l\'image');
    } else if (type === 'edit') {
      const reloadPromise =  fetchAllData();
      setImageToUpdate(null);
      setAddImageModalOpen(false);
      showLoading([reloadPromise], 'Mise à jour de l\'image...', 'Image mise à jour avec succès', 'Erreur lors de la mise à jour de l\'image');
    }
  }

  const breakpointColumnsObj = {
    default: 2,
    1100: 2,
    700: 1,
  };

  return (
    <div className="">
      <Loader show={loading} text={textLoading} />
      
      {/* à mettre dans la navbar*/}
      {/*<div className="text-2xl text-junia-purple font-title font-bold mt-4">{roomName}</div>*/}





    <div className="admin-room-details-container flex flex-col items-center bg-junia-salmon p-3">
      
      <div className="image-panorama-container bg-white w-80 rounded-2xl mt-4 flex">

        <div className="image-list flex flex-col p-2 justify-between">
            <div className="button-add-360 flex justify-center ">
                        <button onClick={() => {
                          setAddImageModalOpen(true);
                          setImageToUpdate(null);
                        }} className="button-type font-title font-bold text-2xl p-2">
                          Ajouter une image 360°
                        </button>
            </div>
          {pictures.map(picture => (
              <div key={picture.id_pictures} className="w-40vw p-1">
                <div className="relative">
                  <img
                      src={picture.imageUrl}
                      alt={`Aperçu de ${picture.id_pictures}`}
                      onClick={() => handlePictureClick(picture.imageUrl, picture.id_pictures)}
                      className="image-card rounded-lg cursor-pointer shadow hover:shadow-lg transition-shadow duration-300 w-full"
                  />
                  <div className="flex gap-1 absolute" style={{ bottom: '5px', right: '5px' }}>
                    <button
                        onClick={() => handleEditPicture(picture.id_pictures)}
                        className="px-2 py-2 button-type"
                    >
                      <FaPen />
                    </button>
                    <button
                        onClick={() => handleDeletePicture(picture.id_pictures)}
                        className="px-2 py-2 button-type2"
                    >
                      <FaTrash />
                    </button>
                  </div>
                </div>
              </div>
          ))}
        </div>

        <div className={`flex-3 relative w-70  p-4 ${newInfospotModalOpen || newLinkModalOpen ? 'pointer-events-none opacity-50' : ''}`} style={{flex: '3'}}>
          {selectedPicture && (
            <Panorama360
              infoPopups={infoPopups}
              selectedPicture={selectedPicture}
              links={links}
              onLinkClick={handleLinkClick}
              onPositionSelect={() => {}}
              isLoading={isLoading}
              disableClick={disableBackgroundClick}
              className=""
            />
          )}
        </div>

      </div>

      {/* Nouveau conteneur flex pour affichage côte à côte */}
      <div className="content-container">
        {/* Section des infospots (2/3 de la largeur) */}
        <div className="infospots-section" style={{width: '66%'}}>
          {/* Zone de recherche d'infospots en haut des 2/3 gauche */}
          <div className="info-spot-research-zone w-full mb-4">
            <div className="flex gap-4 items-center w-full mb-4">
              <div className="text-white text-4xl bg-junia-purple px-4 py-1 font-title font-bold rounded-full">Infobulles</div>
              <div className="button-type font-bold font-title text-xl px-4 py-2">
                <button onClick={handleModalInfopopup}>Nouvelle info-bulle</button>
              </div>
              
            </div>
            <div className="flex gap-4 justify-between items-center mb-3 w-full">
              <div className="flex gap-4">
                  <input
                    type="text"
                    placeholder="Rechercher par titre ..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full p-2 bg-white research-input-IS research-input-orange-text rounded-full" />
                
                  <button 
                    onClick={() => setShowAllInfospots(!showAllInfospots)} 
                    className="button-type all-IS-button font-title font-bold px-4 py-2 ">
                    {showAllInfospots ? "Toutes les infobulles" : "Infobulles de l'image affichée"}
                  </button>
              </div>

              
            </div>
          </div>

          {/* Grille d'infospots sous la zone de recherche */}
          <Masonry
            breakpointCols={breakpointColumnsObj}
            className="my-masonry-grid"
            columnClassName="my-masonry-grid_column"
          >
            {displayedInfoPopups.map((popup) => (
              <div key={popup.id_info_popup} className="one-info-spot flex flex-col gap-2">
                <div className="font-bold font-title text-2xl"> 
                  <span className="text-junia-purple"> Titre : </span>
                  <span className="text-junia-orange">{popup.title}</span>
                </div>
                <div className="font-bold font-title text-2xl text-junia-purple">Description :</div>
                <div className="font-texts text-md text-junia-orange text-justify">{popup.text}</div>
                <div className="font-bold font-title text-2xl text-junia-purple">
                  <span className="text-junia-purple"> ID du panorama : </span>
                  <span className="text-junia-orange">{popup.id_pictures}</span>
                </div>
                <div className="flex justify-center ">
                  {popup.image && (
                    <div className="max-h-30">
                      <img src={`data:image/jpeg;base64,${Buffer.from(popup.image).toString('base64')}`} alt={`Aperçu de ${popup.title}`}/>
                    </div>
                  )}
                </div>
                <div className="flex w-full justify-between ">
                  <button onClick={(event) => handleEditInfoPopup(event, popup)} className="button-type p-2 font-title font-bold ">Modifier</button>
                  <button onClick={(event) => handleDeleteInfoPopup(event, popup.id_info_popup)} className="button-type2 p-2 font-title font-bold ">Supprimer</button>
                </div>
              </div>
            ))}
          </Masonry>
        </div>

        {/* Section des liens (1/3 de la largeur) */}
        <div className=" flex flex-col gap-2 w-1/3">
          <div className="links-research-zone w-full mb-4">
            <div className="flex gap-4 items-center w-full mb-4">
              <div className="text-white text-4xl bg-junia-purple px-4 py-1 font-title font-bold rounded-full">Liens</div>
              <div className="button-type font-bold font-title text-xl px-4 py-2">
                <button onClick={handleModalLink}>Nouveau lien</button>
              </div>
            </div>

            <div className="flex gap-4 items-center mb-2 w-full ">
              <div className="flex gap-4">
                <input
                  type="text"
                  placeholder="Recherche par ID de destination"
                  value={searchLinkTerm}
                  onChange={(e) => setSearchLinkTerm(e.target.value)}
                  className="w-full p-2 bg-white research-input-L research-input-orange-text rounded-full"/>
                
                <button 
                  onClick={() => setShowAllLinks(!showAllLinks)}
                  className="button-type all-IS-button font-title font-bold px-4 py-2">
                  {showAllLinks ? "Tous les liens" : "Liens de l'image affichée"}
                </button>
              </div>

              
            </div>
          </div>

          {displayedLinks.map((link) => (
            <div key={link.id_links} className="one-link-container flex flex-col justify-between items-center bg-white p-2 mb-2.5">
              
              <div className="flex justify-around w-full">
                <div className="flex">
                  <div className="font-bold font-title text-2xl text-junia-purple">ID : </div>
                  <div className="font-bold font-title text-2xl text-junia-orange pl-2"> {link.id_links}</div>
                </div>
                <div className="flex">
                  <div className="font-title text-2xl text-junia-purple">Destination ID : </div>
                  <div className="font-title text-2xl text-junia-orange pl-2">{link.id_pictures_destination}</div>
                </div>
              </div>
              <div className="flex-1 flex justify-center p-2">
                <img src={pictures.find(pic => pic.id_pictures === link.id_pictures_destination)?.imageUrl} alt={`Destination ${link.id_pictures_destination}`} className="max-w-[100px] max-h-[100px]" />
              </div>
              <div className="flex w-full justify-between px-2">
                <button onClick={(event) => handleEditLink(event, link)} className="button-type p-2 font-title font-bold">Modifier</button>
                <button onClick={(event) => handleDeleteLink(event, link.id_links)} className="button-type2 p-2 font-title font-bold">Supprimer</button>
              </div>
            </div>
          ))}
        </div>
      </div>
      </div>

      {/* modales... */}
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
                  <input type="text" name="title" placeholder="Titre" required defaultValue={editInfospotMod ? infospotToEdit.title : ''} maxLength="45" className="p-2 border border-gray-300 rounded" />
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

      <ModalAddEditImage isOpen={addImageModalOpen} toggle={
        () => setAddImageModalOpen(!addImageModalOpen)
      } id_rooms={id} imageToUpdate={imageToUpdate} reload={reloadAfterAddEditImage} />
    </div>
  );
};

export default AdminRoomDetails;