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
      // Habilita o suporte a chaves estrangeiras (Foreign Keys) no SQLite
      db.run('PRAGMA foreign_keys = ON;');

      db.serialize(() => {
        // 1. Tabela de Usuários
        db.run(`
          CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL
          )
        `);

        // 2. Tabela de Hospitais
        db.run(`
          CREATE TABLE IF NOT EXISTS hospitais (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nome TEXT NOT NULL,
            endereco TEXT,
            telefone TEXT
          )
        `);

        // 3. Tabela de Médicos
        db.run(`
          CREATE TABLE IF NOT EXISTS medicos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nome TEXT NOT NULL,
            especialidade TEXT,
            hospital_id INTEGER,
            FOREIGN KEY (hospital_id) REFERENCES hospitais(id) ON DELETE SET NULL
          )
        `);

        // 4. Tabela de Pagamentos
        db.run(`
          CREATE TABLE IF NOT EXISTS pagamentos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            valor REAL NOT NULL,
            data_pagamento TEXT DEFAULT CURRENT_TIMESTAMP,
            status TEXT DEFAULT 'Pendente',
            medico_id INTEGER,
            FOREIGN KEY (medico_id) REFERENCES medicos(id) ON DELETE CASCADE
          )
        `);

        // 5. Tabela opcional para configurações do Dashboard (se necessário)
        db.run(`
          CREATE TABLE IF NOT EXISTS configuracoes_dashboard (
            chave TEXT PRIMARY KEY,
            valor TEXT
          )
        `);

        // Inserção do usuário padrão admin
        db.run(`
          INSERT OR IGNORE INTO users (id, username, password) VALUES (1, 'admin', 'admin123')
        `, (err) => {
          if (err) {
            reject(err);
            return;
          }
          resolve(); // Tudo pronto e criado com sucesso!
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