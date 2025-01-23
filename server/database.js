const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('./db.db', (err) => {
    if (err) {
        console.error('Error opening database', err.message);
    } else {
        console.log('Connected to the SQLite database.');
    }
});

const getTables = (callback) => {
    console.log('Fetching tables');
    db.all("SELECT name FROM sqlite_master WHERE type='table'", (err, tables) => {
        if (err) {
            callback(err, null);
        } else {
            const tableNames = tables.map(table => table.name);
            callback(null, tableNames);
        }
    });
};

const getAllPictures = (callback) => {
    const sql = `SELECT id_pictures FROM Pictures`;
    db.all(sql, [], (err, rows) => {
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
    db.all(sql, [], (err, rows) => {
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
    db.all(sql, [tourId], (err, rows) => {
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
            console.log('Fetched', steps.length, 'tour steps');
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
    db.all(sql, [], (err, rows) => {
        if (err) {
            console.error('Error fetching rooms', err);
            callback(err, null);
        } else {
            const rooms = rows.map(row => ({
                id_rooms: row.id_rooms,
                name: row.name,
                number: row.number,
                id_buildings: row.id_buildings,
                building_name: row.building_name // Add this line
            }));
            console.log('Fetched', rooms.length, 'rooms');
            callback(null, rooms);
        }
    });
};

function insertImage(id_rooms, data, callback) {
    db.get(`SELECT MAX(id_pictures) as maxId FROM Pictures`, (err, row) => {
        if (err) {
            callback(err);
        } else {
            const newId = (row.maxId || 0) + 1;
            const stmt = db.prepare(`INSERT INTO Pictures (id_pictures, id_rooms, picture) VALUES (?, ?, ?)`);
            stmt.run(newId, id_rooms, data, (err) => {
                callback(err);
            });
            stmt.finalize();
        }
    });
}

function updateImage(id_pictures, data, callback) {
    const sql = `UPDATE Pictures SET picture = ? WHERE id_pictures = ?`;
    db.run(sql, [data, id_pictures], (err) => {
        callback(err);
    });
}

function updateInfospot(id_info_popup, id_pictures, posX, posY, posZ, text, title, image, callback) {
    const sql = `UPDATE Info_Popup SET id_pictures = ?, position_x = ?, position_y = ?, position_z = ?, text = ?, title = ?, image = ? WHERE id_info_popup = ?`;
    db.run(sql, [id_pictures, posX, posY, posZ, text, title, image, id_info_popup], (err) => {
        callback(err);
    });
}

function insertInfoPopUp(id_pictures, posX, posY, posZ, text, title, image, callback) {
    db.get(`SELECT MAX(id_info_popup) as maxId FROM Info_Popup`, (err, row) => {
        if (err) {
            callback(err);
        } else {
            const newId = (row.maxId || 0) + 1;
            const stmt = db.prepare(`INSERT INTO Info_Popup (id_info_popup, id_pictures, position_x, position_y, position_z, text, title, image) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`);
            stmt.run(newId, id_pictures, posX, posY, posZ, text, title, image, (err) => {
                callback(err);
            });
            stmt.finalize();
        }
    });
}

function insertLink(id_pictures, posX, posY, posZ, id_pictures_destination, callback) {
    db.get(`SELECT MAX(id_links) as maxId FROM Links`, (err, row) => {
        if (err) {
            callback(err);
        } else {
            const newId = (row.maxId || 0) + 1;
            const stmt = db.prepare(`INSERT INTO Links (id_links, id_pictures, position_x, position_y, position_z, id_pictures_destination) VALUES (?, ?, ?, ?, ?, ?)`);
            stmt.run(newId, id_pictures, posX, posY, posZ, id_pictures_destination, (err) => {
                callback(err);
            });
            stmt.finalize();
        }
    });
}

function updateLink(id_links, id_pictures, posX, posY, posZ, id_pictures_destination, callback) {
    const sql = `UPDATE Links SET id_pictures = ?, position_x = ?, position_y = ?, position_z = ?, id_pictures_destination = ? WHERE id_links = ?`;
    db.run(sql, [id_pictures, posX, posY, posZ, id_pictures_destination, id_links], (err) => {
        callback(err);
    });
}

function retrieveInfoPopUpByIdPicture(id_pictures, callback) {
    const sql = `SELECT * FROM Info_Popup WHERE id_pictures = ?`;
    db.all(sql, [id_pictures], (err, rows) => {
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
            console.log('Fetched', infoPopUp.length, 'info popup');
            callback(null, infoPopUp);
        }
    });
}

function retrieveLinkByIdPicture(id_pictures, callback) {
    const sql = `SELECT * FROM Links WHERE id_pictures = ?`;
    db.all(sql, [id_pictures], (err, rows) => {
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
            console.log('Fetched', links.length, 'links');
            callback(null, links);
        }
    });
}

async function fetchImageById(id) {
    const FileType = await import('file-type'); // Use dynamic import
    return new Promise((resolve, reject) => {
        db.get(`SELECT picture FROM Pictures WHERE id_pictures = ?`, [id], async (err, row) => {
            if (err) {
                reject(err);
            } else if (row) {
                const contentType = await FileType.fileTypeFromBuffer(row.picture); // Determine MIME type
                if (contentType) {
                    resolve({ picture: row.picture, mime: contentType.mime });
                } else {
                    resolve({ picture: row.picture, mime: 'application/octet-stream' }); // Default MIME type
                }
            } else {
                resolve({ picture: null });
            }
        });
    });
}

const getRoomNameById = (id_rooms, callback) => {
    const sql = `SELECT * FROM Rooms WHERE id_rooms = ?`;
    db.get(sql, [id_rooms], (err, row) => {
        if (err) {
            console.error('Error fetching room name', err);
            callback(err, null);
        } else {
            callback(null, row);
        }
    });
};

const getRoomIdByPictureId = (id_pictures, callback) => {
    const sql = `SELECT id_rooms FROM Pictures WHERE id_pictures = ?`;
    db.get(sql, [id_pictures], (err, row) => {
        if (err) {
            console.error('Error fetching room ID by picture ID', err);
            callback(err, null);
        } else {
            callback(null, row.id_rooms);
        }
    });
};

const getPicturesByRoomId = (id_rooms, callback) => {
    const sql = `SELECT id_pictures FROM Pictures WHERE id_rooms = ?`;
    db.all(sql, [id_rooms], (err, rows) => {
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
    const sql = `SELECT id_pictures FROM Pictures WHERE id_rooms = ? LIMIT 1`;
    db.get(sql, [id_rooms], (err, row) => {
        if (err) {
            console.error('Error fetching first picture by room ID', err);
            callback(err, null);
        } else {
            callback(null, row);
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
    getTourSteps,
    getRoomNameById,
    getRoomIdByPictureId,
    getRooms,
    getPicturesByRoomId,
    getFirstPictureByRoomId,
    updateImage,
    updateInfospot,
    updateLink
};
