const service = require("../services/health.service");

exports.healthCheck = (req, res) => {
  res.json(service.getHealth());
};
