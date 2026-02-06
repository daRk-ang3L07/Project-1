const { Invoice, Client, PaymentHistory } = require('../models');

class InvoiceController {
  // Create a new invoice
  static async createInvoice(req, res) {
    try {
      const {
        clientId,
        invoiceNumber,
        amount,
        issueDate,
        dueDate,
        description,
        fileName,
        fileUrl
      } = req.body;

      // Get userId from authenticated token, NOT from request body
      const userId = req.user.id;

      // Verify that the client belongs to this user (security check)
      if (clientId) {
        const client = await Client.findOne({
          where: { 
            id: clientId, 
            userId: userId 
          }
        });
        
        if (!client) {
          return res.status(404).json({
            success: false,
            message: 'Client not found or does not belong to you'
          });
        }
      }

      // Create invoice - only set fields that are required or provided
      const invoice = await Invoice.create({
        userId,  // Now comes from req.user.id
        clientId: clientId || null, // Optional field
        invoiceNumber: invoiceNumber || null, // Optional field  
        amount,
        issueDate,
        dueDate,
        description: description || null, // Optional field
        fileName: fileName || null, // Optional field
        fileUrl: fileUrl || null, // Optional field
        status: 'pending' // Default status
      });

      // Include client data in response
      const invoiceWithClient = await Invoice.findByPk(invoice.id, {
        include: [
          { model: Client, as: 'client' }
        ]
      });

      res.status(201).json({
        success: true,
        data: invoiceWithClient
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  // Get all invoices for a user
  static async getInvoices(req, res) {
    try {
      const invoices = await Invoice.findAll({
        where: { userId: req.user.id },
        include: [
          { model: Client, as: 'client' },
          { model: PaymentHistory, as: 'paymentHistory' }
        ],
        order: [['createdAt', 'DESC']]
      });

      res.json({
        success: true,
        data: invoices
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Get single invoice
  static async getInvoice(req, res) {
    try {
      const invoice = await Invoice.findOne({
        where: { 
          id: req.params.id,
          userId: req.user.id 
        },
        include: [
          { model: Client, as: 'client' },
          { model: PaymentHistory, as: 'paymentHistory' }
        ]
      });

      if (!invoice) {
        return res.status(404).json({
          success: false,
          message: 'Invoice not found'
        });
      }

      res.json({
        success: true,
        data: invoice
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Update invoice
  static async updateInvoice(req, res) {
    try {
      const invoice = await Invoice.findOne({
        where: { 
          id: req.params.id,
          userId: req.user.id 
        }
      });

      if (!invoice) {
        return res.status(404).json({
          success: false,
          message: 'Invoice not found'
        });
      }

      await invoice.update(req.body);

      const updatedInvoice = await Invoice.findByPk(invoice.id, {
        include: [
          { model: Client, as: 'client' }
        ]
      });

      res.json({
        success: true,
        data: updatedInvoice
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  // Mark invoice as paid
  static async markAsPaid(req, res) {
    try {
      const { actualPaymentDate, paymentAmount, paymentMethod, notes } = req.body;

      const invoice = await Invoice.findOne({
        where: { 
          id: req.params.id,
          userId: req.user.id 
        }
      });

      if (!invoice) {
        return res.status(404).json({
          success: false,
          message: 'Invoice not found'
        });
      }

      // Update invoice status
      await invoice.update({
        status: 'paid',
        actualPaymentDate: actualPaymentDate || new Date()
      });

      // Create payment history record
      const daysToPayment = Math.ceil(
        (new Date(actualPaymentDate || new Date()) - new Date(invoice.issueDate)) / (1000 * 60 * 60 * 24)
      );

      await PaymentHistory.create({
        invoiceId: invoice.id,
        daysToPayment,
        wasReminderSent: invoice.reminderSent,
        numberOfReminders: invoice.reminderCount,
        paymentAmount: paymentAmount || invoice.amount,
        paymentMethod,
        notes
      });

      res.json({
        success: true,
        message: 'Invoice marked as paid'
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  // Get overdue invoices
  static async getOverdueInvoices(req, res) {
    try {
      const { Op } = require('sequelize');
      
      const invoices = await Invoice.findAll({
        where: {
          userId: req.user.id,
          status: { [Op.in]: ['pending', 'overdue'] },
          dueDate: { [Op.lt]: new Date() }
        },
        include: [
          { model: Client, as: 'client' }
        ],
        order: [['dueDate', 'ASC']]
      });

      res.json({
        success: true,
        data: invoices
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Get invoices that need reminders
  static async getInvoicesNeedingReminders(req, res) {
    try {
      const invoices = await Invoice.findAll({
        where: { userId: req.user.id },
        include: [
          { model: Client, as: 'client' }
        ]
      });

      // Filter invoices that need reminders using the model method
      const needingReminders = invoices.filter(invoice => invoice.shouldSendReminder());

      res.json({
        success: true,
        data: needingReminders
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Send reminder for invoice
  static async sendReminder(req, res) {
    try {
      const invoice = await Invoice.findOne({
        where: { 
          id: req.params.id,
          userId: req.user.id 
        }
      });

      if (!invoice) {
        return res.status(404).json({
          success: false,
          message: 'Invoice not found'
        });
      }

      // Update reminder tracking
      await invoice.update({
        reminderSent: true,
        reminderCount: invoice.reminderCount + 1,
        lastReminderDate: new Date()
      });

      // Here you would integrate with your email service
      // For now, just return success
      res.json({
        success: true,
        message: 'Reminder sent successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Delete invoice
  static async deleteInvoice(req, res) {
    try {
      const invoice = await Invoice.findOne({
        where: { 
          id: req.params.id,
          userId: req.user.id 
        }
      });

      if (!invoice) {
        return res.status(404).json({
          success: false,
          message: 'Invoice not found'
        });
      }

      await invoice.destroy();

      res.json({
        success: true,
        message: 'Invoice deleted successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
}

module.exports = InvoiceController;