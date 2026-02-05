require("dotenv").config();

const express = require("express");
const cors = require("cors");
const db = require("./models"); // Import your models
const apiRoutes = require('./routes'); // Import API routes

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Test database connection on startup
db.sequelize.authenticate()
  .then(() => {
    console.log('✅ Database connected successfully');
  })
  .catch(err => {
    console.error('❌ Unable to connect to database:', err);
  });

// Routes
app.get("/", (req, res) => {
  res.status(200).send("OK");
});

// API Routes
app.use('/api', apiRoutes);


const PORT = process.env.PORT || 8000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
