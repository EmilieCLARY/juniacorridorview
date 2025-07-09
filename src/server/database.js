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
                description: row.description,
                hidden: row.hidden,
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
        SELECT Tour_Steps.*, Rooms.name as room_name, Rooms.number as room_number, Rooms.hidden as room_hidden
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
                room_number: row.room_number,
                room_hidden: row.room_hidden
            }));
            console.log('Fetched', steps.length, 'tour steps for tour', tourId);
            callback(null, steps);
        }
    });
};

const getRooms = (callback) => {
    const query = `
        SELECT * 
        FROM Rooms
        ORDER BY name ASC
    `;
    
    db.query(query, (err, results) => {
        if (err) {
            console.error('Error executing getRooms query:', err);
            return callback(err, null);
        }
        return callback(null, results);
    });
};

const getFloors = (callback) => {
    const query = `
        SELECT *
        FROM Floors
        ORDER BY name ASC
    `;

    db.query(query, (err, results) => {
        if (err) {
            console.error('Error executing getFloors query:', err);
            return callback(err, null);
        }
        return callback(null, results);
    });
}

const getFloorById = (id_floors, callback) => {
    const sql = `SELECT * FROM Floors WHERE id_floors = ?`;
    db.query(sql, [id_floors], (err, rows) => {
        if (err) {
            console.error('Error fetching floor details', err);
            callback(err, null);
        } else {
            callback(null, rows[0]);
        }
    });
}

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
    console.log('Inserting picture for plan', id_rooms);
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

function deleteImage(id_pictures, callback) {
    console.log('Deleting picture', id_pictures);
    const sql = `DELETE FROM Pictures WHERE id_pictures = ?`;
    db.query(sql, [id_pictures], (err) => {
        callback(err);
    });
}

function updateInfospot(id_info_popup, id_pictures, posX, posY, posZ, text, title, image, callback) {
    console.log('Updating info popup', id_info_popup);
    if(image) {
        const sql = `UPDATE Info_Popup SET id_pictures = ?, position_x = ?, position_y = ?, position_z = ?, text = ?, title = ?, image = ? WHERE id_info_popup = ?`;
        db.query(sql, [id_pictures, posX, posY, posZ, text, title, image, id_info_popup], (err) => {
            callback(err);
        });
    } else {
        const sql = `UPDATE Info_Popup SET id_pictures = ?, position_x = ?, position_y = ?, position_z = ?, text = ?, title = ? WHERE id_info_popup = ?`;
        db.query(sql, [id_pictures, posX, posY, posZ, text, title, id_info_popup], (err) => {
            callback(err);
        });
    }
}

function insertInfoPopUp(id_pictures, posX, posY, posZ, text, title, image, callback) {
    console.log('Inserting info popup for picture', id_pictures);
    const sql = `INSERT INTO Info_Popup (id_pictures, position_x, position_y, position_z, text, title, image) VALUES (?, ?, ?, ?, ?, ?, ?)`;
    const params = [id_pictures, posX, posY, posZ, text, title, image || null];
    db.query(sql, params, (err) => {
        callback(err);
    });
}

function deleteInfoPopUp(id_info_popup, callback) {
    console.log('Deleting info popup', id_info_popup);
    const sql = `DELETE FROM Info_Popup WHERE id_info_popup = ?`;
    db.query(sql, [id_info_popup], (err) => {
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

function deleteLink(id_links, callback) {
    console.log('Deleting link', id_links);
    const sql = `DELETE FROM Links WHERE id_links = ?`;
    db.query(sql, [id_links], (err) => {
        callback(err);
    });
}

function addRoom(name, number, id_floors, plan_x, plan_y, callback) {
    console.log('Adding plan', name, number, 'to floor', id_floors);
    const sql = `INSERT INTO Rooms (name, number, id_floors, plan_x, plan_y) VALUES (?, ?, ?, ?, ?)`;
    db.query(sql, [name, number, id_floors, plan_x, plan_y], (err, result) => {
        if (err) {
            callback(err, null);
        } else {
            callback(null, result.insertId);
        }
    });
}

function updateRoom(id_rooms, name, number, id_floors, plan_x, plan_y, callback) {
    console.log('Updating plan', id_rooms);
    const sql = `UPDATE Rooms SET name = ?, number = ?, id_floors = ?, plan_x = ?, plan_y = ? WHERE id_rooms = ?`;
    db.query(sql, [name, number, id_floors, plan_x, plan_y, id_rooms], (err) => {
        callback(err);
    });
}

function deleteRoom(id_rooms, callback) {
    console.log('Deleting plan', id_rooms);
    const sql = `DELETE FROM Rooms WHERE id_rooms = ?`;
    db.query(sql, [id_rooms], (err) => {
        callback(err);
    });
}

function updateRoomVisibility(id_rooms, hidden, callback) {
    console.log('Updating plan visibility', id_rooms, hidden);
    const sql = `UPDATE Rooms SET hidden = ? WHERE id_rooms = ?`;
    db.query(sql, [hidden, id_rooms], (err) => {
        callback(err);
    });
}

function updateTourVisibility(id_tours, hidden, callback) {
    console.log('Updating tour visibility', id_tours, hidden);
    const sql = `UPDATE Tours SET hidden = ? WHERE id_tours = ?`;
    db.query(sql, [hidden, id_tours], (err) => {
        callback(err);
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
    const sql = `SELECT * FROM Rooms WHERE id_rooms = ?`;
    db.query(sql, [id_rooms], (err, rows) => {
        if (err) {
            console.error('Error fetching plan details', err);
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
            console.error('Error fetching plan ID by picture ID', err);
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
            console.error('Error fetching pictures by plan ID', err);
            callback(err, null);
        } else {
            const pictures = rows.map(row => ({
                id_pictures: row.id_pictures
            }));
            console.log('Fetched', pictures.length, 'pictures for plan', id_rooms);
            callback(null, pictures);
        }
    });
};

const getFirstPictureByRoomId = (id_rooms, callback) => {
    console.log('Fetching first picture for plan', id_rooms);
    const sql = `SELECT id_pictures FROM Pictures WHERE id_rooms = ? LIMIT 1`;
    db.query(sql, [id_rooms], (err, rows) => {
        if (err) {
            console.error('Error fetching first picture by plan ID', err);
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

const getRoomPreview = (id_rooms, callback) => {
    const sql = `SELECT preview FROM Room_Previews WHERE id_rooms = ? LIMIT 1`;
    db.query(sql, [id_rooms], (err, rows) => {
        if (err) {
            console.error('Error fetching plan preview', err);
            callback(err, null);
        } else {
            if (rows.length > 0) {
                callback(null, rows[0].preview);
            } else {
                callback(null, null);
            }
        }
    });
};

const insertRoomPreview = (id_rooms, previewData, callback) => {
    console.log('Inserting plan preview for plan', id_rooms);
    const checkSql = `SELECT id_room_previews FROM Room_Previews WHERE id_rooms = ?`;
    db.query(checkSql, [id_rooms], (err, rows) => {
        if (err) {
            console.error('Error checking for existing plan preview', err);
            callback(err);
            return;
        }
        
        if (rows.length > 0) {
            // Update existing preview
            const updateSql = `UPDATE Room_Previews SET preview = ? WHERE id_rooms = ?`;
            db.query(updateSql, [previewData, id_rooms], (err) => {
                if (err) {
                    console.error('Error updating plan preview', err);
                }
                callback(err);
            });
        } else {
            // Insert new preview
            const insertSql = `INSERT INTO Room_Previews (id_rooms, preview) VALUES (?, ?)`;
            db.query(insertSql, [id_rooms, previewData], (err) => {
                if (err) {
                    console.error('Error inserting plan preview', err);
                }
                callback(err);
            });
        }
    });
};

const deleteRoomPreview = (id_rooms, callback) => {
    console.log('Deleting plan preview for plan', id_rooms);
    const sql = `DELETE FROM Room_Previews WHERE id_rooms = ?`;
    db.query(sql, [id_rooms], (err) => {
        if (err) {
            console.error('Error deleting plan preview', err);
        }
        callback(err);
    });
};

const addBuilding = (name, callback) => {
    console.log('Inserting building', name);
    const sql = `INSERT INTO Buildings (name) VALUES (?)`;
    db.query(sql, [name], (err, result) => {
        if (err) {
            callback(err, null);
        } else {
            callback(null, result.insertId);
        }
    });
}

const updateBuilding = (id_buildings, name, callback) => {
    console.log('Updating building', id_buildings);
    const sql = `UPDATE Buildings SET name = ? WHERE id_buildings = ?`;
    db.query(sql, [name, id_buildings], (err) => {
        callback(err);
    });
}

const deleteBuilding = (id_buildings, callback) => {
    console.log('Deleting building', id_buildings);
    const sql = `DELETE FROM Buildings WHERE id_buildings = ?`;
    db.query(sql, [id_buildings], (err) => {
        callback(err);
    });
}

const addFloor = (name, id_buildings, plan, callback) => {
    console.log('Inserting floor', name, 'for building', id_buildings);
    const sql = `INSERT INTO Floors (name, id_buildings, plan) VALUES (?, ?, ?)`;
    db.query(sql, [name, id_buildings, plan], (err, result) => {
        if (err) {
            callback(err, null);
        } else {
            callback(null, result.insertId);
        }
    });
}

const updateFloor = (id_floors, name, id_buildings, plan, callback) => {
    console.log('Updating floor', id_floors);
    if (plan) {
        const sql = `UPDATE Floors SET name = ?, id_buildings = ?, plan = ? WHERE id_floors = ?`;
        db.query(sql, [name, id_buildings, plan, id_floors], (err) => {
            callback(err);
        });
    } else {
        const sql = `UPDATE Floors SET name = ?, id_buildings = ? WHERE id_floors = ?`;
        db.query(sql, [name, id_buildings, id_floors], (err) => {
            callback(err);
        });
    }
}

const deleteFloor = (id_floors, callback) => {
    console.log('Deleting floor', id_floors);
    const sql = `DELETE FROM Floors WHERE id_floors = ?`;
    db.query(sql, [id_floors], (err) => {
        callback(err);
    });
}

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
    deleteImage,
    updateInfospot,
    updateLink,
    deleteInfoPopUp,
    deleteLink,
    addRoom,
    updateRoom,
    deleteRoom,
    updateRoomVisibility,
    getBuildings,
    getRoomPreview,
    insertRoomPreview,
    deleteRoomPreview,
    getFloors,
    getFloorById,
    addBuilding,
    updateBuilding,
    deleteBuilding,
    addFloor,
    updateFloor,
    deleteFloor,
    updateTourVisibility,
};
