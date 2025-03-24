const mysql = require('mysql');
require('dotenv').config({ path: __dirname + '/database.env' });

const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT
});

db.connect((err) => {
    if (err) {
        console.error('Error connecting to MySQL database:', err.message);
        console.error('Host:', process.env.DB_HOST);
        console.error('User:', process.env.DB_USER);
        console.error('Database:', process.env.DB_NAME);
        console.error('Port:', process.env.DB_PORT);
    } else {
        console.log('Connected to the MySQL database.');
    }
});

const getTables = (callback) => {
    console.log('Fetching tables');
    db.query("SHOW TABLES", (err, tables) => {
        if (err) {
            callback(err, null);
        } else {
            const tableNames = tables.map(table => Object.values(table)[0]);
            callback(null, tableNames);
        }
    });
};

const getAllPictures = (callback) => {
    const sql = `SELECT id_pictures FROM Pictures`;
    db.query(sql, (err, rows) => {
        if (err) {
            console.error('Error fetching pictures', err);
            callback(err, null);
        } else {
            const pictures = rows.map(row => ({
                id_pictures: row.id_pictures
            }));
            console.log('Fetched', pictures.length, 'pictures');
            callback(null, pictures);
        }
    });
};

const getTours = (callback) => {
    const sql = `SELECT * FROM Tours`;
    db.query(sql, (err, rows) => {
        if (err) {
            console.error('Error fetching tours', err);
            callback(err, null);
        } else {
            const tours = rows.map(row => ({
                id_tours: row.id_tours,
                title: row.title,
                description: row.description
            }));
            console.log('Fetched', tours.length, 'tours');
            callback(null, tours);
        }
    });
};

const getTourSteps = (tourId, callback) => {
    const sql = `SELECT * FROM Tour_Steps WHERE id_tours = ? ORDER BY step_number`;
    db.query(sql, [tourId], (err, rows) => {
        if (err) {
            console.error('Error fetching tour steps', err);
            callback(err, null);
        } else {
            const steps = rows.map(row => ({
                id_tour_steps: row.id_tour_steps,
                id_rooms: row.id_rooms,
                step_number: row.step_number,
                id_tours: row.id_tours
            }));
            console.log('Fetched', steps.length, 'tour steps for tour', tourId);
            callback(null, steps);
        }
    });
};

const getTourStepsWithRoomInfo = (tourId, callback) => {
    const sql = `
        SELECT Tour_Steps.*, Rooms.name as room_name, Rooms.number as room_number
        FROM Tour_Steps
        JOIN Rooms ON Tour_Steps.id_rooms = Rooms.id_rooms
        WHERE Tour_Steps.id_tours = ?
        ORDER BY Tour_Steps.step_number
    `;
    db.query(sql, [tourId], (err, rows) => {
        if (err) {
            console.error('Error fetching tour steps', err);
            callback(err, null);
        } else {
            const steps = rows.map(row => ({
                id_tour_steps: row.id_tour_steps,
                id_rooms: row.id_rooms,
                step_number: row.step_number,
                id_tours: row.id_tours,
                room_name: row.room_name,
                room_number: row.room_number
            }));
            console.log('Fetched', steps.length, 'tour steps for tour', tourId);
            callback(null, steps);
        }
    });
};

const getRooms = (callback) => {
    const sql = `
        SELECT Rooms.*, Buildings.name as building_name 
        FROM Rooms 
        LEFT JOIN Buildings ON Rooms.id_buildings = Buildings.id_buildings
    `;
    db.query(sql, (err, rows) => {
        if (err) {
            console.error('Error fetching rooms', err);
            callback(err, null);
        } else {
            const rooms = rows.map(row => ({
                id_rooms: row.id_rooms,
                name: row.name,
                number: row.number,
                id_buildings: row.id_buildings,
                building_name: row.building_name,
                hidden: row.hidden
            }));
            console.log('Fetched', rooms.length, 'rooms');
            callback(null, rooms);
        }
    });
};

const getBuildings = (callback) => {
    const sql = `SELECT id_buildings, name FROM Buildings`;
    db.query(sql, (err, rows) => {
        if (err) {
            console.error('Error fetching buildings', err);
            callback(err, null);
        } else {
            const buildings = rows.map(row => ({
                id_buildings: row.id_buildings,
                name: row.name
            }));
            console.log('Fetched', buildings.length, 'buildings');
            callback(null, buildings);
        }
    });
};

function insertImage(id_rooms, data, callback) {
    console.log('Inserting picture for room', id_rooms);
    const sql = `INSERT INTO Pictures (id_rooms, picture) VALUES (?, ?)`;
    db.query(sql, [id_rooms, data], (err) => {
        callback(err);
    });
}

function updateImage(id_pictures, data, callback) {
    console.log('Updating picture', id_pictures);
    const sql = `UPDATE Pictures SET picture = ? WHERE id_pictures = ?`;
    db.query(sql, [data, id_pictures], (err) => {
        callback(err);
    });
}

function updateInfospot(id_info_popup, id_pictures, posX, posY, posZ, text, title, image, callback) {
    console.log('Updating info popup', id_info_popup);
    const sql = `UPDATE Info_Popup SET id_pictures = ?, position_x = ?, position_y = ?, position_z = ?, text = ?, title = ?, image = ? WHERE id_info_popup = ?`;
    db.query(sql, [id_pictures, posX, posY, posZ, text, title, image, id_info_popup], (err) => {
        callback(err);
    });
}

function insertInfoPopUp(id_pictures, posX, posY, posZ, text, title, image, callback) {
    console.log('Inserting info popup for picture', id_pictures);
    const sql = `INSERT INTO Info_Popup (id_pictures, position_x, position_y, position_z, text, title, image) VALUES (?, ?, ?, ?, ?, ?, ?)`;
    const params = [id_pictures, posX, posY, posZ, text, title, image || null];
    db.query(sql, params, (err) => {
        callback(err);
    });
}

function insertLink(id_pictures, posX, posY, posZ, id_pictures_destination, callback) {
    console.log('Inserting link from', id_pictures, 'to', id_pictures_destination);
    const sql = `INSERT INTO Links (id_pictures, position_x, position_y, position_z, id_pictures_destination) VALUES (?, ?, ?, ?, ?)`;
    db.query(sql, [id_pictures, posX, posY, posZ, id_pictures_destination], (err) => {
        callback(err);
    });
}

function updateLink(id_links, id_pictures, posX, posY, posZ, id_pictures_destination, callback) {
    console.log('Updating link', id_links);
    const sql = `UPDATE Links SET id_pictures = ?, position_x = ?, position_y = ?, position_z = ?, id_pictures_destination = ? WHERE id_links = ?`;
    db.query(sql, [id_pictures, posX, posY, posZ, id_pictures_destination, id_links], (err) => {
        callback(err);
    });
}

function addRoom(name, number, id_buildings, callback) {
    console.log('Adding room', name, number, 'to building', id_buildings);
    const sql = `INSERT INTO Rooms (name, number, id_buildings) VALUES (?, ?, ?)`;
    db.query(sql, [name, number, id_buildings], (err, result) => {
        if (err) {
            callback(err, null);
        } else {
            callback(null, result.insertId);
        }
    });
}

function retrieveInfoPopUpByIdPicture(id_pictures, callback) {
    const sql = `SELECT * FROM Info_Popup WHERE id_pictures = ?`;
    db.query(sql, [id_pictures], (err, rows) => {
        if (err) {
            console.error('Error fetching info popup', err);
            callback(err, null);
        } else {
            const infoPopUp = rows.map(row => ({
                id_info_popup: row.id_info_popup,
                id_pictures: row.id_pictures,
                position_x: row.position_x,
                position_y: row.position_y,
                position_z: row.position_z,
                text: row.text,
                title: row.title,
                image: row.image
            }));
            console.log('Fetched', infoPopUp.length, 'info popup for picture', id_pictures);
            callback(null, infoPopUp);
        }
    });
}

function retrieveLinkByIdPicture(id_pictures, callback) {
    const sql = `SELECT * FROM Links WHERE id_pictures = ?`;
    db.query(sql, [id_pictures], (err, rows) => {
        if (err) {
            console.error('Error fetching links', err);
            callback(err, null);
        } else {
            const links = rows.map(row => ({
                id_links: row.id_links,
                id_pictures: row.id_pictures,
                position_x: row.position_x,
                position_y: row.position_y,
                position_z: row.position_z,
                id_pictures_destination: row.id_pictures_destination
            }));
            console.log('Fetched', links.length, 'links for picture', id_pictures);
            callback(null, links);
        }
    });
}

async function fetchImageById(id) {
    const FileType = await import('file-type');
    return new Promise((resolve, reject) => {
        const sql = `SELECT picture FROM Pictures WHERE id_pictures = ?`;
        db.query(sql, [id], async (err, rows) => {
            if (err) {
                reject(err);
            } else if (rows.length > 0) {
                const contentType = await FileType.fileTypeFromBuffer(rows[0].picture);
                if (contentType) {
                    resolve({ picture: rows[0].picture, mime: contentType.mime });
                } else {
                    resolve({ picture: rows[0].picture, mime: 'application/octet-stream' });
                }
            } else {
                resolve({ picture: null });
            }
        });
    });
}

const getRoomNameById = (id_rooms, callback) => {
    const sql = `SELECT name, number FROM Rooms WHERE id_rooms = ?`;
    db.query(sql, [id_rooms], (err, rows) => {
        if (err) {
            console.error('Error fetching room details', err);
            callback(err, null);
        } else {
            callback(null, rows[0]);
        }
    });
};

const getRoomIdByPictureId = (id_pictures, callback) => {
    const sql = `SELECT id_rooms FROM Pictures WHERE id_pictures = ?`;
    db.query(sql, [id_pictures], (err, rows) => {
        if (err) {
            console.error('Error fetching room ID by picture ID', err);
            callback(err, null);
        } else {
            callback(null, rows[0].id_rooms);
        }
    });
};

const getPicturesByRoomId = (id_rooms, callback) => {
    const sql = `SELECT id_pictures FROM Pictures WHERE id_rooms = ?`;
    db.query(sql, [id_rooms], (err, rows) => {
        if (err) {
            console.error('Error fetching pictures by room ID', err);
            callback(err, null);
        } else {
            const pictures = rows.map(row => ({
                id_pictures: row.id_pictures
            }));
            console.log('Fetched', pictures.length, 'pictures for room', id_rooms);
            callback(null, pictures);
        }
    });
};

const getFirstPictureByRoomId = (id_rooms, callback) => {
    console.log('Fetching first picture for room', id_rooms);
    const sql = `SELECT id_pictures FROM Pictures WHERE id_rooms = ? LIMIT 1`;
    db.query(sql, [id_rooms], (err, rows) => {
        if (err) {
            console.error('Error fetching first picture by room ID', err);
            callback(err, null);
        } else {
            callback(null, rows[0]);
        }
    });
};

const updateTourSteps = (id_tours, steps, title, description, callback) => {
    console.log('Updating tour', id_tours, 'with steps', steps);
    const updateTourSql = `UPDATE Tours SET title = ?, description = ? WHERE id_tours = ?`;
    db.query(updateTourSql, [title, description, id_tours], (err) => {
        if (err) {
            callback(err);
        } else {
            const deleteSql = `DELETE FROM Tour_Steps WHERE id_tours = ?`;
            db.query(deleteSql, [id_tours], (err) => {
                if (err) {
                    callback(err);
                } else {
                    const insertSql = `INSERT INTO Tour_Steps (id_tour_steps, id_tours, id_rooms, step_number) VALUES (?, ?, ?, ?)`;
                    steps.forEach(step => {
                        const newId = step.id_tour_steps.startsWith('new_') ? generateUniqueId() : step.id_tour_steps;
                        db.query(insertSql, [newId, id_tours, step.id_rooms, step.step_number], (err) => {
                            if (err) {
                                callback(err);
                            }
                        });
                    });
                    callback(null);
                }
            });
        }
    });
};

const addTourStep = (id_tours, step, callback) => {
    console.log('Adding tour step', step, 'to tour', id_tours);
    const newId = generateUniqueId();
    const sql = `INSERT INTO Tour_Steps (id_tour_steps, id_tours, id_rooms, step_number) VALUES (?, ?, ?, ?)`;
    db.query(sql, [newId, id_tours, step.id_rooms, step.step_number], (err) => {
        callback(err);
    });
};

const generateUniqueId = () => {
    return Math.floor(Math.random() * 1000000000); // Generate a random numeric ID
};

const createTour = (title, description, callback) => {
    const sql = `INSERT INTO Tours (title, description) VALUES (?, ?)`;
    db.query(sql, [title, description], (err, result) => {
        if (err) {
            callback(err);
        } else {
            callback(null, result.insertId);
        }
    });
};

const createTourWithSteps = (title, description, steps, callback) => {
    console.log('Creating tour with steps');
    const sql = `INSERT INTO Tours (title, description) VALUES (?, ?)`;
    db.query(sql, [title, description], (err, result) => {
        if (err) {
            callback(err);
        } else {
            const tourId = result.insertId;
            if (Array.isArray(steps)) {
                const insertStepSql = `INSERT INTO Tour_Steps (id_tour_steps, id_tours, id_rooms, step_number) VALUES (?, ?, ?, ?)`;
                steps.forEach(step => {
                    const stepId = generateUniqueId();
                    db.query(insertStepSql, [stepId, tourId, step.id_rooms, step.step_number], (err) => {
                        if (err) {
                            callback(err);
                        }
                    });
                });
                callback(null);
            } else {
                callback(new Error('Steps should be an array'));
            }
        }
    });
};

const deleteTour = (id_tours, callback) => {
    console.log('Deleting tour', id_tours);
    const deleteStepsSql = `DELETE FROM Tour_Steps WHERE id_tours = ?`;
    db.query(deleteStepsSql, [id_tours], (err) => {
        if (err) {
            callback(err);
        } else {
            const deleteTourSql = `DELETE FROM Tours WHERE id_tours = ?`;
            db.query(deleteTourSql, [id_tours], (err) => {
                callback(err);
            });
        }
    });
};

module.exports = {
    db,
    getTables,
    getAllPictures,
    insertImage,
    fetchImageById,
    insertInfoPopUp,
    retrieveInfoPopUpByIdPicture,
    insertLink,
    retrieveLinkByIdPicture,
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
    updateInfospot,
    updateLink,
    addRoom,
    getBuildings
};
