import React, { useState, useEffect, useContext, useRef } from 'react';
import { NavLink, useLocation, useHistory } from 'react-router-dom';
import * as api from '../api/AxiosLogin';
import '../style/Navbar.css';
import { FaHome } from "react-icons/fa";
import { AppContext } from '../App';
import firebase from "firebase/compat/app"; // Use compat version
import "firebase/compat/auth"; // Use compat version for auth
import { FaUserCog, FaUser } from "react-icons/fa"; // Ajout de l'icône user settings
import { RiAdminFill } from "react-icons/ri";

const Navbar = ({ isAuthenticated, selectedImageName, currentRoomNumber }) => {
  const { setIsAuthenticated } = useContext(AppContext);
  const [login, setLogin] = useState(false);
  const location = useLocation();
  const history = useHistory();
  const [routeName, setRouteName] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false); // State to toggle modal visibility
  const [userEmail, setUserEmail] = useState(""); // State to store the user's email
  const modalRef = useRef(null);

  useEffect(() => {
    const checkLogin = async () => {
      let val = await api.getLogin();
      setLogin(val.login);
    };
    checkLogin();
  }, []);

  useEffect(() => {
    switch (location.pathname) {
      case '/':
        setRouteName('Accueil');
        break;
      case '/pano':
        // Correction ici : afficher "numéro de la salle - nom de la salle"
        const safeImageName = selectedImageName || '';
        const safeRoomNumber = currentRoomNumber || '';
        if(safeImageName === '' || safeRoomNumber === '') {
          setRouteName('Immersion');
        }
        else {
          setRouteName(safeRoomNumber + ' - ' + safeImageName);
        }
        break;
      case '/tour':
        setRouteName('Visite Guidée');
        break;
      case '/admin':
        setRouteName('Administrateur');
        break;
      case '/admin/tour':
        setRouteName('Gestion des Parcours');
        break;
      case '/admin/room':
        setRouteName('Gestion des Salles');
        break;
      case '/admin/building':
        setRouteName('Gestion des Bâtiments');
        break;
      case '/admin/user':
        setRouteName('Gestion des Administrateurs');
        break;
      case location.pathname.match(/^\/admin\/room\/\d+$/)?.input:
        setRouteName('Gestion d\'une Salle');
      break;

      default:
        setRouteName('Menu Principal');
    }
  }, [location, selectedImageName, currentRoomNumber]);

  useEffect(() => {
    const fetchUserEmail = () => {
      const user = firebase.auth().currentUser;
      if (user) {
        setUserEmail(user.email);
      }
    };
    fetchUserEmail();
    firebase.auth().onAuthStateChanged(fetchUserEmail);
  }, []);

  const handleLogout = async () => {
    await firebase.auth().signOut();
    localStorage.removeItem("isAuthenticated");
    setIsAuthenticated(false);
    history.push("/login");
  };

  const toggleModal = () => {
    setIsModalOpen((prev) => !prev);
  };

  const isAdminPage = location.pathname.startsWith("/admin");

  useEffect(() => {
    if (!isModalOpen) return;
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        setIsModalOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isModalOpen]);

  return (
    <>
      <nav className="relative justify-between bg-white px-2 shadow-lg">
        <div className="flex items-center">
          <NavLink to="/">
            <img src="/img/logojunia.png" alt="Logo JUNIA" className="height-60 cursor-pointer"></img>
          </NavLink>
        </div>
        <div className="flex items-center text-5xl text-junia-purple font-title">
          {routeName}
        </div>
        <div className="flex items-center text-xl text-junia-orange font-title gap-2">
          <NavLink to="/" className="text-inherit no-underline hover:text-inherit" >
            <FaHome className="text-4xl" title="Page d'accueil" />
          </NavLink>
          {isAuthenticated && (
            <NavLink to="/admin/room" className="text-inherit no-underline hover:text-inherit">
              <RiAdminFill className="text-4xl" title="Gestion des salles"/>
            </NavLink>
          )}
          {!isAuthenticated && !isAdminPage && (
            <NavLink to="/login" className="text-inherit no-underline hover:text-inherit">
              <RiAdminFill className="text-4xl" title="Panneau d'administration"/>
            </NavLink>
          )}
          {isAuthenticated && (
            <NavLink
              to="/admin/user"
              className="text-inherit no-underline hover:text-inherit flex items-center"
              style={{ display: "inline-flex", alignItems: "center" }}
              title="Paramètres utilisateur"
            >
              <FaUserCog className="text-4xl cursor-pointer" title="Paramètres administrateurs" />
            </NavLink>
          )}
          {isAuthenticated && (
            <div className="relative inline-block text-left" ref={modalRef}>
              <button
                type="button"
                onClick={toggleModal}
                style={{ background: "none", border: "none", padding: 0, margin: 0, lineHeight: 1 }}
                className="text-inherit no-underline hover:text-inherit flex items-center"
              >
                <FaUser className="text-4xl align-middle cursor-pointer" style={{ verticalAlign: "middle", fontSize: "1.75rem" }} title="Utilisateur" />
              </button>
              {isModalOpen && (
                <div
                  style={{
                    position: "absolute",
                    top: "40px",
                    right: "0",
                    backgroundColor: "white",
                    border: "1px solid #ccc",
                    borderRadius: "5px",
                    boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
                    padding: "10px",
                    zIndex: 1000,
                  }}
                >
                  <p style={{ marginBottom: "10px", fontSize: "14px", color: "#333" }}>
                    {userEmail}
                  </p>
                  <button
                    onClick={handleLogout}
                    style={{
                      background: "none",
                      border: "none",
                      color: "red",
                      cursor: "pointer",
                    }}
                  >
                    Se Déconnecter
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </nav>
    </>
  );
};

export default Navbar;
