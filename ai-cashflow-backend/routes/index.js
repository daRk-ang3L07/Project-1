const express = require('express');
const router = express.Router();

// Import route modules
const invoiceRoutes = require('./invoices');
const userRoutes = require('./users');
// const clientRoutes = require('./clients');

// Mount routes
router.use('/invoices', invoiceRoutes);
router.use('/users', userRoutes);
// router.use('/clients', clientRoutes);

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'AI Cash Flow API is running',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;