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

const storeImageBlob = (id, blob, callback) => {
    console.log('Storing image blob in database with id:', id);
    const sql = `UPDATE Pictures SET picture = ? WHERE id_pictures = ?`;
    db.run(sql, [blob, id], (err) => {
        callback(err);
    });
};

const getAllPictures = (callback) => {
    console.log('Fetching all pictures');
    const sql = `SELECT id_pictures, picture FROM Pictures`;
    db.all(sql, [], (err, rows) => {
        if (err) {
            callback(err, null);
        } else {
            const pictures = rows.map(row => ({
                id_pictures: row.id_pictures,
                picture: row.picture ? row.picture.toString('base64') : null
            }));
            callback(null, pictures);
        }
    });
};

module.exports = { db, getTables, storeImageBlob, getAllPictures };
