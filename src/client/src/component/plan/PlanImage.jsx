import {FaMapMarkerAlt} from "react-icons/fa";
import {Buffer} from "buffer";

const PlanImage = ({ image, altText, pinX, pinY }) => {
    return (
        <>
            {image && (
                <div className="relative inline-block" style={{borderBottom: "2px solid #3c2c53", borderLeft: "2px solid #3c2c53", borderBottomLeftRadius: "5px"}}>
                    <img src={`data:image/jpeg;base64,${Buffer.from(image).toString('base64')}`} alt={altText} className="w-full" style={{borderBottomLeftRadius: "5px"}} />
                    {pinX && pinY && (
                        <div className="absolute top-0 left-0" style={{ left: `${pinX * 100}%`, top: `${pinY * 100}%`, transform: "translate(-50%, -100%)" }}>
                            <FaMapMarkerAlt color={"red"} className="text-red-500 text-2xl" />
                        </div>
                    )}
                </div>
            )}
        </>
    );
}

export default PlanImage;