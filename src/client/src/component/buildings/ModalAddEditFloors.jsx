import React, {useEffect, useState} from "react";
import {toast} from "sonner";
import * as api from "../../api/AxiosAdminBuilding";

const ModalAddEditFloors = ({
    isOpen,
    toggle,
    floor,
    id_buildings,
    reload
}) => {
    const [showAddEditFloor, setShowAddEditFloor] = useState(false);
    const [editMode, setEditMode] = useState(false);

    const [floorName, setFloorName] = useState("");
    const [file, setFile] = useState(null);

    useEffect(() => {
        if (isOpen) {
            setShowAddEditFloor(true);
        } else {
            setShowAddEditFloor(false);
        }
    }, [isOpen]);

    useEffect(() => {
        if (floor && floor.id_floors) {
            setEditMode(true);
            setFloorName(floor.name);
            setFile(floor.plan);
        } else {
            setEditMode(false);
            setFloorName("");
            setFile(null);
        }
    }, [floor]);

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            if (!selectedFile.type.startsWith("image/")) {
                alert("Veuillez sélectionner un fichier image valide.");
                e.target.value = ""; // Clear the input
                return;
            }
            setFile(selectedFile);
        }
    }

    const handleNewFloorSubmit = (e) => {
        e.preventDefault();
        if(!floorName || floorName.trim() === "") {
            toast.error("Veuillez entrer un nom de niveau");
            return;
        }
        if(!file) {
            toast.error("Veuillez sélectionner un plan");
            return;
        }
        const formData = new FormData();
        formData.append('name', floorName);
        formData.append('plan', file);
        formData.append('id_buildings', id_buildings);
        if(editMode) {
            formData.append('id_floors', floor.id_floors);
            api.updateFloor(formData)
                .then(() => {
                    toast.success("Niveau modifié avec succès");
                    toggle();
                    reload();
                })
                .catch((error) => {
                    console.error('Error updating niveau:', error);
                    toast.error("Erreur lors de la modification du niveau !");
                });
        } else {
            // Call the API to create a new building
            api.insertFloor(formData)
                .then(() => {
                    toast.success("Niveau ajouté avec succès");
                    toggle();
                    reload();
                })
                .catch((error) => {
                    console.error('Error creating niveau:', error);
                    toast.error("Erreur lors de l'ajout du niveau !");
                });
        }
    }

    return(
        <>
            {showAddEditFloor && isOpen && (
                <div className="modal">
                    <div className="modal-content">
                        <div className="flex justify-between items-center pb-4">
                            <div className="text-3xl font-bold font-title text-center">{editMode ? "Modifier le niveau" : "Ajouter un nouveau niveau"}</div>
                            <span className="close items-center" onClick={toggle}>&times;</span>
                        </div>
                        <form onSubmit={handleNewFloorSubmit}>
                            <div className="flex items-center gap-4">
                                <div className="fonts-title text-junia-purple font-bold w-1/3">Nom du niveau :</div>
                                <input
                                    type="text"
                                    name="name"
                                    placeholder="Nom du niveau"
                                    value={floorName}
                                    onChange={(e) => setFloorName(e.target.value)}
                                    className="w-full p-2 border border-junia-orange rounded-md bg-white font-texts"
                                    required
                                />
                            </div>
                            <div className="flex items-center gap-4">
                                <label className="block font-bold text-junia-purple w-1/3">Plan :</label>
                                <div className="w-2/3">
                                    <div className="w-full rounded-md bg-white flex items-center">
                                        <input
                                            type="file"
                                            name="plan"
                                            accept="image/*"
                                            onChange={handleFileChange}
                                            className="w-full font-texts bg-junia-salmon"
                                        />
                                    </div>
                                </div>
                            </div>
                            <button
                                type="submit"
                                className="mt-4 p-2 bg-junia-orange hover:bg-junia-orange-dark rounded-3xl text-white font-bold shadow-md font-title text-center transition"
                            >
                                {editMode ? "Modifier le niveau" : "Ajouter le niveau"}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </>
    )
}

export default ModalAddEditFloors;