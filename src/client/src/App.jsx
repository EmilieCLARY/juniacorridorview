import React, { useEffect, useState, createContext } from 'react';
import { Switch, Route, Redirect } from 'react-router-dom';
import Navbar from './component/Navbar';
import Home from './component/Home';
import TourViewer from './component/Tour';
import PanoramaViewer from './component/Pano';
import AdminTour from './component/AdminTour';
import AdminRoom from './component/AdminRoom';
import AdminRoomDetails from './component/AdminRoomDetails';
import Login from './component/Login';
import AdminBuilding from "./component/AdminBuilding";

import './App.css';
import {Toaster} from "sonner";

export const AppContext = createContext();

const PrivateRoute = ({ component: Component, ...rest }) => {
  const isAuthenticated = localStorage.getItem("isAuthenticated") === "true";
  return (
    <Route
      {...rest}
      render={(props) =>
        isAuthenticated ? <Component {...props} /> : <Redirect to="/login" />
      }
    />
  );
};

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Check authentication status on app load
    const authStatus = localStorage.getItem("isAuthenticated") === "true";
    setIsAuthenticated(authStatus);
  }, []);

  return (
    <AppContext.Provider value={{ isAuthenticated, setIsAuthenticated }}>
      <Toaster />
      <Navbar isAuthenticated={isAuthenticated} />
      <Switch>
        <Route exact path="/" component={Home} />
        <Route exact path="/pano" component={PanoramaViewer} />
        <Route exact path="/tour" component={TourViewer} />
        <PrivateRoute exact path="/admin/tour" component={AdminTour} />
        <PrivateRoute exact path="/admin/room" component={AdminRoom} />
        <PrivateRoute exact path="/admin/room/:id" component={AdminRoomDetails} />
        <PrivateRoute exact path="/admin/building" component={AdminBuilding} />
        <Route exact path="/login" component={Login} />
      </Switch>
    </AppContext.Provider>
  )
}

export default App;



