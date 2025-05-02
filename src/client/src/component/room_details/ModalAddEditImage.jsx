import React, {useEffect, useState} from "react";
import * as api from '../../api/AxiosAdminRoom';
import {toast} from "sonner";
import Loader from "../Loader";

const ModalAddEditImage = ({
    isOpen,
    toggle,
    id_rooms,
    imageToUpdate,
    reload,
}) => {
    const [showAddEditImage, setShowAddEditImage] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [loading, setLoading] = useState(false);
    const [textLoading, setTextLoading] = useState("");

    const [file, setFile] = useState(null);

    useEffect(() => {
        if (isOpen) {
            setShowAddEditImage(true);
        } else {
            setShowAddEditImage(false);
        }
    }, [isOpen]);

    useEffect(() => {
        if (imageToUpdate && imageToUpdate.id_pictures) {
            setEditMode(true);
        } else {
            setEditMode(false);
        }
    }, [imageToUpdate]);

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            setFile(selectedFile);
        }
    }

    const handleImageSubmit = (e) => {
        e.preventDefault();
        if (!file) {
            toast.error("Veuillez sélectionner une image");
            return;
        }
        const formData = new FormData();
        formData.append('pic', file);
        formData.append('id_rooms', id_rooms);
        if (editMode) {
            formData.append('id_pictures', imageToUpdate.id_pictures);
            setLoading(true);
            setTextLoading("Modification de l'image...");
            api.updateImage(formData)
                .then(() => {
                    reload('edit');
                    setLoading(false);
                    setFile(null);
                })
                .catch((error) => {
                    console.error("Erreur lors de la modification de l'image :", error);
                    toast.error("Erreur lors de la modification de l'image");
                    setLoading(false);
                    setFile(null);
                });
        } else {
            setLoading(true);
            setTextLoading("Ajout de l'image...");
            api.uploadFile(formData)
                .then(() => {
                    reload('add');
                    setLoading(false);
                    setFile(null);
                })
                .catch((error) => {
                    console.error("Erreur lors de l'ajout de l'image :", error);
                    toast.error("Erreur lors de l'ajout de l'image");
                    setLoading(false);
                    setFile(null);
                });
        }
    }

    return(
        <>
            <Loader show={loading} text={textLoading} />
            {showAddEditImage && isOpen && (
                <div className="modal">
                    <div className="modal-content">
                        <div className="flex justify-between items-center pb-4">
                            <div className="text-3xl font-bold font-title text-center">{editMode ? "Modifier l'image 360°" : "Ajouter une nouvelle image 360°"}</div>
                            <span className="close items-center" onClick={toggle}>&times;</span>
                        </div>
                        <form onSubmit={handleImageSubmit}>
                            <div className="flex items-center gap-4">
                                <label className="block font-bold text-junia-purple w-1/3">Image :</label>
                                <div className="w-2/3">
                                    <div className="w-full rounded-md bg-white flex items-center">
                                        <input
                                            type="file"
                                            name="Image"
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
                                {editMode ? "Modifier l'image" : "Ajouter l'image"}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </>
    )
}

export default ModalAddEditImage;