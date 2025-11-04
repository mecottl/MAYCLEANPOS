// src/routes/pedidos.routes.js
import { Router } from 'express';
import { getPedidosDashboard, crearPedido, actualizarEstadoPedido, getHistorialPedidos } from '../controllers/pedidos.controller.js';
import { verificarToken } from '../middleware/verificarToken.js';

const router = Router();

// Definimos las rutas para Pedidos
// Ruta completa será: /api/pedidos

// GET: Obtener pedidos para el dashboard (Ruta Protegida)
router.get('/dashboard', verificarToken, getPedidosDashboard);
router.get('/historial', verificarToken, getHistorialPedidos);
router.post('/', verificarToken, crearPedido);
router.put('/:folio/estado', verificarToken, actualizarEstadoPedido);

export default router;