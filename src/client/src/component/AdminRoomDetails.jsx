import React, { useEffect, useState, useRef } from "react";
import {useHistory, useParams} from "react-router-dom";
import * as api from '../api/AxiosAdminRoom';
import Panorama360 from './Panorama360';
import { Buffer } from 'buffer';
import { toast } from "sonner";
import Loader from "./Loader";
import Masonry from 'react-masonry-css';
import '../style/AdminRoomDetails.css';
import {FaArrowLeft, FaPen, FaTrash, FaPlusCircle} from "react-icons/fa";
import {ImLocation2} from "react-icons/im";
import {MdOutlineFileUpload} from "react-icons/md";
import ModalAddEditImage from "./room_details/ModalAddEditImage";
import ConfirmDialog from "./dialogs/ConfirmDialog";

const AdminRoomDetails = () => {
  const { id } = useParams();
  const [pictures, setPictures] = useState([]);
  const [selectedPicture, setSelectedPicture] = useState('');
  const [selectedPictureId, setSelectedPictureId] = useState('');
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
  const [imageToUpdate, setImageToUpdate] = useState(null);

  const [loading, setLoading] = useState(true);
  const [textLoading, setTextLoading] = useState("Chargement des données...");

  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmTitle, setConfirmTitle] = useState("");
  const [confirmMessage, setConfirmMessage] = useState("");
  const [imageToDelete, setImageToDelete] = useState(null);
  const [infospotToDelete, setInfospotToDelete] = useState(null);
  const [linkToDelete, setLinkToDelete] = useState(null);

  const history = useHistory();

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
    setSelectedPictureId(pictureId);
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
      await getInfoPopup(selectedPictureId);

      const allImageInfoPopups = await Promise.all(
          pictures.map(async (pic) => await api.getInfoPopup(pic.id_pictures))
      );
      setAllInfoPopups(allImageInfoPopups.flat());
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
        await getLinks(selectedPictureId);
        await getInfoPopup(selectedPictureId);
        const allImageLinks = await Promise.all(
            pictures.map(async (pic) => await api.getLinks(pic.id_pictures))
        );
        setAllLinks(allImageLinks.flat());
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

  const handleDeleteInfoPopup = (event, id) => {
    event.stopPropagation();
    event.preventDefault();
    setInfospotToDelete(id);
    setConfirmTitle("Suppression d'infobulle");
    setConfirmMessage("Etes-vous sûr de vouloir supprimer cette infobulle ? Cette action est irréversible.");
    setShowConfirm(true);
  }

  const confirmDeleteInfospot = async () => {
    try {
      const deletePromise = api.deleteInfospot(infospotToDelete);
      deletePromise.then(() => {
        const updatedInfoPopups = infoPopups.filter(popup => popup.id_info_popup !== infospotToDelete);
        setInfoPopups(updatedInfoPopups);
        const updatedAllInfoPopups = allInfoPopups.filter(popup => popup.id_info_popup !== infospotToDelete);
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
      await getInfoPopup(selectedPictureId);
      const allImageInfoPopups = await Promise.all(
          pictures.map(async (pic) => await api.getInfoPopup(pic.id_pictures))
      );
      setAllInfoPopups(allImageInfoPopups.flat());
    });

    showLoading([updatePromise, updatedInfoPopupsPromise], 'Mise à jour de l\'infobulle...', 'Infobulle mise à jour avec succès', 'Erreur lors de la mise à jour de l\'infobulle');

    setNewInfospotModalOpen(false);
    setDisableBackgroundClick(false);
    setEditInfospotMod(false);
  }

  const handleDeleteLink = (event, id) => {
    event.stopPropagation();
    event.preventDefault();
    setLinkToDelete(id);
    setConfirmTitle("Suppression de lien");
    setConfirmMessage("Etes-vous sûr de vouloir supprimer ce lien ? Cette action est irréversible.");
    setShowConfirm(true);
  }

  const confirmDeleteLink = async () => {
    try {
      const deletePromise = api.deleteLink(linkToDelete);
      deletePromise.then(() => {
        const updatedLinks = links.filter(link => link.id_links !== linkToDelete);
        setLinks(updatedLinks);
        const updatedAllLinks = allLinks.filter(link => link.id_links !== linkToDelete);
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
    setPosX(link.position_x);
    setPosY(link.position_y);
    setPosZ(link.position_z);
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
        await getLinks(selectedPictureId);
        await getInfoPopup(selectedPictureId);
        const allImageLinks = await Promise.all(
            pictures.map(async (pic) => await api.getLinks(pic.id_pictures))
        );
        setAllLinks(allImageLinks.flat());
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
    setImageToDelete(id);
    setConfirmTitle("Suppression d'image");
    setConfirmMessage("Etes-vous sûr de vouloir supprimer cette image ? Cette action est irréversible.");
    setShowConfirm(true);
  }

  const confirmDeleteImage = async () => {
    const deletePromise = api.deleteImage(imageToDelete);
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
  };

  const breakpointColumnsObj = {
    default: 2,
    1100: 2,
    700: 1,
  };

  return (
    <div className="">
      <Loader show={loading} text={textLoading} />

      <div className={`fixed z-40 ${newInfospotModalOpen || newLinkModalOpen || addImageModalOpen ? 'pointer-events-none opacity-50' : ''}`} style={{left: "20px", top: "80px"}}>
        <button
            onClick={() => history.push('/admin/room')}
            className="px-4 py-2 button-type font-title font-bold flex items-center gap-2">
          <FaArrowLeft /> Retour
        </button>
      </div>
      
      {/* à mettre dans la navbar*/}
      {/*<div className="text-2xl text-junia-purple font-title font-bold mt-4">{roomName}</div>*/}


      


    <div className="admin-room-details-container flex flex-col items-center bg-junia-salmon p-3">
      
      <div className="image-panorama-container bg-white w-80 rounded-2xl mt-4 flex">

        <div className="image-list flex flex-col p-2 justify-between">
            <div className="button-add-360 flex justify-center ">
                        <button onClick={() => {
                          setAddImageModalOpen(true)
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
                <button onClick={handleModalInfopopup} className="flex items-center gap-2"><FaPlusCircle /> Nouvelle info-bulle</button>
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
                  <button onClick={(event) => handleEditInfoPopup(event, popup)} className="button-type p-2 font-title font-bold flex items-center gap-2"><FaPen /> Modifier</button>
                  <button onClick={(event) => handleDeleteInfoPopup(event, popup.id_info_popup)} className="button-type2 p-2 font-title font-bold flex items-center gap-2"><FaTrash /> Supprimer</button>
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
                <button onClick={handleModalLink} className="flex items-center gap-2"><FaPlusCircle /> Nouveau lien</button>
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
                <button onClick={(event) => handleEditLink(event, link)} className="button-type p-2 font-title font-bold flex items-center gap-2"><FaPen /> Modifier</button>
                <button onClick={(event) => handleDeleteLink(event, link.id_links)} className="button-type2 p-2 font-title font-bold flex items-center gap-2"><FaTrash /> Supprimer</button>
              </div>
            </div>
          ))}
        </div>
      </div>
      </div>

      {/* modales... */}
      {newInfospotModalOpen && (
        <div className="fixed inset-0 flex justify-center items-center modal-background z-50 p-4">
          <div className="modal-infospot">
            {/* En-tête fixe */}
            <div className="modal-header">
              <div className="text-2xl font-bold text-junia-purple font-title text-center flex-grow">
                {editInfospotMod ? 'Modifier l\'infobulle' : 'Ajouter une nouvelle infobulle'}
              </div>
              <button 
                className="modal-close-button" 
                onClick={closeModalInfospot}
              >
                &times;
              </button>
            </div>

            {/* Section Panorama avec hauteur fixe */}
            <div className="modal-panorama">
              <Panorama360
                infoPopups={modalInfoPopups}
                selectedPicture={modalSelectedPicture}
                links={modalLinks}
                onLinkClick={() => {}}
                onPositionSelect={handlePositionSelect}
                isLoading={isLoadingModal}
              />
            </div>

            {/* Conteneur de formulaire scrollable */}
            <div className="modal-form-container">
              <form onSubmit={editInfospotMod ? handleEditInfospotSubmit : handleNewInfospotSubmit} 
                    className="grid grid-cols-2 gap-4">
                <input type="hidden" name="id_pictures" value={selectedImageId || ''} />
                
                {/* Left column */}
                <div className="flex flex-col gap-4 justify-between h-full">
                  <div className="file-input-container">
                    <div className="file-input-junia">
                      <div className="flex items-center bg-white">
                        <MdOutlineFileUpload className="text-junia-orange text-xl m-2" />
                        <input 
                          type="file"
                          accept="image/*"
                          name="pic"
                          className="file:mr-4 file:py-2 file:px-4 file:text-junia-orange file:opacity-70 file:border-0 file:font-title"
                          onChange={(e) => {
                          const file = e.target.files[0];
                          if (!file.type.startsWith("image/")) {
                            alert("Veuillez sélectionner un fichier image valide.");
                            e.target.value = ""; // Clear the input
                            }
                          }
                        }
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="position-inputs-container flex-col">
                    {/* Labels en haut */}
                    <div className="flex w-full justify-between mb-1">
                      <label className="text-junia-purple font-bold text-center w-1/3">Coordonnée X :</label>
                      <label className="text-junia-purple font-bold text-center w-1/3">Coordonnée Y :</label>
                      <label className="text-junia-purple font-bold text-center w-1/3">Coordonnée Z :</label>
                    </div>
                    {/* Inputs en bas */}
                    <div className="flex w-full justify-between">
                      <input 
                        type="text" 
                        name="posX" 
                        placeholder="Position X" 
                        value={parseFloat(posX).toFixed(4) || ''} 
                        onChange={(e) => setPosX(e.target.value)} 
                        required 
                        readOnly 
                        className="position-input" 
                      />
                      <input 
                        type="text" 
                        name="posY" 
                        placeholder="Position Y" 
                        value={parseFloat(posY).toFixed(4) || ''} 
                        onChange={(e) => setPosY(e.target.value)} 
                        required 
                        readOnly 
                        className="position-input" 
                      />
                      <input 
                        type="text" 
                        name="posZ" 
                        placeholder="Position Z" 
                        value={parseFloat(posZ).toFixed(4) || ''} 
                        onChange={(e) => setPosZ(e.target.value)} 
                        required 
                        readOnly 
                        className="position-input" 
                      />
                    </div>
                  </div>
                  
                  <div className="flex gap-4 justify-center">
                    <button 
                      type="button" 
                      onClick={(event) => handleSelectPositionClick(event)} 
                      className="button-type font-bold font-title text-xl px-4 py-2 flex items-center gap-2">
                      <ImLocation2 /> Positionner
                    </button>
                    <button 
                      type="submit" 
                      className="button-type font-bold font-title text-xl px-4 py-2 flex items-center gap-2">
                      {editInfospotMod ? <><FaPen /> Modifier</> : "Ajouter"}
                    </button>
                  </div>
                </div>

                {/* Right column - pas de justify-between ici */}
                <div className="flex flex-col h-full">
                  <input 
                    type="text" 
                    name="title" 
                    placeholder="Titre" 
                    required 
                    defaultValue={editInfospotMod ? infospotToEdit.title : ''} 
                    maxLength="45" 
                    className="p-2 rounded orange-border mb-2" 
                  />
                  <textarea 
                    name="text" 
                    placeholder="Texte" 
                    required 
                    defaultValue={editInfospotMod ? infospotToEdit.text : ''} 
                    maxLength="300" 
                    className="p-2 rounded resize-none orange-border flex-grow" 
                  />
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {newLinkModalOpen && (
        <div className="fixed inset-0 flex justify-center items-center modal-background z-50 p-4">
          <div className="modal-infospot">
            {/* En-tête fixe */}
            <div className="modal-header">
              <div className="text-2xl font-bold text-junia-purple font-title text-center flex-grow">
                {editLinkMod ? 'Modifier le lien' : 'Ajouter un nouveau lien'}
              </div>
              <button 
                className="modal-close-button" 
                onClick={closeModalLink}
              >
                &times;
              </button>
            </div>

            {/* Section Panorama avec hauteur fixe */}
            <div className="modal-panorama">
              <Panorama360
                infoPopups={modalInfoPopups}
                selectedPicture={modalSelectedPicture}
                links={modalLinks}
                onLinkClick={() => {}}
                onPositionSelect={handlePositionSelect}
                isLoading={isLoadingModal}
              />
            </div>

            {/* Conteneur de formulaire scrollable */}
            <div className="modal-form-container">
              <form onSubmit={editLinkMod ? handleEditLinkSubmit : handleNewLinkSubmit} 
                    className="grid grid-cols-2 gap-4">
                <input type="hidden" name="id_pictures" value={selectedImageId || ''} />
                
                {/* Left column */}
                <div className="flex flex-col gap-4 justify-between h-full">
                  <input 
                    type="text" 
                    name="id_pictures_destination" 
                    placeholder="ID de destination" 
                    required 
                    defaultValue={editLinkMod ? linkToEdit.id_pictures_destination : ''} 
                    className="p-2 rounded orange-border" 
                    />
                  <div className="position-inputs-container flex-col">
                    {/* Labels en haut */}
                    <div className="flex w-full justify-between mb-1">
                      <label className="text-junia-purple font-bold text-center w-1/3">Coordonnée X :</label>
                      <label className="text-junia-purple font-bold text-center w-1/3">Coordonnée Y :</label>
                      <label className="text-junia-purple font-bold text-center w-1/3">Coordonnée Z :</label>
                    </div>
                    {/* Inputs en bas */}
                    <div className="flex w-full justify-between">
                      <input 
                        type="text" 
                        name="posX" 
                        placeholder="Position X" 
                        value={parseFloat(posX).toFixed(4) || ''} 
                        onChange={(e) => setPosX(e.target.value)} 
                        required 
                        readOnly 
                        className="position-input" 
                      />
                      <input 
                        type="text" 
                        name="posY" 
                        placeholder="Position Y" 
                        value={parseFloat(posY).toFixed(4) || ''} 
                        onChange={(e) => setPosY(e.target.value)} 
                        required 
                        readOnly 
                        className="position-input" 
                      />
                      <input 
                        type="text" 
                        name="posZ" 
                        placeholder="Position Z" 
                        value={parseFloat(posZ).toFixed(4) || ''} 
                        onChange={(e) => setPosZ(e.target.value)} 
                        required 
                        readOnly 
                        className="position-input" 
                      />
                    </div>
                  </div>
                  
                  <div className="flex gap-4 justify-center">
                    <button 
                      type="button" 
                      onClick={(event) => handleSelectPositionClick(event)} 
                      className="button-type font-bold font-title text-xl px-4 py-2 flex items-center gap-2">
                      <ImLocation2 /> Positionner
                    </button>
                    <button 
                      type="submit" 
                      className="button-type font-bold font-title text-xl px-4 py-2 flex items-center gap-2">
                      {editLinkMod ? <><FaPen /> Modifier</> : "Ajouter"}
                    </button>
                  </div>
                </div>

                {/* Right column - pas de justify-between ici */}
                <div className="flex flex-col h-full">
                  
                  <div className="flex-1 overflow-y-auto">
                    {pictures.map(picture => (
                      <div 
                        key={picture.id_pictures} 
                        className="mb-4 cursor-pointer bg-white p-2 rounded-lg hover:shadow-lg transition-all"
                        onClick={() => handleModalPictureClick(picture.imageUrl, picture.id_pictures)}
                      >
                        <p className="text-sm font-bold mb-2">ID : {picture.id_pictures}</p>
                        <img 
                          src={picture.imageUrl} 
                          alt={`Aperçu ${picture.id_pictures}`} 
                          className="w-full h-auto rounded-lg"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      <ModalAddEditImage isOpen={addImageModalOpen} toggle={
        () => setAddImageModalOpen(!addImageModalOpen)
      } id_rooms={id} imageToUpdate={imageToUpdate} reload={reloadAfterAddEditImage} />

      <ConfirmDialog open={showConfirm} onClose={() => setShowConfirm(false)} title={confirmTitle} message={confirmMessage} onConfirm={async () => {
        if (imageToDelete) {
          await confirmDeleteImage();
        } else if (infospotToDelete) {
          await confirmDeleteInfospot();
        } else if (linkToDelete) {
          await confirmDeleteLink();
        }
      }} />
    </div>
  );
};

export default AdminRoomDetails;