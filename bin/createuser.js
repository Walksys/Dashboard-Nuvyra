#!/usr/bin/env node
const readline = require('readline');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('crypto').randomUUID ? { v4: require('crypto').randomUUID } : { v4: () => Math.random().toString(36).substring(2, 15) };
const { initDatabase, query } = require('../src/database/db');

async function askQuestion(rl, queryText) {
  return new Promise((resolve) => rl.question(queryText, resolve));
}

async function main() {
  console.log('\n======================================');
  console.log('       🛠️  Mpanel User Creator        ');
  console.log('======================================\n');

  await initDatabase();

  const args = process.argv.slice(2);
  let username = '';
  let email = '';
  let password = '';
  let isAdmin = false;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--username' || args[i] === '-u') username = args[i + 1];
    if (args[i] === '--email' || args[i] === '-e') email = args[i + 1];
    if (args[i] === '--password' || args[i] === '-p') password = args[i + 1];
    if (args[i] === '--admin') isAdmin = true;
  }

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  try {
    if (!username) {
      username = await askQuestion(rl, 'Enter Username: ');
    }
    if (!email) {
      email = await askQuestion(rl, 'Enter Email: ');
    }
    if (!password) {
      password = await askQuestion(rl, 'Enter Password: ');
    }
    if (!args.includes('--admin')) {
      const adminAns = await askQuestion(rl, 'Grant Administrator privileges? (y/N): ');
      isAdmin = adminAns.toLowerCase().startsWith('y');
    }

    if (!username || !email || !password) {
      console.error('\n❌ Error: Username, email, and password cannot be empty.');
      process.exit(1);
    }

    const existing = await query.get('SELECT id FROM users WHERE username = ? OR email = ?', [username, email]);
    if (existing) {
      console.error(`\n❌ Error: A user with username "${username}" or email "${email}" already exists.`);
      process.exit(1);
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const userUuid = uuidv4();
    const role = isAdmin ? 'admin' : 'user';

    const result = await query.run(
      'INSERT INTO users (uuid, username, email, password_hash, role) VALUES (?, ?, ?, ?, ?)',
      [userUuid, username, email, passwordHash, role]
    );

    console.log('\n======================================');
    console.log('✅ User successfully created!');
    console.log(`• ID:       ${result.lastID}`);
    console.log(`• UUID:     ${userUuid}`);
    console.log(`• Username: ${username}`);
    console.log(`• Email:    ${email}`);
    console.log(`• Role:     ${role.toUpperCase()}`);
    console.log('======================================\n');
  } catch (err) {
    console.error('\n❌ Failed to create user:', err.message);
  } finally {
    rl.close();
    process.exit(0);
  }
}

main();

