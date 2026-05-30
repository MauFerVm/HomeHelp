const Provincia = require('../models/provinciaModel');
const Localidad = require('../models/localidadModel');
const TipoProfesional = require('../models/tipoProfesionalModel');

exports.listarProvincias = async (req, res) => {
  const list = await Provincia.getAll();
  res.json(list.map(p => p.toJSON()));
};

exports.listarLocalidades = async (req, res) => {
  const { provinciaId } = req.params;
  const list = await Localidad.getByProvincia(provinciaId);
  res.json(list.map(l => l.toJSON()));
};

exports.listarTiposProfesional = async (req, res) => {
  const list = await TipoProfesional.getActive();
  res.json(list.map(t => t.toJSON()));
};
