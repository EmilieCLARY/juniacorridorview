# Junia Corridor View

Junia Corridor View is a web application designed to manage and visualize room and building information, including panoramic (360°) images, across various floors and buildings. It provides an intuitive interface for administrators to organize and interact with spatial data effectively.

## Features

### Room Management
- View rooms in a card-based layout with detailed metadata (name, number, building, floor, etc.).
- Add, edit, and delete room information.
- Upload and manage panoramic (360°) images for rooms.
- Place rooms on interactive floor plans.

### Building and Floor Management
- Associate rooms with specific buildings and floors.
- Manage building and floor metadata.
- Visualize floor plans and room placements.

### Administration
- Manage room types, building data, and floor information.
- Track usage statistics (e.g., number of rooms per floor/building).

## Tech Stack

- **Frontend**: React.js with React Router
- **Backend**: Node.js with Express.js
- **Database**: MySQL
- **Styling**: Tailwind CSS
- **Additional Libraries**:
  - React Select for dropdown components
  - Axios for API requests
  - React Icons for interactive UI elements

## Pages

### User Pages

#### Home
The Home page let you choose between two visiting modes: Guided Tour and Free Tour. The Guided Tour mode provides a list of rooms to visit, while the Free Tour mode allows users to explore the building free ly.

#### Guided Tour Select
The Guided Tour Select page displays a list of guided tours available for the user to choose from. Each tour is displayed with a carousel of rooms, allowing users to select a specific tour.

#### Navigation Page
Depending on the selected mode, the Navigation page provides a list of rooms to visit. Users can select a room to view it in 360° mode and see informations spots about technical engines.
The page also includes a map view of the building, showing the user's current location and the selected room.

### Admin Pages

#### Rooms List
The dashboard displays all rooms in a card view format, with filtering options and the ability to add new rooms.

#### Room Detail 
Displays detailed information about a room, including its building, floor, and associated panoramic images. Features include room editing, image management, and placement on floor plans.

##### Building List
The Building List page displays all buildings in a card view format, with filtering options and the ability to add new buildings. You can also view the list of floors associated with each building and edit their details.

##### Guided Tour List
As on User Pages, the Guided Tour List page displays a list of guided tours available for the user to choose from. Each tour is displayed with a carousel of rooms, allowing administrators to edit steps and add new rooms for each tour.
