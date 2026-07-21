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
      db.run('PRAGMA foreign_keys = ON;');

      db.serialize(() => {
        // 1. Tabela de Utilizadores
        db.run(`
          CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            nome_completo TEXT,
            email TEXT,
            role TEXT DEFAULT 'user',
            ativo INTEGER DEFAULT 1,
            criado_em TEXT DEFAULT CURRENT_TIMESTAMP
          )
        `);

        // 2. Tabela de Hospitais
        db.run(`
          CREATE TABLE IF NOT EXISTS hospitais (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nome TEXT NOT NULL,
            endereco TEXT,
            telefone TEXT,
            tipo TEXT DEFAULT 'Hospital Público'
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

        // 5. Tabela de Configurações
        db.run(`
          CREATE TABLE IF NOT EXISTS configuracoes_dashboard (
            chave TEXT PRIMARY KEY,
            valor TEXT
          )
        `);

        // 6. Tabela de Notificações
        db.run(`
          CREATE TABLE IF NOT EXISTS notificacoes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            tipo TEXT NOT NULL,
            titulo TEXT NOT NULL,
            descricao TEXT,
            data TEXT DEFAULT CURRENT_TIMESTAMP,
            lida INTEGER DEFAULT 0,
            urgente INTEGER DEFAULT 0
          )
        `);

        // 7. Tabela de Auditoria (registo de atividade)
        db.run(`
          CREATE TABLE IF NOT EXISTS audit_log (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            acao TEXT NOT NULL,
            entidade TEXT NOT NULL,
            entidade_id INTEGER,
            detalhes TEXT,
            usuario TEXT NOT NULL,
            data TEXT DEFAULT CURRENT_TIMESTAMP
          )
        `);

        // Inserção do superadmin padrão
        db.run(`
          INSERT OR IGNORE INTO users (id, username, password)
          VALUES (1, 'admin', 'admin123')
        `, (err) => {
          if (err) { reject(err); return; }
          migratePagamentosColumns()
            .then(() => migrateMedicosColumns())
            .then(() => migrateUsersColumns())
            .then(() => migrateHospitaisColumns())
            .then(() => {
              // Update admin user to superadmin and set name
              db.run("UPDATE users SET role = 'superadmin', nome_completo = 'Administrador do Sistema' WHERE id = 1");
              resolve();
            })
            .catch(reject);
        });
      });
    });
  }

  // === Migrações ===

  function migrateUsersColumns() {
    return new Promise((resolve, reject) => {
      db.all('PRAGMA table_info(users)', [], (err, cols) => {
        if (err) return reject(err);
        const names = cols.map((c) => c.name);
        const migrations = [];
        if (!names.includes('nome_completo')) migrations.push("ALTER TABLE users ADD COLUMN nome_completo TEXT");
        if (!names.includes('email')) migrations.push("ALTER TABLE users ADD COLUMN email TEXT");
        if (!names.includes('role')) migrations.push("ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'user'");
        if (!names.includes('ativo')) migrations.push("ALTER TABLE users ADD COLUMN ativo INTEGER DEFAULT 1");
        if (!names.includes('criado_em')) migrations.push("ALTER TABLE users ADD COLUMN criado_em TEXT");
        if (migrations.length === 0) return resolve();
        // Update the admin to superadmin
        db.run("UPDATE users SET role = 'superadmin' WHERE id = 1 AND (role IS NULL OR role = 'user')");
        let pending = migrations.length;
        migrations.forEach((sql) => {
          db.run(sql, (runErr) => {
            if (runErr && !runErr.message.includes('duplicate column')) return reject(runErr);
            pending -= 1;
            if (pending === 0) resolve();
          });
        });
      });
    });
  }

  function migrateHospitaisColumns() {
    return new Promise((resolve, reject) => {
      db.all('PRAGMA table_info(hospitais)', [], (err, cols) => {
        if (err) return reject(err);
        const names = cols.map((c) => c.name);
        const migrations = [];
        if (!names.includes('tipo')) migrations.push("ALTER TABLE hospitais ADD COLUMN tipo TEXT DEFAULT 'Hospital Público'");
        if (migrations.length === 0) return resolve();
        let pending = migrations.length;
        migrations.forEach((sql) => {
          db.run(sql, (runErr) => {
            if (runErr && !runErr.message.includes('duplicate column')) return reject(runErr);
            pending -= 1;
            if (pending === 0) resolve();
          });
        });
      });
    });
  }

  function migrateMedicosColumns() {
    return new Promise((resolve, reject) => {
      db.all('PRAGMA table_info(medicos)', [], (err, cols) => {
        if (err) return reject(err);
        const names = cols.map((c) => c.name);
        const migrations = [];
        if (!names.includes('telefone')) migrations.push("ALTER TABLE medicos ADD COLUMN telefone TEXT");
        if (!names.includes('email')) migrations.push("ALTER TABLE medicos ADD COLUMN email TEXT");
        if (!names.includes('numero_ordem')) migrations.push("ALTER TABLE medicos ADD COLUMN numero_ordem TEXT");
        if (!names.includes('data_validade')) migrations.push("ALTER TABLE medicos ADD COLUMN data_validade TEXT");
        if (!names.includes('grupo_sanguineo')) migrations.push("ALTER TABLE medicos ADD COLUMN grupo_sanguineo TEXT");
        if (migrations.length === 0) return resolve();
        let pending = migrations.length;
        migrations.forEach((sql) => {
          db.run(sql, (runErr) => {
            if (runErr && !runErr.message.includes('duplicate column')) return reject(runErr);
            pending -= 1;
            if (pending === 0) resolve();
          });
        });
      });
    });
  }

  function migratePagamentosColumns() {
    return new Promise((resolve, reject) => {
      db.all('PRAGMA table_info(pagamentos)', [], (err, cols) => {
        if (err) { reject(err); return; }
        const names = cols.map((c) => c.name);
        const migrations = [];
        if (!names.includes('metodo_pagamento')) migrations.push("ALTER TABLE pagamentos ADD COLUMN metodo_pagamento TEXT DEFAULT 'Multicaixa Express'");
        if (!names.includes('observacoes')) migrations.push("ALTER TABLE pagamentos ADD COLUMN observacoes TEXT");
        if (!names.includes('mes_referencia')) migrations.push("ALTER TABLE pagamentos ADD COLUMN mes_referencia INTEGER");
        if (!names.includes('ano_referencia')) migrations.push("ALTER TABLE pagamentos ADD COLUMN ano_referencia INTEGER");
        if (migrations.length === 0) { resolve(); return; }
        let pending = migrations.length;
        migrations.forEach((sql) => {
          db.run(sql, (runErr) => {
            if (runErr && !runErr.message.includes('duplicate column')) { reject(runErr); return; }
            pending -= 1;
            if (pending === 0) resolve();
          });
        });
      });
    });
  }

  // === Médicos ===

  function getMedicosLista() {
    return new Promise((resolve, reject) => {
      db.all(
        `SELECT m.id, m.nome, m.especialidade, m.telefone, m.email, m.numero_ordem, m.data_validade, m.grupo_sanguineo, m.hospital_id, h.nome AS hospital_nome
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

  function updateMedico(id, dados, usuario) {
    return new Promise((resolve, reject) => {
      db.run(
        `UPDATE medicos SET nome=?, especialidade=?, telefone=?, email=?, numero_ordem=?, data_validade=?, grupo_sanguineo=?, hospital_id=? WHERE id=?`,
        [dados.nome, dados.especialidade||null, dados.telefone||null, dados.email||null,
         dados.numero_ordem||null, dados.data_validade||null, dados.grupo_sanguineo||null,
         dados.hospital_id||null, id],
        function(err) {
          if (err) return reject(err);
          addAuditLog('EDITAR', 'Médico', id, `Dados do Dr(a). ${dados.nome} atualizados.`, usuario);
          resolve({ changes: this.changes });
        }
      );
    });
  }

  function renovarCarteira(medicoId, novaData, nomeMedico, usuario) {
    return new Promise((resolve, reject) => {
      db.run(
        `UPDATE medicos SET data_validade=? WHERE id=?`,
        [novaData, medicoId],
        function(err) {
          if (err) return reject(err);
          // Apagar notificações antigas de expiração para este médico
          db.run(`DELETE FROM notificacoes WHERE tipo='alerta' AND descricao LIKE ?`, [`%${nomeMedico}%`]);
          addAuditLog('RENOVAR CARTEIRA', 'Médico', medicoId, `Carteira do Dr(a). ${nomeMedico} renovada até ${novaData}.`, usuario);
          resolve({ changes: this.changes });
        }
      );
    });
  }

  // === Hospitais ===

  function getHospitaisLista() {
    return new Promise((resolve, reject) => {
      db.all(
        `SELECT id, nome, endereco, telefone, tipo FROM hospitais ORDER BY nome ASC`,
        [],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });
  }

  function updateHospital(id, dados, usuario) {
    return new Promise((resolve, reject) => {
      db.run(
        `UPDATE hospitais SET nome=?, endereco=?, telefone=?, tipo=? WHERE id=?`,
        [dados.nome, dados.endereco||null, dados.telefone||null, dados.tipo||'Hospital Público', id],
        function(err) {
          if (err) return reject(err);
          addAuditLog('EDITAR', 'Hospital', id, `Dados de "${dados.nome}" atualizados.`, usuario);
          resolve({ changes: this.changes });
        }
      );
    });
  }

  // === Pagamentos ===

  function getPagamentosLista() {
    return new Promise((resolve, reject) => {
      db.all(
        `SELECT p.id, p.valor, p.data_pagamento, p.status, p.metodo_pagamento, p.observacoes, p.mes_referencia, p.ano_referencia,
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
      const meses = Array.isArray(dados.meses) && dados.meses.length > 0 ? dados.meses : [null];
      
      db.serialize(() => {
        db.run('BEGIN TRANSACTION');
        
        const stmt = db.prepare(
          `INSERT INTO pagamentos (valor, medico_id, status, metodo_pagamento, data_pagamento, observacoes, mes_referencia, ano_referencia)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
        );

        let errorOccurred = null;

        meses.forEach(mes => {
          stmt.run(
            [
              dados.valor, 
              dados.medico_id, 
              dados.status || 'Pendente',
              dados.metodo_pagamento || 'Multicaixa Express',
              dados.data_pagamento || new Date().toISOString().split('T')[0],
              dados.observacoes || null,
              mes,
              dados.ano || new Date().getFullYear()
            ],
            (err) => { if (err) errorOccurred = err; }
          );
        });

        stmt.finalize((err) => {
          if (err) errorOccurred = err;
          if (errorOccurred) {
            db.run('ROLLBACK', () => reject(errorOccurred));
          } else {
            db.run('COMMIT', () => resolve({ success: true, count: meses.length }));
          }
        });
      });
    });
  }

  function updatePagamentoStatus(id, status) {
    return new Promise((resolve, reject) => {
      db.run('UPDATE pagamentos SET status = ? WHERE id = ?', [status, id], function(err) {
        if (err) reject(err);
        else resolve({ changes: this.changes });
      });
    });
  }

  // === Utilizadores ===

  function authenticateUser(username, password) {
    return new Promise((resolve, reject) => {
      db.get(
        'SELECT id, username, nome_completo, role FROM users WHERE username = ? AND password = ? AND ativo = 1',
        [username, password],
        (err, row) => {
          if (err) { reject(err); return; }
          resolve(row || null);
        }
      );
    });
  }

  function getUsers() {
    return new Promise((resolve, reject) => {
      db.all(
        'SELECT id, username, nome_completo, email, role, ativo, criado_em FROM users ORDER BY id ASC',
        [],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows || []);
        }
      );
    });
  }

  function addUser(dados) {
    return new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO users (username, password, nome_completo, email, role, ativo) VALUES (?, ?, ?, ?, ?, 1)`,
        [dados.username, dados.password, dados.nome_completo || null, dados.email || null, dados.role || 'user'],
        function(err) {
          if (err) reject(err);
          else resolve({ id: this.lastID });
        }
      );
    });
  }

  function updateUser(id, dados) {
    return new Promise((resolve, reject) => {
      const params = [dados.nome_completo || null, dados.email || null, dados.role || 'user', dados.ativo !== undefined ? dados.ativo : 1];
      let sql = `UPDATE users SET nome_completo=?, email=?, role=?, ativo=?`;
      if (dados.password) {
        sql += `, password=?`;
        params.push(dados.password);
      }
      sql += ` WHERE id=?`;
      params.push(id);
      db.run(sql, params, function(err) {
        if (err) reject(err);
        else resolve({ changes: this.changes });
      });
    });
  }

  function deleteUser(id) {
    return new Promise((resolve, reject) => {
      db.run('UPDATE users SET ativo = 0 WHERE id = ?', [id], function(err) {
        if (err) reject(err);
        else resolve({ changes: this.changes });
      });
    });
  }

  // === Auditoria ===

  function addAuditLog(acao, entidade, entidadeId, detalhes, usuario) {
    db.run(
      `INSERT INTO audit_log (acao, entidade, entidade_id, detalhes, usuario, data) VALUES (?, ?, ?, ?, ?, ?)`,
      [acao, entidade, entidadeId || null, detalhes || null, usuario || 'Sistema', new Date().toISOString()]
    );
  }

  function getAuditLog(limit = 200) {
    return new Promise((resolve, reject) => {
      db.all(
        `SELECT * FROM audit_log ORDER BY data DESC LIMIT ?`,
        [limit],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows || []);
        }
      );
    });
  }

  // === Notificações ===

  function addNotificacao(tipo, titulo, descricao, urgente = 0) {
    return new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO notificacoes (tipo, titulo, descricao, data, lida, urgente) VALUES (?, ?, ?, ?, 0, ?)`,
        [tipo, titulo, descricao, new Date().toISOString(), urgente ? 1 : 0],
        function(err) {
          if (err) reject(err);
          else resolve({ id: this.lastID });
        }
      );
    });
  }

  function getNotificacoesLista() {
    return new Promise((resolve, reject) => {
      db.all('SELECT * FROM notificacoes ORDER BY data DESC LIMIT 100', [], (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });
  }

  function marcarNotificacaoLida(id, lida) {
    return new Promise((resolve, reject) => {
      db.run('UPDATE notificacoes SET lida = ? WHERE id = ?', [lida ? 1 : 0, id], function(err) {
        if (err) reject(err);
        else resolve({ changes: this.changes });
      });
    });
  }

  function marcarTodasNotificacoesLidas() {
    return new Promise((resolve, reject) => {
      db.run('UPDATE notificacoes SET lida = 1 WHERE lida = 0', [], function(err) {
        if (err) reject(err);
        else resolve({ changes: this.changes });
      });
    });
  }

  function eliminarNotificacao(id) {
    return new Promise((resolve, reject) => {
      db.run('DELETE FROM notificacoes WHERE id = ?', [id], function(err) {
        if (err) reject(err);
        else resolve({ changes: this.changes });
      });
    });
  }

  // === Dashboard Full Stats ===

  function getFullDashboardStats() {
    return new Promise((resolve, reject) => {
      const currentYear = new Date().getFullYear();
      const mesAtual = new Date().getMonth() + 1;
      const results = {};

      db.serialize(() => {
        db.get('SELECT COUNT(*) as c FROM hospitais', [], (err, row) => { if (!err) results.totalHospitais = row?.c || 0; });
        db.get('SELECT COUNT(*) as c FROM medicos', [], (err, row) => { if (!err) results.totalMedicos = row?.c || 0; });
        db.get('SELECT SUM(valor) as s FROM pagamentos WHERE status = "Pago"', [], (err, row) => { if (!err) results.receitaTotal = row?.s || 0; });
        db.get('SELECT COUNT(DISTINCT medico_id) as c FROM pagamentos WHERE status = "Pago" AND ano_referencia = ? AND mes_referencia = ?',
          [currentYear, mesAtual], (err, row) => { if (!err) results.pagosMes = row?.c || 0; });
        db.all('SELECT mes_referencia, SUM(valor) as total FROM pagamentos WHERE status = "Pago" AND ano_referencia = ? GROUP BY mes_referencia',
          [currentYear], (err, rows) => {
            if (!err) results.pagamentosMensais = rows || [];
            results.emAtrasoMes = Math.max(0, (results.totalMedicos || 0) - (results.pagosMes || 0));
            resolve(results);
          });
      });
    });
  }

  function limparDadosTeste(usuario) {
    return new Promise((resolve, reject) => {
      db.serialize(() => {
        db.run('BEGIN TRANSACTION');
        db.run('DELETE FROM medicos');
        db.run('DELETE FROM hospitais');
        db.run('DELETE FROM pagamentos');
        db.run('DELETE FROM notificacoes');
        db.run('DELETE FROM audit_log');
        db.run('COMMIT', (err) => {
          if (err) { db.run('ROLLBACK'); reject(err); }
          else {
            addAuditLog('LIMPAR', 'Sistema', null, 'Dados de teste removidos do sistema.', usuario || 'Sistema');
            resolve({ success: true });
          }
        });
      });
    });
  }

  function reiniciarBaseDados() {
    return new Promise((resolve, reject) => {
      db.serialize(() => {
        db.run('BEGIN TRANSACTION');
        db.run('DELETE FROM medicos');
        db.run('DELETE FROM hospitais');
        db.run('DELETE FROM pagamentos');
        db.run('DELETE FROM notificacoes');
        db.run('DELETE FROM audit_log');
        db.run('DELETE FROM users');
        
        db.run(`INSERT INTO users (id, username, password, role, nome_completo) VALUES (1, 'admin', 'admin123', 'superadmin', 'Administrador do Sistema')`);
        
        db.run('COMMIT', (err) => {
          if (err) { db.run('ROLLBACK'); reject(err); }
          else { resolve({ success: true }); }
        });
      });
    });
  }

  return {
    initialize,
    authenticateUser,
    getMedicosLista,
    updateMedico,
    renovarCarteira,
    getHospitaisLista,
    updateHospital,
    getPagamentosLista,
    getPagamentosStats,
    addPagamento,
    updatePagamentoStatus,
    getUsers,
    addUser,
    updateUser,
    deleteUser,
    addNotificacao,
    getNotificacoesLista,
    marcarNotificacaoLida,
    marcarTodasNotificacoesLidas,
    eliminarNotificacao,
    getFullDashboardStats,
    addAuditLog,
    getAuditLog,
    limparDadosTeste,
    reiniciarBaseDados,
    db,
  };
}

module.exports = { createDatabase };