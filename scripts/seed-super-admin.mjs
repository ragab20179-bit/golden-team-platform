import mysql2 from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import { config } from 'dotenv';

config();

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('DATABASE_URL not set');
  process.exit(1);
}

const conn = await mysql2.createConnection(DATABASE_URL);

const tempPassword = 'GoldenTeam@2026';
const hash = await bcrypt.hash(tempPassword, 12);

await conn.execute(`
  INSERT INTO users (openId, name, email, loginMethod, role, passwordHash, lastSignedIn)
  VALUES (?, ?, ?, 'email', 'admin', ?, NOW())
  ON DUPLICATE KEY UPDATE 
    name = VALUES(name),
    role = 'admin',
    passwordHash = VALUES(passwordHash),
    lastSignedIn = NOW()
`, ['local-ragab20179', 'AbdelRahman Ibrahim', 'ragab20179@gmail.com', hash]);

console.log('✅ Super admin created/updated:');
console.log('   Email:    ragab20179@gmail.com');
console.log('   Password: GoldenTeam@2026');
console.log('   Role:     admin');

await conn.end();
