import React from "react";
import "../style/Loader.css";

const Loader = ({ show, text }) => {
    return (
        <>
            {show && (
                <div className="loader-overlay">
                    <div className="loader-container bg-junia-orange">
                        <img src="/img/junia_un.PNG" alt="Logo JUNIA" className="loader-image" />
                    </div>
                    {text && <p className="loader-text font-title font-bold">{text}</p>}
                </div>
            )}
        </>
    );
};

export default Loader;
