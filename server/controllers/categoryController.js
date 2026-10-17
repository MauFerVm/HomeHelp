// controllers/categoryController.js
const fs = require('fs');
const path = require('path');
const TipoProfesional = require('../models/tipoProfesionalModel');

const borrarImagenAnterior = (archivo) => {
  if (!archivo) return;
  const ruta = path.join(__dirname, '..', 'public', 'uploads', 'categorias', path.basename(archivo));
  fs.unlink(ruta, () => {});
};

/**
 * Obtiene todas las categorías activas
 */
const getActiveCategories = async (req, res) => {
  try {
    const categories = await TipoProfesional.getActive();
    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    console.error('Error al obtener categorías activas:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

/**
 * Obtiene todas las categorías (activas e inactivas)
 */
const getAllCategories = async (req, res) => {
  try {
    const categories = await TipoProfesional.getAll();
    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    console.error('Error al obtener todas las categorías:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

const validarNombre = (nombre) => {
  const limpio = String(nombre || '').trim();
  if (limpio.length < 2 || limpio.length > 100) {
    return { ok: false, message: 'El nombre debe tener entre 2 y 100 caracteres' };
  }
  return { ok: true, nombre: limpio };
};

const getGestion = async (req, res) => {
  try {
    const categorias = await TipoProfesional.listarGestion();
    res.json({ success: true, data: categorias });
  } catch (error) {
    console.error('Error al obtener la gestión de categorías:', error);
    res.status(500).json({
      success: false,
      message: 'No se pudieron obtener las categorías'
    });
  }
};

const crearCategoria = async (req, res) => {
  try {
    const validacion = validarNombre(req.body.nombre);
    if (!validacion.ok) {
      return res.status(400).json({ success: false, message: validacion.message });
    }
    if (await TipoProfesional.nombreEnUso(validacion.nombre)) {
      return res.status(409).json({ success: false, message: 'Ya existe una categoría con ese nombre' });
    }
    const imagen = req.file ? req.file.filename : null;
    const categoria = await TipoProfesional.crear(validacion.nombre, imagen);
    res.status(201).json({ success: true, data: categoria });
  } catch (error) {
    console.error('Error al crear la categoría:', error);
    res.status(500).json({ success: false, message: 'No se pudo crear la categoría' });
  }
};

const modificarCategoria = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const validacion = validarNombre(req.body.nombre);
    if (!Number.isInteger(id)) {
      return res.status(400).json({ success: false, message: 'Categoría inválida' });
    }
    if (!validacion.ok) {
      return res.status(400).json({ success: false, message: validacion.message });
    }
    if (await TipoProfesional.nombreEnUso(validacion.nombre, id)) {
      return res.status(409).json({ success: false, message: 'Ya existe una categoría con ese nombre' });
    }
    const imagen = req.file ? req.file.filename : null;
    const actualizada = await TipoProfesional.actualizar(id, validacion.nombre, imagen);
    if (!actualizada.ok) {
      return res.status(404).json({ success: false, message: 'Categoría no encontrada' });
    }
    if (imagen && actualizada.anterior && actualizada.anterior !== imagen) {
      borrarImagenAnterior(actualizada.anterior);
    }
    res.json({ success: true, data: { id, nombre: validacion.nombre, imagen } });
  } catch (error) {
    console.error('Error al modificar la categoría:', error);
    res.status(500).json({ success: false, message: 'No se pudo modificar la categoría' });
  }
};

const cambiarEstadoCategoria = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { estado } = req.body;
    if (!Number.isInteger(id) || typeof estado !== 'boolean') {
      return res.status(400).json({ success: false, message: 'Datos de estado inválidos' });
    }
    const actualizada = await TipoProfesional.actualizarEstado(id, estado);
    if (!actualizada) {
      return res.status(404).json({ success: false, message: 'Categoría no encontrada' });
    }
    res.json({ success: true, estado });
  } catch (error) {
    console.error('Error al cambiar el estado de la categoría:', error);
    res.status(500).json({ success: false, message: 'No se pudo cambiar el estado' });
  }
};

module.exports = {
  getActiveCategories,
  getAllCategories,
  getGestion,
  crearCategoria,
  modificarCategoria,
  cambiarEstadoCategoria
};
