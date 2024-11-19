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
    const checkSql = `SELECT COUNT(*) as count FROM Pictures WHERE id_pictures = ?`;
    db.get(checkSql, [id], (err, row) => {
        if (err) {
            callback(err);
        } else if (row.count > 0) {
            const updateSql = `UPDATE Pictures SET picture = ? WHERE id_pictures = ?`;
            db.run(updateSql, [blob, id], (err) => {
                callback(err);
            });
        } else {
            const insertSql = `INSERT INTO Pictures (id_pictures, picture) VALUES (?, ?)`;
            db.run(insertSql, [id, blob], (err) => {
                callback(err);
            });
        }
    });
};

const getAllPictures = (callback) => {
    console.log('Fetching all pictures');
    const sql = `SELECT * FROM Pictures`;
    db.all(sql, [], (err, rows) => {
        if (err) {
            console.error('Error fetching pictures', err);
            callback(err, null);
        } else {
            const pictures = rows.map(row => ({
                id_pictures: row.id_pictures,
                picture: row.picture
            }));
            console.log('Fetched', pictures.length, 'pictures');
            callback(null, pictures);
        }
    });
};

module.exports = { db, getTables, storeImageBlob, getAllPictures };
