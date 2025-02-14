import { Buffer } from 'buffer';
import React, { useEffect, useRef, useState } from "react";
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
  const [isLoading, setIsLoading] = useState(true);
  const [firstLoad, setFirstLoad] = useState(true);
  const [selectedInfospot, setSelectedInfospot] = useState(null);
  const [currentRoomName, setCurrentRoomName] = useState('');
  const [currentRoomNumber, setCurrentRoomNumber] = useState('');
  const [rooms, setRooms] = useState([]);
  const [roomPreviews, setRoomPreviews] = useState({});
  const [visitType, setVisitType] = useState('Visite libre');
  const [tourSteps, setTourSteps] = useState([]);
  const [roomPreviewsData, setRoomPreviewsData] = useState([]);

  const loadingTourSteps = useRef(false);
  const loadingImage = useRef(false);

  const fetchTourSteps = async (tourId) => {
    try {
      const stepsData = await getTourSteps(tourId);
      setTourSteps(stepsData);
      const roomIds = stepsData.map(step => step.id_rooms);
      const roomsData = await Promise.all(roomIds.map(async (id) => {
        const room = await api.getRoomDetails(id);
        return { ...room, id_rooms: id };
      }));
      setRooms(roomsData);
      console.log('Fetched rooms:', roomsData);
      const imagesData = await Promise.all(
        stepsData.map(async step => {
          const picture = await api.getFirstPictureByRoomId(step.id_rooms);
          if (picture) {
            const imageBlob = await api.getImage(picture.id_pictures);
            return { id: picture.id_pictures, imageBlob };
          }
          return null;
        })
      );

      const roomPreviewsData = await Promise.all(
        roomsData.map(async room => {
          const picture = await api.getFirstPictureByRoomId(room.id_rooms);
          if (picture) {
            const imageBlob = await api.getImage(picture.id_pictures);
            return { id_rooms: room.id_rooms, imageBlob };
          }
          return { id_rooms: room.id_rooms, imageBlob: null };
        })
      );

      setImages(imagesData.filter(image => image !== null));
      setCurrentImageId(imagesData[0]?.id || null);
      setRoomPreviews(Object.fromEntries(roomPreviewsData.map(preview => [preview.id_rooms, preview.imageBlob ? URL.createObjectURL(preview.imageBlob) : null])));

      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching tour steps:', error);
    }
  };

  const fetchTables = async () => {
    const tables = await api.getTables();
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

  const fetchImage = async (id) => {
    try {
      const imageBlob = await api.getImage(id);
      setImages(prevImages => [...prevImages, { id, imageBlob }]);
    }
    catch (error) {
      console.error('Error fetching image:', error);
    }
  };

  const fetchPictures = async () => {
    setImages([]);
    const pictures = await api.getPictures();
    
    await Promise.all(
      pictures.map(picture => fetchImage(picture.id_pictures))
    );
    
    setIsLoading(false);
  };
  
  const fetchRooms = async () => {
    const rooms = await api.getRooms();
    setRooms(rooms);
    const roomPreviewsData = await Promise.all(
      rooms.map(async room => {
        const picture = await api.getFirstPictureByRoomId(room.id_rooms);
        if (picture) {
          const imageBlob = await api.getImage(picture.id_pictures);
          return { id_rooms: room.id_rooms, imageBlob };
        }
        return { id_rooms: room.id_rooms, imageBlob: null };
      })
    );
    setRoomPreviews(Object.fromEntries(roomPreviewsData.map(preview => [preview.id_rooms, preview.imageBlob ? URL.createObjectURL(preview.imageBlob) : null])));
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
    setCurrentImageId(id);

    const retrievedPopupsPromise = handleRetrieveInfoPopUp(id);
    const retrievedLinksPromise = handleRetrieveLinks(id);

    const roomIdPromise = api.getRoomIdByPictureId(id);
    const roomDetailsPromise = roomIdPromise.then(roomId => fetchRoomDetails(roomId));

    if(!firstLoad) {
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
    if (images.length > 0 && !isLoading && firstLoad) {
      if(loadingImage.current) return;
      loadingImage.current = true;
      displayImage(images[0].imageBlob, images[0].id);
      setFirstLoad(false);
    }
  }, [images, isLoading]);

  useEffect(() => {
    if (loadingTourSteps.current) return;
    loadingTourSteps.current = true;

    const params = new URLSearchParams(location.search);
    const tourId = params.get('tour_id');
    if (tourId) {
      setVisitType(`Visite guidée, Parcours ${tourId}`);
      const tourStepsPromise = fetchTourSteps(tourId);
      toast.promise(tourStepsPromise, {
        loading: 'Chargement...',
        success: 'Chargement des données réussi',
        error: 'Erreur lors du chargement des données',
      });
      tourStepsPromise.then(() => {
        loadingTourSteps.current = false;
      });
    }
  }, [location]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tourId = params.get('tour_id');
    if (!tourId) {
      const picturePromise = fetchPictures();
      const roomsPromise = fetchRooms();
      toast.promise(Promise.all([picturePromise, roomsPromise]), {
        loading: 'Chargement...',
        success: 'Chargement des données réussi',
        error: 'Erreur lors du chargement des données',
      });
    }
    setCurrentImageId(0);
  }, []);

  const filteredRooms = visitType.startsWith('Visite guidée') 
    ? rooms.filter(room => tourSteps.some(step => step.id_rooms === room.id_rooms))
    : rooms;
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
              <button key={`${image.id}-${index}`} onClick={() => displayImage(image.imageBlob, image.id)}>
                Display Image {image.id}
              </button>
            ))}
        </div>
        <div className="panorama-content">
          <Panorama360 
            infoPopups={infoPopups[currentImageId] || []} 
            selectedPicture={images.find(image => image.id === currentImageId)?.imageBlob ? URL.createObjectURL(images.find(image => image.id === currentImageId).imageBlob) : null} 
            links={links[currentImageId] || []}
            onLinkClick={handleLinkClick} // Pass the function to Panorama360
          />
        </div>
      </div>
      <div className="forms-container">
        <button onClick={fetchTables}>Fetch Tables</button>
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