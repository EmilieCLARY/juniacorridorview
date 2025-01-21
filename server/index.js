const express = require('express');
const http = require('http');
const cors = require("cors");
const bcrypt = require('bcrypt');
const bodyParser = require("body-parser");
const cookieparser = require("cookie-parser")
const session = require("express-session");
const fileUpload = require('express-fileupload'); // Add this line
const saltRounds = 10;
const { db, getTables, storeImageBlob, getAllPictures, insertImage, fetchImageById, insertInfoPopUp, retrieveInfoPopUpByIdPicture } = require('./database');

const PORT = process.env.PORT || 8000;

const app = express();

app.use(cors({
    origin: "http://localhost:3000",
    credentials: true,
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
            console.log('Fetched', infoPopUp.length, 'info popup');
            res.json(infoPopUp);
        }
    });
});

app.post("/insertInfoPopUp", (req, res) => {
    const { id_pictures, posX, posY, posZ, text, title } = req.body;
    insertInfoPopUp(id_pictures, posX, posY, posZ, text, title, (err) => {
        if (err) {
            console.error('Error inserting info popup:', err);
            res.sendStatus(500);
        } else {
            res.sendStatus(200);
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

app.listen(PORT, () => {
    console.log(`app running in ${PORT}`);
});