const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { createDatabase } = require('../src/database');

test('authenticate default admin user', async () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'sigo2m-'));
  const databasePath = path.join(tempDir, 'test.sqlite');
  const database = createDatabase({ databasePath });

  await database.initialize();
  const user = await database.authenticateUser('admin', 'admin123');

  assert.deepEqual(user, { id: 1, username: 'admin' });
});
