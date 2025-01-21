import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { Viewer, ImagePanorama, Infospot } from "panolens";
import axios from 'axios';
import * as api from '../api/AxiosPano';

const PanoramaViewer = () => {
  const viewerRef = useRef(null);
  const [images, setImages] = useState([]);
  const [viewer, setViewer] = useState(null);
  const [currentImageId, setCurrentImageId] = useState(null);
  const [infoPopups, setInfoPopups] = useState({});
  const [links, setLinks] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [firstLoad, setFirstLoad] = useState(true); 

  const fetchTables = async () => {
    const tables = await api.getTables();
    console.log('Fetched tables:', tables);
  };

  const handleUpload = async (event) => {
    event.preventDefault();
    const formData = new FormData(event.target);
    try {
      await axios.post('http://localhost:8000/upload', formData);
      alert('File uploaded successfully');
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('File upload failed');
    }
  };

  const handleInsertInfoPopUp = async (event) => {
    event.preventDefault();
    const formData = new FormData(event.target);
    const data = Object.fromEntries(formData.entries());
    try {
      await axios.post('http://localhost:8000/insertInfoPopUp', data);
      alert('Info popup inserted successfully');
    } catch (error) {
      console.error('Error inserting info popup:', error);
      alert('Info popup insertion failed');
    }
  };

  const handleInsertLink = async (event) => {
    event.preventDefault();
    const formData = new FormData(event.target);
    const data = Object.fromEntries(formData.entries());
    console.log('Data:', data);
    try {
      await axios.post('http://localhost:8000/insertLink', data);
      alert('Link inserted successfully');
    } catch (error) {
      console.error('Error inserting link:', error);
      alert('Link insertion failed');
    }
  };


  const handleRetrieveInfoPopUp = async (imageId) => {
    try {
      const response = await axios.post('http://localhost:8000/retrieveInfoPopUpByIdPicture', { id_pictures: imageId });
      return response.data;
    } catch (error) {
      console.error('Error retrieving info popup:', error);
      alert('Info popup retrieval failed');
      return [];
    }
  };

  const handleRetrieveLinks = async (imageId) => {
    try {
      const response = await axios.post('http://localhost:8000/retrieveLinkByIdPicture', { id_pictures: imageId });
      return response.data;
    } catch (error) {
      console.error('Error retrieving links:', error);
      alert('Link retrieval failed');
      return [];
    }
  };

  const fetchImage = async (id) => {
    try {
      const response = await axios.get(`http://localhost:8000/fetch/${id}`, { responseType: 'blob' });
      const imageUrl = URL.createObjectURL(response.data);
      setImages(prevImages => [...prevImages, { id, imageUrl }]);

    } catch (error) {
      console.error('Error fetching image:', error);
    }
  };

  const fetchPictures = async () => {
    const pictures = await api.getPictures();
    console.log('Fetched pictures:', pictures);
    
    await Promise.all(
      pictures.map(picture => fetchImage(picture.id_pictures))
    );
    
    setIsLoading(false);
  };
  
  const cleanUrlParams = () => {
    const url = new URL(window.location);
    url.search = '';
    window.history.replaceState({}, document.title, url);
  };
  
  const displayImage = async (imageUrl, id) => {
    setCurrentImageId(id);
    const retrievedPopups = await handleRetrieveInfoPopUp(id); // Wait for the retrieval
    setInfoPopups(prevInfoPopups => ({
      ...prevInfoPopups,
      [id]: retrievedPopups
    }));

    const panorama = new ImagePanorama(imageUrl);
    console.log('Popups:', retrievedPopups);

    // Add all infospots
    if (retrievedPopups) {
      retrievedPopups.forEach(popup => {
        const position = new THREE.Vector3(popup.position_x, popup.position_y, popup.position_z);
        const infospot = new Infospot(350);
        infospot.position.copy(position);
        infospot.addHoverText(popup.title);
        panorama.add(infospot);
      });
    }

    // Add all links
    const retrievedLinks = await handleRetrieveLinks(id);
    console.log('Links:', retrievedLinks);
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
          const response = await axios.get(`http://localhost:8000/fetch/${link.id_pictures_destination}`, { responseType: 'blob' });
          const newImageUrl = URL.createObjectURL(response.data);
          displayImage(newImageUrl, link.id_pictures_destination);
        });
        panorama.add(infospot);
      });
    }

    viewer.add(panorama);
    viewer.setPanorama(panorama);
    cleanUrlParams(); // Clean URL parameters after loading the panorama
  };

  const handlePanoramaClick = (event) => {
    const mouse = new THREE.Vector2();
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, viewer.camera);
  
    const intersects = raycaster.intersectObjects(viewer.scene.children, true);
    if (intersects.length > 0) {
      const point = intersects[0].point;
      console.log(`Coordinates: x=${point.x}, y=${point.y}, z=${point.z}`);
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
      if(images.length > 0 && !isLoading && firstLoad) {   
        console.log(images[0].imageUrl, images[0].id);
        displayImage(images[0].imageUrl, images[0].id);
        setFirstLoad(false); // Ensure this is only called once
      } 
  }, [images, isLoading]);
  
  useEffect(() => {
    fetchPictures();
    setCurrentImageId(0);

    const viewerInstance = new Viewer({
      container: viewerRef.current,
      autoRotate: false,
      autoRotateSpeed: 0.3,
    });
    
    setViewer(viewerInstance);

    return () => {
      viewerInstance.dispose();
    };
  }, []);

  return (
    <div>
      <div
        ref={viewerRef}
        style={{
          width: "100%", // Adaptation à la largeur de l'écran
          height: "500px", // Taille fixe pour la hauteur
          marginBottom: "20px",
          position: "relative", // Assurez-vous que le conteneur est correctement positionné
        }}
      ></div>
      <div>
        {images.map((image, index) => (
          <button key={`${image.id}-${index}`} onClick={() => displayImage(image.imageUrl, image.id)}>
            Display Image {image.id}
          </button>
        ))}
      </div>
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
  );
};

export default PanoramaViewer;