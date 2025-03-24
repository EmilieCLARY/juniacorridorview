import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import * as api from '../api/AxiosLogin';
import '../style/Navbar.css';

const Navbar = () => {
  const [login, setLogin] = useState(false);
  const location = useLocation();
  const [routeName, setRouteName] = useState('');

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
        setRouteName('Immersion');
        break;
      case '/tour':
        setRouteName('Visite Guidée');
        break;
      case '/admin':
        setRouteName('Administrateur');
        break;
      case '/admin/tour':
        setRouteName('Parcours');
        break;
      case '/admin/room':
        setRouteName('Salles');
        break;
      case location.pathname.match(/\/admin\room\/[0-9]{1,9}/)?.input + '/edit':
        setRouteName('Détails de la Salle');
      break;

      default:
        setRouteName('Menu Principal');
    }
  }, [location]);

  return (
    <>
      <nav className="relative justify-between bg-white px-2 shadow-lg">
        <div className="flex items-center">
          <NavLink to="/">
            <img src="/img/logojunia.png" alt="Logo JUNIA" className="h-3/4"></img>
          </NavLink>
        </div>
        <div className="flex items-center text-5xl text-junia-purple font-title">
          {routeName}
        </div>
        <div className="flex items-center text-xl text-junia-orange font-title gap-2">
        <NavLink to="/" className="text-inherit no-underline hover:text-inherit"> <img src="\img\house_icon-orange.png" alt="House-icon" className="height-40" /></NavLink>
          <NavLink to="/admin/room" className="text-inherit no-underline hover:text-inherit">Admin</NavLink>
        </div>
      </nav>
    </>
  );
};

export default Navbar;
