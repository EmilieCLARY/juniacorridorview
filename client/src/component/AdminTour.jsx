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
    const fetchToursInfoPromise = updateTourStepsPromise.then(() => fetchToursInfo());
    showLoading([updateTourStepsPromise, fetchToursInfoPromise], 'Modification du parcours...', 'Parcours modifié avec succès', 'La modification du parcours a échoué');
    fetchToursInfoPromise.then(() => {
      setEditTourModalOpen(false);
    });
  };

  const handleDeleteTour = async (tourId) => {
    if (!window.confirm('Are you sure you want to delete this tour?')) return;
    const deleteTourPromise = tourApi.deleteTour(tourId);
    const fetchToursInfoPromise = deleteTourPromise.then(() => fetchToursInfo());
    showLoading([deleteTourPromise, fetchToursInfoPromise], 'Suppression du parcours...', 'Parcours supprimé avec succès', 'La suppression du parcours a échoué');
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
    const fetchToursInfoPromise = createTourPromise.then(async () => {
      await fetchToursInfo();
      const newTour = await tourApi.getTours();
      const newTourSteps = await tourApi.getTourSteps(newTour[newTour.length - 1].id_tours);
      setTourSteps(prevSteps => ({
        ...prevSteps,
        [newTour[newTour.length - 1].id_tours]: newTourSteps
      }));
    });
    showLoading([createTourPromise, fetchToursInfoPromise], 'Ajout du parcours...', 'Parcours ajouté avec succès', 'L\'ajout du parcours a échoué');
    fetchToursInfoPromise.then(() => {
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

  const filteredTours = tours.filter(tour =>
    tour.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      <div className="header">
        <h1>Tour Information</h1>
        <input
          type="text"
          placeholder="Search tours"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-bar"
        />
        <button onClick={openNewTourModal}>Add New Tour</button>
      </div>
      <div className="tours-container">
        {filteredTours.map(tour => (
          <div key={tour.id_tours} className="tour-card">
            <h3>{tour.title}</h3>
            <p>{tour.description}</p>
            <ul>
              {tourSteps[tour.id_tours]?.map(step => (
                <li key={step.id_tour_steps}>
                  Step {step.step_number}: {step.room_name} ({step.room_number})
                  {panoramaUrls[step.id_rooms] && (
                    <div className="panorama-overview">
                      <img src={panoramaUrls[step.id_rooms]} alt={`Panorama of ${step.room_name}`} />
                    </div>
                  )}
                </li>
              ))}
            </ul>
            <button onClick={() => handleDeleteTour(tour.id_tours)}>Delete Tour</button>
            <button onClick={() => handleEditTour(tour)}>Edit Tour</button>
          </div>
        ))}
      </div>

      {newTourModalOpen && (
        <div className="modal">
          <div className="modal-content">
            <span className="close" onClick={() => setNewTourModalOpen(false)}>&times;</span>
            <h2>Add New Tour</h2>
            <form onSubmit={handleNewTour}>
              <input type="text" name="title" placeholder="Tour Title" required />
              <textarea name="description" placeholder="Tour Description" required></textarea>
              <DndContext onDragEnd={onDragEnd} modifiers={[restrictToVerticalAxis, restrictToWindowEdges]}>
                <SortableContext items={newTourSteps.map(step => step.id)} strategy={verticalListSortingStrategy}>
                  {newTourSteps.map((step, index) => (
                    <SortableItem key={step.id} id={step.id}>
                      <div className="draggable-step">
                        <h4>Step {index + 1}</h4>
                        <select
                          name={`steps[${index}][id_rooms]`}
                          value={step.id_rooms}
                          onChange={(e) => handleNewTourStepChange(index, 'id_rooms', e.target.value)}
                          onPointerDown={(e) => e.stopPropagation()}
                          required
                        >
                          <option value="">Select Room</option>
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
              <button type="button" onClick={handleAddNewTourStep}>Add Step</button>
              <button type="submit">Add Tour</button>
            </form>
          </div>
        </div>
      )}

      {editTourModalOpen && selectedTour && (
        <div className="modal">
          <div className="modal-content">
            <span className="close" onClick={() => setEditTourModalOpen(false)}>&times;</span>
            <h2>Edit Tour</h2>
            <form onSubmit={handleEditTourSubmit}>
                <input type="hidden" name="id_tours" value={selectedTour.id_tours} />
                <input type="text" name="title" defaultValue={selectedTour.title} placeholder="Tour Title" required />
                <textarea name="description" defaultValue={selectedTour.description} placeholder="Tour Description" required></textarea>
                <DndContext onDragEnd={onDragEnd} modifiers={[restrictToVerticalAxis, restrictToWindowEdges]}>
                  <SortableContext items={tourSteps[selectedTour.id_tours]?.map(step => step.id_tour_steps)} strategy={verticalListSortingStrategy}>
                    {tourSteps[selectedTour.id_tours]?.map((step, index) => (
                      <SortableItem  key={`step-${step.id_tour_steps}`} id={step.id_tour_steps}>
                        <div className="draggable-step">
                          <span className="drag-icon">☰</span>
                          <h4>Step {index + 1}</h4>
                          <input type="hidden" name={`steps[${index}][id_tour_steps]`} value={step.id_tour_steps} />
                          <select
                            name={`steps[${index}][id_rooms]`}
                            defaultValue={step.id_rooms}
                            required
                            onPointerDown={(e) => e.stopPropagation()}
                          >
                            <option value="">Select Room</option>
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
                          <h4>New Step {tourSteps[selectedTour.id_tours]?.length + index + 1}</h4>
                          <input type="hidden" name={`steps[${tourSteps[selectedTour.id_tours]?.length + index}][id_tour_steps]`} value={`new_${index}`} />
                          <select
                            name={`steps[${tourSteps[selectedTour.id_tours]?.length + index}][id_rooms]`}
                            required
                            onPointerDown={(e) => e.stopPropagation()}
                          >
                            <option value="">Select Room</option>
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
                <button type="button" onClick={handleAddStep}>Add Step</button>
                <button type="submit">Update Tour</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminTour;
