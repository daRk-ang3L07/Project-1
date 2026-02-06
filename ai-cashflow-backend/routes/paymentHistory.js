const express = require('express');
const router = express.Router();
const PaymentHistoryController = require('../controllers/PaymentHistoryController');
const authenticate = require('../middleware/auth');

// Apply authentication to all payment history routes
router.use(authenticate);

// POST /api/payment-history - Create payment history record
router.post('/', PaymentHistoryController.createPaymentHistory);

// GET /api/payment-history - List payment history (optional ?invoiceId=...)
router.get('/', PaymentHistoryController.getPaymentHistories);

// GET /api/payment-history/:id - Get single payment record
router.get('/:id', PaymentHistoryController.getPaymentHistory);

// PUT /api/payment-history/:id - Update payment record
router.put('/:id', PaymentHistoryController.updatePaymentHistory);

// DELETE /api/payment-history/:id - Delete payment record
router.delete('/:id', PaymentHistoryController.deletePaymentHistory);

module.exports = router;
