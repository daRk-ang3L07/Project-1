const express = require('express');
const router = express.Router();
const ClientController = require('../controllers/ClientController');

// POST /api/clients - Create client
router.post('/', ClientController.createClient);

// GET /api/clients - Get all clients (optional ?userId=...)
router.get('/', ClientController.getClients);

// GET /api/clients/:id - Get single client
router.get('/:id', ClientController.getClient);

// PUT /api/clients/:id - Update client
router.put('/:id', ClientController.updateClient);

// DELETE /api/clients/:id - Delete client
router.delete('/:id', ClientController.deleteClient);

module.exports = router;
