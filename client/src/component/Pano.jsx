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

    // Antoine's infospots for testing
    const infospot2 = new Infospot(500);
    infospot2.position.set(-4450, -100, 5555);
    panorama.add(infospot2);
    
    viewer.add(panorama);
    viewer.setPanorama(panorama);
  };

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
        {images.map(image => (
          <button key={image.id} onClick={() => displayImage(image.imageUrl, image.id)}>
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
    </div>
  );
};

export default PanoramaViewer;