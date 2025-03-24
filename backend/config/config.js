// config/config.js
require('dotenv').config();

module.exports = {
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 5432,
    user: process.env.DB_USER || 'admin',
    password: process.env.DB_PASSWORD || 're684199',
    database: process.env.DB_NAME || 'mydatabase',
  },
  jwtSecret: process.env.JWT_SECRET || 'ff0ead9a7347c85fc367f1ddc92f31f445fac46bd3f6b3afdf636e663296bb9191e185420635316cc2454ad8b0dfefe809dc7eaf0aee506e2f2f2d807d715f39c04f13cc15ffc8dd77761ee7e4e3d1f3fecc8a14f4f954399356be90af15a86a341b6497d221027589871480741627360b6290a20cda82958c3593e93d4972e87dcb0aeac8e6d626a697ae2453cfbfc3276d7dbd03fe7b47ca1a08ba0ea7044348635deb323393f0ec000fc319e71aefd9c216aa0ca62c8b699dcbf66b9841e9c76fa8f2263bc292bd260ee034615f950bb164d082c6dc774d96605c39d1bb00e5ee8a560bc5374d1d1d417f4c978850583215538d4c5fb8825e18fc31260750',
};