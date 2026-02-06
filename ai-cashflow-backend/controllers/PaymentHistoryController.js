const { PaymentHistory, Invoice } = require('../models');

class PaymentHistoryController {
  // Create a payment history record and optionally update the invoice
  static async createPaymentHistory(req, res) {
    try {
      const { invoiceId, paymentAmount, paymentMethod, notes, actualPaymentDate } = req.body;

      if (!invoiceId) {
        return res.status(400).json({ success: false, message: 'invoiceId is required' });
      }

      const invoice = await Invoice.findByPk(invoiceId);
      if (!invoice) return res.status(404).json({ success: false, message: 'Invoice not found' });

      let daysToPayment = null;
      if (actualPaymentDate && invoice.issueDate) {
        const issue = new Date(invoice.issueDate);
        const paid = new Date(actualPaymentDate);
        daysToPayment = Math.ceil((paid - issue) / (1000 * 60 * 60 * 24));
      }

      const payment = await PaymentHistory.create({
        invoiceId,
        paymentAmount,
        paymentMethod,
        notes,
        actualPaymentDate,
        daysToPayment
      });

      // If a payment amount or actualPaymentDate is provided, mark invoice paid
      if (paymentAmount || actualPaymentDate) {
        invoice.actualPaymentDate = actualPaymentDate || invoice.actualPaymentDate;
        invoice.status = 'paid';
        await invoice.save();
      }

      res.status(201).json({ success: true, data: payment });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  // Get all payment history records (optionally filter by invoiceId)
  static async getPaymentHistories(req, res) {
    try {
      const { invoiceId } = req.query;
      const where = {};
      if (invoiceId) where.invoiceId = invoiceId;

      const payments = await PaymentHistory.findAll({ where, order: [['createdAt', 'DESC']] });

      res.json({ success: true, data: payments });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // Get single payment record
  static async getPaymentHistory(req, res) {
    try {
      const payment = await PaymentHistory.findByPk(req.params.id);
      if (!payment) return res.status(404).json({ success: false, message: 'Payment record not found' });

      res.json({ success: true, data: payment });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // Update payment record
  static async updatePaymentHistory(req, res) {
    try {
      const payment = await PaymentHistory.findByPk(req.params.id);
      if (!payment) return res.status(404).json({ success: false, message: 'Payment record not found' });

      await payment.update(req.body);

      res.json({ success: true, data: payment });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  // Delete payment record
  static async deletePaymentHistory(req, res) {
    try {
      const payment = await PaymentHistory.findByPk(req.params.id);
      if (!payment) return res.status(404).json({ success: false, message: 'Payment record not found' });

      await payment.destroy();

      res.json({ success: true, message: 'Payment record deleted successfully' });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}

module.exports = PaymentHistoryController;
