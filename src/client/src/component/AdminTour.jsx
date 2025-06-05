import React, { useEffect, useState, useRef, useCallback, useMemo } from "react";
import * as tourApi from '../api/AxiosTour';
import * as api from '../api/AxiosAdmin';
import { Buffer } from 'buffer';
import { toast } from "sonner";
import { useHistory } from 'react-router-dom';
import { DndContext, DragOverlay } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import Masonry from 'react-masonry-css';
import {
    restrictToVerticalAxis,
    restrictToWindowEdges,
  } from '@dnd-kit/modifiers';
import Carousel from '../reactbits/Components/Carousel/Carousel';
import '../style/AdminTour.css';
import Loader from "./Loader";
import Select from 'react-select';
import {FaArrowLeft, FaTrash} from "react-icons/fa";
import ConfirmDialog from "./dialogs/ConfirmDialog";

// Custom styles for React Select
const customSelectStyles = {
  control: (provided, state) => ({
    ...provided,
    backgroundColor: 'white',
    borderColor: state.isFocused ? '#3B82F6' : '#fb8500',
    borderWidth: '2px',
    borderRadius: '0.375rem',
    boxShadow: state.isFocused ? '0 0 0 2px #93C5FD' : 'none',
    '&:hover': {
      borderColor: '#3B82F6'
    },
    padding: '2px',
    marginTop: '0.5rem',
    width: '100%'
  }),
  option: (provided, state) => ({
    ...provided,
    backgroundColor: state.isSelected ? '#fb8500' : state.isFocused ? '#FDE68A' : 'white',
    color: state.isSelected ? 'white' : '#333',
    cursor: 'pointer',
    '&:hover': {
      backgroundColor: state.isSelected ? '#fb8500' : '#FDE68A',
    }
  }),
  placeholder: (provided) => ({
    ...provided,
    color: '#9CA3AF'
  }),
  singleValue: (provided) => ({
    ...provided,
    color: '#111827'
  }),
  menu: (provided) => ({
    ...provided,
    zIndex: 9999,
  }),
  menuPortal: (provided) => ({
    ...provided,
    zIndex: 9999
  }),
};

const SortableItem = ({ id, children }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });

  const style = {
    transform: transform ? `translateY(${transform.y}px)` : undefined,
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`bg-white border-2 border-junia-orange p-2 my-2 rounded-lg shadow-sm flex items-center justify-between cursor-grab transition 
        ${isDragging ? 'opacity-70 scale-105 shadow-md bg-junia-salmon' : 'bg-junia-salmon'}`}
    >
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
  const [editModeNewSteps, setEditModeNewSteps] = useState([]); // Add this new state
  const [newTourModalOpen, setNewTourModalOpen] = useState(false);
  const [rooms, setRooms] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [panoramaUrls, setPanoramaUrls] = useState({});
  const [previewUrls, setPreviewUrls] = useState({});
  const [currentRoomName, setCurrentRoomName] = useState({});
  const [floors, setFloors] = useState([]);
  const loading = useRef(false);
  const history = useHistory();

  const [isLoading, setIsLoading] = useState(true);
  const [textLoading, setTextLoading] = useState("Chargement des données...");

  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmTitle, setConfirmTitle] = useState("");
  const [confirmMessage, setConfirmMessage] = useState("");
  const [tourToDelete, setTourToDelete] = useState(null);

  const showLoading = (promises, textLoading, textSuccess, textError) => {
    setIsLoading(true);
    setTextLoading(textLoading);
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

  const fetchPanoramaUrls = async (steps) => {
    try {
      const panoramaUrlsData = await Promise.all(
        steps.map(async step => {
          try {
            // First try to get plan preview
            const previewUrl = await tourApi.getRoomPreview(step.id_rooms);
            
            if (previewUrl) {
              // If we have a preview, use it
              return { id_rooms: step.id_rooms, imageUrl: previewUrl, isPreview: true };
            } else {
              // If no preview, fallback to panorama
              const picture = await tourApi.getFirstPictureByRoomId(step.id_rooms);
              if (picture) {
                const imageUrl = await tourApi.getImage(picture.id_pictures);
                return { id_rooms: step.id_rooms, imageUrl, isPreview: false };
              }
              console.log(`No picture found for room ID: ${step.id_rooms}`);
              return { id_rooms: step.id_rooms, imageUrl: null, isPreview: false };
            }
          } catch (error) {
            console.error(`Error fetching images for room ${step.id_rooms}:`, error);
            return { id_rooms: step.id_rooms, imageUrl: null, isPreview: false };
          }
        })
      );
      
      // Store which images are previews
      setPreviewUrls(Object.fromEntries(panoramaUrlsData.map(data => [data.id_rooms, data.isPreview])));
      
      // Return panorama URLs
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
      console.log("Fetched rooms:", roomsData);
      return roomsData;
    } catch (error) {
      console.error("Error fetching rooms:", error);
      toast.error("Impossible de charger les salles. Certaines fonctionnalités peuvent être limitées.");
      return [];
    }
  };

  // Add a function to fetch floors
  const fetchFloors = async () => {
    try {
      const floorsData = await tourApi.getFloors();
      console.log('Fetched floors:', floorsData);
      setFloors(floorsData);
      return floorsData;
    } catch (error) {
      console.error("Error fetching floors:", error);
      toast.error("Impossible de charger les étages.");
      return [];
    }
  };

  const fetchAllData = async () => {
    console.log('Fetching all data...');
    try {
      // Fetch tours and steps
      const { toursData, steps } = await fetchToursInfo();
      
      // Fetch floors first
      let floorsData = [];
      try {
        floorsData = await fetchFloors();
      } catch (error) {
        console.error("Failed to fetch floors:", error);
      }
      
      let roomsData = [];
      try {
        roomsData = await fetchRooms();
      } catch (error) {
        console.error("Failed to fetch rooms:", error);
      }
      
      // Create a flat array of all tour steps to fetch panoramas more efficiently
      const allSteps = Object.values(steps).flat();
      const allPanoramaUrls = await fetchPanoramaUrls(allSteps);
    
      // Batch state updates
      setTours(toursData);
      setTourSteps(steps);
      setRooms(roomsData);
      setFloors(floorsData);
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
    setEditModeNewSteps([]); // Reset edit mode new steps
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

  const handleDeleteTour = (tourId) => {
    setTourToDelete(tourId);
    setConfirmTitle("Suppression du parcours");
    setConfirmMessage("Êtes-vous sûr de vouloir supprimer ce parcours ? Cette action est irréversible.");
    setShowConfirm(true);
  };

  const confirmDeleteTour = () => {
    const deleteTourPromise = tourApi.deleteTour(tourToDelete);
    const fetchUpdatedToursPromise = deleteTourPromise.then(() => fetchToursInfo());
    showLoading([deleteTourPromise, fetchUpdatedToursPromise], 'Suppression du parcours...', 'Parcours supprimé avec succès', 'La suppression du parcours a échoué');
    fetchUpdatedToursPromise.then(({ toursData, steps }) => {
      setTours(toursData);
      setTourSteps(steps);
    });
  }

  const fetchUpdatedTour = async (tourId) => {
    try {
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
    // Initialize new step in edit mode
    setEditModeNewSteps(prev => [...prev, { id_rooms: '', id: `new-step-${newStepCount}` }]);
  };

  const handleAddNewTourStep = () => {
    setNewTourSteps([...newTourSteps, { id_rooms: '', id: `new-step-${newTourSteps.length}` }]);
  };

  const handleNewTourStepChange = (index, field, selectedOption) => {
    const updatedSteps = [...newTourSteps];
    if (!updatedSteps[index]) {
      updatedSteps[index] = { id: `new-step-${index}` };
    }
    // For React Select, we receive the whole option object, so extract the value
    const value = field === 'id_rooms' && selectedOption ? selectedOption.value : selectedOption;
    updatedSteps[index][field] = value;
    setNewTourSteps(updatedSteps);
  };

  const handleDeleteStep = (stepId) => {
    // Remove step from tourSteps
    setTourSteps((prevSteps) => {
      const updatedSteps = { ...prevSteps };
      if (selectedTour && updatedSteps[selectedTour.id_tours]) {
        updatedSteps[selectedTour.id_tours] = updatedSteps[selectedTour.id_tours].filter(step => step.id_tour_steps !== stepId);
      }
      return updatedSteps;
    });
    // Remove step from editModeNewSteps if it exists
    // Change newStepCount if we are deleting a new step
    if (stepId.startsWith('new-step-')) {
      const index = parseInt(stepId.split('-')[2], 10);
      if (index < newStepCount) {
        setNewStepCount(newStepCount - 1);
      }
    }
    setEditModeNewSteps((prevSteps) => {
        return prevSteps.filter(step => step.id !== stepId);
    });
    // Remove step from newTourSteps if it exists
    setNewTourSteps((prevSteps) => {
      return prevSteps.filter(step => step.id !== stepId);
    });
  }

  // Add new function to handle edit mode new step changes
  const handleEditModeNewStepChange = (index, selectedOption) => {
    const updatedSteps = [...editModeNewSteps];
    if (!updatedSteps[index]) {
      updatedSteps[index] = { id: `new-step-${index}` };
    }
    updatedSteps[index].id_rooms = selectedOption ? selectedOption.value : '';
    setEditModeNewSteps(updatedSteps);
  };

  const openNewTourModal = () => {
    setNewTourSteps([]);
    setNewTourModalOpen(true);
  };

  const handleModalClose = () => {
    setNewTourSteps([]);
    setNewTourModalOpen(false);
    setEditTourModalOpen(false);
    setNewStepCount(0); // Reset new step count
    setEditModeNewSteps([]); // Reset edit mode new steps
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
    
    // Create images array with placeholders for missing images
    const images = tourSteps[tourId].map(step => { 
      return { 
        src: panoramaUrls[step.id_rooms] || 'https://via.placeholder.com/800x600?text=No+Image+Available', 
        alt: `Panorama of ${step.room_name}`, 
        roomName: step.room_name,
        isPreview: previewUrls[step.id_rooms] || false,
        isPlaceholder: !panoramaUrls[step.id_rooms]
      }; 
    });
    
    // Only return the array if at least one real image exists
    const hasRealImages = images.some(img => !img.isPlaceholder);
    
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
  }, [tourSteps, panoramaUrls]);
  

  const filteredTours = tours.filter(tour =>
    tour.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Format rooms as options for React Select
  const roomOptions = useMemo(() => {
    // If no floors available, return simple flat options
    if (!floors || floors.length === 0) {
      return rooms.map(room => ({
        value: room.id_rooms,
        label: `${room.name} (${room.number})`
      }));
    }
    
    // Group rooms by floors
    const roomsByFloor = floors.map(floor => {
      const floorRooms = rooms
        .filter(room => room.id_floors === floor.id_floors)
        .map(room => ({
          value: room.id_rooms,
          label: `${room.name} (${room.number})`
        }));
      
      return {
        label: `${floor.name}`,
        options: floorRooms,
      };
    }).filter(group => group.options.length > 0); // Remove empty floors
    
    return roomsByFloor;
  }, [rooms, floors]);

  // Define breakpoints for Masonry layout
  const breakpointColumnsObj = {
    default: 3,
    1100: 2,
    700: 1
  };

  return (
    <>
      <div className="absolute top-0 left-0 w-full h-full bg-junia-salmon -z-10"></div>
      
      <div className="relative absolute top-0 left-0 w-full h-full -z-10">
        <Loader show={isLoading} text={textLoading} />
        <div className="absolute" style={{left: "20px"}}>
          <button
              onClick={() => history.push('/admin/room')}
              className="px-4 py-2 button-type font-title font-bold flex items-center gap-2">
            <FaArrowLeft /> Retour
          </button>
        </div>
        <div className="my-4 flex justify-center">
          <div className="flex gap-8 items-center font-title text-xl">
            <input
              type="text"
              placeholder="Rechercher un parcours..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full p-2 research-input bg-white rounded-full"
            />
            <button 
              onClick={openNewTourModal} 
              className="text-white font-bold shadow-md font-title text-center bg-junia-orange rounded-3xl p-2 rounded-full cursor-pointer bouton-modifier"
            >
              Ajouter un nouveau parcours
            </button>
          </div>

        </div>
        <div className="h-full p-4">
          <Masonry
            breakpointCols={breakpointColumnsObj}
            className="my-masonry-grid"
            columnClassName="my-masonry-grid_column"
          >
            {filteredTours.map(tour => (
              <div key={tour.id_tours} className="purpleborder text-justify bg-white border-5 border-junia-orange p-2 rounded-3xl flex flex-col mb-10">
                <div className="font-title font-bold text-junia-orange text-3xl text-center">Parcours : {tour.title}</div>
                <div className="font-texts">
                  <p  className="font-texts font-bold text-junia-orange text-2xl">Description</p>
                  {tour.description}
                </div>
                
                {tourSteps[tour.id_tours] ? (
                  tourSteps[tour.id_tours].length > 0 ? (
                    <div className="mt-4" style={{ height: "500px" }}>
                      <p  className="font-texts font-bold text-junia-orange text-2xl">Étapes</p>
                      <p className="font-texts font-bold text-center text-junia-violet">
                        Salle : {currentRoomName[tour.id_tours] || (getPanoramaImagesForTour(tour.id_tours)[0]?.roomName || 'Aucune salle disponible')}
                      </p>
                      <div style={{ height: "450px" }}>
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
                      
                      {getPanoramaImagesForTour(tour.id_tours).every(img => img.isPlaceholder) && (
                        <p className="text-amber-500 mt-2 text-center text-sm">
                          Attention: Ce parcours n'a pas d'images panoramiques.
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-center my-4 text-junia-purple">Aucune étape disponible pour ce parcours</p>
                  )
                ) : (
                  <p className="text-center my-4 text-junia-purple">Chargement des étapes...</p>
                )}
                
                <div className="flex flex-col items-center justify-center gap-4 margin-top-8 mb-4">
                  <div 
                    onClick={() => handleEditTour(tour)} 
                    className="text-white font-bold shadow-md font-title text-center bg-junia-orange rounded-3xl p-2 w-1/3 max-w-max inline-block cursor-pointer bouton-modifier"
                  >
                    Modifier
                  </div>
                  <div 
                    onClick={() => handleDeleteTour(tour.id_tours)} 
                    className="text-white font-bold shadow-md font-title text-center bg-junia-purple rounded-3xl p-2 w-1/3 max-w-max inline-block cursor-pointer bouton-ajouter"
                  >
                    Supprimer
                  </div>
                </div>
              </div>
            ))}
          </Masonry>
        </div>

        {newTourModalOpen && (
          <div className="modal">
            <div className="modal-content">
              <div className="flex justify-between items-center pb-4">
                <div className="text-3xl font-bold font-title text-center">Ajouter un nouveau parcours</div>
                <span className="close items-center" onClick={() => {setNewTourModalOpen(false); setNewTourSteps([]); setNewStepCount(0); setEditModeNewSteps([])}}>&times;</span>
              </div>
              <form onSubmit={handleNewTour}>
                <input type="text" name="title" placeholder="Titre du Parcours" className="font-texts" required />
                <textarea name="description" placeholder="Description du Parcours" className="font-texts" required></textarea>
                <DndContext onDragEnd={onDragEnd} modifiers={[restrictToVerticalAxis, restrictToWindowEdges]}>
                  <SortableContext items={newTourSteps.map(step => step.id)} strategy={verticalListSortingStrategy}>
                    <div className="space-y-3">
                      {newTourSteps.map((step, index) => (
                        <SortableItem key={step.id} id={step.id}>
                          <div className="draggable-step font-title flex items-center justify-between w-full">
                            <input type="hidden" name={`steps[${index}][id]`} value={step.id} />
                            <input type="hidden" name={`steps[${index}][id_rooms]`} value={step.id_rooms} />
                            <span className="drag-icon ">☰</span>
                            <h4 className="font-title font-bold text-lg whitespace-nowrap flex-grow mr-2">Étape {index + 1}</h4>
                            <div className="w-full" onPointerDown={(e) => e.stopPropagation()}>
                              <input 
                                type="hidden" 
                                name={`steps[${index}][id_rooms]`}
                                value={step.id_rooms || ''}
                              />
                              <Select
                                options={roomOptions}
                                onChange={(selectedOption) => handleNewTourStepChange(index, 'id_rooms', selectedOption)}
                                value={roomOptions.flatMap(group => group.options || []).find(option => option.value === step.id_rooms) || null}
                                isDisabled={rooms.length === 0}
                                placeholder="Sélectionner une salle"
                                styles={customSelectStyles}
                                className="w-full font-texts shadow-md rounded-lg max-w-full"
                                noOptionsMessage={() => "Aucune salle disponible"}
                                required
                                isSearchable
                                menuPlacement="auto"
                                menuPosition="fixed"
                                menuPortalTarget={document.body}
                              />
                            </div>
                            <button type="button"
                                    onPointerDown={(e) => e.stopPropagation()}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      e.preventDefault();
                                      handleDeleteStep(step.id);
                                    }}
                                    className="px-2 py-2 button-type2"
                            >
                                <FaTrash />
                            </button>
                          </div>
                        </SortableItem>
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
                <button type="button" onClick={handleAddNewTourStep} disabled={rooms.length === 0} className="bouton-ajouter font-texts shadow-md ">Ajouter une étape</button>
                <button type="submit" disabled={rooms.length === 0 || newTourSteps.length === 0} className="bg-junia-orange disabled:bg-junia-orange disabled:opacity-50 bouton-modifier font-texts shadow-md">Confirmer l'ajout du parcours</button>
              </form>
            </div>
          </div>
        )}

        {editTourModalOpen && selectedTour && (
          <div className="modal">
            <div className="modal-content">
              <div className="flex justify-between items-center pb-4">
                <div className="text-3xl font-bold font-title text-center">Modifier un parcours</div>
                <span className="close items-center" onClick={() => {setEditTourModalOpen(false); setNewTourSteps([]); setNewStepCount(0); setEditModeNewSteps([])}}>&times;</span>
              </div>
              <form onSubmit={handleEditTourSubmit}>
                  <input type="hidden" name="id_tours" value={selectedTour.id_tours} />
                  <input type="text" name="title" defaultValue={selectedTour.title} placeholder="Titre du Parcours" className="font-texts" required />
                  <textarea name="description" defaultValue={selectedTour.description} placeholder="Description du Parcours" className="font-texts" required></textarea>
                  <DndContext onDragEnd={onDragEnd} modifiers={[restrictToVerticalAxis, restrictToWindowEdges]}>
                    <SortableContext items={tourSteps[selectedTour.id_tours]?.map(step => step.id_tour_steps)} strategy={verticalListSortingStrategy}>
                      {tourSteps[selectedTour.id_tours]?.map((step, index) => (
                        <SortableItem  key={`step-${step.id_tour_steps}`} id={step.id_tour_steps}>
                          <div className="draggable-step font-title flex items-center justify-between w-full">
                            <span className="drag-icon">☰</span>
                            <h4 className="font-title font-bold text-lg">Étape {index + 1}</h4>
                            <input type="hidden" name={`steps[${index}][id_tour_steps]`} value={step.id_tour_steps} />
                            <input 
                              type="hidden" 
                              name={`steps[${index}][id_rooms]`}
                              id={`step-room-${index}`}
                              value={step.id_rooms || ''}
                            />
                            <div className="w-full" onPointerDown={(e) => e.stopPropagation()}>
                              <Select
                                options={roomOptions}
                                defaultValue={roomOptions.flatMap(group => group.options || []).find(option => option.value === step.id_rooms) || null}
                                onChange={(selectedOption) => {
                                  document.getElementById(`step-room-${index}`).value = selectedOption.value;
                                }}
                                styles={customSelectStyles}
                                className="w-full font-texts"
                                placeholder="Sélectionner une salle"
                                noOptionsMessage={() => "Aucune salle disponible"}
                                required
                                isSearchable
                                menuPlacement="auto"
                                menuPosition="fixed"
                                menuPortalTarget={document.body}
                              />
                            </div>
                            <button type="button"
                                    onPointerDown={(e) => e.stopPropagation()}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      e.preventDefault();
                                      handleDeleteStep(step.id_tour_steps);
                                    }}
                                    className="px-2 py-2 button-type2"
                            >
                              <FaTrash />
                            </button>
                          </div>
                        </SortableItem>
                      ))}
                      {[...Array(newStepCount)].map((_, index) => {
                        const newStepIndex = tourSteps[selectedTour.id_tours]?.length + index;
                        const editStepData = editModeNewSteps[index] || { id_rooms: '' };
                        return (
                          <SortableItem key={`new_${index}`} id={`new-step-${index}`}>
                            <div className="draggable-step font-title flex items-center justify-between w-full">
                              <span className="drag-icon">☰</span>
                              <h4 className="font-title font-bold text-lg">Nouvelle étape {newStepIndex + 1}</h4>
                              <input type="hidden" name={`steps[${newStepIndex}][id_tour_steps]`} value={`new_${index}`} />
                              <input 
                                type="hidden" 
                                name={`steps[${newStepIndex}][id_rooms]`}
                                value={editStepData.id_rooms}
                              />
                              <div className="w-full" onPointerDown={(e) => e.stopPropagation()}>
                                <Select
                                  options={roomOptions}
                                  value={roomOptions.flatMap(group => group.options || []).find(option => option.value === editStepData.id_rooms) || null}
                                  onChange={(selectedOption) => handleEditModeNewStepChange(index, selectedOption)}
                                  styles={customSelectStyles}
                                  className="w-full font-texts"
                                  placeholder="Sélectionner une salle"
                                  noOptionsMessage={() => "Aucune salle disponible"}
                                  required
                                  isSearchable
                                  menuPlacement="auto"
                                  menuPosition="fixed"
                                  menuPortalTarget={document.body}
                                />
                              </div>
                                <button type="button"
                                        onPointerDown={(e) => e.stopPropagation()}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            e.preventDefault();
                                            handleDeleteStep(`new-step-${index}`);
                                        }}
                                        className="px-2 py-2 button-type2"
                                >
                                    <FaTrash />
                                </button>
                            </div>
                          </SortableItem>
                        );
                      })}
                    </SortableContext>
                  </DndContext>
                  <button type="button" onClick={handleAddStep} className="bouton-ajouter font-texts shadow-md">Ajouter une étape</button>
                  <button type="submit" className="bouton-modifier font-texts shadow-md bg-junia-orange">Modifier le parcours</button>
              </form>
            </div>
          </div>
        )}
      </div>
      <ConfirmDialog open={showConfirm} onClose={() => setShowConfirm(false)} title={confirmTitle} message={confirmMessage} onConfirm={() => {
        confirmDeleteTour()
      }} />
    </>
  );
};

export default AdminTour;