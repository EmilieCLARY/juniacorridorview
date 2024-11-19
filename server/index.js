const express = require('express');
const http = require('http');
const cors = require("cors");
const bcrypt = require('bcrypt');
const bodyParser = require("body-parser");
const cookieparser = require("cookie-parser")
const session = require("express-session");
const saltRounds = 10;
const { db, getTables, storeImageBlob, getAllPictures } = require('./database');

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
}))

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

app.post('/storeImageBlob', (req, res) => {
    const { id, blob } = req.body;
    storeImageBlob(id, blob, (err) => {
        if (err) {
            console.error('Error storing image blob', err.message);
            res.status(500).send('Error storing image blob');
        } else {
            res.send('Image blob stored');
        }
    });
});

app.get("/pictures", (req, res) => {
    getAllPictures((err, pictures) => {
        if (err) {
            console.error('Error fetching pictures', err.message);
            res.status(500).send('Error fetching pictures');
        } else {
            /*pictures = pictures.map(picture => ({
                id_pictures: picture.id_pictures,
                picture: `data:image/jpeg;base64,${picture.picture.toString('base64')}`
            }));*/
            res.json(pictures);
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