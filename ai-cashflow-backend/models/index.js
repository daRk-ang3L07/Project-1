// src/models/index.js
const { Sequelize } = require('sequelize');
const config = require('../config/database');
require('dotenv').config();

const env = process.env.NODE_ENV || 'development';
const dbConfig = config[env];

// Create Sequelize instance
let sequelize;
if (dbConfig.use_env_variable) {
  sequelize = new Sequelize(process.env[dbConfig.use_env_variable], {
    dialect: dbConfig.dialect,
    dialectOptions: dbConfig.dialectOptions,
    logging: false
  });
} else {
  sequelize = new Sequelize(
    dbConfig.database,
    dbConfig.username,
    dbConfig.password,
    dbConfig
  );
}

// Test connection
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully.');
  } catch (error) {
    console.error('❌ Unable to connect to the database:', error);
  }
};

testConnection();

// Object to hold all models
const db = {};

db.Sequelize = Sequelize;
db.sequelize = sequelize;

// Import models
db.User = require('./User')(sequelize, Sequelize);
db.Client = require('./Client')(sequelize, Sequelize);
db.Invoice = require('./Invoice')(sequelize, Sequelize);
db.PaymentHistory = require('./PaymentHistory')(sequelize, Sequelize);

// Define associations
Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

module.exports = db;