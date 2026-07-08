const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

function createDatabase({ databasePath } = {}) {
  const resolvedPath = databasePath || path.join(__dirname, '..', 'data', 'sigo2m.sqlite');
  const dir = path.dirname(resolvedPath);

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const db = new sqlite3.Database(resolvedPath);

  function initialize() {
    return new Promise((resolve, reject) => {
      db.serialize(() => {
        db.run(`
          CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL
          )
        `, (err) => {
          if (err) {
            reject(err);
            return;
          }

          db.run(`
            INSERT OR IGNORE INTO users (id, username, password) VALUES (1, 'admin', 'admin123')
          `, (insertErr) => {
            if (insertErr) {
              reject(insertErr);
              return;
            }

            resolve();
          });
        });
      });
    });
  }

  function authenticateUser(username, password) {
    return new Promise((resolve, reject) => {
      db.get(
        'SELECT id, username FROM users WHERE username = ? AND password = ?',
        [username, password],
        (err, row) => {
          if (err) {
            reject(err);
            return;
          }

          resolve(row || null);
        }
      );
    });
  }

  return { initialize, authenticateUser, db };
}

module.exports = { createDatabase };
