
const { Sequelize } = require('sequelize');

// Create a new Sequelize instance, connecting to a SQLite database.
// The database will be stored in the 'database.sqlite' file in the project root.
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: './database.sqlite',
  logging: false // Set to console.log to see SQL queries
});

module.exports = sequelize;
