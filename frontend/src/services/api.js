// frontend/src/services/api.js

// --- ¡ESTA ES LA LÓGICA CLAVE! ---
// 1. Define tus dos URLs de backend
const LOCAL_API_URL = 'http://localhost:4321/api'; // Tu backend local
const PRODUCTION_API_URL = 'https://maycleanpos.onrender.com/api'; // Tu backend de Render

// 2. Comprueba en qué dominio está corriendo el frontend
const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

// 3. Elige la URL correcta
const API_URL = isLocal ? LOCAL_API_URL : PRODUCTION_API_URL;

export const login = async (email, password) => {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Error al iniciar sesión');
  return data;
};

/**
 * Obtener Pedidos del Dashboard
 */
export const getDashboardPedidos = async (token) => {
  const url = `${API_URL}/pedidos/dashboard?t=${new Date().getTime()}`;
  const response = await fetch(url, {
    method: 'GET',
    cache: 'no-cache',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Error al obtener pedidos');
  return data;
};

/**
 * 1. Busca un cliente por teléfono
 */
export const buscarCliente = async (telefono, token) => {
  const response = await fetch(`${API_URL}/clientes/buscar?telefono=${telefono}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Cliente no encontrado');
  return data;
};

/**
 * 2. Crea un nuevo cliente
 */
export const crearCliente = async (datosCliente, token) => {
  const response = await fetch(`${API_URL}/clientes`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(datosCliente)
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Error al crear cliente');
  return data;
};

/**
 * 3. Crea un nuevo pedido
 */
export const crearPedido = async (datosPedido, token) => {
  const response = await fetch(`${API_URL}/pedidos`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(datosPedido)
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Error al crear pedido');
  return data;
};


/**
 * 4. Actualiza el estado de un pedido
 */
export const actualizarEstadoPedido = async (folio, datosActualizados, token) => {
  const response = await fetch(`${API_URL}/pedidos/${folio}/estado`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(datosActualizados)
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Error al actualizar pedido');
  return data;
};

/**
 * 5. Obtiene la lista completa de clientes
 */
export const getClientes = async (token) => {
  const response = await fetch(`${API_URL}/clientes`, {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Error al obtener clientes');
  return data;
};

/**
 * 8. Actualiza un cliente existente
 */
export const updateCliente = async (clienteId, datosCliente, token) => {
  const response = await fetch(`${API_URL}/clientes/${clienteId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(datosCliente)
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Error al actualizar cliente');
  return data;
};

/**
 * 7. Elimina un cliente por su ID
 */
export const deleteCliente = async (clienteId, token) => {
  const response = await fetch(`${API_URL}/clientes/${clienteId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Error al eliminar cliente');
  return data;
};


/**
 * 6. Obtiene el historial de pedidos
 */
export const getHistorialPedidos = async (token, rangoFecha = '') => {
  let url = `${API_URL}/pedidos/historial?t=${new Date().getTime()}`;
  if (rangoFecha) {
    url += `&rango=${rangoFecha}`;
  }
  const response = await fetch(url, {
    cache: 'no-cache',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Error al obtener historial');
  return data;
};

/**
 * 9. Agrega o quita el servicio a domicilio
 */
export const toggleDomicilio = async (folio, esDomicilio, token) => {
  const response = await fetch(`${API_URL}/pedidos/${folio}/domicilio`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ es_domicilio: esDomicilio })
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Error al actualizar domicilio');
  return data;
};