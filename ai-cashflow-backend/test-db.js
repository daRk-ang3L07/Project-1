require('dotenv').config();
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'postgres',
    logging: console.log
  }
);

async function testConnection() {
  try {
    await sequelize.authenticate();
    console.log('✅ Connection has been established successfully.');
    
    // Try a simple query
    const [results] = await sequelize.query('SELECT NOW()');
    console.log('✅ Current database time:', results[0].now);
    
    await sequelize.close();
    console.log('✅ Connection closed.');
  } catch (error) {
    console.error('❌ Unable to connect to the database:');
    console.error('Error:', error.message);
    console.error('\nTroubleshooting:');
    console.error('1. Check if PostgreSQL service is running (services.msc)');
    console.error('2. Verify your .env file has correct credentials');
    console.error('3. Make sure database "cashflow_db" exists');
  }
}

testConnection();