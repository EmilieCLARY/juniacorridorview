import React, {useEffect, useRef, useState, useCallback} from "react";
import { useHistory } from "react-router-dom";
import * as api from '../api/AxiosTour';
import '../style/Tour.css';
import { Buffer } from 'buffer';
import Carousel from '../reactbits/Components/Carousel/Carousel'
import {toast} from "sonner";
import Loader from "./Loader";
import Masonry from 'react-masonry-css';

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

  const [isLoading, setIsLoading] = useState(true);
  const [textLoading, setTextLoading] = useState("Chargement des données...");

  // Define breakpoints for Masonry layout
  const breakpointColumnsObj = {
    default: 3,
    1100: 2,
    700: 1
  };

  const showLoading = (promises, textLoading, textSuccess, textError) => {
    setIsLoading(true);
    setTextLoading(textLoading);
    // Return a toaster success after all promises are resolved
    Promise.all(promises)
        .then(() => {
          setIsLoading(false);
          toast.success(textSuccess);
        })
        .catch((error) => {
          setIsLoading(false);
          console.error('Error fetching data:', error);
          toast.error(textError);
        });
  }

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

      // Fetch plan details and one panorama URL for each step
      const roomDetails = await Promise.all(
        stepsData.map(step => api.getRoomDetails(step.id_rooms)
          .then(room => ({ ...room, id_rooms: step.id_rooms })) // Add id_rooms to the plan object
        )
      );
      setRooms(prevRooms => ({
        ...prevRooms,
        ...Object.fromEntries(roomDetails.map(room => [room.id_rooms, room]))
      }));

      // Try to get previews first, fall back to panorama images
      const imageUrlsData = await Promise.all(
        stepsData.map(async step => {
          // First try to get plan preview
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

  const fetchAllTourSteps = async () => {
    try {
      for (const tour of tours) {
        await fetchTourSteps(tour.id_tours);
      }
    } catch (error) {
      console.error('Error fetching all tour steps:', error);
    }
  }

  const handleTourClick = (tourId) => {
    history.push(`/pano?tour_id=${tourId}`);
  };

  useEffect(() => {
    if (loading.current) return;
    loading.current = true;

    const fetchToursPromise = fetchTours();
    const fetchRoomsPromise = fetchRooms();

    Promise.all([fetchToursPromise, fetchRoomsPromise])
        .then(() => {
            loading.current = false;
        }
    );
  }, []);

  useEffect(() => {
    if (tours.length > 0) {
      const fetchAllTourStepsPromise = fetchAllTourSteps();
      showLoading([fetchAllTourStepsPromise], 'Chargement des parcours...', 'Chargement des parcours réussi', 'Erreur lors du chargement des parcours');
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
      <Loader show={isLoading} text={textLoading} />
      <div className="bg-junia-lavender p-4">
        <Masonry
          breakpointCols={breakpointColumnsObj}
          className="my-masonry-grid"
          columnClassName="my-masonry-grid_column"
        >
          {tours.map(tour => (
            <div key={tour.id_tours} className=" text-justify bg-white p-2 rounded-3xl flex-col">
              <div className="font-title font-bold text-junia-orange text-3xl text-center">{tour.title}</div>
              <div className="font-texts">{tour.description}</div>
              {getPanoramaImagesForTour(tour.id_tours).length > 0 && (
                <div className="mt-4" style={{ height: "500px" }}>
                    <p className="font-texts font-bold text-center text-junia-violet">Salle : {currentRoomName[tour.id_tours] || getPanoramaImagesForTour(tour.id_tours)[0]?.roomName}</p>
                    <div style={{ height: "500px" }}>
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
                </div>
              )}
              <div className="flex justify-center margin-top-8">
                <div 
                  onClick={() => handleTourClick(tour.id_tours)} 
                  className="text-xl text-white font-bold shadow-md font-title text-center bg-junia-orange rounded-3xl p-2 w-1/3 max-w-max inline-block mb-2 mt-2 cursor-pointer bouton-modifier"
                >
                  Commencer le parcours
                </div>
              </div>
            </div>
          ))}
        </Masonry>
      </div>
    </div>
  );
};

export default TourViewer;