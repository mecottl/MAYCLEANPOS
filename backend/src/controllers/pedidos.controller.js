// backend/src/controllers/pedidos.controller.js
import pool from '../config/db.config.js';

// --- ¡NUEVAS CONSTANTES DE NEGOCIO! ---
const PRECIO_POR_KG = 15;
const TARIFA_DOMICILIO_FIJA = 30;
const MAX_KG_GRATIS = 10; // El descuento se aplica hasta 10kg
const PUNTOS_PARA_GRATIS = 9; // El 10º pedido (índice 9) es gratis

/**
 * 1. Obtiene pedidos ACTIVOS para el Dashboard
 */
export const getPedidosDashboard = async (req, res) => {
  // ... (Esta función se queda igual)
  try {
    const pedidosActivos = await pool.query(
      `SELECT 
         p.folio, p.precio_total, p.estado_flujo, p.estado_pago, 
         p.fecha_creacion, p.es_domicilio, c.nombre AS nombre_cliente,
         c.telefono AS telefono_cliente
       FROM pedidos p
       JOIN clientes c ON p.cliente_id = c.id
       WHERE p.estado_flujo IN ('En Proceso', 'Listo')
       ORDER BY p.fecha_creacion ASC`
    );
    res.status(200).json(pedidosActivos.rows);
  } catch (error) {
    console.error('Error al obtener pedidos del dashboard:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

/**
 * 2. Crea un nuevo pedido.
 * ¡TOTALMENTE REESCRITO para manejar la lógica de precios!
 */
export const crearPedido = async (req, res) => {
  try {
    // --- ¡CAMBIO! Recibimos 'kilos' en lugar de 'precio_servicio' ---
    const { cliente_id, kilos, es_domicilio, estado_pago = 'Pendiente' } = req.body;

    if (!cliente_id || !kilos) {
      return res.status(400).json({ message: 'El cliente_id y los kilos son requeridos' });
    }

    const clienteResult = await pool.query(
      'SELECT contador_servicios FROM clientes WHERE id = $1',
      [cliente_id]
    );

    if (clienteResult.rows.length === 0) {
      return res.status(404).json({ message: 'Error: El cliente no existe' });
    }

    const cliente = clienteResult.rows[0];
    const esPedidoGratis = cliente.contador_servicios >= PUNTOS_PARA_GRATIS;
    
    let precio_servicio = 0;
    let mensajeRespuesta = 'Pedido creado exitosamente';

    if (esPedidoGratis) {
      // --- ¡NUEVA LÓGICA DE 10KG MÁXIMO! ---
      if (kilos <= MAX_KG_GRATIS) {
        // 1. Pedido de 10kg o menos: El servicio es 100% gratis
        precio_servicio = 0;
        mensajeRespuesta = `¡Pedido gratis (hasta ${MAX_KG_GRATIS}kg) aplicado!`;
      } else {
        // 2. Pedido de más de 10kg: Se cobran los kilos excedentes
        const kilos_excedentes = kilos - MAX_KG_GRATIS;
        precio_servicio = kilos_excedentes * PRECIO_POR_KG;
        mensajeRespuesta = `¡Descuento de ${MAX_KG_GRATIS}kg gratis aplicado! Se cobran ${kilos_excedentes}kg excedentes.`;
      }
      
      // Reseteamos el contador y sumamos al historial de gratis
      await pool.query(
        `UPDATE clientes 
         SET contador_servicios = 0, 
             pedidos_gratis_contador = pedidos_gratis_contador + 1 
         WHERE id = $1`,
        [cliente_id]
      );
    } else {
      // Pedido normal, se cobra completo
      precio_servicio = kilos * PRECIO_POR_KG;
    }
    // --- FIN DE LA LÓGICA ---

    // Calculamos la tarifa de domicilio
    const tarifa_domicilio = es_domicilio ? TARIFA_DOMICILIO_FIJA : 0;

    const nuevoPedido = await pool.query(
      `INSERT INTO pedidos (cliente_id, precio_servicio, tarifa_domicilio, es_domicilio, estado_pago) 
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [cliente_id, precio_servicio, tarifa_domicilio, es_domicilio, estado_pago]
    );

    res.status(201).json({
      message: mensajeRespuesta,
      pedido: nuevoPedido.rows[0]
    });

  } catch (error) {
    if (error.code === '23503') { 
      return res.status(404).json({ message: 'Error: El cliente_id no existe' });
    }
    console.error('Error al crear pedido:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

/**
 * 3. Actualiza el estado de un pedido (Listo, Entregado, Cancelado)
 */
export const actualizarEstadoPedido = async (req, res) => {
  // ... (Tu función se queda igual)
  try {
    const { folio } = req.params;
    const { estado_flujo, estado_pago } = req.body;

    if (!estado_flujo && !estado_pago) {
      return res.status(400).json({ message: 'Se requiere al menos un estado para actualizar' });
    }

    const fields = [];
    const values = [];
    let paramIndex = 1;

    if (estado_flujo) {
      fields.push(`estado_flujo = $${paramIndex++}`);
      values.push(estado_flujo);
      if (estado_flujo === 'Listo') {
        fields.push(`fecha_listo = NOW()`);
      } else if (estado_flujo === 'Entregado') {
        fields.push(`fecha_entrega = NOW()`);
      }
    }

    if (estado_pago) {
      fields.push(`estado_pago = $${paramIndex++}`);
      values.push(estado_pago);
    }

    values.push(folio);
    const query = `
      UPDATE pedidos
      SET ${fields.join(', ')} 
      WHERE folio = $${paramIndex} 
      RETURNING *`;

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Pedido no encontrado' });
    }

    const pedidoActualizado = result.rows[0];
    let mensajeRespuesta = 'Pedido actualizado exitosamente';

    if (pedidoActualizado.estado_flujo === 'Entregado' && pedidoActualizado.estado_pago === 'Pagado') {
      await pool.query(
        'UPDATE clientes SET contador_servicios = contador_servicios + 1 WHERE id = $1',
        [pedidoActualizado.cliente_id]
      );
      mensajeRespuesta = 'Pedido actualizado y 1 punto de lealtad sumado al cliente';
    }

    res.status(200).json({
      message: mensajeRespuesta,
      pedido: pedidoActualizado
    });

  } catch (error) {
    console.error('Error al actualizar pedido:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

/**
 * 4. Obtiene TODOS los pedidos para el Historial
 */
export const getHistorialPedidos = async (req, res) => {
  // ... (Tu función se queda igual) ...
  try {
    const { rango } = req.query;
    let sqlFiltroFecha = ""; 

    if (rango) {
      sqlFiltroFecha = `WHERE (p.fecha_entrega >= (NOW() - INTERVAL '${rango}') OR p.fecha_creacion >= (NOW() - INTERVAL '${rango}'))`;
    }

    const pedidosHistorial = await pool.query(
      `SELECT 
         p.folio, p.precio_servicio, p.tarifa_domicilio, p.precio_total,
         p.estado_flujo, p.estado_pago, p.fecha_creacion, p.fecha_listo,
         p.fecha_entrega, p.es_domicilio, c.nombre AS nombre_cliente,
         c.telefono AS telefono_cliente
       FROM pedidos p
       JOIN clientes c ON p.cliente_id = c.id
       ${sqlFiltroFecha}
       ORDER BY
         CASE 
           WHEN p.estado_flujo = 'En Proceso' THEN 1
           WHEN p.estado_flujo = 'Listo' THEN 2
           WHEN p.estado_flujo = 'Entregado' THEN 3
           WHEN p.estado_flujo = 'Cancelado' THEN 4
           ELSE 5 
         END ASC,
         p.fecha_creacion DESC`
    );
    
    res.status(200).json(pedidosHistorial.rows);

  } catch (error) {
    console.error('Error al obtener historial de pedidos:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

/**
 * 5. Agrega o quita el servicio a domicilio de un pedido.
 */
export const toggleDomicilio = async (req, res) => {
  // ... (Tu función se queda igual) ...
  try {
    const { folio } = req.params;
    const { es_domicilio } = req.body; 

    if (typeof es_domicilio !== 'boolean') {
      return res.status(400).json({ message: 'Se requiere el campo "es_domicilio" (true/false)' });
    }

    const nuevaTarifa = es_domicilio ? TARIFA_DOMICILIO_FIJA : 0;

    const result = await pool.query(
      `UPDATE pedidos
       SET es_domicilio = $1, tarifa_domicilio = $2
       WHERE folio = $3
       RETURNING *`,
      [es_domicilio, nuevaTarifa, folio]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Pedido no encontrado' });
    }

    res.status(200).json({
      message: es_domicilio ? 'Servicio a domicilio añadido' : 'Servicio a domicilio cancelado',
      pedido: result.rows[0]
    });

  } catch (error) {
    console.error('Error al actualizar domicilio:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};