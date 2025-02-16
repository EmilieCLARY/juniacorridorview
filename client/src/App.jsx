import React from 'react';
import Navbar from './component/Navbar';
import { Switch, Route } from 'react-router-dom';
import Home from './component/Home';
import Login from './component/Login';
import Register from './component/Register';
import Profile from './component/Profile';
import TourViewer from './component/Tour';
import Admin from './component/Admin';
import PanoramaViewer from './component/Pano';
import Panorama360 from './component/Panorama360';
import AdminTour from './component/AdminTour';

import './App.css';
import {Toaster} from "sonner";

const App = () => {
  return (
    <>
      <Toaster />
      <Navbar/>
      <Switch>
        <Route exact path ="/" component={Home}/>
        <Route exact path ="/pano" component={PanoramaViewer}/>
        <Route exact path ="/tour" component={TourViewer}/>
        <Route exact path ="/admin" component={Admin}/>
        <Route exact path ="/dev-pano" component={Panorama360}/> 
        <Route exact path ="/admin-tour" component={AdminTour}/>
      </Switch>
    </>
  )
}

export default App;



