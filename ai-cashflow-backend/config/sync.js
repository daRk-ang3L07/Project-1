// src/config/sync.js
const db = require('../models');

const syncDatabase = async () => {
  try {
    // force: true will drop tables and recreate (USE ONLY IN DEVELOPMENT)
    // alter: true will try to alter tables to match models
    await db.sequelize.sync({ alter: true });
    
    console.log('✅ Database synced successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error syncing database:', error);
    process.exit(1);
  }
};

syncDatabase();