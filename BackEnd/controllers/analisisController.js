const { handleGenAI } = require('./genaiController');

exports.getAnalisisWilayah = (req, res) => handleGenAI(req, res, true);
