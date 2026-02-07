const express = require('express');
const router = express.Router();
const {
  getSummary,
  getCashFlowForecast,
  getAlerts,
  getRecentInvoices,
  getTopClients
} = require('../controllers/DashboardController');
const authenticate = require('../middleware/auth');

// All dashboard routes are protected
router.use(authenticate);

router.get('/summary', getSummary);
router.get('/forecast', getCashFlowForecast);
router.get('/alerts', getAlerts);
router.get('/recent-invoices', getRecentInvoices);
router.get('/top-clients', getTopClients);

module.exports = router;