const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgresql',
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false
    }
  }
});

async function supabaseConnection() {
  try {
    await sequelize.authenticate();
    console.log('✅ Connection to Supabase successful!');
    await sequelize.close();
  } catch (error) {
    console.error('❌ Unable to connect to database:', error);
  }
}

supabaseConnection();