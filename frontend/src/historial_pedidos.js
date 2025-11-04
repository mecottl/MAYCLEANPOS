// frontend/src/historial_pedidos.js
import { getHistorialPedidos } from './services/api.js';

let todoElHistorial = [];
const token = localStorage.getItem('lavander_token');
let searchInput; // La haremos "global" en este script

// --- NAVEGACIÓN Y SEGURIDAD ---
document.addEventListener('DOMContentLoaded', () => {
  if (!token) {
    window.location.href = 'index.html';
    return;
  }
  
  setupNavigation();
  
  // 1. Asigna el input de búsqueda
  searchInput = document.querySelector('#buscar-historial');
  
  // 2. Configura el listener de la búsqueda
  setupSearch();
  
  // 3. Carga los datos (esto ahora también activará el filtro)
  cargarHistorial();
});

function setupNavigation() {
  // ... (tu código de setupNavigation se queda igual) ...
  document.querySelector('#nav-dashboard').addEventListener('click', (e) => { e.preventDefault(); window.location.href = 'dashboard.html'; });
  document.querySelector('#nav-crear-orden').addEventListener('click', (e) => { e.preventDefault(); window.location.href = 'new_order.html'; });
  document.querySelector('#nav-clientes').addEventListener('click', (e) => { e.preventDefault(); window.location.href = 'gestion_clientes.html'; });
  document.querySelector('#nav-historial').addEventListener('click', (e) => e.preventDefault());
  document.querySelector('.logout').addEventListener('click', (e) => {
    e.preventDefault();
    localStorage.clear();
    window.location.href = 'index.html';
  });
  // ... (botón de contabilidad) ...
}
// --- FIN DE NAVEGACIÓN ---


// --- LÓGICA DE LA PÁGINA ---

async function cargarHistorial() {
  const tbody = document.querySelector('#lista-historial-body');
  tbody.innerHTML = '<tr><td colspan="5">Cargando historial...</td></tr>';

  try {
    todoElHistorial = await getHistorialPedidos(token);
    renderizarHistorial(todoElHistorial);
    
    // --- ¡AQUÍ ESTÁ LA CORRECCIÓN! ---
    // Ahora que los datos SÍ existen, revisamos la URL.
    checkUrlParams(); 
    
  } catch (error) {
    tbody.innerHTML = `<tr><td colspan="5" class="error">Error al cargar historial: ${error.message}</td></tr>`;
  }
}

function renderizarHistorial(pedidos) {
  const tbody = document.querySelector('#lista-historial-body');
  tbody.innerHTML = ''; 

  if (pedidos.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5">No se encontraron pedidos.</td></tr>';
    return;
  }

  pedidos.forEach(pedido => {
    const tr = document.createElement('tr');
    
    const fecha = pedido.fecha_entrega ? 
                  new Date(pedido.fecha_entrega).toLocaleDateString('es-MX') : 
                  new Date(pedido.fecha_creacion).toLocaleDateString('es-MX');
                  
    const estadoClase = pedido.estado_flujo === 'Entregado' ? 'estado-entregado' : 'estado-cancelado';
    
    tr.innerHTML = `
      <td>${pedido.folio.substring(0, 8)}...</td>
      <td>${pedido.nombre_cliente}</td>
      <td>${fecha}</td>
      <td>$${Number(pedido.precio_total).toFixed(2)}</td>
      <td><span class="estado-badge ${estadoClase}">${pedido.estado_flujo}</span></td>
    `;
    tbody.appendChild(tr);
  });
}

// --- ¡FUNCIÓN MODIFICADA! ---
function setupSearch() {
  searchInput.addEventListener('input', () => {
    const searchTerm = searchInput.value.toLowerCase();
    
    const pedidosFiltrados = todoElHistorial.filter(pedido => {
      // Ahora también buscamos por teléfono
      return (pedido.nombre_cliente && pedido.nombre_cliente.toLowerCase().includes(searchTerm)) || 
             (pedido.folio && pedido.folio.toLowerCase().includes(searchTerm)) ||
             (pedido.telefono_cliente && pedido.telefono_cliente.includes(searchTerm));
    });
    
    renderizarHistorial(pedidosFiltrados);
  });
}

// --- ¡NUEVA FUNCIÓN! ---
function checkUrlParams() {
  const urlParams = new URLSearchParams(window.location.search);
  const busqueda = urlParams.get('search'); // Busca ?search=...

  if (busqueda) {
    // Si lo encuentra:
    // 1. Pone el valor en la barra de búsqueda
    searchInput.value = busqueda;
    
    // 2. Dispara un evento "input" para forzar al 'setupSearch' a filtrar
    searchInput.dispatchEvent(new Event('input'));
  }
}