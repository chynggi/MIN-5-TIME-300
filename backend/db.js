// db.js
const { Pool } = require('pg');
const config = require('./config/config').database;

const pool = new Pool({
  host: config.host,
  port: config.port,
  user: config.user,
  password: config.password,
  database: config.database,
});

module.exports = pool;