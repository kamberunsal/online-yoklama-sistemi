const { Sequelize } = require('sequelize');
require('dotenv').config();

// Connect to PostgreSQL using the connection URL from environment variables
const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  protocol: 'postgres',
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false // Required for Render's PostgreSQL
    }
  },
  pool: {
    max: 20,
    min: 0,
    acquire: 30000,
    idle: 10000
  },
  logging: false // Set to console.log to see SQL queries
});

module.exports = sequelize;