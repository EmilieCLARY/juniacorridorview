import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import * as api from '../api/AxiosLogin';
import '../style/Navbar.css';
// Importer l'image
//import logo from '/img/logojunia.png';

const Navbar = () => {
  const [login, setLogin] = useState(false);

  useEffect(() => {
    const checkLogin = async () => {
      let val = await api.getLogin();
      setLogin(val.login);
    };
    checkLogin();
  }, []);

  return (
    <>
      <nav className="relative justify-between bg-white px-2 shadow-lg">
        <div className="flex items-center">
          <img src="/img/logojunia.png" alt="Logo JUNIA" className="h-3/4"></img>
        </div>
        <div className=" flex items-center text-5xl text-junia-purple font-title"> 
          Menu Principal 
        </div>
        <div className="flex items-center text-xl text-junia-orange font-title">
          Login Admin
        </div>
      </nav>

    </>
  );
};

export default Navbar;
