import React, { useState, useEffect, useContext } from "react";
import { useHistory } from "react-router-dom";
import firebase from "firebase/compat/app"; // Use compat version
import "firebase/compat/auth"; // Use compat version for auth
import firebaseConfig from "../firebaseConfig";
import { AppContext } from "../App";
import "../style/Login.css"; // Add this line to import the new CSS file

// Initialize Firebase
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { setIsAuthenticated } = useContext(AppContext); // Use setIsAuthenticated from context
  const history = useHistory();

  useEffect(() => {
    const checkAuth = async () => {
      const user = firebase.auth().currentUser;
      console.log("Current user in checkAuth:", user); // Debugging log
      setIsAuthenticated(!!user); // Update authentication status
    };
    firebase.auth().onAuthStateChanged(checkAuth);
  }, [setIsAuthenticated]);

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const userCredential = await firebase.auth().signInWithEmailAndPassword(
        email,
        password
      );
      console.log("User logged in:", userCredential.user); // Debugging log

      // Store authentication status in localStorage
      localStorage.setItem("isAuthenticated", true);
      setIsAuthenticated(true);

      history.push("/admin/room");
    } catch (err) {
      console.error("Login error:", err); // Debugging log
      setError(err.message);
    }
  };

  return (
    <div className="login-container bg-junia-lavender flex justify-center items-center h-screen">
      <div className="login-box bg-white px-12 py-12 rounded-lg shadow-lg w-full max-w-lg">
        <h1 className="text-junia-purple font-title text-2xl mb-6 text-center">
          Connexion
        </h1>
        {error && (
          <p className="text-red-500 text-center mb-4">{error}</p>
        )}
        <form
          onSubmit={handleLogin}
          className="flex flex-col gap-4"
        >
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="input-field"
          />
          <input
            type="password"
            placeholder="Mot de passe"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="input-field"
          />
          <button type="submit" className="button-type">
            Se connecter
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
