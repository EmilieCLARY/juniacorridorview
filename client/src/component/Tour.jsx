import React, {useEffect, useRef, useState, useCallback} from "react";
import { useHistory } from "react-router-dom";
import * as api from '../api/AxiosTour';
import '../style/Tour.css';
import { Buffer } from 'buffer';
import Carousel from '../reactbits/Components/Carousel/Carousel'
import {toast} from "sonner";

const TourViewer = () => {
  Buffer.from = Buffer.from || require('buffer').Buffer;
  const [tours, setTours] = useState([]);
  const [tourSteps, setTourSteps] = useState({});
  const [rooms, setRooms] = useState({});
  const [panoramaUrls, setPanoramaUrls] = useState({});
  const [previewUrls, setPreviewUrls] = useState({});
  const [currentRoomName, setCurrentRoomName] = useState({});
  const loading = useRef(false);
  const history = useHistory();

  const fetchTours = async () => {
    try {
      const toursData = await api.getTours();
      setTours(toursData);
    } catch (error) {
      console.error('Error fetching tours:', error);
    }
  };

  const fetchTourSteps = async (tourId) => {
    try {
      const stepsData = await api.getTourSteps(tourId);
      setTourSteps(prevSteps => ({
        ...prevSteps,
        [tourId]: stepsData
      }));

      // Fetch room details and one panorama URL for each step
      const roomDetails = await Promise.all(
        stepsData.map(step => api.getRoomDetails(step.id_rooms)
          .then(room => ({ ...room, id_rooms: step.id_rooms })) // Add id_rooms to the room object
        )
      );
      setRooms(prevRooms => ({
        ...prevRooms,
        ...Object.fromEntries(roomDetails.map(room => [room.id_rooms, room]))
      }));

      // Try to get previews first, fall back to panorama images
      const imageUrlsData = await Promise.all(
        stepsData.map(async step => {
          // First try to get room preview
          const previewUrl = await api.getRoomPreview(step.id_rooms);
          
          if (previewUrl) {
            // If we have a preview, use it
            return { id_rooms: step.id_rooms, imageUrl: previewUrl, isPreview: true };
          } else {
            // If no preview, fallback to panorama
            const picture = await api.getFirstPictureByRoomId(step.id_rooms);
            if (picture) {
              const imageUrl = await api.getImage(picture.id_pictures);
              return { id_rooms: step.id_rooms, imageUrl, isPreview: false };
            }
            return { id_rooms: step.id_rooms, imageUrl: null, isPreview: false };
          }
        })
      );
      
      // Store the image URLs
      setPanoramaUrls(prevUrls => ({
        ...prevUrls,
        ...Object.fromEntries(imageUrlsData.map(data => [data.id_rooms, data.imageUrl]))
      }));
      
      // Also store which images are previews (for UI indicators if needed)
      setPreviewUrls(prevPreviewState => ({
        ...prevPreviewState,
        ...Object.fromEntries(imageUrlsData.map(data => [data.id_rooms, data.isPreview]))
      }));
    } catch (error) {
      console.error('Error fetching tour steps:', error);
    }
  };

  const fetchRooms = async () => {
    try {
      const roomsData = await api.getRooms();
      setRooms(roomsData);
    } catch (error) {
      console.error('Error fetching rooms:', error);
    }
  };

  const fetchData = async () => {
    const fetchToursPromise = fetchTours();
    const fetchRoomsPromise = fetchRooms();

    toast.promise(Promise.all([fetchToursPromise, fetchRoomsPromise]), {
      loading: 'Chargement...',
      success: 'Chargement des données réussi',
      error: 'Erreur lors du chargement des données',
    });
  };

  const handleTourClick = (tourId) => {
    history.push(`/pano?tour_id=${tourId}`);
  };

  useEffect(() => {
    const fetchAllData = async () => {
      await fetchTours();
      await fetchRooms();
    };

    fetchAllData();

    if (loading.current) return;
    loading.current = true;

    fetchData().then(r => {
      loading.current = false;
    });
  }, []);

  useEffect(() => {
    const fetchAllTourSteps = async () => {
      for (const tour of tours) {
        await fetchTourSteps(tour.id_tours);
      }
    };

    if (tours.length > 0) {
      fetchAllTourSteps();
    }
  }, [tours]);

  const getPanoramaImagesForTour = (tourId) => {
    if (!tourSteps[tourId]) return [];
    let tmp = tourSteps[tourId].map(step => { 
      return { 
        src: panoramaUrls[step.id_rooms], 
        alt: `Image of ${rooms[step.id_rooms]?.name}`,
        roomName: rooms[step.id_rooms]?.name || 'Salle inconnue',
        isPreview: previewUrls[step.id_rooms] || false
      }; 
    });
    if (tmp.some(image => !image.src)) return []; // Wait until all URLs are available
    return tmp;
  };

  const handleCarouselChange = useCallback((tourId, index) => {
    const images = getPanoramaImagesForTour(tourId);
    if (images.length > 0) {
      setCurrentRoomName((prevState) => {
        if (prevState[tourId] === images[index].roomName) return prevState;
        return {
          ...prevState,
          [tourId]: images[index].roomName,
        };
      });
    }
  }, [tourSteps, panoramaUrls, rooms]);

  return (
    <div className="h-100">
      <div className="bg-junia-lavender grid grid-cols-3 gap-10 justify-between p-4 items-start">
        {tours.map(tour => (
          <div key={tour.id_tours} className="purpleborder text-justify bg-white border-5 border-junia-orange p-2 rounded-3xl flex-col">
            <div className="font-title font-bold text-junia-orange text-3xl text-center">{tour.title}</div>
            <div className="font-texts">{tour.description}</div>
            {getPanoramaImagesForTour(tour.id_tours).length > 0 && (
              <div className="mt-4 mb-0">
                  <p className="font-texts font-bold text-center text-junia-violet">Salle : {currentRoomName[tour.id_tours] || getPanoramaImagesForTour(tour.id_tours)[0]?.roomName}</p>
                  <Carousel 
                    items={getPanoramaImagesForTour(tour.id_tours)} 
                    baseWidth="100%" 
                    autoplay={true} 
                    autoplayDelay={3000} 
                    pauseOnHover={true} 
                    loop={true} 
                    round={false}
                    onChange={(index) => handleCarouselChange(tour.id_tours, index)}
                  />
              </div>
            )}
            <div className="flex justify-center">
              <div 
                onClick={() => handleTourClick(tour.id_tours)} 
                className="text-xl text-white font-bold shadow-md font-title text-center bg-junia-orange rounded-3xl p-2 w-1/3 max-w-max inline-block mb-2 mt-2"
              >
                Commencer le parcours
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TourViewer;