import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { Viewer, ImagePanorama, Infospot } from "panolens";
import axios from 'axios';

const PanoramaViewer = () => {
  const viewerRef = useRef(null);

  useEffect(() => {
    const viewer = new Viewer({
      container: viewerRef.current,
      autoRotate: true,
      autoRotateSpeed: 0.3,
    });

    const fetchPictures = async () => {
      try {
        const response = await axios.get('http://localhost:8000/pictures');
        const pictures = response.data;
        console.log('Fetched pictures:', pictures);
        pictures.forEach(picture => {
          const panorama = new ImagePanorama(picture.picture);
          viewer.add(panorama);
        }
        );
      } catch (error) {
        console.error('Error fetching pictures', error);
      }
    }

    fetchPictures();

    return () => {
      viewer.dispose();
    };
  }, []);

  const fetchTables = () => {
    axios.get('http://localhost:8000/tables')
      .then(response => {
        console.log('Tables:', response.data);
      })
      .catch(error => {
        console.error('Error fetching tables', error);
      });
  };

  const storeImageBlob = (id, blob) => {
    axios.post('http://localhost:8000/storeImageBlob', { id, blob })
      .then(response => {
        console.log('Image blob stored successfully');
      })
      .catch(error => {
        console.error('Error storing image blob', error);
      });
  };


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
      <button onClick={fetchTables}>Fetch Tables</button>
      <button onClick={() => storeImageBlob(0, '/img/test.jpg')}>Store Image Blob</button>
    </div>
  );
};

export default PanoramaViewer;
