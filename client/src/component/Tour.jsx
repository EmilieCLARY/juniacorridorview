import React, { useEffect, useState } from "react";
import { useHistory } from "react-router-dom";
import * as api from '../api/AxiosTour';
import '../style/Tour.css';
import { Buffer } from 'buffer';
import Carousel from '../reactbits/Components/Carousel/Carousel'
const TourViewer = () => {
  Buffer.from = Buffer.from || require('buffer').Buffer;
  const [tours, setTours] = useState([]);
  const [tourSteps, setTourSteps] = useState({});
  const [rooms, setRooms] = useState({});
  const [panoramaUrls, setPanoramaUrls] = useState({});
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
        stepsData.map(step => api.getRoomDetails(step.id_rooms))
      );
      setRooms(prevRooms => ({
        ...prevRooms,
        ...Object.fromEntries(roomDetails.map(room => [room.id_rooms, room]))
      }));

      const panoramaUrlsData = await Promise.all(
        stepsData.map(async step => {
          const picture = await api.getFirstPictureByRoomId(step.id_rooms);
          if (picture) {
            const imageUrl = await api.getImage(picture.id_pictures);
            return { id_rooms: step.id_rooms, imageUrl };
          }
          return { id_rooms: step.id_rooms, imageUrl: null };
        })
      );
      setPanoramaUrls(prevUrls => ({
        ...prevUrls,
        ...Object.fromEntries(panoramaUrlsData.map(panorama => [panorama.id_rooms, panorama.imageUrl]))
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

  const handleTourClick = (tourId) => {
    history.push(`/pano?tour_id=${tourId}`);
  };

  useEffect(() => {
    const fetchAllData = async () => {
      await fetchTours();
      await fetchRooms();
    };

    fetchAllData();
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
    let tmp = tourSteps[tourId].map(step => { return { src: panoramaUrls[step.id_rooms], alt: `Panorama of ${rooms[step.id_rooms]?.name}` }; });
    if (tmp.some(image => !image.src)) return []; // Wait until all URLs are available
    return tmp;
  };

  return (
    <div className="h-100">
      <div className="bg-junia-lavender grid grid-cols-3 grid-flow-col auto-cols-min gap-10 justify-between p-4 h-full">
        {tours.map(tour => (
          <div key={tour.id_tours} className="purpleborder text-justify bg-white border-5 border-junia-orange p-2 rounded-3xl">
            <div className="font-title font-bold text-junia-orange text-3xl text-center">{tour.title}</div>
            <div className="font-texts">{tour.description}</div>
            {getPanoramaImagesForTour(tour.id_tours).length > 0 && (
              <div className="">
                  <Carousel items={getPanoramaImagesForTour(tour.id_tours)} baseWidth="100%" autoplay={true} autoplayDelay={3000} pauseOnHover={true} loop={true} round={false} />
              </div>
            )}
            <div onClick={() => handleTourClick(tour.id_tours)} className="text-xl font-title border-2 rounded-3xl w-sm" >Start Tour</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TourViewer;