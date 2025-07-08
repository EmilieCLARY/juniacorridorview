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
              <div className="flex flex-col gap-15 basis-1/3 h-grow justify-center">
                <NavLink to="/tour?type=guided" className=" flex justify-center items-center bouton-orange text-white h-20vh rounded-r-3xl text-6xl font-bold ">
                  Visite Guidée
                </NavLink>
                <NavLink to="/pano?type=free" className="flex justify-center items-center bouton-orange text-white h-20vh rounded-r-3xl text-6xl font-bold">
                  Visite Libre
                </NavLink>
              </div>

              <div className="flex flex-col basis-2/3 gap-12 h-full justify-center">
                  <div className="bg-junia-purple h-25vh flex flex-col">
                    <div className='adaptive-title text-white inline-flex bg-junia-orange p-2 font-bold font-title rounded-br-lg'>JUNIA Corridor View</div>
                    <div className="px-3 py-2 text-white text-justify adaptive-text font-paragraphs overflow-auto">
                      Bienvenue dans la visite virtuelle de la Halle Technologique de Junia ! Découvrez un espace dédié à
                      l'innovation, où technologie et créativité se rencontrent pour façonner le futur. Plongez dans nos
                      installations, explorez nos projets, et laissez-vous inspirer par notre savoir-faire.
                    </div>
                  </div>
                <div className="bg-junia-purple flex-col h-25vh flex">
                    <div className='adaptive-title text-white bg-junia-orange inline-flex p-2 font-bold font-title rounded-br-lg'>Halle Technologique</div>
                    <div className="px-3 py-2 text-white text-justify adaptive-text font-paragraphs overflow-auto">
                      La Halle Technologique : un espace d'innovation et d'excellence.
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
