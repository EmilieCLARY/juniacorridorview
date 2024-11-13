import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { Viewer, ImagePanorama, Infospot } from "panolens";

const PanoramaViewer = () => {
  const viewerRef = useRef(null);

  useEffect(() => {

    const imageUrl = "/img/test.jpg";
    const imageUrl2 = "/img/test2.jpg";

    // Créez un panorama avec l'image
    const panorama = new ImagePanorama(imageUrl);
    const panorama2 = new ImagePanorama(imageUrl2);

    // Créez et configurez le viewer
    const viewer = new Viewer({
      container: viewerRef.current,
      autoRotate: true,
      autoRotateSpeed: 0.3,
    });

    // Ajouter le panorama au viewer
    viewer.add(panorama);
    viewer.add(panorama2);

    // Créer un Infospot
    const infospot = new Infospot(20);
    infospot.position.set(0, 0, -200);
    infospot.addHoverText("Voici un InfoSpot", 20);
    panorama.add(infospot);

    // Link panoramas
    panorama.link(panorama2, new THREE.Vector3(0, 0, -200));
    panorama2.link(panorama, new THREE.Vector3(0, 0, -200));

    // Nettoyage lors du démontage du composant
    return () => {
      viewer.dispose();
    };
  }, []);

  return (
    <div
      ref={viewerRef}
      style={{
        width: "100%", // Adaptation à la largeur de l'écran
        height: "500px", // Taille fixe pour la hauteur
        marginBottom: "20px",
        position: "relative", // Assurez-vous que le conteneur est correctement positionné
      }}
    ></div>
  );
};

export default PanoramaViewer;
