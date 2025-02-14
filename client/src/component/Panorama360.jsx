import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import React, { useEffect, useRef } from "react";

const Panorama360 = ({ infoPopups, selectedPicture, links, onLinkClick }) => {
  const mountRef = useRef(null);
  const infoTexture = new THREE.TextureLoader().load("/img/info.png");
  const infoMeshes = [];
  const linksTexture = new THREE.TextureLoader().load("/img/links.png");                      
  const linksMeshes = [];

  useEffect(() => {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    mountRef.current.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.rotateSpeed = 0.5;
    controls.enableZoom = false;
    
    camera.position.set(0, 0, 1);
    controls.update();

    const geometry = new THREE.SphereGeometry(500, 60, 40);
    geometry.scale(-1, 1, 1);
    const textureLoader = new THREE.TextureLoader();
    const texture = textureLoader.load(selectedPicture);
    const material = new THREE.MeshBasicMaterial({ map: texture });
    const sphere = new THREE.Mesh(geometry, material);
    scene.add(sphere);

    const onWindowResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener("resize", onWindowResize);

    // Add info spots from props
    if (infoPopups) {
      console.log("Info popups", infoPopups);
      infoPopups.forEach(popup => {
        const infoGeometry = new THREE.PlaneGeometry(20, 20);
        const infoMaterial = new THREE.MeshBasicMaterial({ map: infoTexture, transparent: true });
        const infoMesh = new THREE.Mesh(infoGeometry, infoMaterial);
        const pos = new THREE.Vector3(popup.position_x, popup.position_y, popup.position_z).normalize().multiplyScalar(495);
        infoMesh.position.copy(pos);
        infoMeshes.push(infoMesh);
        scene.add(infoMesh);
      });
    }

    // Add links from props
    if (links) {
      links.forEach(link => {
        const linksGeometry = new THREE.PlaneGeometry(20, 20);
        const linksMaterial = new THREE.MeshBasicMaterial({ map: linksTexture, transparent: true });
        const linksMesh = new THREE.Mesh(linksGeometry, linksMaterial);
        const pos = new THREE.Vector3(link.position_x, link.position_y, link.position_z).normalize().multiplyScalar(495);
        linksMesh.position.copy(pos);
        linksMeshes.push(linksMesh);
        scene.add(linksMesh);
      });
    }

    const createInfoPopup = (popup) => {
      const popupGroup = new THREE.Group();
      
      // Title canvas
      const titleCanvas = document.createElement('canvas');
      const titleContext = titleCanvas.getContext('2d');
      titleContext.font = 'Bold 70px Arial';
      const titleWidth = titleContext.measureText(popup.title).width;
      titleCanvas.width = titleWidth + 20; // Add some padding
      titleCanvas.height = 50;
      titleContext.font = 'Bold 70px Arial';
      titleContext.fillStyle = 'red';
      // put text in capital letters
      titleContext.fillText(popup.title.toUpperCase(), 10, 50);
      const titleTexture = new THREE.CanvasTexture(titleCanvas);
      const titleMaterial = new THREE.MeshBasicMaterial({ map: titleTexture, transparent: true });
      const titleGeometry = new THREE.PlaneGeometry(titleWidth / 5, 12);
      const titleMesh = new THREE.Mesh(titleGeometry, titleMaterial);
      titleMesh.position.set(0, 50, 0);
      popupGroup.add(titleMesh);
      
      // Text canvas
      const textCanvas = document.createElement('canvas');
      const textContext = textCanvas.getContext('2d');
      textContext.font = 'Normal 50px Arial';
      const textWidth = textContext.measureText(popup.text).width;
      textCanvas.width = textWidth + 20; // Add some padding
      textCanvas.height = 256; // Set canvas height
      textContext.font = 'Normal 50px Arial';
      textContext.fillStyle = 'red';
      textContext.fillText(popup.text, 10, 50);
      const textTexture = new THREE.CanvasTexture(textCanvas);
      const textMaterial = new THREE.MeshBasicMaterial({ map: textTexture, transparent: true });
      const textGeometry = new THREE.PlaneGeometry(textWidth / 5, 50);
      const textMesh = new THREE.Mesh(textGeometry, textMaterial);
      textMesh.position.set(-textWidth / 10, 0, 0); // Adjusted position to the left
      popupGroup.add(textMesh);
      
      // Image canvas
      const imageGeometry = new THREE.PlaneGeometry(100, 75); // Adjusted size
      const imageTexture = new THREE.TextureLoader().load(URL.createObjectURL(new Blob([new Uint8Array(popup.image.data)], { type: 'image/png' })));
      const imageMaterial = new THREE.MeshBasicMaterial({ map: imageTexture, transparent: true });
      const imageMesh = new THREE.Mesh(imageGeometry, imageMaterial);
      imageMesh.position.set(textWidth / 10 + 50, 0, 0); // Adjusted position to the right
      popupGroup.add(imageMesh);
      
      return popupGroup;
    };

    const onClick = (event) => {
      const mouse = new THREE.Vector2();
      mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObject(sphere);

      // Check if click intersects already existing info spots
      if(infoMeshes.length > 0) {
        infoMeshes.forEach((info, index) => {
          const infoIntersects = raycaster.intersectObject(info);
          if (infoIntersects.length > 0 && infoPopups[index]) {
            console.log("Info clicked");
            const popupGroup = createInfoPopup(infoPopups[index]);
            const pos = new THREE.Vector3(infoPopups[index].position_x, infoPopups[index].position_y, infoPopups[index].position_z).normalize().multiplyScalar(345);
            popupGroup.position.copy(pos);
            console.log("Popup at", pos);
            scene.add(popupGroup);
            popupGroup.lookAt(camera.position);
            console.log("Popup ajouté à la scène:", scene.children);

          }
        });
      }

      // Check if click intersects already existing links
      if(linksMeshes.length > 0) {
        linksMeshes.forEach((link, index) => {
          const linkIntersects = raycaster.intersectObject(link);
          if (linkIntersects.length > 0 && links[index]) {
            console.log("Link clicked");
            onLinkClick(links[index].id_pictures_destination);
          }
        });
      }

      if (intersects.length > 0) {
        const infoGeometry = new THREE.PlaneGeometry(20, 20);
        const infoMaterial = new THREE.MeshBasicMaterial({ map: linksTexture, transparent: true });
        const infoMesh = new THREE.Mesh(infoGeometry, infoMaterial);
        const hitPoint = intersects[0].point.clone();
        const direction = hitPoint.clone().normalize().multiplyScalar(495);
        infoMesh.position.copy(direction);
        console.log("Click at", hitPoint);
        
        //linksMeshes.push(infoMesh);
        //scene.add(infoMesh);
      }
    };
    document.addEventListener("click", onClick);

    const animate = () => {
      requestAnimationFrame(animate);
      controls.update();
      infoMeshes.forEach(mesh => mesh.lookAt(camera.position)); // Keep info images fixed on the sphere
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      mountRef.current.removeChild(renderer.domElement);
      window.removeEventListener("resize", onWindowResize);
      document.removeEventListener("click", onClick);
    };
  }, [infoPopups, selectedPicture, links, onLinkClick]);

  return <div ref={mountRef} className="w-full h-full" />;
};

export default Panorama360;