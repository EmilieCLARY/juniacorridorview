import React, {useEffect, useRef, useState} from "react";
import {Buffer} from "buffer";
import PlanImage from "./PlanImage";
import {FaMapMarkerAlt} from "react-icons/fa";

const ModalPlanPlacement = ({
    isOpen,
    toggle,
    setNewRoomData,
    setEditRoomData,
    newRoomData,
    editRoomData,
    editMode,
    floor
}) => {
    const [showPlanPlacement, setShowPlanPlacement] = useState(false);
    const imageRef = useRef(null);

    useEffect(() => {
        if (isOpen) {
            setShowPlanPlacement(true);
            console.log(newRoomData);
            console.log(editRoomData);
            console.log(editMode);
            console.log(floor);
        } else {
            setShowPlanPlacement(false);
        }
    }, [isOpen]);

    useEffect(() => {
        if(editMode) {
            setPinPosition({x: editRoomData.plan_x, y: editRoomData.plan_y});
        } else {
            setPinPosition({x: newRoomData.plan_x, y: newRoomData.plan_y});
        }
    }, [editRoomData, newRoomData, editMode]);

    const [pinPosition, setPinPosition] = useState(null); // { x: 0.5, y: 0.5 }

    const handleImageClick = (e) => {
        const rect = imageRef.current.getBoundingClientRect();

        const offsetX = e.clientX - rect.left;
        const offsetY = e.clientY - rect.top;

        const xPercent = offsetX / rect.width;
        const yPercent = offsetY / rect.height;

        setPinPosition({ x: xPercent, y: yPercent });

        if(editMode){
            setEditRoomData(prevData => ({
                ...prevData,
                plan_x: xPercent,
                plan_y: yPercent
            }));
        } else {
            setNewRoomData(prevData => ({
                ...prevData,
                plan_x: xPercent,
                plan_y: yPercent
            }));
        }
    };

    return(
        <>
            {showPlanPlacement && isOpen && (
                <div className="modal">
                    <div className="modal-content">
                        <div className="flex justify-between items-center pb-2">
                            <div className="text-3xl font-bold font-title text-center">Placer sur le plan</div>
                            <span className="close items-center" onClick={toggle}>&times;</span>
                        </div>
                        <div className="text-lg text-center">
                            Veuillez placer la salle sur le plan du bâtiment
                        </div>
                        <div style={{maxHeight: "60vh", display: "flex", justifyContent: "center"}}>
                            <div className="relative inline-block cursor-pointer" onClick={handleImageClick}>
                                <img ref={imageRef} src={`data:image/jpeg;base64,${Buffer.from(floor.plan).toString('base64')}`} alt="Plan de l'étage" style={{ maxHeight: "60vh", height: "auto", width: "auto", display: "block" }} />
                                {pinPosition && pinPosition.x && pinPosition.y && (
                                    <div className="absolute top-0 left-0" style={{ left: `${pinPosition.x * 100}%`, top: `${pinPosition.y * 100}%`, transform: "translate(-50%, -100%)" }}>
                                        <FaMapMarkerAlt color={"red"} className="text-red-500 text-2xl" />
                                    </div>
                                )}
                            </div>
                        </div>
                        <button
                            type="button"
                            className="mt-4 p-2 button-type"
                            onClick={toggle}
                        >
                            Fermer
                        </button>
                        <div style={{maxHeight: "15vh", maxWidth: "15vw"}}>
                            <PlanImage image={floor.plan} altText={"plan"} pinX={pinPosition ? pinPosition.x : null} pinY={pinPosition ? pinPosition.y : null} />
                        </div>
                    </div>
                </div>
            )}
        </>
    );

}

export default ModalPlanPlacement;