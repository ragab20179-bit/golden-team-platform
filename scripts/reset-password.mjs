import bcrypt from 'bcryptjs';
import mysql from 'mysql2/promise';

const conn = await mysql.createConnection(process.env.DATABASE_URL);
const hash = await bcrypt.hash('GoldenTeam@2026', 12);
console.log('New hash:', hash);
await conn.execute('UPDATE users SET passwordHash = ? WHERE openId = ?', [hash, 'local-ragab20179']);
console.log('Updated passwordHash for local-ragab20179');
const [rows] = await conn.execute('SELECT passwordHash FROM users WHERE openId = ?', ['local-ragab20179']);
const valid = await bcrypt.compare('GoldenTeam@2026', rows[0].passwordHash);
console.log('Verification bcrypt.compare:', valid);
await conn.end();
process.exit(0);
