import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import * as api from '../api/AxiosLogin';
import '../style/Navbar.css';

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
    
    
      <nav className="navbar bg-junia-purple">
        <div className="navbar-container">
          <div className="navbar-left">
            <NavLink to="/" className="navbar-logo">
              JUNIA
            </NavLink>
            <p className="navbar-subtitle">Grande école d'ingénieurs</p>
          </div>
          <div className="navbar-right">
            <NavLink to="/" className="navbar-item">
              Home
            </NavLink>
            {login ? (
              <NavLink to="/logout" className="navbar-item">
                Logout
              </NavLink>
            ) : (
              <NavLink to="/login" className="navbar-item">
                Login
              </NavLink>
            )}
          </div>
        </div>
      </nav>
    </>
  );
};

export default Navbar;
