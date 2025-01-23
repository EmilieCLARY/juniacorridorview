import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { Viewer, ImagePanorama, Infospot } from "panolens";
import axios from 'axios';
import '../style/Tour.css';

const TourViewer = () => {
  const [tours, setTours] = useState([]);
  const [tourSteps, setTourSteps] = useState({});

  const fetchTours = async () => {
    try {
      const response = await axios.get('http://localhost:8000/tours');
      setTours(response.data);
    } catch (error) {
      console.error('Error fetching tours:', error);
    }
  };

  const fetchTourSteps = async (tourId) => {
    try {
      const response = await axios.get(`http://localhost:8000/tour-steps/${tourId}`);
      setTourSteps(prevSteps => ({
        ...prevSteps,
        [tourId]: response.data
      }));
    } catch (error) {
      console.error('Error fetching tour steps:', error);
    }
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
            <button onClick={() => fetchTourSteps(tour.id_tours)}>Show Steps</button>
            {tourSteps[tour.id_tours] && (
              <ul>
                {tourSteps[tour.id_tours].map(step => (
                  <li key={step.id_tour_steps}>
                    Step {step.step_number}: Room {step.id_rooms}
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
