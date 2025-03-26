const express = require('express');
const http = require('http');
const cors = require("cors");
const bcrypt = require('bcrypt');
const bodyParser = require("body-parser");
const cookieparser = require("cookie-parser")
const session = require("express-session");
const fileUpload = require('express-fileupload'); // Add this line
const mysql = require('mysql');
const saltRounds = 10;
const { db,
    retrieveLinkByIdPicture,
    insertLink,
    getTables, storeImageBlob,
    getAllPictures,
    insertImage,
    fetchImageById, insertInfoPopUp,
    retrieveInfoPopUpByIdPicture,
    getTours,
    getTourStepsWithRoomInfo,
    updateTourSteps,
    addTourStep,
    createTourWithSteps,
    deleteTour,
    getRoomNameById,
    getRoomIdByPictureId,
    getRooms,
    getPicturesByRoomId,
    getFirstPictureByRoomId,
    updateImage,
    deleteImage,
    updateInfospot,
    updateLink,
    addRoom,
    updateRoom,
    deleteRoom,
    getBuildings,
    updateRoomVisibility,
    insertRoomPreview,
    deleteRoomPreview,
    getRoomPreview,
    deleteInfoPopUp,
    deleteLink,
    getFloors
} = require('./database');


const PORT = process.env.PORT || 8000;

const app = express();

// Configure CORS
app.use(cors({
  origin: 'http://localhost:5174', // Update to Vite's default port
  methods: ['GET', 'POST', 'PUT', 'DELETE'], // Autoriser les méthodes HTTP nécessaires
  credentials: true // Si vous utilisez des cookies ou des sessions
}));

app.use(express.json());
app.use(cookieparser());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
    key: "userId",
    secret: "atanu",
    resave: false,
    saveUninitialized: false,
}));
app.use(fileUpload()); // Add this line

// Enable CORS for all routes
app.use(cors());

app.get("/", (req, res) => {
    res.send("hi");
})

app.get("/tables", (req, res) => {
    getTables((err, tables) => {
        if (err) {
            console.error('Error fetching tables', err.message);
            res.status(500).send('Error fetching tables');
        } else {
            res.json(tables);
        }
    });
});

app.get("/pictures", (req, res) => {
    getAllPictures((err, pictures) => {
        if (err) {
            console.error('Error fetching pictures', err.message);
            res.status(500).send('Error fetching pictures');
        } else {
            res.json(pictures);
        }
    });
});

// Upload image (requires id_rooms)
app.post('/upload', (req, res) => {
    const { id_rooms } = req.body;
    const { pic } = req.files;
    console.log('id_rooms:', id_rooms, 'pic:', pic);
    if (pic && id_rooms) {
        console.log('Inserting image');
        insertImage(id_rooms, pic.data, (err) => {
            if (err) {
                console.error('Error inserting image:', err);
                res.sendStatus(500);
            } else {
                res.sendStatus(200);
            }
        });
    } else {
        res.sendStatus(400);
    }
});

app.get('/fetch/:id', async (req, res) => {
    const id = req.params.id;
    try {
        const { picture, mime } = await fetchImageById(id);
        if (picture) {
            res.type(mime);
            res.end(picture);
        } else {
            res.end('No Img with that Id!');
        }
    } catch (err) {
        console.error('Error fetching image:', err);
        res.sendStatus(500);
    }
});

app.post("/retrieveInfoPopUpByIdPicture/", (req, res) => {
    const id_pictures = req.body.id_pictures;
    retrieveInfoPopUpByIdPicture(id_pictures, (err, infoPopUp) => {
        if (err) {
            console.error('Error fetching info popup', err);
            res.sendStatus(500);
        } else {
            res.json(infoPopUp);
        }
    });
});

app.post("/retrieveLinkByIdPicture/", (req, res) => {
    const id_pictures = req.body.id_pictures;
    retrieveLinkByIdPicture(id_pictures, (err, links) => {
        if (err) {
            console.error('Error fetching links', err);
            res.sendStatus(500);
        } else {
            res.json(links);
        }
    });
});

app.post("/insertInfoPopUp", (req, res) => {
    const { id_pictures, posX, posY, posZ, text, title } = req.body;
    const pic = req.files ? req.files.pic : null;
    console.log('id_pictures:', id_pictures, 'posX:', posX, 'posY:', posY, 'posZ:', posZ, 'text:', text, 'title:', title, 'pic:', pic);
    if (id_pictures && posX && posY && posZ && text && title) {
        insertInfoPopUp(id_pictures, posX, posY, posZ, text, title, pic ? pic.data : null, (err) => {
            if (err) {
                console.error('Error inserting info popup:', err);
                res.sendStatus(500);
            } else {
                res.sendStatus(200);
            }
        });
    } else {
        res.sendStatus(400);
    }
});

app.post("/insertLink", (req, res) => {
    console.log(req.body);
    const { id_pictures, posX, posY, posZ, id_pictures_destination } = req.body;
    insertLink(id_pictures, posX, posY, posZ, id_pictures_destination, (err) => {
        if (err) {
            console.error('Error inserting info popup:', err);
            res.sendStatus(500);
        } else {
            res.sendStatus(200);
        }
    });
});

app.get("/tours", (req, res) => {
    getTours((err, tours) => {
        if (err) {
            console.error('Error fetching tours', err.message);
            res.status(500).send('Error fetching tours');
        } else {
            res.json(tours);
        }
    });
});

app.get("/tour-steps/:id", (req, res) => {
    const tourId = req.params.id;
    getTourStepsWithRoomInfo(tourId, (err, steps) => {
        if (err) {
            console.error('Error fetching tour steps', err.message);
            res.status(500).send('Error fetching tour steps');
        } else {
            res.json(steps);
        }
    });
});

app.post("/update-tour-steps", (req, res) => {
    const { id_tours, steps, title, description } = req.body;
    const stepsWithNumbers = steps.map((step, index) => ({
        ...step,
        step_number: index + 1
    }));
    updateTourSteps(id_tours, stepsWithNumbers, title, description, (err) => {
        if (err) {
            console.error('Error updating tour steps', err.message);
            res.status(500).send('Error updating tour steps');
        } else {
            res.sendStatus(200);
        }
    });
});

app.post("/add-tour-step", (req, res) => {
    const { id_tours, step } = req.body;
    addTourStep(id_tours, step, (err) => {
        if (err) {
            console.error('Error adding tour step', err.message);
            res.status(500).send('Error adding tour step');
        } else {
            res.sendStatus(200);
        }
    });
});

app.post("/create-tour", (req, res) => {
    const { title, description, steps } = req.body;
    const stepsWithNumbers = steps.map((step, index) => ({
        ...step,
        step_number: index + 1
    }));
    createTourWithSteps(title, description, stepsWithNumbers, (err) => {
        if (err) {
            console.error('Error creating tour', err.message);
            res.status(500).send('Error creating tour');
        } else {
            res.sendStatus(200);
        }
    });
});

app.delete("/delete-tour/:id", (req, res) => {
    const tourId = req.params.id;
    deleteTour(tourId, (err) => {
        if (err) {
            console.error('Error deleting tour', err.message);
            res.status(500).send('Error deleting tour');
        } else {
            res.sendStatus(200);
        }
    });
});

app.get('/room/:id', (req, res) => {
    const id_rooms = req.params.id;
    getRoomNameById(id_rooms, (err, room) => {
        if (err) {
            console.error('Error fetching room name', err);
            res.sendStatus(500);
        } else {
            res.json(room);
        }
    });
});

app.get('/room-id/:id', (req, res) => {
    const id_pictures = req.params.id;
    getRoomIdByPictureId(id_pictures, (err, roomId) => {
        if (err) {
            console.error('Error fetching room ID by picture ID', err);
            res.sendStatus(500);
        } else {
            res.json({ id_rooms: roomId });
        }
    });
});

app.get('/rooms', (req, res) => {
    getRooms((err, rooms) => {
        if (err) {
            console.error('Error fetching rooms', err);
            res.sendStatus(500);
        } else {
            res.json(rooms);
        }
    });
});

app.get('/room-details/:id', (req, res) => {
    const id_rooms = req.params.id;
    getRoomNameById(id_rooms, (err, room) => {
        if (err) {
            console.error('Error fetching room details', err);
            res.sendStatus(500);
        } else {
            res.json(room);
        }
    });
});

app.get('/pictures-by-room/:id', (req, res) => {
    const id_rooms = req.params.id;
    getPicturesByRoomId(id_rooms, (err, pictures) => {
        if (err) {
            console.error('Error fetching pictures by room ID', err);
            res.sendStatus(500);
        } else {
            res.json(pictures);
        }
    });
});

app.get('/first-picture-by-room/:id', (req, res) => {
  const id_rooms = req.params.id;
  getFirstPictureByRoomId(id_rooms, (err, picture) => {
    if (err) {
      console.error('Error fetching first picture by room ID', err);
      res.sendStatus(500);
    } else {
      res.json(picture);
    }
  });
});

app.get("/login",(req,res)=>{
    if(req.session.user)
    {
        res.send({login:true,user:req.session.user});
    }
    else{
        res.send({login:false});
    }
})

app.post('/update-image', (req, res) => {
    const { id_pictures } = req.body;
    const { pic } = req.files;
    if (pic && id_pictures) {
        updateImage(id_pictures, pic.data, (err) => {
            if (err) {
                console.error('Error updating image:', err);
                res.sendStatus(500);
            } else {
                res.sendStatus(200);
            }
        });
    } else {
        res.sendStatus(400);
    }
});

app.delete('/delete-image/:id', (req, res) => {
    const id_pictures = req.params.id;
    deleteImage(id_pictures, (err) => {
        if (err) {
            console.error('Error deleting image:', err);
            res.sendStatus(500);
        } else {
            res.sendStatus(200);
        }
    });
});

app.post('/update-infospot', (req, res) => {
    const { id_info_popup, id_pictures, posX, posY, posZ, text, title } = req.body;
    const pic = req.files ? req.files.pic : null;
    updateInfospot(id_info_popup, id_pictures, posX, posY, posZ, text, title, pic ? pic.data : null, (err) => {
        if (err) {
            console.error('Error updating infospt:', err);
            res.sendStatus(500);
        } else {
            res.sendStatus(200);
        }
    });
});

app.delete('/delete-infospot/:id', (req, res) => {
    const id_info_popup = req.params.id;
    deleteInfoPopUp(id_info_popup, (err) => {
        if (err) {
            console.error('Error deleting infospot:', err);
            res.sendStatus(500);
        } else {
            res.sendStatus(200);
        }
    });
});

app.post('/update-link', (req, res) => {
    const { id_links, id_pictures, posX, posY, posZ, id_pictures_destination } = req.body;
    updateLink(id_links, id_pictures, posX, posY, posZ, id_pictures_destination, (err) => {
        if (err) {
            console.error('Error updating link:', err);
            res.sendStatus(500);
        } else {
            res.sendStatus(200);
        }
    });
});

app.delete('/delete-link/:id', (req, res) => {
    const id_links = req.params.id;
    deleteLink(id_links, (err) => {
        if (err) {
            console.error('Error deleting link:', err);
            res.sendStatus(500);
        } else {
            res.sendStatus(200);
        }
    });
});

app.post('/add-room', (req, res) => {
    const { name, number, id_floors } = req.body;
    const previewImage = req.files && req.files.previewImage ? req.files.previewImage : null;
    
    addRoom(name, number, id_floors, (err, roomId) => {
        if (err) {
            console.error('Error adding room:', err);
            res.sendStatus(500);
        } else {
            // If a preview image was provided, save it
            if (previewImage) {
                insertRoomPreview(roomId, previewImage.data, (err) => {
                    if (err) {
                        console.error('Error saving room preview image:', err);
                        // Continue even if preview save fails
                    }
                });
            }
            res.json({ id_rooms: roomId });
        }
    });
});

app.post('/update-room', (req, res) => {
    const { id_rooms, name, number, id_floors } = req.body;
    const previewImage = req.files && req.files.previewImage ? req.files.previewImage : null;
    
    updateRoom(id_rooms, name, number, id_floors, (err) => {
        if (err) {
            console.error('Error updating room:', err);
            res.sendStatus(500);
        } else {
            // If a preview image was provided, update it
            if (previewImage) {
                insertRoomPreview(id_rooms, previewImage.data, (err) => {
                    if (err) {
                        console.error('Error updating room preview image:', err);
                        // Continue even if preview update fails
                    }
                });
            }
            res.sendStatus(200);
        }
    });
});

app.post('/update-room-visibility', (req, res) => {
  const { id_rooms, hidden } = req.body;
  updateRoomVisibility(id_rooms, hidden, (err) => {
    if (err) {
      console.error('Error updating room visibility:', err);
      res.sendStatus(500);
    } else {
      res.sendStatus(200);
    }
  });
});

app.delete('/delete-room/:id', (req, res) => {
    const id_rooms = req.params.id;
    // Then delete the room
    deleteRoom(id_rooms, (err) => {
        if (err) {
            console.error('Error deleting room:', err);
            res.sendStatus(500);
        } else {
            res.sendStatus(200);
        }
    });
});

app.get('/room-preview/:id', (req, res) => {
    const id_rooms = req.params.id;
    getRoomPreview(id_rooms, async (err, previewData) => {
        if (err) {
            console.error('Error fetching room preview', err);
            res.sendStatus(500);
        } else if (previewData) {
            try {
                const FileType = await import('file-type');
                const contentType = await FileType.fileTypeFromBuffer(previewData);
                if (contentType) {
                    res.type(contentType.mime);
                } else {
                    res.type('application/octet-stream');
                }
                res.end(previewData);
            } catch (error) {
                console.error('Error determining file type', error);
                res.type('application/octet-stream');
                res.end(previewData);
            }
        } else {
            res.sendStatus(404);
        }
    });
});

app.get('/buildings', (req, res) => {
    getBuildings((err, buildings) => {
        if (err) {
            console.error('Error fetching buildings', err);
            res.sendStatus(500);
        } else {
            res.json(buildings);
        }
    });
});

app.get('/floors', (req, res) => {
    getFloors((err, floors) => {
        if (err) {
            console.error('Error fetching floors', err);
            res.sendStatus(500);
        } else {
            res.json(floors);
        }
    });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});