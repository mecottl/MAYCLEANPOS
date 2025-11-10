// backend/src/controllers/clientes.controller.js
import pool from '../config/db.config.js';

export const crearCliente = async (req, res) => {
  try {
    const { nombre, telefono, direccion } = req.body;
    if (!nombre || !telefono) {
      return res.status(400).json({ message: 'El nombre y el teléfono son requeridos' });
    }
    const nuevoCliente = await pool.query(
      'INSERT INTO clientes (nombre, telefono, direccion) VALUES ($1, $2, $3) RETURNING *',
      [nombre, telefono, direccion]
    );
    res.status(201).json({
      message: 'Cliente creado exitosamente',
      cliente: nuevoCliente.rows[0]
    });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(400).json({ message: 'El teléfono ya está registrado' });
    }
    console.error(error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

export const buscarCliente = async (req, res) => {
  try {
    const { telefono } = req.query;
    if (!telefono) {
      return res.status(400).json({ message: 'El parámetro "telefono" es requerido' });
    }

    // --- ¡CORRECCIÓN! Usa 'contador_lealtad' ---
    const clienteResult = await pool.query(
      `SELECT id, nombre, telefono, direccion, contador_lealtad, pedidos_totales, pedidos_gratis_contador 
   FROM clientes 
   WHERE telefono = $1`,
      [telefono]
    );

    if (clienteResult.rows.length === 0) {
      return res.status(404).json({ message: 'Cliente no encontrado' });
    }

    res.status(200).json({
      message: 'Cliente encontrado exitosamente',
      cliente: clienteResult.rows[0] // Ahora este objeto SÍ tiene 'contador_lealtad'
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

export const getAllClientes = async (req, res) => {
  try {
    // --- ¡CORRECCIÓN! Usa 'contador_lealtad' ---
    const query = `
   SELECT id, nombre, telefono, direccion, contador_lealtad, pedidos_totales, pedidos_gratis_contador 
   FROM clientes 
   ORDER BY fecha_registro DESC
  `;
    const clientes = await pool.query(query);
    res.status(200).json(clientes.rows);
  } catch (error) {
    console.error('Error al obtener todos los clientes:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
    S
  }
};

export const deleteCliente = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'DELETE FROM clientes WHERE id = $1 RETURNING *',
      [id]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Cliente no encontrado' });
    }
    res.status(200).json({ message: 'Cliente eliminado exitosamente' });
  } catch (error) {
    if (error.code === '23503') {
      return res.status(400).json({ message: 'Error: No se puede eliminar un cliente que ya tiene pedidos registrados.' });
    }
    console.error('Error al eliminar cliente:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

export const updateCliente = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, telefono, direccion } = req.body;
    if (!nombre || !telefono) {
   return res.status(400).json({ message: 'Nombre y teléfono son requeridos' });
    }
    const result = await pool.query(
      `UPDATE clientes 
   SET nombre = $1, telefono = $2, direccion = $3 
   WHERE id = $4 
   RETURNING *`,
      [nombre, telefono, direccion, id]
    );
    if (result.rowCount === 0) {
      return res.status(44).json({ message: 'Cliente no encontrado' });
    }
    res.status(200).json({
      message: 'Cliente actualizado exitosamente',
      cliente: result.rows[0]
    });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(400).json({ message: 'El teléfono ya está registrado con otro cliente.' });
    }
    console.error('Error al actualizar cliente:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};