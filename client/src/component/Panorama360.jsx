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
      console.log("Info popups:", infoPopups);
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
      console.log("Links:", links);
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

    const onClick = (event) => {
      const mouse = new THREE.Vector2();
      mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObject(sphere);

      // Check if click intersects already existing links
      if(linksMeshes.length > 0) {
        linksMeshes.forEach((link, index) => {
          const linkIntersects = raycaster.intersectObject(link);
          if (linkIntersects.length > 0 && links[index]) {
            console.log("Link clicked");
            onLinkClick(links[index].id_pictures_destination); // Call the onLinkClick function
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
        
        linksMeshes.push(infoMesh);
        scene.add(infoMesh);
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
