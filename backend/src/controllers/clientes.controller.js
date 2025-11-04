// src/controllers/clientes.controller.js
import pool from '../config/db.config.js'; // Importamos el pool de Neon

export const crearCliente = async (req, res) => {
  try {
    // 1. Obtenemos nombre y teléfono del cuerpo
    const { nombre, telefono, direccion } = req.body;

    // 2. Validación simple
    if (!nombre || !telefono) {
      return res.status(400).json({ message: 'El nombre y el teléfono son requeridos' });
    }

    // 3. Guardar en la Base de Datos 
    // El 'contador_servicios' usará el valor por defecto (0)
    const nuevoCliente = await pool.query(
      'INSERT INTO clientes (nombre, telefono, direccion) VALUES ($1, $2, $3) RETURNING *',
      [nombre, telefono, direccion]
    );

    // 4. Responder al cliente
    res.status(201).json({
      message: 'Cliente creado exitosamente',
      cliente: nuevoCliente.rows[0]
    });

  } catch (error) {
    // Manejo de errores (ej. teléfono duplicado)
    if (error.code === '23505') { // Código de PostgreSQL para "unique_violation"
      return res.status(400).json({ message: 'El teléfono ya está registrado' });
    }
    
    console.error(error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

export const buscarCliente = async (req, res) => {
  try {
    // 1. Obtenemos el teléfono desde los "query parameters" (la URL)
    const { telefono } = req.query;

    if (!telefono) {
      return res.status(400).json({ message: 'El parámetro "telefono" es requerido' });
    }

    // 2. Buscar en la Base de Datos
    const clienteResult = await pool.query(
      'SELECT * FROM clientes WHERE telefono = $1',
      [telefono]
    );

    // 3. Verificar si se encontró el cliente
    if (clienteResult.rows.length === 0) {
      return res.status(404).json({ message: 'Cliente no encontrado' });
    }

    // 4. Responder con el cliente encontrado
    res.status(200).json({
      message: 'Cliente encontrado exitosamente',
      cliente: clienteResult.rows[0]
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

export const getAllClientes = async (req, res) => {
  try {
    const query = `
      SELECT id, nombre, telefono, direccion, contador_servicios, fecha_registro 
      FROM clientes 
      ORDER BY fecha_registro DESC
    `;    
    const clientes = await pool.query(query);
    res.status(200).json(clientes.rows);

  } catch (error) {
    // Si esto falla, el error está en uno de los nombres de columna
    console.error('Error al obtener todos los clientes:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

export const deleteCliente = async (req, res) => {
  try {
    const { id } = req.params; // Obtenemos el ID de la URL (ej. /api/clientes/uuid-...)

    // NOTA: PostgreSQL fallará si intentas borrar un cliente
    // que ya tiene pedidos (por la llave foránea).
    // Idealmente, aquí deberíamos 'desactivar' al cliente o borrar sus pedidos.
    // Por ahora, solo manejará el borrado simple.
    const result = await pool.query(
      'DELETE FROM clientes WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Cliente no encontrado' });
    }

    res.status(200).json({ message: 'Cliente eliminado exitosamente' });

  } catch (error) {
     // Error si el cliente tiene pedidos
    if (error.code === '23503') {
      return res.status(400).json({ message: 'Error: No se puede eliminar un cliente que ya tiene pedidos registrados.' });
    }
    console.error('Error al eliminar cliente:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

export const updateCliente = async (req, res) => {
  try {
    const { id } = req.params; // El ID del cliente de la URL
    const { nombre, telefono, direccion } = req.body; // Los nuevos datos del formulario

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
      return res.status(404).json({ message: 'Cliente no encontrado' });
    }

    res.status(200).json({
      message: 'Cliente actualizado exitosamente',
      cliente: result.rows[0]
    });

  } catch (error) {
     if (error.code === '23505') { // Teléfono duplicado
      return res.status(400).json({ message: 'El teléfono ya está registrado con otro cliente.' });
    }
    console.error('Error al actualizar cliente:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};