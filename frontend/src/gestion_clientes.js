// frontend/src/gestion_clientes.js
import { getClientes, deleteCliente, updateCliente } from './services/api.js';

let todosLosClientes = [];
const token = localStorage.getItem('lavander_token');

// --- Elementos del Modal (IDs de tu HTML de v0) ---
const modalBackdrop = document.querySelector('#modal-backdrop');
const editModal = document.querySelector('#edit-modal');
const editForm = document.querySelector('#edit-form');
const closeModalBtn = document.querySelector('#modal-close-btn');
const cancelModalBtn = document.querySelector('#modal-cancel-btn');
const saveModalBtn = document.querySelector('#modal-save-btn');

// Inputs del formulario del modal
const editNombre = document.querySelector('#modal-nombre');
const editTelefono = document.querySelector('#modal-telefono');
const editDireccion = document.querySelector('#modal-direccion');

// Input oculto para guardar el ID del cliente
let clienteIdActual = null;


// --- NAVEGACIÓN Y SEGURIDAD ---
document.addEventListener('DOMContentLoaded', () => {
  if (!token) {
    window.location.href = 'index.html';
    return;
  }
  
  setupNavigation();
  cargarClientes();
  setupSearch();
  setupEventListeners(); // <-- Esta línea es la que activa los botones
});

function setupNavigation() {
  // Asigna los listeners a CADA enlace de la sidebar
  document.querySelector('#nav-dashboard').addEventListener('click', (e) => { e.preventDefault(); window.location.href = 'dashboard.html'; });
  document.querySelector('#nav-crear-orden').addEventListener('click', (e) => { e.preventDefault(); window.location.href = 'new_order.html'; });
  document.querySelector('#nav-clientes').addEventListener('click', (e) => e.preventDefault()); // Ya está aquí
  document.querySelector('#nav-historial').addEventListener('click', (e) => { e.preventDefault(); window.location.href = 'historial_pedidos.html'; });
  document.querySelector('.logout').addEventListener('click', (e) => {
    e.preventDefault();
    localStorage.clear();
    window.location.href = 'index.html';
  });
  
  const contabilidadBtn = document.querySelector('#nav-contabilidad');
  if (contabilidadBtn) {
    contabilidadBtn.addEventListener('click', (e) => {
      e.preventDefault();
      alert('¡Página de Contabilidad en construcción!');
    });
  }
}
// --- FIN DE NAVEGACIÓN ---


// --- LÓGICA DE LA PÁGINA ---
async function cargarClientes() {
  const tbody = document.querySelector('#lista-clientes-body');
  tbody.innerHTML = '<tr><td colspan="5">Cargando clientes...</td></tr>'; // 5 columnas

  try {
    todosLosClientes = await getClientes(token);
    renderizarClientes(todosLosClientes);
  } catch (error) {
    console.error('Error de API:', error.message);
    tbody.innerHTML = `<tr><td colspan="5" class="error">Error al cargar clientes: ${error.message}</td></tr>`;
  }
}

function renderizarClientes(clientes) {
  const tbody = document.querySelector('#lista-clientes-body');
  tbody.innerHTML = ''; 

  if (clientes.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5">No se encontraron clientes.</td></tr>';
    return;
  }

  clientes.forEach(cliente => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${cliente.nombre}</td>
      <td>${cliente.telefono}</td>
      <td>${cliente.direccion || 'N/A'}</td>
      <td>${cliente.contador_servicios}</td>
      <td class="acciones">
        <a href="historial_pedidos.html?search=${cliente.telefono}" class="btn-accion btn-ver">
          Historial
        </a>
        <button 
          class="btn-accion btn-editar" 
          data-id="${cliente.id}">
          Editar
        </button>
        <button 
          class="btn-accion btn-eliminar" 
          data-id="${cliente.id}" 
          data-nombre="${cliente.nombre}">
          Eliminar
        </button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function setupSearch() {
  const searchInput = document.querySelector('#buscar-cliente');
  searchInput.addEventListener('input', (e) => {
    const searchTerm = e.target.value.toLowerCase();
    const clientesFiltrados = todosLosClientes.filter(cliente => {
      return cliente.nombre.toLowerCase().includes(searchTerm) || 
             cliente.telefono.toLowerCase().includes(searchTerm);
    });
    renderizarClientes(clientesFiltrados);
  });
}


// --- FUNCIONES PARA EL MODAL Y EVENTOS ---
function setupEventListeners() {
  const tbody = document.querySelector('#lista-clientes-body');

  // Listener delegado para los botones "Eliminar" y "Editar"
  tbody.addEventListener('click', async (event) => {
    
    // --- Lógica de Eliminar ---
    if (event.target.classList.contains('btn-eliminar')) {
      const boton = event.target;
      const clienteId = boton.dataset.id;
      const clienteNombre = boton.dataset.nombre;

      if (!confirm(`¿Estás seguro de que deseas eliminar a ${clienteNombre}?`)) return;

      try {
        boton.disabled = true;
        await deleteCliente(clienteId, token);
        await cargarClientes(); // Recarga la tabla
      } catch (error) {
        alert(`Error al eliminar: ${error.message}`);
        boton.disabled = false;
      }
    }

    // --- Lógica de Editar ---
    if (event.target.classList.contains('btn-editar')) {
      const boton = event.target;
      const clienteId = boton.dataset.id;
      
      const cliente = todosLosClientes.find(c => c.id === clienteId);
      if (cliente) {
        openEditModal(cliente);
      }
    }
  });

  // Listener para el botón de "Guardar" del modal
  saveModalBtn?.addEventListener('click', async () => {
    
    saveModalBtn.disabled = true;
    saveModalBtn.textContent = 'Guardando...';

    // Obtenemos el ID guardado y los nuevos datos
    const clienteId = clienteIdActual;
    const datosCliente = {
      nombre: editNombre.value,
      telefono: editTelefono.value,
      direccion: editDireccion.value,
    };

    try {
      await updateCliente(clienteId, datosCliente, token);
      closeEditModal();
      await cargarClientes(); // Recarga la tabla
    } catch (error) {
      alert(`Error al actualizar: ${error.message}`);
      saveModalBtn.disabled = false;
      saveModalBtn.textContent = 'Guardar Cambios';
    }
  });

  // Listeners para cerrar el modal
  closeModalBtn?.addEventListener('click', closeEditModal);
  cancelModalBtn?.addEventListener('click', closeEditModal);
  modalBackdrop?.addEventListener('click', closeEditModal);
}

function openEditModal(cliente) {
  // Rellena el formulario del modal con los datos del cliente
  clienteIdActual = cliente.id; // Guardamos el ID
  editNombre.value = cliente.nombre;
  editTelefono.value = cliente.telefono;
  editDireccion.value = cliente.direccion || '';
  
  // Muestra el modal
  modalBackdrop?.classList.remove('oculto');
  editModal?.classList.remove('oculto');
}

function closeEditModal() {
  // Oculta el modal
  modalBackdrop?.classList.add('oculto');
  editModal?.classList.add('oculto');
  
  // Resetea el botón de guardar
  if (saveModalBtn) {
      saveModalBtn.disabled = false;
      saveModalBtn.textContent = 'Guardar Cambios';
  }
}