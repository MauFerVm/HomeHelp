const express = require('express');
const router = express.Router();
const favoritoController = require('../controllers/favoritoController');

router.post('/', favoritoController.crearFavorito);
router.get('/cliente/:cliente_persona_id', favoritoController.getFavoritosByCliente);

module.exports = router;
