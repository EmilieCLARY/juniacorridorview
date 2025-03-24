import React, { useEffect, useState, useRef, useCallback } from "react";
import * as tourApi from '../api/AxiosTour';
import * as api from '../api/AxiosAdmin';
import { Buffer } from 'buffer';
import { toast } from "sonner";
import { useHistory } from 'react-router-dom';
import { DndContext, DragOverlay } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
    restrictToVerticalAxis,
    restrictToWindowEdges,
  } from '@dnd-kit/modifiers';
import Carousel from '../reactbits/Components/Carousel/Carousel';

const SortableItem = ({ id, children }) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      {children}
    </div>
  );
};

const AdminTour = () => {
  const [tours, setTours] = useState([]);
  const [tourSteps, setTourSteps] = useState({});
  const [editTourModalOpen, setEditTourModalOpen] = useState(false);
  const [selectedTour, setSelectedTour] = useState(null);
  const [newStepCount, setNewStepCount] = useState(0);
  const [newTourSteps, setNewTourSteps] = useState([]);
  const [newTourModalOpen, setNewTourModalOpen] = useState(false);
  const [rooms, setRooms] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [panoramaUrls, setPanoramaUrls] = useState({});
  const [currentRoomName, setCurrentRoomName] = useState({});
  const loading = useRef(false);
  const history = useHistory();

  const showLoading = (promises, textLoading, textSuccess, textError) => {
    return toast.promise(Promise.all(promises), {
        loading: textLoading,
        success: textSuccess,
        error: textError,
    });
  }

  // Improve fetchPanoramaUrls to better handle errors and ensure we're logging issues
  const fetchPanoramaUrls = async (steps) => {
    try {
      const panoramaUrlsData = await Promise.all(
        steps.map(async step => {
          try {
            const picture = await tourApi.getFirstPictureByRoomId(step.id_rooms);
            if (picture) {
              const imageUrl = await tourApi.getImage(picture.id_pictures);
              return { id_rooms: step.id_rooms, imageUrl };
            }
            console.log(`No picture found for room ID: ${step.id_rooms}`);
            return { id_rooms: step.id_rooms, imageUrl: null };
          } catch (error) {
            console.error(`Error fetching panorama for room ${step.id_rooms}:`, error);
            return { id_rooms: step.id_rooms, imageUrl: null };
          }
        })
      );
      return Object.fromEntries(panoramaUrlsData.map(panorama => [panorama.id_rooms, panorama.imageUrl]));
    } catch (error) {
      console.error('Error in fetchPanoramaUrls:', error);
      return {};
    }
  };

  const fetchToursInfo = async () => {
    const toursData = await tourApi.getTours();
    const stepsData = await Promise.all(toursData.map(tour => tourApi.getTourSteps(tour.id_tours)));
    const steps = stepsData.reduce((acc, steps, index) => {
      acc[toursData[index].id_tours] = steps;
      return acc;
    }, {});
    return { toursData, steps };
  };

  // Improve fetchRooms to handle errors gracefully
  const fetchRooms = async () => {
    try {
      const roomsData = await api.getRooms();
      return roomsData.filter(room => room.hidden !== 0 && room.hidden !== null);
    } catch (error) {
      console.error("Error fetching rooms:", error);
      toast.error("Impossible de charger les salles. Certaines fonctionnalités peuvent être limitées.");
      return []; // Return empty array if rooms can't be loaded
    }
  };

  // Modify fetchAllData to continue even if rooms fail to load
  const fetchAllData = async () => {
    console.log('Fetching all data...');
    try {
      // Fetch tours and steps (most important data)
      const { toursData, steps } = await fetchToursInfo();
      
      // Try to fetch rooms but continue if it fails
      let roomsData = [];
      try {
        roomsData = await fetchRooms();
      } catch (error) {
        console.error("Failed to fetch rooms:", error);
        // Continue with empty rooms array
      }
      
      // Create a flat array of all tour steps to fetch panoramas more efficiently
      const allSteps = Object.values(steps).flat();
      const allPanoramaUrls = await fetchPanoramaUrls(allSteps);
      
      console.log('Panorama URLs:', allPanoramaUrls);
      console.log('Tour steps:', steps);
    
      // Batch state updates
      setTours(toursData);
      setTourSteps(steps);
      setRooms(roomsData);
      setPanoramaUrls(allPanoramaUrls);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error("Erreur lors du chargement des données");
    }
  };

  const fetchData = useCallback(async () => {
    showLoading([fetchAllData()], 'Chargement...', 'Chargement des données réussi', 'Erreur lors du chargement des données');
  }, []);

  useEffect(() => {
    if (!loading.current) {
      loading.current = true;
      fetchData().then(() => {
        loading.current = false;
      });
    }
  }, [fetchData]);

  const handleEditTour = async (tour) => {
    setSelectedTour(tour);
    if (!tourSteps[tour.id_tours]) {
        const stepsDataPromise = tourApi.getTourSteps(tour.id_tours);
        showLoading([stepsDataPromise], 'Modification du parcours...', 'Parcours modifié avec succès', 'La modification du parcours a échoué');
        stepsDataPromise.then(stepsData => {
          setTourSteps(prevSteps => ({
            ...prevSteps,
            [tour.id_tours]: stepsData
          }));
    });
    }
    setEditTourModalOpen(true);
  };

  const handleEditTourSubmit = async (event) => {
    event.preventDefault();
    const formData = new FormData(event.target);
    const steps = Array.from(formData.entries()).reduce((acc, [key, value]) => {
        const match = key.match(/steps\[(\d+)\]\[(\w+)\]/);
        if (match) {
            const [_, index, field] = match;
            if (!acc[index]) acc[index] = {};
            acc[index][field] = value;
        }
        return acc;
    }, []);
    const title = formData.get('title');
    const description = formData.get('description');
    const updateTourStepsPromise = tourApi.updateTourSteps({ id_tours: selectedTour.id_tours, steps, title, description });
    setNewStepCount(0);
    const fetchUpdatedTourPromise = updateTourStepsPromise.then(() => fetchUpdatedTour(selectedTour.id_tours));
    showLoading([updateTourStepsPromise, fetchUpdatedTourPromise], 'Modification du parcours...', 'Parcours modifié avec succès', 'La modification du parcours a échoué');
    fetchUpdatedTourPromise.then(() => {
      setEditTourModalOpen(false);
      fetchUpdatedTour(selectedTour.id_tours);
    });
  };

  const handleDeleteTour = async (tourId) => {
    if (!window.confirm('Etes-vous sûr de vouloir supprimer le parcours ?')) return;
    const deleteTourPromise = tourApi.deleteTour(tourId);
    const fetchUpdatedToursPromise = deleteTourPromise.then(() => fetchToursInfo());
    showLoading([deleteTourPromise, fetchUpdatedToursPromise], 'Suppression du parcours...', 'Parcours supprimé avec succès', 'La suppression du parcours a échoué');
    fetchUpdatedToursPromise.then(({ toursData, steps }) => {
      setTours(toursData);
      setTourSteps(steps);
    });
  };

  const fetchUpdatedTour = async (tourId) => {
    try {
      // Replace getTourById with getTours and filter for the specific tour
      const toursData = await tourApi.getTours();
      const updatedTour = toursData.find(tour => tour.id_tours === tourId);
      
      const updatedSteps = await tourApi.getTourSteps(tourId);
      setTours((prevTours) => prevTours.map(tour => tour.id_tours === tourId ? updatedTour : tour));
      setTourSteps((prevSteps) => ({
        ...prevSteps,
        [tourId]: updatedSteps,
      }));
      const updatedPanoramaUrls = await fetchPanoramaUrls(updatedSteps);
      setPanoramaUrls((prevUrls) => ({
        ...prevUrls,
        ...updatedPanoramaUrls,
      }));
    } catch (error) {
      console.error('Error fetching updated tour:', error);
    }
  };

  const handleAddStep = () => {
    setNewStepCount(newStepCount + 1);
  };

  const handleAddNewTourStep = () => {
    setNewTourSteps([...newTourSteps, { id_rooms: '', id: `new-step-${newTourSteps.length}` }]);
  };

  const handleNewTourStepChange = (index, field, value) => {
    const updatedSteps = [...newTourSteps];
    if (!updatedSteps[index]) {
      updatedSteps[index] = { id: `new-step-${index}` };
    }
    updatedSteps[index][field] = value;
    setNewTourSteps(updatedSteps);
  };

  const openNewTourModal = () => {
    setNewTourSteps([]);
    setNewTourModalOpen(true);
  };

  const handleModalClose = () => {
    setNewTourSteps([]);
    setNewTourModalOpen(false);
    setEditTourModalOpen(false);
  };

  
  const handleNewTour = async (event) => {
    event.preventDefault();
    const formData = new FormData(event.target);
    const data = Object.fromEntries(formData.entries());
    data.steps = newTourSteps;
    const createTourPromise = tourApi.createTour(data);
    const fetchUpdatedToursPromise = createTourPromise.then(() => fetchToursInfo());
    showLoading([createTourPromise, fetchUpdatedToursPromise], 'Ajout du parcours...', 'Parcours ajouté avec succès', 'L\'ajout du parcours a échoué');
    fetchUpdatedToursPromise.then(({ toursData, steps }) => {
      setTours(toursData);
      setTourSteps(steps);
      setNewTourModalOpen(false);
      handleModalClose();
    });
  };

  const onDragEnd = (event) => {
    const { active, over } = event;
    if (active.id !== over.id) {
      if (selectedTour) {
        setTourSteps((prevSteps) => {
          const reorderedSteps = arrayMove(
            prevSteps[selectedTour.id_tours],
            prevSteps[selectedTour.id_tours].findIndex(step => step.id_tour_steps === active.id),
            prevSteps[selectedTour.id_tours].findIndex(step => step.id_tour_steps === over.id)
          );
          return {
            ...prevSteps,
            [selectedTour.id_tours]: reorderedSteps,
          };
        });
      } else {
        const reorderedSteps = arrayMove(
          newTourSteps,
          newTourSteps.findIndex(step => step.id === active.id),
          newTourSteps.findIndex(step => step.id === over.id)
        );
        setNewTourSteps(reorderedSteps);
        
      }
    }
  };

  // Improve the getPanoramaImagesForTour function to better handle and debug image loading
  // Update getPanoramaImagesForTour to include placeholder images for missing panoramas
  const getPanoramaImagesForTour = (tourId) => {
    if (!tourSteps[tourId]) return [];
    
    // Log information about the tour steps and panorama URLs for debugging
    console.log(`Getting panorama images for tour ${tourId}:`, 
      tourSteps[tourId].map(step => ({
        room_id: step.id_rooms,
        room_name: step.room_name,
        has_image: !!panoramaUrls[step.id_rooms]
      }))
    );
    
    // Create images array with placeholders for missing images
    const images = tourSteps[tourId].map(step => { 
      return { 
        src: panoramaUrls[step.id_rooms] || 'https://via.placeholder.com/800x600?text=No+Image+Available', 
        alt: `Panorama of ${step.room_name}`, 
        roomName: step.room_name,
        isPlaceholder: !panoramaUrls[step.id_rooms]
      }; 
    });
    
    // Only return the array if at least one real image exists
    const hasRealImages = images.some(img => !img.isPlaceholder);
    console.log(`Tour ${tourId} has ${images.filter(img => !img.isPlaceholder).length}/${images.length} real images`);
    
    // Return all images, including placeholders
    return images;
  };

  // Update handleCarouselChange to handle cases with placeholder images
  const handleCarouselChange = useCallback((tourId, index) => {
    const images = getPanoramaImagesForTour(tourId);
    if (images.length > 0) {
      setCurrentRoomName((prevState) => {
        if (prevState[tourId] === images[index].roomName) return prevState; // Prevent unnecessary updates
        return {
          ...prevState,
          [tourId]: images[index].roomName,
        };
      });
    }
  }, [tourSteps, panoramaUrls]); // Add dependencies here
  

  const filteredTours = tours.filter(tour =>
    tour.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="container mx-auto p-4">
      <div className="header mb-4">
        <h1 className="text-2xl font-bold mb-2">Information des parcours</h1>
        {rooms.length === 0 && (
          <div className="bg-amber-100 border-l-4 border-amber-500 text-amber-700 p-4 mb-4" role="alert">
            <p className="font-bold">Attention</p>
            <p>Impossible de charger les salles depuis le serveur. La création et modification de parcours peut être limitée.</p>
          </div>
        )}
        <input
          type="text"
          placeholder="Rechercher un parcours..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-bar p-2 border border-gray-300 rounded mb-4"
        />
        <button onClick={openNewTourModal} className="bg-blue-500 text-white px-4 py-2 rounded">Ajouter un nouveau parcours</button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {filteredTours.map(tour => (
          <div key={tour.id_tours} className="tour-card p-4 border border-gray-300 rounded shadow">
            <h3 className="text-xl font-semibold mb-2">{tour.title}</h3>
            <h4> Description </h4>
            <p className="mb-2">{tour.description}</p>
            <div className="">
              <h4>Étapes</h4>
              {tourSteps[tour.id_tours] ? (
                tourSteps[tour.id_tours].length > 0 ? (
                  <>
                    <p>Nom de la salle : {currentRoomName[tour.id_tours] || (getPanoramaImagesForTour(tour.id_tours)[0]?.roomName || 'Aucune salle disponible')}</p>
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
                    {getPanoramaImagesForTour(tour.id_tours).every(img => img.isPlaceholder) && (
                      <p className="text-amber-500 mt-2">
                        Attention: Ce parcours n'a pas d'images panoramiques. Veuillez en ajouter dans la gestion des salles.
                      </p>
                    )}
                  </>
                ) : (
                  <p>Aucune étape disponible pour ce parcours</p>
                )
              ) : (
                <p>Chargement des étapes...</p>
              )}
            </div>
            <button onClick={() => handleDeleteTour(tour.id_tours)} className="bg-red-500 text-white px-4 py-2 rounded mr-2">Supprimer</button>
            <button onClick={() => handleEditTour(tour)} className="bg-red-500 text-white px-4 py-2 rounded">Modifier</button>
          </div>
        ))}
      </div>

      {newTourModalOpen && (
        <div className="modal">
          <div className="modal-content">
            <span className="close" onClick={() => setNewTourModalOpen(false)}>&times;</span>
            <h2>Ajouter un nouveau parcours</h2>
            {rooms.length === 0 && (
              <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4" role="alert">
                <p>Impossible de charger les salles. Vous ne pourrez pas créer de parcours pour le moment.</p>
              </div>
            )}
            <form onSubmit={handleNewTour}>
              <input type="text" name="title" placeholder="Titre du Parcours" required />
              <textarea name="description" placeholder="Description du Parcours" required></textarea>
              <DndContext onDragEnd={onDragEnd} modifiers={[restrictToVerticalAxis, restrictToWindowEdges]}>
                <SortableContext items={newTourSteps.map(step => step.id)} strategy={verticalListSortingStrategy}>
                  {newTourSteps.map((step, index) => (
                    <SortableItem key={step.id} id={step.id}>
                      <div className="draggable-step">
                        <h4>Étape {index + 1}</h4>
                        <select
                          name={`steps[${index}][id_rooms]`}
                          value={step.id_rooms}
                          onChange={(e) => handleNewTourStepChange(index, 'id_rooms', e.target.value)}
                          onPointerDown={(e) => e.stopPropagation()}
                          required
                          disabled={rooms.length === 0}
                        >
                          <option value="">Sélectionner une salle</option>
                          {rooms.map(room => (
                            <option key={room.id_rooms} value={room.id_rooms}>
                              {room.name} ({room.number})
                            </option>
                          ))}
                        </select>
                      </div>
                    </SortableItem>
                  ))}
                </SortableContext>
              </DndContext>
              <button type="button" onClick={handleAddNewTourStep} disabled={rooms.length === 0}>Ajouter une étape</button>
              <button type="submit" disabled={rooms.length === 0 || newTourSteps.length === 0}>Ajouter un parcours</button>
            </form>
          </div>
        </div>
      )}

      {editTourModalOpen && selectedTour && (
        <div className="modal">
          <div className="modal-content">
            <span className="close" onClick={() => setEditTourModalOpen(false)}>&times;</span>
            <h2>Modifier un parcours</h2>
            {rooms.length === 0 && (
              <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4" role="alert">
                <p>Impossible de charger les salles. Les modifications peuvent être limitées.</p>
              </div>
            )}
            <form onSubmit={handleEditTourSubmit}>
                <input type="hidden" name="id_tours" value={selectedTour.id_tours} />
                <input type="text" name="title" defaultValue={selectedTour.title} placeholder="Titre du Parcours" required />
                <textarea name="description" defaultValue={selectedTour.description} placeholder="Description du Parcours" required></textarea>
                <DndContext onDragEnd={onDragEnd} modifiers={[restrictToVerticalAxis, restrictToWindowEdges]}>
                  <SortableContext items={tourSteps[selectedTour.id_tours]?.map(step => step.id_tour_steps)} strategy={verticalListSortingStrategy}>
                    {tourSteps[selectedTour.id_tours]?.map((step, index) => (
                      <SortableItem  key={`step-${step.id_tour_steps}`} id={step.id_tour_steps}>
                        <div className="draggable-step">
                          <span className="drag-icon">☰</span>
                          <h4>Étape {index + 1}</h4>
                          <input type="hidden" name={`steps[${index}][id_tour_steps]`} value={step.id_tour_steps} />
                          <select
                            name={`steps[${index}][id_rooms]`}
                            defaultValue={step.id_rooms}
                            required
                            onPointerDown={(e) => e.stopPropagation()}
                          >
                            <option value="">Sélectionner une salle</option>
                            {rooms.map(room => (
                              <option key={room.id_rooms} value={room.id_rooms}>
                                {room.name} ({room.number})
                              </option>
                            ))}
                          </select>
                        </div>
                      </SortableItem>
                    ))}
                    {[...Array(newStepCount)].map((_, index) => (
                      <SortableItem key={`new_${index}`} id={`new-step-${index}`}>
                        <div className="draggable-step">
                          <span className="drag-icon">☰</span>
                          <h4>Nouvelle étape {tourSteps[selectedTour.id_tours]?.length + index + 1}</h4>
                          <input type="hidden" name={`steps[${tourSteps[selectedTour.id_tours]?.length + index}][id_tour_steps]`} value={`new_${index}`} />
                          <select
                            name={`steps[${tourSteps[selectedTour.id_tours]?.length + index}][id_rooms]`}
                            required
                            onPointerDown={(e) => e.stopPropagation()}
                          >
                            <option value="">Sélectionner une salle</option>
                            {rooms.map(room => (
                              <option key={room.id_rooms} value={room.id_rooms}>
                                {room.name} ({room.number})
                              </option>
                            ))}
                          </select>
                        </div>
                      </SortableItem>
                    ))}
                  </SortableContext>
                </DndContext>
                <button type="button" onClick={handleAddStep}>Ajouter une étape</button>
                <button type="submit">Modifier le parcours</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminTour;
