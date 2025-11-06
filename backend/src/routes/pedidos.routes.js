// backend/src/routes/pedidos.routes.js
import { Router } from 'express';
import { 
  getPedidosDashboard, 
  crearPedido, 
  actualizarEstadoPedido, 
  getHistorialPedidos,
  toggleDomicilio // <-- ¡NUEVA IMPORTACIÓN!
} from '../controllers/pedidos.controller.js';
import { verificarToken } from '../middleware/verificarToken.js';

const router = Router();

// Ruta para el Dashboard (Pedidos activos)
router.get('/dashboard', verificarToken, getPedidosDashboard);

// Ruta para el Historial (Todos los pedidos)
router.get('/historial', verificarToken, getHistorialPedidos);

// Ruta para crear un nuevo pedido
router.post('/', verificarToken, crearPedido);

// Ruta para actualizar el ESTADO (Listo, Entregado, Pagado, Cancelado)
router.put('/:folio/estado', verificarToken, actualizarEstadoPedido);

// --- ¡NUEVA RUTA! ---
// Ruta para agregar/quitar servicio a domicilio
router.put('/:folio/domicilio', verificarToken, toggleDomicilio);

export default router;