import { Buffer } from 'buffer';
import React, { useEffect, useRef, useState, useCallback, useMemo } from "react";
import * as api from '../api/AxiosPano';
import { getTourSteps } from '../api/AxiosTour';
import '../style/Pano.css';
import { toast } from "sonner";
import Panorama360 from './Panorama360';

const PanoramaViewer = ({ location }) => {
  Buffer.from = Buffer.from || require('buffer').Buffer;
  const [images, setImages] = useState([]);
  const [currentImageId, setCurrentImageId] = useState(null);
  const [infoPopups, setInfoPopups] = useState({});
  const [links, setLinks] = useState({});
  const firstLoad = useRef(true);
  const isLoading = useRef(true);

  const [currentRoomName, setCurrentRoomName] = useState('');
  const [currentRoomNumber, setCurrentRoomNumber] = useState('');
  const [rooms, setRooms] = useState([]);
  const [roomPreviews, setRoomPreviews] = useState({});
  const [previewFlags, setPreviewFlags] = useState({}); // Track which images are previews
  const [visitType, setVisitType] = useState('Visite libre');
  const [tourSteps, setTourSteps] = useState([]);
  const dataFetched = useRef(false);
  const [allRoomImages, setAllRoomImages] = useState({});
  
  const loadingImage = useRef(false);
  const [loadingImageBeforeRoomSwitch, setLoadingImageBeforeRoomSwitch] = useState(false);

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

      // Fetch room previews first, then fall back to panoramas if needed
      const previewPromises = roomsData.map(async room => {
        try {
          // Try to get room preview first
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
      
      // Set room previews
      setRoomPreviews(
        Object.fromEntries(roomPreviewsData.map(preview => [
          preview.id_rooms, 
          preview.imageUrl
        ]))
      );
      
      // Set preview flags
      setPreviewFlags(
        Object.fromEntries(roomPreviewsData.map(preview => [
          preview.id_rooms, 
          preview.isPreview
        ]))
      );
  
      // Continue with loading all room images for panoramas
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
    setCurrentRoomNumber(room.number);
  };

  const displayImage = async (imageBlob, id) => {
    cleanUrlParams();
    if (currentImageId !== id) setCurrentImageId(id);

    const retrievedPopupsPromise = handleRetrieveInfoPopUp(id);
    const retrievedLinksPromise = handleRetrieveLinks(id);

    const roomIdPromise = api.getRoomIdByPictureId(id);
    const roomDetailsPromise = roomIdPromise.then(roomId => fetchRoomDetails(roomId));

    if(!isLoading.current || firstLoad) {
      toast.promise(Promise.all([retrievedPopupsPromise, retrievedLinksPromise, roomIdPromise, roomDetailsPromise]), {
          loading: 'Chargement...',
          success: 'Chargement des données réussi',
          error: 'Erreur lors du chargement des données',
      });
    }

    retrievedPopupsPromise.then((retrievedPopupsPromise) => {
      setInfoPopups(prevInfoPopups => ({
        ...prevInfoPopups,
        [id]: retrievedPopupsPromise
      }));
    });

    retrievedLinksPromise.then((retrievedLinksPromise) => {
      setLinks(prevLinks => ({
        ...prevLinks,
        [id]: retrievedLinksPromise
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
      if(loadingImage.current) return;
      loadingImage.current = true;
      displayImage(images[0].imageBlob, images[0].id);
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
    
    // Then apply the tour-specific filtering if needed
    return visitType.startsWith('Visite guidée') 
      ? visibleRooms.filter(room => tourSteps.some(step => step.id_rooms === room.id_rooms))
      : visibleRooms;
  }, [visitType, rooms, tourSteps]);
  
  return (
    <div>
      
      <div className="panorama-container">
        <div className="rooms-list flex-col w-15 h-full">
          <div className="font-title font-bold text-2xl text-junia-orange sticky top-0 bg-white z-10 py-2">
            Autres Salles
          </div>
          
          {filteredRooms.map(room => (
              <div key={room.id_rooms} className="flex  justify-start items-end h-64 m-2" onClick={() => handleRoomClick(room.id_rooms)}>
                
                {roomPreviews[room.id_rooms] && (
                  <div className=" w-full h-full relative">
                    <img src={roomPreviews[room.id_rooms]} alt={`Preview of ${room.name}`} className="h-full w-full object-cover rounded-lg" />
                    <div className="absolute inset-0 bg-gradient-to-t from-white to-transparent rounded-lg"></div>
                    {previewFlags[room.id_rooms] && (
                      <div className="absolute top-2 right-2 bg-junia-orange text-white text-xs font-bold px-2 py-1 rounded">
                        Preview
                      </div>
                    )}
                  </div>
                )}
                <div className="text-junia-orange font-bold absolute bottom-0 z-10 w-15 wrapped-text  px-3">{room.name} ({room.number})</div>
              </div>
            ))}
          
        </div>
        <div>
        </div>
        <div className="panorama-content">
        {/*<h2>Salle actuelle : {currentRoomName} ({currentRoomNumber})</h2>*/}
          <Panorama360 
            infoPopups={infoPopups[currentImageId] || []} 
            selectedPicture={images.find(image => image.id === currentImageId)?.imageBlob ? URL.createObjectURL(images.find(image => image.id === currentImageId).imageBlob) : null} 
            links={links[currentImageId] || []}
            onLinkClick={handleLinkClick}
            isLoading={(isLoading.current || firstLoad.current || loadingImageBeforeRoomSwitch) }
          />
        </div>
      </div>
    </div>
  );
};

export default PanoramaViewer;