const { Client, Invoice } = require('../models');

class ClientController {
  // Create a new client
  static async createClient(req, res) {
    try {
      const { name, email, phone, address } = req.body;
      const userId = req.user.id;

      if (!name) {
        return res.status(400).json({ success: false, message: 'name is required' });
      }

      const client = await Client.create({ userId, name, email, phone, address });

      res.status(201).json({ success: true, data: client });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  // Get all clients for a user (or all if no filter)
  static async getClients(req, res) {
    try {
      const userId = req.user.id;
      const where = { userId };

      const clients = await Client.findAll({ where, order: [['createdAt', 'DESC']] });

      res.json({ success: true, data: clients });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // Get single client by ID (include invoices)
  static async getClient(req, res) {
    try {
      const client = await Client.findByPk(req.params.id, {
        include: [{ model: Invoice, as: 'invoices' }]
      });

      if (!client) return res.status(404).json({ success: false, message: 'Client not found' });

      res.json({ success: true, data: client });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // Update client
  static async updateClient(req, res) {
    try {
      const client = await Client.findByPk(req.params.id);
      if (!client) return res.status(404).json({ success: false, message: 'Client not found' });

      await client.update(req.body);

      res.json({ success: true, data: client });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  // Delete client
  static async deleteClient(req, res) {
    try {
      const client = await Client.findByPk(req.params.id);
      if (!client) return res.status(404).json({ success: false, message: 'Client not found' });

      await client.destroy();

      res.json({ success: true, message: 'Client deleted successfully' });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}

module.exports = ClientController;
