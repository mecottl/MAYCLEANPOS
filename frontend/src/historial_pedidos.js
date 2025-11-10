// frontend/src/historial_pedidos.js
import { getHistorialPedidos } from './services/api.js';
// --- ¡NUEVAS IMPORTACIONES! ---
import { setupNavigation, setupRoles } from './services/navigation.js';

let todoElHistorial = [];
const token = localStorage.getItem('lavander_token');
let searchInput;
let filtroFechaSelect;

// --- NAVEGACIÓN Y SEGURIDAD (REFACTORIZADO) ---
document.addEventListener('DOMContentLoaded', () => {
  if (!token) {
    window.location.href = 'index.html';
    return;
  }

  // --- ¡LLAMADAS A MÓDULOS IMPORTADOS! ---
  setupNavigation('#nav-historial'); // Pasa el ID de la página actual
  setupRoles();

  // 1. Asigna los inputs
  searchInput = document.querySelector('#buscar-historial');
  filtroFechaSelect = document.querySelector('#filtro-fecha');

  // 2. Configura los listeners
  setupSearch();
  setupDateFilter();

  // 3. Carga los datos
  cargarHistorial();
});

// --- ¡LA FUNCIÓN 'setupNavigation()' LOCAL SE ELIMINA DE AQUÍ! ---


// --- LÓGICA DE LA PÁGINA ---

// Carga los datos desde la API basado en el filtro de fecha
async function cargarHistorial() {
  const rango = filtroFechaSelect.value;
  const tbody = document.querySelector('#lista-historial-body');
  tbody.innerHTML = '<tr><td colspan="8">Cargando historial...</td></tr>';

  try {
    todoElHistorial = await getHistorialPedidos(token, rango);
    renderizarHistorial(todoElHistorial);
    checkUrlParams();

  } catch (error) {
    tbody.innerHTML = `<tr><td colspan="8" class="error">Error al cargar historial: ${error.message}</td></tr>`;
  }
}

// Pinta los datos en la tabla
function renderizarHistorial(pedidos) {
  const tbody = document.querySelector('#lista-historial-body');
  tbody.innerHTML = '';

  if (pedidos.length === 0) {
    tbody.innerHTML = '<tr><td colspan="8">No se encontraron pedidos.</td></tr>';
    return;
  }

  pedidos.forEach(pedido => {
    const tr = document.createElement('tr');

    // --- Funciones Helper para formatear ---
    const formatFecha = (fecha) => {
      return fecha ? new Date(fecha).toLocaleDateString('es-MX') : 'N/A';
    };
    const formatMoneda = (valor) => valor ? `$${Number(valor).toFixed(2)}` : '$0.00';
    const formatEstado = (estado, claseBase) => {
      // Ajusta las clases según tu CSS
      let clase = '';
      if (estado === 'Pagado' || estado === 'Entregado') {
        clase = 'estado-entregado';
      } else if (estado === 'Cancelado') {
        clase = 'estado-cancelado';
      } else {
        clase = 'estado-pendiente';
      }
      return `<span class="estado-badge ${clase}">${estado}</span>`;
    };
    const formatDomicilio = (esDomicilio) => {
      return esDomicilio ? 'Sí' : 'No';
    };
    tr.innerHTML = `
   <td>${pedido.numero_pedido}...</td>
   <td>${pedido.nombre_cliente}</td>
   <td>${formatFecha(pedido.fecha_creacion)}</td>
   <td>${formatFecha(pedido.fecha_entrega)}</td>
   <td>${formatDomicilio(pedido.es_domicilio)}</td>
   <td><strong>${formatMoneda(pedido.precio_total)}</strong></td>
   <td>${formatEstado(pedido.estado_pago)}</td>
   <td>${formatEstado(pedido.estado_flujo)}</td>
  `;
    tbody.appendChild(tr);
  });
}

function setupSearch() {
  searchInput.addEventListener('input', () => {
    const searchTerm = searchInput.value.toLowerCase();

    const pedidosFiltrados = todoElHistorial.filter(pedido => {
      return (pedido.nombre_cliente && pedido.nombre_cliente.toLowerCase().includes(searchTerm)) ||
        (pedido.folio && pedido.folio.toLowerCase().includes(searchTerm)) ||
        (pedido.telefono_cliente && pedido.telefono_cliente.includes(searchTerm));
    });

    renderizarHistorial(pedidosFiltrados);
  });
}

// Configura el filtro de fecha
function setupDateFilter() {
  filtroFechaSelect.addEventListener('change', () => {
    cargarHistorial();
  });
}

// Revisa si la URL tiene un ?search=...
function checkUrlParams() {
  const urlParams = new URLSearchParams(window.location.search);
  const busqueda = urlParams.get('search');

  if (busqueda) {
    searchInput.value = busqueda;
    searchInput.dispatchEvent(new Event('input'));
  }
}