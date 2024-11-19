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


function insertInfoPopUp(id_pictures, posX, posY, posZ, text, title, callback) {
    db.get(`SELECT MAX(id_info_popup) as maxId FROM Info_Popup`, (err, row) => {
        if (err) {
            callback(err);
        } else {
            const newId = (row.maxId || 0) + 1;
            const stmt = db.prepare(`INSERT INTO Info_Popup (id_info_popup, id_pictures, position_x, position_y, position_z, text, title) VALUES (?, ?, ?, ?, ?, ?, ?)`);
            stmt.run(newId, id_pictures, posX, posY, posZ, text, title, (err) => {
                callback(err);
            });
            stmt.finalize();
        }
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
                title: row.title
            }));
            console.log('Fetched', infoPopUp.length, 'info popup');
            callback(null, infoPopUp);
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

module.exports = {
    db,
    getTables,
    getAllPictures,
    insertImage,
    fetchImageById, // Add this line
    insertInfoPopUp,
    retrieveInfoPopUpByIdPicture
};
