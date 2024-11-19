import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { Viewer, ImagePanorama, Infospot } from "panolens";
import axios from 'axios';
import * as api from '../api/AxiosPano';

const PanoramaViewer = () => {
  const viewerRef = useRef(null);

  useEffect(() => {
    const viewer = new Viewer({
      container: viewerRef.current,
      autoRotate: false,
      autoRotateSpeed: 0.3,
    });

    const fetchPictures = async () => {
      const pictures = await api.getPictures();

      /*pictures.forEach(picture => {
        console.log('Fetched pictures:', pictures);
        const panorama = new ImagePanorama(picture.picture);
        viewer.add(panorama);
      });*/
      console.log('Fetched pictures:', pictures[0].picture);

      // Use the data URL in Panolens
      const panorama = new ImagePanorama(pictures[0].picture);

      // Infospot
      const infospot = new Infospot(300); // Taille de l'infospot
      infospot.position.set(-5000, -1300, -3000); // Position dans la scène (x, y, z)

      // Ajout de l'infospot à la scène
      panorama.add(infospot);

      viewer.add(panorama);


      /*try {
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
      }*/
    }

    fetchPictures();

    return () => {
      viewer.dispose();
    };
  }, []);

  const fetchTables = async () => {
    const tables = await api.getTables();
    console.log('Fetched tables:', tables);
  }


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
      <button onClick={() => storeImageBlob(0, '/img/vraies/demonstrateur_4.jpg')}>Store Image Blob</button>
    </div>
  );
};

export default PanoramaViewer;
