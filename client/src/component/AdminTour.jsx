import React, { useEffect, useState, useRef } from "react";
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

  const fetchPanoramaUrls = async (steps) => {
    const panoramaUrlsData = await Promise.all(
      steps.map(async step => {
        const picture = await tourApi.getFirstPictureByRoomId(step.id_rooms);
        if (picture) {
          const imageUrl = await tourApi.getImage(picture.id_pictures);
          return { id_rooms: step.id_rooms, imageUrl };
        }
        return { id_rooms: step.id_rooms, imageUrl: null };
      })
    );
    return Object.fromEntries(panoramaUrlsData.map(panorama => [panorama.id_rooms, panorama.imageUrl]));
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

  const fetchRooms = async () => {
    const roomsData = await api.getRooms();
    return roomsData;
  };

  const fetchAllData = async () => {
    console.log('Fetching all data...');
    try {
      const { toursData, steps } = await fetchToursInfo();
      setTours(toursData);
      setTourSteps(steps);

      const panoramaUrlsData = await Promise.all(
        toursData.map(async tour => {
          const tourSteps = steps[tour.id_tours];
          return fetchPanoramaUrls(tourSteps);
        })
      );
      const panoramaUrls = panoramaUrlsData.reduce((acc, urls) => ({ ...acc, ...urls }), {});
      setPanoramaUrls(panoramaUrls);

      const roomsData = await fetchRooms();
      setRooms(roomsData);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const fetchData = async () => {
    showLoading([fetchAllData()], 'Chargement...', 'Chargement des données réussi', 'Erreur lors du chargement des données');
  };

  useEffect(() => {
    if (loading.current) return;
    loading.current = true;

    fetchData().then(r => {
      loading.current = false;
    });
  }, []);

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
      const updatedTour = await tourApi.getTourById(tourId);
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

  const getPanoramaImagesForTour = (tourId) => {
    if (!tourSteps[tourId]) return [];
    let tmp = tourSteps[tourId].map(step => { return { src: panoramaUrls[step.id_rooms], alt: `Panorama of ${step.room_name}`, roomName: step.room_name }; });
    if (tmp.some(image => !image.src)) return [];
    return tmp;
  };

  const handleCarouselChange = (tourId, index) => {
    const images = getPanoramaImagesForTour(tourId);
    if (images.length > 0) {
      setCurrentRoomName(prevState => ({
        ...prevState,
        [tourId]: images[index].roomName
      }));
    }
  };

  const filteredTours = tours.filter(tour =>
    tour.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="container mx-auto p-4">
      <div className="header mb-4">
        <h1 className="text-2xl font-bold mb-2">Information des parcours</h1>
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
            {getPanoramaImagesForTour(tour.id_tours).length > 0 && (
              <div className="">
                <h4>Étapes</h4>
                <p>Nom de la salle : {currentRoomName[tour.id_tours]}</p>
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
              <button type="button" onClick={handleAddNewTourStep}>Ajouter une étape</button>
              <button type="submit">Ajouter un parcours</button>
            </form>
          </div>
        </div>
      )}

      {editTourModalOpen && selectedTour && (
        <div className="modal">
          <div className="modal-content">
            <span className="close" onClick={() => setEditTourModalOpen(false)}>&times;</span>
            <h2>Modifier un parcours</h2>
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
