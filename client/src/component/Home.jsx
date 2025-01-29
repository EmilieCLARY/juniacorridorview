import React from 'react';
import { NavLink } from 'react-router-dom';
import '../style/Home.css'; // Importing the CSS file
import SpotlightCard from '../reactbits/Components/SpotlightCard/SpotlightCard';

const Home = () => {
  return (
    <>
      <section className="home-section bg-junia-lavender">
        <main>
          <h2 className="main-title">Menu Principal</h2>
          <div className="button-container">
            <NavLink to="/tour?type=guided" className="main-button">
              Visite Guidée
            </NavLink>
            <NavLink to="/pano?type=free" className="main-button">
              Visite Libre
            </NavLink>
          </div>
          <div className="info-container">
            <SpotlightCard >
              <div className="info-box bg-junia-purple">
                <h3>JUNIA Corridor View</h3>
                <p>
                  Bienvenue dans la visite virtuelle de la Halle Technologique de Junia ! Découvrez un espace dédié à
                  l'innovation, où technologie et créativité se rencontrent pour façonner le futur. Plongez dans nos
                  installations, explorez nos projets, et laissez-vous inspirer par notre savoir-faire.
                </p>
              </div>
            </SpotlightCard>
            <SpotlightCard >
              <div className="info-box bg-junia-orange-accent">
                <h3>Présentation halle technologique</h3>
                <p>
                  La Halle Technologique : un espace d'innovation et d'excellence. Explorez ce lieu unique dédié à la
                  recherche, au développement et à la formation technologique. Avec ses équipements de pointe et ses
                  projets collaboratifs, la Halle Technologique est à la croisée des chemins entre industrie, créativité
                  et apprentissage.
                </p>
              </div>
            </SpotlightCard>
          </div>
        </main>
      </section>
    </>
  );
};

export default Home;
