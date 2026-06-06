const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'debjeetjalui123',
  database: process.env.DB_NAME || 'indulge_db',
  waitForConnections: true,
  connectionLimit: 50,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 5000,
  idleTimeout: 0,
  connectTimeout: 60000
});

pool.getConnection()
  .then(connection => {
    console.log('MySQL connected successfully');
    connection.release();
  })
  .catch(err => {
    console.error('MySQL connection failed:', err.message);
  });

setInterval(async () => {
  try {
    await pool.query('SELECT 1');
  } catch (err) {
    console.error('MySQL heartbeat failed:', err.message);
  }
}, 15 * 1000);

module.exports = pool;
