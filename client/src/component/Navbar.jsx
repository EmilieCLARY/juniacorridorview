import React,{useState,useEffect} from 'react';
import {NavLink} from 'react-router-dom';
import * as api from '../api/AxiosLogin';

const Navbar = () => {
  const [login, setLogin] = useState(false)

  useEffect(() => {
    const checkLogin= async () => {
      let val= await api.getLogin();
      setLogin(val.login)
    }
    checkLogin();
  }, [login])
  
  return (
    <>
      <nav className="navbar navbar-expand-lg bg-dark">
        <div className="container">
          <NavLink className="navbar-brand text-white" to="/">Navbar</NavLink>
          <button className="navbar-toggler" type="button" data-toggle="collapse" data-target="#navbarNav" aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
            <span className="navbar-toggler-icon"></span>
          </button>
          <div className="collapse navbar-collapse" id="navbarNav">
            <ul className="navbar-nav ml-auto ">
              <li className="nav-item active">
                <NavLink to="/" className="nav-link text-white" >Home </NavLink>
              </li>
              <li className="nav-item active">
              {
                !login ? (
                  <>
                  <NavLink to="/login" className="nav-link text-white" >Login</NavLink>
                  
                  </>
                )
                :   <NavLink to="/logout" className="nav-link text-white" >LogOut</NavLink>
              }
              </li>              
            </ul>
          </div>
        </div>
      </nav>
    </>
  )
}

export default Navbar;
