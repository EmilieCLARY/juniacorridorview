import React from 'react';
import Navbar from './component/Navbar';
import { Switch, Route } from 'react-router-dom';
import Home from './component/Home';
import Login from './component/Login';
import Register from './component/Register';
import Profile from './component/Profile';
import TourViewer from './component/Tour';

import PanoramaViewer from './component/Pano';

import './App.css';

const App = () => {
  return (
    <>
    <Navbar/>
    <Switch>
      <Route exact path ="/" component={Home}/>
      <Route exact path ="/pano" component={PanoramaViewer}/>
      <Route exact path ="/tour" component={TourViewer}/>
      
    </Switch>
    </>
  )
}

export default App;



