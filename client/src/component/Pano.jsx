import { Buffer } from 'buffer';
import { ImagePanorama, Infospot, Viewer } from "panolens";
import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import * as api from '../api/AxiosPano';
import { getTourSteps } from '../api/AxiosTour'; // Add this line
import '../style/Pano.css';
import { getImage } from '../api/AxiosPano';

const PanoramaViewer = ({ location }) => {
  Buffer.from = Buffer.from || require('buffer').Buffer;
  const viewerRef = useRef(null);
  const [images, setImages] = useState([]);
  const [viewer, setViewer] = useState(null);
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

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tourId = params.get('tour_id');
    if (tourId) {
      setVisitType(`Visite guidée, Parcours ${tourId}`);
      fetchTourSteps(tourId);
    }
  }, [location]);

  const fetchTourSteps = async (tourId) => {
    try {
      const stepsData = await getTourSteps(tourId);
      setTourSteps(stepsData);
      const roomIds = stepsData.map(step => step.id_rooms);
      const roomsData = await Promise.all(roomIds.map(async (id) => {
        const room = await api.getRoomDetails(id);
        return { ...room, id_rooms: id }; // Ajoute id_rooms manuellement si absent
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

      // Add previews for each room
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
    setCurrentImageId(id);
    const retrievedPopups = await handleRetrieveInfoPopUp(id); // Wait for the retrieval
    setInfoPopups(prevInfoPopups => ({
      ...prevInfoPopups,
      [id]: retrievedPopups
    }));

    // Supprimer tous les panoramas avant d'en ajouter un nouveau
    if (viewer && viewer.panorama) {
      viewer.remove(viewer.panorama);
    }

    const panorama = new ImagePanorama(URL.createObjectURL(imageBlob));

    // Add all infospots
    if (retrievedPopups) {
      retrievedPopups.forEach(popup => {
        const position = new THREE.Vector3(popup.position_x, popup.position_y, popup.position_z);
        const infospot = new Infospot(350);
        infospot.position.copy(position);
        infospot.addHoverText(popup.title);
        infospot.addEventListener('click', () => handleInfospotClick(popup));
        panorama.add(infospot);
      });
    }

    // Add all links
    const retrievedLinks = await handleRetrieveLinks(id);
    setLinks(prevLinks => ({
      ...prevLinks,
      [id]: retrievedLinks
    }));

    if (retrievedLinks) {
      retrievedLinks.forEach(link => {
        const position = new THREE.Vector3(link.position_x, link.position_y, link.position_z);
        const infospot = new Infospot(350, '/img/chain.png');
        infospot.position.copy(position);
        infospot.addHoverText(`Go to panorama ${link.id_pictures_destination}`);
        infospot.addEventListener('click', async () => {
          const newImageBlob = await api.getImage(link.id_pictures_destination);
          displayImage(newImageBlob, link.id_pictures_destination);
        });
        panorama.add(infospot);
      });
    }

    viewer.add(panorama);
    viewer.setPanorama(panorama);
    cleanUrlParams();

    // Fetch and set the room details
    const roomId = await api.getRoomIdByPictureId(id);
    fetchRoomDetails(roomId);
  };

  const handlePanoramaClick = (event) => {
    if (!viewer || !viewer.panorama) return;

    const intersects = viewer.raycaster.intersectObject(viewer.panorama, true);
    
    if (intersects.length > 0) {
      const { x, y, z } = intersects[0].point;

      console.log(`Clicked Position: X: ${-x}, Y: ${y}, Z: ${z}`);
    };
  }

  const handleRoomClick = async (id_rooms) => {
    const pictures = await api.getPicturesByRoomId(id_rooms);
    if (pictures.length > 0) {
      const firstPicture = pictures[0];
      const imageBlob = await api.getImage(firstPicture.id_pictures);
      displayImage(imageBlob, firstPicture.id_pictures);
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
    if (images.length > 0 && !isLoading && firstLoad) {
      displayImage(images[0].imageBlob, images[0].id);
      setFirstLoad(false);
    }
  }, [images, isLoading]);

  useEffect(() => {
    if (!viewerRef.current || viewer) return;

    const viewerInstance = new Viewer({
      container: viewerRef.current,
      autoRotate: false,
      autoRotateSpeed: 0.3,
    });

    setViewer(viewerInstance);

    return () => {
      viewerInstance.dispose();
      viewerRef.current.innerHTML = "";
    };
  }, []);  

  useEffect(() => {
    if (!viewer) return;

    const params = new URLSearchParams(location.search);
    const tourId = params.get('tour_id');
    if (!tourId) {
      fetchPictures();
      fetchRooms();
    }
    setCurrentImageId(0);
  }, [viewer]);

                    
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
        <div className="panorama-content">
          <div>
            <h2>Current Room: {currentRoomName} ({currentRoomNumber})</h2>
            {images.map((image, index) => (
              <button key={`${image.id}-${index}`} onClick={() => displayImage(image.imageBlob, image.id)}>
                Display Image {image.id}
              </button>
            ))}
          </div>
          <div ref={viewerRef} className="viewer-container">
            {selectedInfospot && (
              <div className="infospot-popup">
                <button onClick={() => setSelectedInfospot(null)}>✖</button>
                <h3>{selectedInfospot.title}</h3>
                <p>{selectedInfospot.text}</p>
                {selectedInfospot.image && (
                  <img src={`data:image/jpeg;base64,${Buffer.from(selectedInfospot.image).toString('base64')}`} alt="Infospot" />
                )}
              </div>
            )}
          </div>
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
    </div>
  );
};

export default PanoramaViewer;