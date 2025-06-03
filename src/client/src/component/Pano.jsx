import { Buffer } from 'buffer';
import React, { useEffect, useRef, useState, useCallback, useMemo } from "react";
import * as api from '../api/AxiosPano';
import { getTourSteps } from '../api/AxiosTour';
import '../style/Pano.css';
import { toast } from "sonner";
import Panorama360 from './Panorama360';
import Loader from "./Loader";
import Navbar from './Navbar';

const PanoramaViewer = ({ location, setSelectedImageName, setCurrentRoomNumber }) => {
  Buffer.from = Buffer.from || require('buffer').Buffer;

  const [images, setImages] = useState([]);
  const [currentImageId, setCurrentImageId] = useState(null);
  const [infoPopups, setInfoPopups] = useState({});
  const [links, setLinks] = useState({});
  const firstLoad = useRef(true);
  const isLoading = useRef(true);

  const [currentRoomName, setCurrentRoomName] = useState('');
  const [currentRoomNumberState, setCurrentRoomNumberState] = useState('');

  const [rooms, setRooms] = useState([]);
  const [roomPreviews, setRoomPreviews] = useState({});
  const [previewFlags, setPreviewFlags] = useState({}); // Track which images are previews
  const [visitType, setVisitType] = useState('Visite libre');
  const [tourSteps, setTourSteps] = useState([]);
  const dataFetched = useRef(false);
  const [allRoomImages, setAllRoomImages] = useState({});
  const [currentFloor, setCurrentFloor] = useState(null);
  
  const loadingImage = useRef(false);
  const [loadingImageBeforeRoomSwitch, setLoadingImageBeforeRoomSwitch] = useState(false);

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
      isLoading.current = true;
  
      const params = new URLSearchParams(location.search);
      const tourId = params.get('tour_id');
  
      let stepsData = [];
      let roomsData = [];
  
      if (tourId) {
        stepsData = await getTourSteps(tourId);
        setTourSteps(stepsData);
  
        const roomIds = stepsData.map(step => step.id_rooms);
        roomsData = await Promise.all(
          roomIds.map(async (id) => {
            const room = await api.getRoomDetails(id);
            return { ...room, id_rooms: id };
          })
        );
        
        roomsData = roomsData.filter(room => room.hidden !== 1);
        
        setVisitType(`Visite guidée, Parcours ${tourId}`);
      } else {
        roomsData = await api.getRooms();
        roomsData = roomsData.filter(room => room.hidden !== 1);
      }
  
      setRooms(roomsData);

      // Fetch plan previews first, then fall back to panoramas if needed
      const previewPromises = roomsData.map(async room => {
        try {
          // Try to get plan preview first
          const previewUrl = await api.getRoomPreview(room.id_rooms);
          
          if (previewUrl) {
            // If we got a preview, use it and flag it as a preview
            return { id_rooms: room.id_rooms, imageUrl: previewUrl, isPreview: true };
          }
          
          // Otherwise, fall back to panorama images
          const pictures = await api.getPicturesByRoomId(room.id_rooms);
          const images = pictures.length > 0 ? 
            await api.getImage(pictures[0].id_pictures) : null;
            
          return { id_rooms: room.id_rooms, imageUrl: images, isPreview: false };
        } catch (error) {
          console.error(`Error fetching preview for room ${room.id_rooms}:`, error);
          return { id_rooms: room.id_rooms, imageUrl: null, isPreview: false };
        }
      });
      
      const roomPreviewsData = await Promise.all(previewPromises);
      
      // Set plan previews
      const roomPreviewsObj = {};
      
      roomPreviewsData.forEach(preview => {
        if (preview.isPreview) {
          // If it's a true preview, use it directly
          roomPreviewsObj[preview.id_rooms] = preview.imageUrl;
        } else if (preview.imageUrl) {
          // If it's a blob from panorama image, create a URL
          roomPreviewsObj[preview.id_rooms] = URL.createObjectURL(preview.imageUrl);
        }
      });
      
      setRoomPreviews(roomPreviewsObj);
      
      // Set preview flags
      setPreviewFlags(
        Object.fromEntries(roomPreviewsData.map(preview => [
          preview.id_rooms, 
          preview.isPreview
        ]))
      );
  
      // Continue with loading all plan images for panoramas
      const roomImagesPromises = roomsData.map(async room => {
        const pictures = await api.getPicturesByRoomId(room.id_rooms);
        const images = await Promise.all(
          pictures.map(async picture => {
            const imageBlob = await api.getImage(picture.id_pictures);
            return { id: picture.id_pictures, imageBlob };
          })
        );
        return { id_rooms: room.id_rooms, images };
      });
      
      const allRoomImagesData = await Promise.all(roomImagesPromises);
      
      // Charger toutes les images des pièces
      const allRoomImages = allRoomImagesData.reduce((acc, preview) => {
        acc[preview.id_rooms] = preview.images;
        return acc;
      }, {});
      setAllRoomImages(allRoomImages);
  
      // Charger les images principales
      const imagesData = allRoomImagesData.flatMap(preview => preview.images);
      setImages(imagesData);
      isLoading.current = false;
    } catch (error) {
      console.error("Erreur lors du chargement des données :", error);
    }
  };
  
  const handleUpload = async (event) => {
    event.preventDefault();
    const formData = new FormData(event.target);
    await api.uploadFile(formData);
  };

  const handleInsertInfoPopUp = async (event) => {
    event.preventDefault();
    const formData = new FormData(event.target);
    await api.insertInfoPopUp(formData);
  };

  const handleInsertLink = async (event) => {
    event.preventDefault();
    const formData = new FormData(event.target);
    const data = Object.fromEntries(formData.entries());
    console.log('Data:', data);
    await api.insertLink(data);
  };

  const handleRetrieveInfoPopUp = async (imageId) => {
    const popUps = await api.getInfoPopup(imageId);
    return popUps;
  };

  const handleRetrieveLinks = async (imageId) => {
    const links = await api.getLinks(imageId);
    return links;
  };

  const cleanUrlParams = () => {
    const url = new URL(window.location);
    url.search = '';
    window.history.replaceState({}, document.title, url);
  };

  const fetchRoomDetails = async (id_rooms) => {
    const room = await api.getRoomDetails(id_rooms);
    setCurrentRoomName(room.name);
    setCurrentRoomNumberState(room.number);
    // Mettez à jour la navbar via les props
    if (typeof setSelectedImageName === "function") setSelectedImageName(room.name);
    if (typeof setCurrentRoomNumber === "function") setCurrentRoomNumber(room.number);
  };

  const fetchFloor = async (id_rooms) => {
    const room = rooms.find(room => room.id_rooms === id_rooms);
    const id_floor = room ? room.id_floors : null;
    console.log(room);
    console.log(id_floor);
    if (id_floor) {
      const floor = await api.getFloorById(id_floor);
      floor.plan_x = room.plan_x;
      floor.plan_y = room.plan_y;
      setCurrentFloor(floor);
    }
  }

  const displayImage = async (imageBlob, id) => {
    cleanUrlParams();
    if (currentImageId !== id) setCurrentImageId(id);
  
    const retrievedPopupsPromise = handleRetrieveInfoPopUp(id);
    const retrievedLinksPromise = handleRetrieveLinks(id);
  
    const roomIdPromise = api.getRoomIdByPictureId(id);

    const roomDetailsPromise = roomIdPromise.then((roomId) => {
      fetchRoomDetails(roomId);
      fetchFloor(roomId);
    });

    if(!isLoading.current || firstLoad) {
      showLoading([retrievedPopupsPromise, retrievedLinksPromise, roomIdPromise, roomDetailsPromise], 'Chargement des données...', 'Chargement des données réussi', 'Erreur lors du chargement des données');
    }
  
    retrievedPopupsPromise.then((retrievedPopups) => {
      setInfoPopups((prevInfoPopups) => ({
        ...prevInfoPopups,
        [id]: retrievedPopups,
      }));
    });
  
    retrievedLinksPromise.then((retrievedLinks) => {
      setLinks((prevLinks) => ({
        ...prevLinks,
        [id]: retrievedLinks,
      }));
    });
  
    Promise.all([retrievedPopupsPromise, retrievedLinksPromise, roomIdPromise, roomDetailsPromise]).then(() => {
      setLoadingImageBeforeRoomSwitch(false);
    });
  };

  const handleRoomClick = async (id_rooms) => {
    setLoadingImageBeforeRoomSwitch(true);
    const roomImages = allRoomImages[id_rooms];
    if (roomImages) {
      const pictures = roomImages;
      if (pictures.length > 0) {
        const firstImage = pictures[0];
        displayImage(firstImage.imageBlob, firstImage.id);
      }
    }
    setCurrentRoomNumber(id_rooms); // This sets the room id, but currentRoomNumber is the room number string. You may want to update this logic.
  };
  
  const handleLinkClick = (id_pictures_destination) => {
    setLoadingImageBeforeRoomSwitch(true);
    const image = images.find(img => img.id === id_pictures_destination);
    if (image) {
      displayImage(image.imageBlob, image.id);
    }
  };

  useEffect(() => {
    if (images.length > 0 && !isLoading.current && firstLoad.current) {
      if (loadingImage.current) return;
      loadingImage.current = true;
      const firstImage = images[0];
      displayImage(firstImage.imageBlob, firstImage.id);
      // setSelectedImageName(currentRoomName || ''); // Remove this line
      firstLoad.current = false;
    }
  }, [images]);

  useEffect(() => {
      if (!dataFetched.current) {
          fetchAllData();
          dataFetched.current = true;
      }
  }, [location]);

  const filteredRooms = useMemo(() => {
    // First filter out any rooms that are hidden
    const visibleRooms = rooms.filter(room => room.hidden !== 1);
    visibleRooms.sort((a, b) => a.number.localeCompare(b.number));
    
    // Then apply the tour-specific filtering if needed
    return visitType.startsWith('Visite guidée') 
      ? visibleRooms.filter(room => tourSteps.some(step => step.id_rooms === room.id_rooms))
      : visibleRooms;
  }, [visitType, rooms, tourSteps]);
  
  return (
    <div>
      <Loader show={loading} text={textLoading} />
      <div className="panorama-container bg-junia-lavender">
        <div className="h-full scrollable-list flex-col w-15" id="style-2">
          <div className="other-rooms-title">
            Autres Salles
          </div>
          
          {filteredRooms.map(room => (
            <div
              key={room.id_rooms}
              className={`room-container ${currentRoomName === room.name ? 'selected-room' : ''}`}
              onClick={() => handleRoomClick(room.id_rooms)}
            >
              {roomPreviews[room.id_rooms] && (
                <img
                  src={roomPreviews[room.id_rooms]}
                  alt={`Preview of ${room.name}`}
                />
              )}
              <div className="bg-white text-center font-bold text-junia-orange room-title border-junia-orange">
              {room.number} - {room.name}
              </div>
            </div>
          ))}
          
        </div>
        
        <div className="panorama-content">
        {/*<h2>Salle actuelle : {currentRoomName} ({currentRoomNumber})</h2>*/}
          
            <Panorama360 
                infoPopups={infoPopups[currentImageId] || []} 
                selectedPicture={images.find(image => image.id === currentImageId)?.imageBlob ? 
                  URL.createObjectURL(images.find(image => image.id === currentImageId).imageBlob) : null} 
                links={links[currentImageId] || []}
                onLinkClick={handleLinkClick}
                isLoading={(isLoading.current || firstLoad.current || loadingImageBeforeRoomSwitch) }
                floor={currentFloor}
              />
          
        </div>
      </div>
    </div>
  );
};

export default PanoramaViewer;