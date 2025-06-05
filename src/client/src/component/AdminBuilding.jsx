import React, {useEffect, useRef, useState} from "react";
import {toast} from "sonner";
import Loader from "./Loader";
import * as api from '../api/AxiosAdminBuilding';
import {FaArrowLeft, FaChevronDown, FaChevronUp, FaPen, FaPlus, FaPlusCircle, FaTrash} from "react-icons/fa";
import '../style/AdminBuilding.css';
import {Buffer} from "buffer";
import ModalAddEditBuilding from "./buildings/ModalAddEditBuilding";
import ModalAddEditFloors from "./buildings/ModalAddEditFloors";
import {useHistory} from "react-router-dom";
import ConfirmDialog from "./dialogs/ConfirmDialog";

const AdminBuilding = () => {
    const dataFetchedRef = useRef(false);

    const [building, setBuilding] = useState([]);
    const [floors, setFloors] = useState([]);

    const [showAddEditBuilding, setShowAddEditBuilding] = useState(false);
    const [showAddEditFloor, setShowAddEditFloor] = useState(false);

    const [buildingToEdit, setBuildingToEdit] = useState({});
    const [floorToEdit, setFloorToEdit] = useState({});
    const [idBuildingFloor, setIdBuildingFloor] = useState(null);

    const [indexesToShow, setIndexesToShow] = useState([]);

    const [isLoading, setIsLoading] = useState(true);
    const [textLoading, setTextLoading] = useState("Chargement des données...");

    const [showConfirm, setShowConfirm] = useState(false);
    const [confirmTitle, setConfirmTitle] = useState("");
    const [confirmMessage, setConfirmMessage] = useState("");
    const [buildingToDelete, setBuildingToDelete] = useState(null);
    const [floorToDelete, setFloorToDelete] = useState(null);

    const history = useHistory();

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

    const fetchBuildings = async () => {
        await api.getBuildings()
            .then((data) => {
                setBuilding(data);
            });
    }

    const fetchFloors = async () => {
        await api.getFloors()
            .then((data) => {
                setFloors(data);
            });
    }

    const getFloorsByBuilding = (id_building) => {
        return floors.filter(floor => floor.id_buildings === id_building);
    }

    const toggleIndexToShow = (index) => () => {
        if (indexesToShow.includes(index)) {
            setIndexesToShow(indexesToShow.filter(i => i !== index));
        } else {
            setIndexesToShow([...indexesToShow, index]);
        }
    }

    const toggleAddEditBuilding = () => {
        setShowAddEditBuilding(!showAddEditBuilding);
    }

    const toggleAddEditFloor = () => {
        setShowAddEditFloor(!showAddEditFloor);
    }

    const handleAddBuilding = () => {
        setBuildingToEdit({});
        setShowAddEditBuilding(true);
    }

    const handleEditBuilding = (building) => {
        setBuildingToEdit(building);
        setShowAddEditBuilding(true);
    }

    const handleAddFloor = (id_buildings) => {
        setFloorToEdit({});
        setIdBuildingFloor(id_buildings);
        setShowAddEditFloor(true);
    }

    const handleEditFloor = (floor, id_buildings) => {
        setFloorToEdit(floor);
        setIdBuildingFloor(id_buildings);
        setShowAddEditFloor(true);
    }

    const handleDeleteBuilding = (id_building) => {
        setBuildingToDelete(id_building);
        setConfirmTitle("Suppresion du bâtiment");
        setConfirmMessage("Êtes-vous sûr de vouloir supprimer ce bâtiment ? Cette action est irréversible.");
        setShowConfirm(true);
    }

    const confirmDeleteBuilding = () => {
        api.deleteBuilding(buildingToDelete)
            .then(() => {
                toast.success("Bâtiment supprimé avec succès");
                reloadBuilding();
                setBuildingToDelete(null)
            })
            .catch((error) => {
                console.error('Error deleting building:', error);
                toast.error("Erreur lors de la suppression du bâtiment !");
            });
    }

    const handleDeleteFloor = (id_floor) => {
        setFloorToDelete(id_floor);
        setConfirmTitle("Suppression du niveau");
        setConfirmMessage("Êtes-vous sûr de vouloir supprimer ce niveau ? Cette action est irréversible.");
        setShowConfirm(true);
    }

    const confirmDeleteFloor = () => {
        api.deleteFloor(floorToDelete)
            .then(() => {
                toast.success("Niveau supprimé avec succès");
                reloadFloor();
                setFloorToDelete(null);
            })
            .catch((error) => {
                console.error('Error deleting niveau:', error);
                toast.error("Erreur lors de la suppression du niveau !");
            });
    }

    const reloadBuilding = () => {
        showLoading([fetchBuildings()], "Chargement des bâtiments...", "Bâtiments chargées avec succès", "Erreur lors du chargement des bâtiments");
    }

    const reloadFloor = () => {
        showLoading([fetchFloors()], "Chargement des niveaux...", "Niveaux chargées avec succès", "Erreur lors du chargement des niveaux");
    }

    useEffect(() => {
        if (!dataFetchedRef.current) {
            showLoading([fetchBuildings(), fetchFloors()], "Chargement des données...", "Données chargées avec succès", "Erreur lors du chargement des données");
            dataFetchedRef.current = true;
        }
    }, []);

    return (
        <div className="admin-building-page">
            <Loader show={isLoading} text={textLoading} />
            <div className="mx-auto p-3">
                <div className="flex flex-row gap-4 mb-4">
                    <button
                        onClick={() => history.push('/admin/room')}
                        className="px-4 py-2 button-type font-title font-bold flex items-center gap-2">
                        <FaArrowLeft /> Retour
                    </button>
                    <button className="px-4 py-2 button-type font-title font-bold flex flex-row gap-2 items-center hover:cursor-pointer" onClick={handleAddBuilding}>
                        <FaPlusCircle /> Ajouter un bâtiment
                    </button>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    {building.map((building, index) => (
                        <div key={index} className="px-1 py-2 border-2 purpleborder rounded-3xl shadow bg-white flex flex-col">
                            <div className="mx-4 mb-2 py-2 border-b flex flex-row justify-between items-center">
                                <h4 className="font-bold font-title ">Bâtiment {building.name}</h4>
                                <div className="flex flex-row gap-2 items-center">
                                    <button className="px-3 py-1 button-type2 font-title flex flex-row gap-2 items-center hover:cursor-pointer" onClick={() => handleEditBuilding(building)}><FaPen /> Modifier</button>
                                    <button className="px-3 py-1 button-type font-title flex flex-row gap-2 items-center hover:cursor-pointer" onClick={() => handleDeleteBuilding(building.id_buildings)}><FaTrash /> Supprimer</button>
                                </div>
                            </div>
                            <div className="px-3 flex flex-col gap-2 scrollable-floor" id="style-2">
                                {getFloorsByBuilding(building.id_buildings).map((floor, index) => (
                                    <div key={index} className="px-4 py-2 orangeborder rounded-xl shadow hover:shadow-lg hover:cursor-pointer transition-shadow duration-300 bg-white select-none flex flex-col gap-2" onClick={toggleIndexToShow(floor.id_floors)}>
                                        <div  className="flex flex-row justify-between items-center">
                                            <h5 className="font-title">Niveau {floor.name}</h5>
                                            <div className="flex flex-row gap-2 items-center">
                                                <button className="px-3 py-1 button-type2 font-title flex flex-row gap-2 items-center hover:cursor-pointer" onClick={() => handleEditFloor(floor, building.id_buildings)}><FaPen /> Modifier</button>
                                                <button className="px-3 py-1 button-type font-title flex flex-row gap-2 items-center hover:cursor-pointer" onClick={() => handleDeleteFloor(floor.id_floors)}><FaTrash /> Supprimer</button>
                                                {indexesToShow.includes(floor.id_floors) ? <FaChevronUp className="ml-3" /> : <FaChevronDown className="ml-3" />}
                                            </div>
                                        </div>
                                        {indexesToShow.includes(floor.id_floors) && (
                                            <div className="flex flex-col items-center justify-center pt-2 border-t">
                                                <h6 className="font-title">Plan de l'étage</h6>
                                                <div className="overflow-hidden flex items-center">
                                                    <img src={`data:image/jpeg;base64,${Buffer.from(floor.plan).toString('base64')}`} alt={`Preview of ${floor.name}`} className="object-cover h-90% rounded-xl" />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                                <div className="px-4 mb-4 py-2 orangeborder rounded-xl shadow hover:shadow-lg hover:cursor-pointer transition-shadow duration-300 bg-white select-none flex flex-col items-center gap-2"
                                     onClick={() => {handleAddFloor(building.id_buildings)}}
                                >
                                    <FaPlus className="text-3xl text-junia-orange" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
                <ModalAddEditBuilding isOpen={showAddEditBuilding} toggle={toggleAddEditBuilding} building={buildingToEdit} reload={reloadBuilding} />
                <ModalAddEditFloors isOpen={showAddEditFloor} toggle={toggleAddEditFloor} floor={floorToEdit} id_buildings={idBuildingFloor} reload={reloadFloor} />
                <ConfirmDialog open={showConfirm} onClose={() => setShowConfirm(false)} title={confirmTitle} message={confirmMessage} onConfirm={() => {
                    if (buildingToDelete) {
                        confirmDeleteBuilding();
                    } else if (floorToDelete) {
                        confirmDeleteFloor();
                    }
                }} />
            </div>
        </div>
    );
}

export default AdminBuilding;