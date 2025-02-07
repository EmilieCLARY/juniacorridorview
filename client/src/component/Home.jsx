import React from 'react';
import { NavLink } from 'react-router-dom';
import '../style/Home.css'; // Importing the CSS file
import SpotlightCard from '../reactbits/Components/SpotlightCard/SpotlightCard';

const Home = () => {
  return (
    <>
      <section className="bg-junia-lavender body-container">
      <main className='h-full'>
            <div className="flex flex-row h-full pr-5 gap-30">
              <div className="flex flex-col gap-8 basis-1/3 h-grow justify-center">
                <NavLink to="/tour?type=guided" className="flex justify-center items-center bouton-orange text-white h-28 rounded-r-3xl text-3xl font-bold hover:border-2 hover:border-junia-orange hover:no-underline">
                  Visite Guidée
                </NavLink>
                <NavLink to="/pano?type=free" className="flex justify-center items-center bouton-orange text-white h-28 rounded-r-3xl text-3xl font-bold">
                  Visite Libre
                </NavLink>
              </div>

              <div className="flex flex-col basis-2/3 gap-12  justify-center">
                  <div className="bg-junia-purple">
                    <div className='text-xl font-title text-white inline-block text-center bg-junia-orange p-2 font-bold'> JUNIA Corridor View</div>
                    <div className="px-3 py-2 text-white text-justify">
                      Bienvenue dans la visite virtuelle de la Halle Technologique de Junia ! Découvrez un espace dédié à
                      l'innovation, où technologie et créativité se rencontrent pour façonner le futur. Plongez dans nos
                      installations, explorez nos projets, et laissez-vous inspirer par notre savoir-faire.
                    </div>
                  </div>
                <div className="bg-junia-purple flex-col">
                    <div className='text-xl font-title text-white text-center bg-junia-orange inline-block p-2 font-bold'> Halle Technologique  </div>
                    <div className="px-3 py-2 text-white text-justify">
                      La Halle Technologique : un espace d’innovation et d’excellence.
                      Explorez ce lieu unique dédié à la recherche, au développement
                      et à la formation technologique. Avec ses équipements de pointe
                      et ses projets collaboratifs, la Halle Technologique est à la croisée
                      des chemins entre industrie, créativité et apprentissage.
                    </div>
                  </div>
              </div>
            </div>
        </main>
      </section>
    </>
  );
};

export default Home;
