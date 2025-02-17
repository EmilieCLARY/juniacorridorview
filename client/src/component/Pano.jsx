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

  const [selectedInfospot, setSelectedInfospot] = useState(null);
  const [currentRoomName, setCurrentRoomName] = useState('');
  const [currentRoomNumber, setCurrentRoomNumber] = useState('');
  const [rooms, setRooms] = useState([]);
  const [roomPreviews, setRoomPreviews] = useState({});
  const [visitType, setVisitType] = useState('Visite libre');
  const [tourSteps, setTourSteps] = useState([]);
  const [roomPreviewsData, setRoomPreviewsData] = useState([]);
  const dataFetched = useRef(false);
  
  const loadingTourSteps = useRef(false);
  const loadingImage = useRef(false);

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
        setVisitType(`Visite guidée, Parcours ${tourId}`);
      } else {
        roomsData = await api.getRooms();
      }
  
      setRooms(roomsData);
  
      // Charger les images des pièces
      const roomPreviewsData = await Promise.all(
        roomsData.map(async room => {
          const pictures = await api.getPicturesByRoomId(room.id_rooms);
          const images = await Promise.all(
            pictures.map(async picture => {
              const imageBlob = await api.getImage(picture.id_pictures);
              return { id: picture.id_pictures, imageBlob };
            })
          );
          return { id_rooms: room.id_rooms, images };
        })
      );
  
      setRoomPreviews(
        Object.fromEntries(roomPreviewsData.map(preview => [
          preview.id_rooms, 
          preview.images.length > 0 ? URL.createObjectURL(preview.images[0].imageBlob) : null
        ]))
      );
  
      // Charger les images principales
      const imagesData = roomPreviewsData.flatMap(preview => preview.images);
      setImages(imagesData);
      setCurrentImageId(imagesData[0]?.id || null);
  
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
  
  const handleInfospotClick = (popup) => {
    if (selectedInfospot && selectedInfospot.id === popup.id) {
      setSelectedInfospot(null);
    } else {
      setSelectedInfospot(popup);
    }
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
    });
  };

  const handleRoomClick = async (id_rooms) => {
    const pictures = await api.getPicturesByRoomId(id_rooms);
    if (pictures.length > 0) {
      const firstPicture = pictures[0];
      const imageBlob = await api.getImage(firstPicture.id_pictures);
      displayImage(imageBlob, firstPicture.id_pictures);
    }
  };

  const handleLinkClick = (id_pictures_destination) => {
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
          console.log("Fetching data only once...");
          fetchAllData();
          dataFetched.current = true;
      }
  }, [location]);
  
  

  const filteredRooms = useMemo(() => {
    return visitType.startsWith('Visite guidée') 
      ? rooms.filter(room => tourSteps.some(step => step.id_rooms === room.id_rooms))
      : rooms;
  }, [visitType, rooms, tourSteps]);
  
  return (
    <div>
      <h1>{visitType}</h1>
      <div className="panorama-container">
        <div className="rooms-list">
          <h3>Available Rooms</h3>
          <ul>
            {filteredRooms.map(room => (
              <li key={room.id_rooms} onClick={() => handleRoomClick(room.id_rooms)}>
                {room.name} ({room.number})
                {roomPreviews[room.id_rooms] && (
                  <div className="room-preview">
                    <img src={roomPreviews[room.id_rooms]} alt={`Preview of ${room.name}`} />
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
        <div>
        <h2>Current Room: {currentRoomName} ({currentRoomNumber})</h2>
          {images.map((image, index) => (
            <div key={`${image.id}-${index}`}>
              <button onClick={() => displayImage(image.imageBlob, image.id)}>
                Display Image {image.id}
              </button>
            </div>
          ))}
        </div>
        <div className="panorama-content">
          <Panorama360 
            infoPopups={infoPopups[currentImageId] || []} 
            selectedPicture={images.find(image => image.id === currentImageId)?.imageBlob ? URL.createObjectURL(images.find(image => image.id === currentImageId).imageBlob) : null} 
            links={links[currentImageId] || []}
            onLinkClick={handleLinkClick}
          />
        </div>
      </div>
      <div className="forms-container">
        <form onSubmit={handleUpload}>
          <input type="file" name="pic" />
          <input type="text" name="id_rooms" placeholder="id_rooms"/>
          <input type="submit" value="Upload a file"/>
        </form>
        <form onSubmit={handleInsertInfoPopUp}>
          <input type="text" name="id_pictures" placeholder="id_pictures" />
          <input type="text" name="posX" placeholder="posX" />
          <input type="text" name="posY" placeholder="posY" />
          <input type="text" name="posZ" placeholder="posZ" />
          <input type="text" name="text" placeholder="text" />
          <input type="text" name="title" placeholder="title" />
          <input type="file" name="pic" />
          <input type="submit" value="Add Info Popup" />
        </form>
        <form onSubmit={handleInsertLink}>
          <input type="text" name="id_pictures" placeholder="id_pictures" />
          <input type="text" name="posX" placeholder="posX" />
          <input type="text" name="posY" placeholder="posY" />
          <input type="text" name="posZ" placeholder="posZ" />
          <input type="text" name="id_pictures_destination" placeholder="id_pictures_destination" />
          <input type="submit" value="Add Link" />
        </form>
      </div>
      <div id="panorama-container-dev"></div>
    </div>
  );
};

export default PanoramaViewer;