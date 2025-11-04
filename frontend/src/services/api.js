// frontend/src/services/api.js

const API_URL = 'https://maycleanpos.onrender.com/api'; 

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

export const getDashboardPedidos = async (token) => {
  const url = `${API_URL}/pedidos/dashboard?t=${new Date().getTime()}`;
  const response = await fetch(url, {
    method: 'GET',
    cache: 'no-cache',
    headers: {
      'Content-Type': 'application/json', // ¡Esta línea es importante!
      'Authorization': `Bearer ${token}` 
    }
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Error al obtener pedidos');
  return data;
};

export const buscarCliente = async (telefono, token) => {
  const response = await fetch(`${API_URL}/clientes/buscar?telefono=${telefono}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Cliente no encontrado');
  return data;
};

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
 * 4. Actualiza el estado de un pedido (flujo y/o pago)
 * @param {string} folio - El UUID del pedido
 * @param {object} datosActualizados - ej: { estado_flujo: 'Listo' }
 * @param {string} token - El token JWT
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
  return data; // Retorna { message, pedido }
};

export const getClientes = async (token) => {
  const response = await fetch(`${API_URL}/clientes`, {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}` 
    }
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Error al obtener clientes');
  return data; // Retorna un array de clientes
};

export const getHistorialPedidos = async (token) => {
  const url = `${API_URL}/pedidos/historial?t=${new Date().getTime()}`; // Cache-busting
  const response = await fetch(url, {
    cache: 'no-cache',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}` 
    }
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Error al obtener historial');
  return data; // Retorna un array de pedidos
};

export const deleteCliente = async (clienteId, token) => {
  const response = await fetch(`${API_URL}/clientes/${clienteId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Error al eliminar cliente');
  return data; // Retorna { message }
};

export const updateCliente = async (clienteId, datosCliente, token) => {
  const response = await fetch(`${API_URL}/clientes/${clienteId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(datosCliente) // datosCliente = { nombre, telefono, direccion }
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Error al actualizar cliente');
  return data; // Retorna { message, cliente }
};