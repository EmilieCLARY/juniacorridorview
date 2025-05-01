/*
	jsrepo 1.36.0
	Installed from https://reactbits.dev/default/
	14-02-2025
*/

import { useEffect, useState, useRef } from "react";
import { motion, useMotionValue, useTransform } from "framer-motion";
// replace icons with your own if needed
import {
  FiCircle,
  FiCode,
  FiFileText,
  FiLayers,
  FiLayout,
} from "react-icons/fi";

import "./Carousel.css";

const DEFAULT_ITEMS = [
  {
    title: "Text Animations",
    description: "Cool text animations for your projects.",
    id: 1,
    icon: <FiFileText className="carousel-icon" />,
  },
  {
    title: "Animations",
    description: "Smooth animations for your projects.",
    id: 2,
    icon: <FiCircle className="carousel-icon" />,
  },
  {
    title: "Components",
    description: "Reusable components for your projects.",
    id: 3,
    icon: <FiLayers className="carousel-icon" />,
  },
  {
    title: "Backgrounds",
    description: "Beautiful backgrounds and patterns for your projects.",
    id: 4,
    icon: <FiLayout className="carousel-icon" />,
  },
  {
    title: "Common UI",
    description: "Common UI components are coming soon!",
    id: 5,
    icon: <FiCode className="carousel-icon" />,
  },
];

const DRAG_BUFFER = 0;
const VELOCITY_THRESHOLD = 300;
const GAP = 16;
const SPRING_OPTIONS = { type: "tween", duration: 0.5, ease: "easeInOut" };

export default function Carousel({
  items = DEFAULT_ITEMS,
  baseWidth = "100%",
  autoplay = false,
  autoplayDelay = 3000,
  pauseOnHover = false,
  loop = false,
  round = false,
  onChange = () => {}, // Add onChange prop
}) {
  const containerPadding = 0; // Remove padding to make the image bigger
  const itemWidth = `calc(${baseWidth} - ${containerPadding * 2}px)`;
  const trackItemOffset = `calc(${itemWidth} + ${GAP}px)`;

  const carouselItems = loop ? [...items, items[0]] : items;
  const [currentIndex, setCurrentIndex] = useState(0);
  const x = useMotionValue(0);
  const [isHovered, setIsHovered] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const containerRef = useRef(null);
  useEffect(() => {
    if (pauseOnHover && containerRef.current) {
      const container = containerRef.current;
      const handleMouseEnter = () => setIsHovered(true);
      const handleMouseLeave = () => setIsHovered(false);
      container.addEventListener("mouseenter", handleMouseEnter);
      container.addEventListener("mouseleave", handleMouseLeave);
      return () => {
        container.removeEventListener("mouseenter", handleMouseEnter);
        container.removeEventListener("mouseleave", handleMouseLeave);
      };
    }
  }, [pauseOnHover]);

  useEffect(() => {
    onChange(currentIndex % items.length); // Call onChange with the new index
  }, [currentIndex, items.length, onChange]);

  useEffect(() => {
    if (autoplay && (!pauseOnHover || !isHovered)) {
      const timer = setInterval(() => {
        setCurrentIndex((prev) => {
          const newIndex = prev === items.length - 1 && loop ? prev + 1 : prev === carouselItems.length - 1 ? (loop ? 0 : prev) : prev + 1;
          return newIndex;
        });
      }, autoplayDelay);
      return () => clearInterval(timer);
    }
  }, [
    autoplay,
    autoplayDelay,
    isHovered,
    loop,
    items.length,
    carouselItems.length,
    pauseOnHover,
  ]);

  const effectiveTransition = isResetting ? { duration: 0 } : SPRING_OPTIONS;

  const handleAnimationComplete = () => {
    if (loop && currentIndex === carouselItems.length - 1) {
      setIsResetting(true);
      x.set(0);
      setCurrentIndex(0);
      setTimeout(() => setIsResetting(false), 50);
    }
  };

  const handleDragEnd = (_, info) => {
    const offset = info.offset.x;
    const velocity = info.velocity.x;
    let newIndex = currentIndex;
    if (offset < -DRAG_BUFFER || velocity < -VELOCITY_THRESHOLD) {
      newIndex = loop && currentIndex === items.length - 1 ? currentIndex + 1 : Math.min(currentIndex + 1, carouselItems.length - 1);
    } else if (offset > DRAG_BUFFER || velocity > VELOCITY_THRESHOLD) {
      newIndex = loop && currentIndex === 0 ? items.length - 1 : Math.max(currentIndex - 1, 0);
    }
    setCurrentIndex(newIndex);
  };

  const dragProps = loop
    ? {}
    : {
        dragConstraints: {
          left: `calc(-${trackItemOffset} * (${carouselItems.length} - 1))`,
          right: 0,
        },
      };

  return (
    <div
      ref={containerRef}
      className={`carousel-container ${round ? "round" : ""}`}
      style={{
        width: baseWidth,
        height: round ? baseWidth : "100%", // Utiliser 100% de la hauteur du conteneur parent
        minHeight: "400px", // Ajouter une hauteur minimum
        ...(round && {borderRadius:"100%"}),
      }}
    >
      <motion.div
        className="carousel-track"
        drag="x"
        {...dragProps}
        style={{
          width: itemWidth,
          gap: `${GAP}px`,
          perspective: 1000,
          perspectiveOrigin: `calc(${currentIndex} * ${trackItemOffset} + ${itemWidth} / 2) 50%`,
          x,
        }}
        onDragEnd={handleDragEnd}
        animate={{ x: `calc(-${currentIndex} * ${trackItemOffset})` }}
        transition={effectiveTransition}
        onAnimationComplete={handleAnimationComplete}
      >
        {carouselItems.map((item, index) => {
          return (
            <motion.div
              key={index}
              className={`carousel-item ${round ? "round" : ""}`}
              style={{
                width: itemWidth,
                height: round ? itemWidth : "100%",
                backgroundImage: `url(${item.src})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                ...(round && { borderRadius: "100%" }),
              }}
              transition={effectiveTransition}
            >
              <div className={`carousel-item-header ${round ? "round" : ""}`}>
                <span className="carousel-icon-container">{item.icon}</span>
              </div>
              <div className="carousel-item-content">
                <div className="carousel-item-title">{item.title}</div>
                <p className="carousel-item-description">{item.description}</p>
              </div>
            </motion.div>
          );
        })}
      </motion.div>
      <div className={`carousel-indicators-container ${round ? "round" : ""}`}>
        <div className="carousel-indicators">
          {items.map((_, index) => (
            <motion.div
              key={index}
              className={`carousel-indicator ${
                currentIndex % items.length === index ? "active" : "inactive"
              }`}
              style={{
                backgroundColor: currentIndex % items.length === index ? 'var(--color-junia-orange-accent)' : 'var(--color-junia-orange)',
              }}
              animate={{
                scale: currentIndex % items.length === index ? 1.2 : 1,
              }}
              onClick={() => {
                setCurrentIndex(index);
                onChange(index); // Call onChange with the new index
              }}
              transition={{ duration: 0.15 }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}