const express = require('express');
const router = express.Router();
const InvoiceController = require('../controllers/InvoiceController');

// No middleware needed - we'll pass userId in request body

// GET /api/invoices - Get all invoices for the user
router.get('/', InvoiceController.getInvoices);

// GET /api/invoices/overdue - Get overdue invoices
router.get('/overdue', InvoiceController.getOverdueInvoices);

// GET /api/invoices/reminders - Get invoices that need reminders
router.get('/reminders', InvoiceController.getInvoicesNeedingReminders);

// GET /api/invoices/:id - Get single invoice by ID
router.get('/:id', InvoiceController.getInvoice);

// POST /api/invoices - Create new invoice
router.post('/', InvoiceController.createInvoice);

// PUT /api/invoices/:id - Update invoice
router.put('/:id', InvoiceController.updateInvoice);

// PATCH /api/invoices/:id/pay - Mark invoice as paid
router.patch('/:id/pay', InvoiceController.markAsPaid);

// POST /api/invoices/:id/reminder - Send reminder for invoice
router.post('/:id/reminder', InvoiceController.sendReminder);

// DELETE /api/invoices/:id - Delete invoice
router.delete('/:id', InvoiceController.deleteInvoice);

module.exports = router;