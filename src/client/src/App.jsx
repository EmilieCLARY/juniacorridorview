import React, { useState, createContext } from 'react';
import Navbar from './component/Navbar';
import { Switch, Route } from 'react-router-dom';
import Home from './component/Home';
import Login from './component/Login';
import Register from './component/Register';
import Profile from './component/Profile';
import TourViewer from './component/Tour';
import Admin from './component/Admin';
import PanoramaViewer from './component/Pano';
import AdminTour from './component/AdminTour';
import AdminRoom from './component/AdminRoom';
import AdminRoomDetails from './component/AdminRoomDetails';

import './App.css';
import {Toaster} from "sonner";
import AdminBuilding from "./component/AdminBuilding";

export const AppContext = createContext();

const App = () => {
  const [selectedImageName, setSelectedImageName] = useState('');
  const [currentRoomNumber, setCurrentRoomNumber] = useState('');

  return (
    <AppContext.Provider value={{ selectedImageName, setSelectedImageName, currentRoomNumber, setCurrentRoomNumber }}>
      <Toaster />
      <Navbar />
      <Switch>
        <Route exact path="/" component={Home} />
        <Route exact path="/pano" component={PanoramaViewer} />
        <Route exact path="/tour" component={TourViewer} />
        <Route exact path="/admin" component={Admin} />
        <Route exact path="/admin/tour" component={AdminTour} />
        <Route exact path="/admin/room" component={AdminRoom} />
        <Route exact path="/admin/room/:id" component={AdminRoomDetails} />
        <Route exact path="/admin/building" component={AdminBuilding} />
      </Switch>
    </AppContext.Provider>
  )
}

export default App;



