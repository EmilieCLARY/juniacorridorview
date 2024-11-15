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

app.get("/pictures", (req, res) => {
    getAllPictures((err, pictures) => {
        if (err) {
            console.error('Error fetching pictures', err.message);
            res.status(500).send('Error fetching pictures');
        } else {
            // Based on how they are stored in the database, retrive it and return it as they were before manipulation in /storeImageBlob
            res.json(pictures);
        }
    });
});

app.post('/storeImageBlob', (req, res) => {
    const { id, blob } = req.body;
    const base64Data = blob.replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(base64Data, 'base64');
    storeImageBlob(id, buffer, (err) => {
        if (err) {
            console.error('Error storing image blob', err.message);
            res.status(500).send('Error storing image blob');
        } else {
            res.status(200).send('Image blob stored successfully');
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