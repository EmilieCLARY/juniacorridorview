import React, {useEffect, useState} from "react";
import * as api from '../../api/AxiosAdminBuilding';
import {toast} from "sonner";

const ModalAddEditBuilding = ({
    isOpen,
    toggle,
    building,
    reload
}) => {
    const [showAddEditBuilding, setShowAddEditBuilding] = useState(false);
    const [editMode, setEditMode] = useState(false);

    const [buildingName, setBuildingName] = useState("");

    useEffect(() => {
        if (isOpen) {
            setShowAddEditBuilding(true);
        } else {
            setShowAddEditBuilding(false);
        }
    }, [isOpen]);

    useEffect(() => {
        if (building && building.id_buildings != null) {
            setEditMode(true);
            setBuildingName(building.name);
        } else {
            setEditMode(false);
            setBuildingName("");
        }
    }, [building]);

    const handleNewBuildingSubmit = (e) => {
        e.preventDefault();
        if(!buildingName || buildingName.trim() === "") {
            toast.error("Veuillez entrer un nom de bâtiment");
            return;
        }
        const formData = new FormData();
        formData.append('name', buildingName);
        if(editMode) {
            formData.append('id_buildings', building.id_buildings);
            api.updateBuilding(formData)
                .then(() => {
                    toast.success("Bâtiment modifié avec succès");
                    toggle();
                    reload();
                })
                .catch((error) => {
                    console.error('Error updating building:', error);
                    toast.error("Erreur lors de la modification du bâtiment !");
                });
        } else {
            // Call the API to create a new building
            api.insertBuilding(formData)
                .then(() => {
                    toast.success("Bâtiment ajouté avec succès");
                    toggle();
                    reload();
                })
                .catch((error) => {
                    console.error('Error creating building:', error);
                    toast.error("Erreur lors de l'ajout du bâtiment !");
                });
        }
    }

    return(
        <>
            {showAddEditBuilding && isOpen && (
                <div className="modal">
                    <div className="modal-content">
                        <div className="flex justify-between items-center pb-4">
                            <div className="text-3xl font-bold font-title text-center">{editMode ? "Modifier le bâtiment" : "Ajouter un nouveau bâtiment"}</div>
                            <span className="close items-center" onClick={toggle}>&times;</span>
                        </div>
                        <form onSubmit={handleNewBuildingSubmit}>
                            <div className="flex items-center gap-4">
                                <div className="fonts-title text-junia-purple font-bold w-1/3">Nom du bâtiment :</div>
                                <input
                                    type="text"
                                    name="name"
                                    placeholder="Nom du bâtiment"
                                    value={buildingName}
                                    onChange={(e) => setBuildingName(e.target.value)}
                                    className="w-full p-2 border border-junia-orange rounded-md bg-white font-texts"
                                    required
                                />
                            </div>
                            <button
                                type="submit"
                                className="mt-4 p-2 bg-junia-orange hover:bg-junia-orange-dark rounded-3xl text-white font-bold shadow-md font-title text-center transition"
                            >
                                {editMode ? "Modifier le bâtiment" : "Ajouter le bâtiment"}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </>
    )
}

export default ModalAddEditBuilding;