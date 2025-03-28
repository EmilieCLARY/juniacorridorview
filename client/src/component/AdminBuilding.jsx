import React, {useEffect, useRef, useState} from "react";
import {toast} from "sonner";
import Loader from "./Loader";
import * as api from '../api/AxiosAdminBuilding';
import {FaChevronDown, FaChevronUp, FaPen, FaPlus, FaPlusCircle, FaTrash} from "react-icons/fa";
import '../style/AdminBuilding.css'
import {Buffer} from "buffer";

const AdminBuilding = () => {
    const dataFetchedRef = useRef(false);

    const [building, setBuilding] = useState([]);
    const [floors, setFloors] = useState([]);

    const [indexesToShow, setIndexesToShow] = useState([]);

    const [isLoading, setIsLoading] = useState(true);
    const [textLoading, setTextLoading] = useState("Chargement des données...");

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
        return floors.filter(floor => floor.id_building === id_building);
    }

    const toggleIndexToShow = (index) => () => {
        if (indexesToShow.includes(index)) {
            setIndexesToShow(indexesToShow.filter(i => i !== index));
        } else {
            setIndexesToShow([...indexesToShow, index]);
        }
    }

    useEffect(() => {
        if (!dataFetchedRef.current) {
            showLoading([fetchBuildings(), fetchFloors()], "Chargement des données...", "Données chargées avec succès", "Erreur lors du chargement des données");
            dataFetchedRef.current = true;
        }
    }, []);

    return (
        <div className="mx-auto p-4 bg-junia-salmon">
            <Loader show={isLoading} text={textLoading} />
            <button className="px-4 py-2 mb-4 button-type font-title font-bold flex flex-row gap-2 items-center hover:cursor-pointer">
                <FaPlusCircle /> Ajouter un bâtiment
            </button>
            <div className="grid grid-cols-2 gap-4">
                {building.map((building, index) => (
                    <div key={index} className="px-1 py-2 border-2 purpleborder rounded-3xl shadow bg-white flex flex-col">
                        <h4 className="mx-4 font-bold font-title py-2 border-b">Bâtiment {building.name}</h4>
                        <div className="px-3 flex flex-col gap-2 scrollable-floor" id="style-2">
                            {getFloorsByBuilding(building.id_building).map((floor, index) => (
                                <div key={index} className="px-4 py-2 orangeborder rounded-xl shadow hover:shadow-lg hover:cursor-pointer transition-shadow duration-300 bg-white select-none flex flex-col gap-2" onClick={toggleIndexToShow(index)}>
                                    <div  className="flex flex-row justify-between items-center">
                                        <h5 className="font-title">Étage {floor.name}</h5>
                                        <div className="flex flex-row gap-2 items-center">
                                            <button className="px-3 py-1 button-type2 font-title flex flex-row gap-2 items-center hover:cursor-pointer"><FaPen /> Modifier</button>
                                            <button className="px-3 py-1 button-type font-title flex flex-row gap-2 items-center hover:cursor-pointer"><FaTrash /> Supprimer</button>
                                            {indexesToShow.includes(index) ? <FaChevronUp className="ml-3" /> : <FaChevronDown className="ml-3" />}
                                        </div>
                                    </div>
                                    {indexesToShow.includes(index) && (
                                        <div className="flex flex-col items-center justify-center pt-2 border-t">
                                            <h6 className="font-title">Plan de l'étage</h6>
                                            <div className="overflow-hidden flex items-center">
                                                <img src={`data:image/jpeg;base64,${Buffer.from(floor.plan).toString('base64')}`} alt={`Preview of ${floor.name}`} className="object-cover h-90% rounded-xl" />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                            <div className="px-4 mb-4 py-2 orangeborder rounded-xl shadow hover:shadow-lg hover:cursor-pointer transition-shadow duration-300 bg-white select-none flex flex-col items-center gap-2">
                                <FaPlus className="text-3xl text-junia-orange" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default AdminBuilding;