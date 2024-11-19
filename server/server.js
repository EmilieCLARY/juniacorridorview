
const express = require('express');
const bodyParser = require('body-parser');
const { insertInfoPopUp } = require('./database');

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// ...existing code...

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

// ...existing code...

app.listen(8000, () => {
    console.log('Server is running on port 8000');
});