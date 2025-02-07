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
        setRouteName('Home');
        break;
      case '/pano':
        setRouteName('Panorama Viewer');
        break;
      case '/tour':
        setRouteName('Tour Viewer');
        break;
      case '/admin':
        setRouteName('Admin Panel');
        break;
      default:
        setRouteName('Menu Principal');
    }
  }, [location]);

  return (
    <>
      <nav className="relative justify-between bg-white px-2 shadow-lg">
        <div className="flex items-center">
          <img src="/img/logojunia.png" alt="Logo JUNIA" className="h-3/4"></img>
        </div>
        <div className="flex items-center text-5xl text-junia-purple font-title">
          {routeName}
        </div>
        <div className="flex items-center text-xl text-junia-orange font-title">
          Login Admin
        </div>
      </nav>
    </>
  );
};

export default Navbar;
