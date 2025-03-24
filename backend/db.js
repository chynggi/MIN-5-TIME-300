// db.js
import pkg from 'pg';
const { Pool } = pkg;
import config from './config/config.js';

const pool = new Pool({
  host: config.database.host,
  port: config.database.port,
  user: config.database.user,
  password: config.database.password,
  database: config.database.database,
});

export default pool;