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
          migratePagamentosColumns()
            .then(() => resolve())
            .catch(reject);
        });

      });
    });
  }

  function migratePagamentosColumns() {
    return new Promise((resolve, reject) => {
      db.all('PRAGMA table_info(pagamentos)', [], (err, cols) => {
        if (err) {
          reject(err);
          return;
        }
        const names = cols.map((c) => c.name);
        const migrations = [];
        if (!names.includes('metodo_pagamento')) {
          migrations.push(
            "ALTER TABLE pagamentos ADD COLUMN metodo_pagamento TEXT DEFAULT 'Multicaixa Express'"
          );
        }
        if (!names.includes('observacoes')) {
          migrations.push('ALTER TABLE pagamentos ADD COLUMN observacoes TEXT');
        }
        if (migrations.length === 0) {
          resolve();
          return;
        }
        let pending = migrations.length;
        migrations.forEach((sql) => {
          db.run(sql, (runErr) => {
            if (runErr) {
              reject(runErr);
              return;
            }
            pending -= 1;
            if (pending === 0) resolve();
          });
        });
      });
    });
  }

  function getMedicosLista() {
    return new Promise((resolve, reject) => {
      db.all(
        `SELECT m.id, m.nome, m.especialidade, h.nome AS hospital_nome
         FROM medicos m
         LEFT JOIN hospitais h ON m.hospital_id = h.id
         ORDER BY m.nome ASC`,
        [],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });
  }

  function getPagamentosLista() {
    return new Promise((resolve, reject) => {
      db.all(
        `SELECT p.id, p.valor, p.data_pagamento, p.status, p.metodo_pagamento, p.observacoes,
                m.id AS medico_id, m.nome AS medico_nome, m.especialidade
         FROM pagamentos p
         LEFT JOIN medicos m ON p.medico_id = m.id
         ORDER BY p.id DESC`,
        [],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });
  }

  function getPagamentosStats() {
    return new Promise((resolve, reject) => {
      db.get(
        `SELECT
           COUNT(*) AS total,
           SUM(CASE WHEN status = 'Pago' THEN 1 ELSE 0 END) AS pagos,
           SUM(CASE WHEN status = 'Pendente' THEN 1 ELSE 0 END) AS pendentes,
           COALESCE(SUM(CASE WHEN status = 'Pago' THEN valor ELSE 0 END), 0) AS receita_total
         FROM pagamentos`,
        [],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });
  }

  function addPagamento(dados) {
    return new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO pagamentos (valor, medico_id, status, metodo_pagamento, data_pagamento, observacoes)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          dados.valor,
          dados.medico_id,
          dados.status || 'Pendente',
          dados.metodo_pagamento || 'Multicaixa Express',
          dados.data_pagamento || new Date().toISOString().split('T')[0],
          dados.observacoes || null,
        ],
        function (err) {
          if (err) reject(err);
          else resolve({ id: this.lastID });
        }
      );
    });
  }

  function updatePagamentoStatus(id, status) {
    return new Promise((resolve, reject) => {
      db.run(
        'UPDATE pagamentos SET status = ? WHERE id = ?',
        [status, id],
        function (err) {
          if (err) reject(err);
          else resolve({ changes: this.changes });
        }
      );
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

  return {
    initialize,
    authenticateUser,
    getMedicosLista,
    getPagamentosLista,
    getPagamentosStats,
    addPagamento,
    updatePagamentoStatus,
    db,
  };
}

module.exports = { createDatabase };