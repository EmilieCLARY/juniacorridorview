import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import React, { useEffect, useRef, useState, useCallback } from "react";

const Panorama360 = ({ infoPopups, selectedPicture, links, onLinkClick, onPositionSelect, isLoading, disableClick}) => {
  const mountRef = useRef(null);
  const rendererRef = useRef(null);
  const cameraRef = useRef(null);
  const initialDimensionsRef = useRef({ width: 0, height: 0 });

  const infoTexture = new THREE.TextureLoader().load("/img/info.png");
  infoTexture.colorSpace = THREE.SRGBColorSpace;
  const infoMeshes = [];
  const linksTexture = new THREE.TextureLoader().load("/img/arrow.png");
  linksTexture.colorSpace = THREE.SRGBColorSpace;
  const linksMeshes = [];
  const displayedPopups = [];

  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      mountRef.current.requestFullscreen().then(() => {
        setIsFullscreen(true);
      }).catch(err => {
        alert(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
      });
    } else {
      document.exitFullscreen().catch(err => {
        alert(`Error attempting to exit full-screen mode: ${err.message} (${err.name})`);
      });
    }
  };

  const createInfoPopup = (popup) => {
    const popupGroup = new THREE.Group();

    // Create a single canvas for all information
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    context.font = 'Bold 70px Arial';
    context.font = 'Normal 50px Arial';

    let canvasWidth = 0;
    let canvasHeight = 0;

    const lineHeight = 60; // Adjust line height as needed

    const image = new Image();
    image.onload = () => {
      var imageWidth = image.width;
      var imageHeight = image.height;
      const aspectRatio = imageWidth / imageHeight;

      if (imageWidth < imageHeight) {   // Si l'image est en format portrait
        const maxImageWidth = 600;
        const maxImageHeight = 450;

        // Calculate new dimensions while maintaining aspect ratio
        if (imageWidth > maxImageWidth) {
          imageWidth = maxImageWidth;
          imageHeight = maxImageWidth / aspectRatio;
        } else if (imageHeight > maxImageHeight) {
          imageHeight = maxImageHeight;
          imageWidth = maxImageHeight * aspectRatio;
        }

        // Calculate the dimensions of the canvas
        canvasWidth = 60 + 2 * imageWidth + 60; // Add extra width for the image and padding

        // Calculate the height needed for the text
        const textLines = wrapText(context, popup.text.slice(0, 50), imageWidth); 
        const textHeight = textLines.length * lineHeight + 50;

        // Adjust canvas height based on text and image height
        canvasHeight = Math.max(imageHeight, textHeight) + 350; // Add extra height for the title and padding

        // Set the canvas dimensions
        canvas.width = canvasWidth;
        canvas.height = canvasHeight;

        // Background color with rounded border
        const radius = 20; // Adjust the radius for rounded corners
        context.fillStyle = '#e85c30';
        context.strokeStyle = '#3c2c53';
        context.lineWidth = 10;
        context.beginPath();
        context.moveTo(radius, 0);
        context.lineTo(canvasWidth - radius, 0);
        context.arcTo(canvasWidth, 0, canvasWidth, radius, radius);
        context.lineTo(canvasWidth, canvasHeight - radius);
        context.arcTo(canvasWidth, canvasHeight, canvasWidth - radius, canvasHeight, radius);
        context.lineTo(radius, canvasHeight);
        context.arcTo(0, canvasHeight, 0, canvasHeight - radius, radius);
        context.lineTo(0, radius);
        context.arcTo(0, 0, radius, 0, radius);
        context.closePath();
        context.fill();
        context.stroke();

        // Title
        context.font = 'Bold 70px Arial';
        context.fillStyle = 'white';
        context.textAlign = 'center';

        // Wrap title text if it exceeds the canvas width
        const titleLines = wrapText(context, popup.title.toUpperCase().slice(0, 40), canvasWidth - 80); // Add padding
        const titleYStart = 110; // Starting Y position for the title
        const titleLineHeight = 70; // Line height for the title

        titleLines.forEach((line, i) => {
          context.fillText(line, canvasWidth / 2, titleYStart + i * titleLineHeight);
        });

        // Text
        context.font = 'Normal 52px Arial';
        context.fillStyle = 'white';
        context.textAlign = 'left';

        const textX = 40;
        const titleHeight = titleLines.length * titleLineHeight;
        const textY = titleYStart + titleHeight ; // Add padding after title

        let lines = wrapText(context, popup.text, imageWidth);
        lines.forEach((line, i) => {
          context.fillText(line, textX, textY + (i + 1) * lineHeight);
        });

        const imgX = canvasWidth - imageWidth - 40;
        const imgY = titleYStart + titleHeight + 10; // Add padding after title

        // Image (optional)
        if (popup.image) {
          // Draw image
          context.drawImage(image, imgX, imgY, imageWidth, imageHeight);

          // Draw border around the image
          context.strokeStyle = '#3c2c53';
          context.lineWidth = 5;
          context.strokeRect(imgX, imgY, imageWidth, imageHeight);
        }
      }

      /*---------------------------------------------------------*/

      else {     // Si l'image est en format paysage
        const maxImageWidth = 1100;
        const maxImageHeight = 500;

        // Calculate new dimensions while maintaining aspect ratio
        if (imageWidth > maxImageWidth) {
          imageWidth = maxImageWidth;
          imageHeight = maxImageWidth / aspectRatio;
        } else if (imageHeight > maxImageHeight) {
          imageHeight = maxImageHeight;
          imageWidth = maxImageHeight * aspectRatio;
        }

        // Set initial canvas width
        canvasWidth = 60 + imageWidth + 60;

        // Temporarily set canvas width to measure text correctly
        canvas.width = canvasWidth;
        context.font = 'Bold 70px Arial';

        // Get text dimensions with correct canvas width
        const titleLines = wrapText(context, popup.title.toUpperCase().slice(0, 40), canvasWidth - 100);
        context.font = 'Normal 52px Arial';
        const textLines = wrapText(context, popup.text, imageWidth);

        // Calculate vertical spacing
        const titleYStart = 110;
        const titleLineHeight = 70;
        const titleHeight = titleLines.length * titleLineHeight;
        const textY = titleYStart + titleHeight + 30;
        const textHeight = textLines.length * lineHeight;
        const imgY = textY + textHeight + 20;

        // Set final canvas height
        canvasHeight = imgY + imageHeight + 50;
        canvas.height = canvasHeight;

        // Reset context properties after canvas resize
        context.fillStyle = '#e85c30';
        context.strokeStyle = '#3c2c53';
        context.lineWidth = 10;

        // Draw background
        const radius = 20;
        context.beginPath();
        context.moveTo(radius, 0);
        context.lineTo(canvasWidth - radius, 0);
        context.arcTo(canvasWidth, 0, canvasWidth, radius, radius);
        context.lineTo(canvasWidth, canvasHeight - radius);
        context.arcTo(canvasWidth, canvasHeight, canvasWidth - radius, canvasHeight, radius);
        context.lineTo(radius, canvasHeight);
        context.arcTo(0, canvasHeight, 0, canvasHeight - radius, radius);
        context.lineTo(0, radius);
        context.arcTo(0, 0, radius, 0, radius);
        context.closePath();
        context.fill();
        context.stroke();

        // Reset font and draw title
        context.font = 'Bold 70px Arial';
        context.fillStyle = 'white';
        context.textAlign = 'center';
        titleLines.forEach((line, i) => {
          context.fillText(line, canvasWidth / 2, titleYStart + i * titleLineHeight);
        });

        // Reset font and draw text
        context.font = 'Normal 55px Arial';
        context.fillStyle = 'white';
        context.textAlign = 'left';
        const textX = 40;
        textLines.forEach((line, i) => {
          context.fillText(line, textX, textY + i * lineHeight);
        });

        // Draw image if available
        const imgX = (canvasWidth - imageWidth) / 2;
        if (popup.image) {
          context.drawImage(image, imgX, imgY, imageWidth, imageHeight);
          context.strokeStyle = '#3c2c53';
          context.lineWidth = 5;
          context.strokeRect(imgX, imgY, imageWidth, imageHeight);
        }
      }

      // Create texture and mesh after the image is loaded and drawn
      const texture = new THREE.CanvasTexture(canvas);
      texture.colorSpace = THREE.SRGBColorSpace;
      const material = new THREE.MeshBasicMaterial({ 
        map: texture, 
        transparent: true
      });
      const geometry = new THREE.PlaneGeometry(canvasWidth / 5, canvasHeight / 5);
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(0, 50, 0);
      popupGroup.add(mesh);
    };

    image.src = URL.createObjectURL(new Blob([new Uint8Array(popup.image.data)], { type: 'image/png' }));

    return popupGroup;
  };

  const wrapText = (context, text, maxWidth) => {
    const words = text.split(' ');
    const lines = [];
    let currentLine = words[0];

    for (let i = 1; i < words.length; i++) {
      const word = words[i];
      const width = context.measureText(currentLine + ' ' + word).width;
      if (width < maxWidth) {
        currentLine += ' ' + word;
      } else {
        lines.push(currentLine);
        currentLine = word;
      }
    }
    lines.push(currentLine);
    return (lines);
  };

  let camera;
  let sphere;
  let scene;

  // Ajouter ces variables pour le hover
  const originalScale = new THREE.Vector3(1.2, 1.2, 1.2);
  const hoverScale = new THREE.Vector3(1.5, 1.5, 1.5);

  const handleResize = useCallback(() => {
    if (!mountRef.current || !rendererRef.current || !cameraRef.current) return;

    const width = isFullscreen ? window.innerWidth : mountRef.current.clientWidth;
    const height = isFullscreen ? window.innerHeight : mountRef.current.clientHeight;

    cameraRef.current.aspect = width / height;
    cameraRef.current.updateProjectionMatrix();
    rendererRef.current.setSize(width, height);
  }, [isFullscreen]);

  useEffect(() => {
    if (!mountRef.current || isLoading) return;

    // Store initial dimensions
    initialDimensionsRef.current = {
      width: mountRef.current.clientWidth,
      height: mountRef.current.clientHeight
    };

    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, mountRef.current.clientWidth / mountRef.current.clientHeight, 0.1, 1000);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ 
      antialias: true,
      preserveDrawingBuffer: true
    });
    rendererRef.current = renderer;

    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1;

    mountRef.current.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.rotateSpeed = 0.5;
    controls.enableZoom = false;
    
    camera.position.set(0, 0, 1);
    controls.update();

    const geometry = new THREE.SphereGeometry(500, 32, 16);
    geometry.scale(-1, 1, 1);
    const textureLoader = new THREE.TextureLoader();
    const texture = textureLoader.load(selectedPicture);
    texture.colorSpace = THREE.SRGBColorSpace;
    const material = new THREE.MeshBasicMaterial({ 
      map: texture
    });
    sphere = new THREE.Mesh(geometry, material);
    scene.add(sphere);

    const onWindowResize = () => {
      handleResize();
    };
    
    window.addEventListener("resize", onWindowResize);

    // Ajout des infospots
    if (infoPopups) {
      infoPopups.forEach(popup => {
        const infoGeometry = new THREE.PlaneGeometry(20, 20);
        const infoMaterial = new THREE.MeshBasicMaterial({ 
          map: infoTexture, 
          transparent: true,
        });
        const infoMesh = new THREE.Mesh(infoGeometry, infoMaterial);
        const pos = new THREE.Vector3(popup.position_x, popup.position_y, popup.position_z).normalize().multiplyScalar(495);
        infoMesh.position.copy(pos);
        infoMeshes.push(infoMesh);
        scene.add(infoMesh);
      });
    }

    // Ajout des liens
    if (links) {
      links.forEach(link => {
        const linksGeometry = new THREE.PlaneGeometry(20, 20);
        const linksMaterial = new THREE.MeshBasicMaterial({ 
          map: linksTexture, 
          transparent: true,
        });
        const linksMesh = new THREE.Mesh(linksGeometry, linksMaterial);
        const pos = new THREE.Vector3(link.position_x, link.position_y, link.position_z).normalize().multiplyScalar(495);
        linksMesh.position.copy(pos);
        linksMeshes.push(linksMesh);
        scene.add(linksMesh);
      });
    }
    
    // Ajouter l'événement de clic
    document.addEventListener("click", onClick);

    // Ajouter la gestion du hover
    const onMouseMove = (event) => {
      if (!mountRef.current) return;
      
      const rect = mountRef.current.getBoundingClientRect();
      const mouse = new THREE.Vector2();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(mouse, camera);

      // Réinitialiser l'échelle de tous les meshes
      [...infoMeshes, ...linksMeshes].forEach(mesh => {
        mesh.scale.copy(originalScale);
      });

      // Vérifier le hover sur les infospots et les liens
      const intersects = raycaster.intersectObjects([...infoMeshes, ...linksMeshes]);
      if (intersects.length > 0) {
        intersects[0].object.scale.copy(hoverScale);
        mountRef.current.style.cursor = 'pointer';
      } else {
        mountRef.current.style.cursor = 'grab';
      }
    };

    document.addEventListener('mousemove', onMouseMove);

    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
      handleResize();
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    handleResize();
    
    const animate = () => {
      requestAnimationFrame(animate);
      controls.update();
      infoMeshes.forEach(mesh => mesh.lookAt(camera.position));
      linksMeshes.forEach(mesh => mesh.lookAt(camera.position));
      displayedPopups.forEach(popup => popup.lookAt(camera.position));
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      if (mountRef.current) {
        mountRef.current.removeChild(renderer.domElement);
      }
      window.removeEventListener("resize", onWindowResize);
      document.removeEventListener("click", onClick);
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      
      // Nettoyer les ressources Three.js
      infoMeshes.length = 0;
      linksMeshes.length = 0;
      displayedPopups.length = 0;
    };
  }, [infoPopups, selectedPicture, links, isLoading, handleResize]);

  const onClick = (event) => {
    if (!mountRef.current) return;
    console.log("Click event ::::" + disableClick);
    if (disableClick) return;

    // Récupérer la taille et position du conteneur
    const rect = mountRef.current.getBoundingClientRect();

    // Convertir la position de la souris en coordonnées normalisées pour Three.js
    const mouse = new THREE.Vector2();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    // Création du raycaster
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, camera);

    // Vérifier si un infospot est cliqué
    infoMeshes.forEach((info, index) => {
      const intersects = raycaster.intersectObject(info);
      if (intersects.length > 0 && infoPopups[index]) {
        console.log("Info spot clicked"); // Debug log
        const existingPopup = displayedPopups.find(popup => popup.name === `popup_${index}`);
        const popupGroup = createInfoPopup(infoPopups[index]);
        popupGroup.name = `popup_${index}`;
        const pos = new THREE.Vector3(infoPopups[index].position_x, infoPopups[index].position_y, infoPopups[index].position_z)
            .normalize()
            .multiplyScalar(345);
        popupGroup.position.copy(pos);
        scene.add(popupGroup);
        popupGroup.lookAt(camera.position);
        displayedPopups.push(popupGroup);
        console.log("Popup ajouté à la scène");
      }
    });

    // Vérifier si un lien est cliqué
    linksMeshes.forEach((link, index) => {
      const intersects = raycaster.intersectObject(link);
      if (intersects.length > 0 && links[index]) {
        console.log("Link clicked"); // Debug log
        onLinkClick(links[index].id_pictures_destination);
      }
    });

    // Vérifier si un point de la sphère est cliqué
    const intersects = raycaster.intersectObject(sphere);
    if (intersects.length > 0) {
      const infoGeometry = new THREE.PlaneGeometry(20, 20);
      const infoMaterial = new THREE.MeshBasicMaterial({ map: infoTexture, transparent: true });
      const infoMesh = new THREE.Mesh(infoGeometry, infoMaterial);
      const hitPoint = intersects[0].point.clone();
      const direction = hitPoint.clone().normalize().multiplyScalar(495);
      infoMesh.position.copy(direction);
      console.log("Click at", hitPoint);

      if (intersects.length > 0) {
        const hitPoint = intersects[0].point.clone();
        console.log("Selected Position:", hitPoint);

        if (typeof onPositionSelect === "function") {
          if (window.isSelectingPosition) {
            if (window.isFirstClick) {
              window.isFirstClick = false;
            } else {
              onPositionSelect({ x: hitPoint.x, y: hitPoint.y, z: hitPoint.z });
              window.isSelectingPosition = false;
              window.isFirstClick = true;
            }
          }
        } else {
          console.warn("onPositionSelect n'est pas une fonction");
        }
      }
    }

    // Check if the 'X' button is clicked
    displayedPopups.forEach((popupGroup, index) => {
      const closeButton = popupGroup.children[0];
      if (closeButton) {
        const intersects = raycaster.intersectObject(closeButton);
        if (intersects.length > 0) {
          scene.remove(popupGroup);
          displayedPopups.splice(index, 1);
          console.log("Popup closed");
        }
      }
    });
  };

  return (
    <div ref={mountRef} className="w-full h-full relative">
      <img
        src={isFullscreen ? "/img/fullscreen-exit.svg" : "/img/fullscreen.png"}
        alt="Fullscreen"
        onClick={toggleFullscreen}
        style={{
          position: "absolute",
          bottom: "10px",
          right: "10px",
          width: "40px",
          height: "40px",
          cursor: "pointer"
        }}
      />
      <img
        src={"/img/logojunia.png"}
        alt="floor_plan"
        onClick={toggleFullscreen}
        style={{
          position: "absolute",
          top: "0px",
          right: "0px",
          width: "15vw",
          height: "15vh",
          cursor: "pointer"
        }}
      />

    </div>
  );
};

export default React.memo(Panorama360);
