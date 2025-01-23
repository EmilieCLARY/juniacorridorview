import React, { useEffect, useState } from "react";
import { useHistory } from "react-router-dom";
import * as api from '../api/AxiosTour';
import '../style/Tour.css';

const TourViewer = () => {
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

  const handleTourClick = (tourId) => {
    history.push(`/pano?tour_id=${tourId}`);
  };

  useEffect(() => {
    fetchTours();
  }, []);

  return (
    <div>
      <h1>Tours</h1>
      <div className="tours-container">
        {tours.map(tour => (
          <div key={tour.id_tours} className="tour-item">
            <h2>Tour {tour.id_tours}</h2>
            <h3>{tour.title}</h3>
            <p>{tour.description}</p>
            <button onClick={() => handleTourClick(tour.id_tours)}>Start Tour</button>
            <button onClick={() => fetchTourSteps(tour.id_tours)}>Show Steps</button>
            {tourSteps[tour.id_tours] && (
              <ul>
                {tourSteps[tour.id_tours].map(step => (
                  <li key={step.id_tour_steps}>
                    Step {step.step_number}: Room {rooms[step.id_rooms]?.name} ({rooms[step.id_rooms]?.number})
                    {panoramaUrls[step.id_rooms] && (
                      <div className="panorama-overview">
                        <img src={panoramaUrls[step.id_rooms]} alt={`Panorama of ${rooms[step.id_rooms]?.name}`} />
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default TourViewer;
