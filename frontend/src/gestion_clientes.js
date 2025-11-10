import { getClientes, deleteCliente, updateCliente } from './services/api.js';
import { setupNavigation, setupRoles } from './services/navigation.js';

let todosLosClientes = [];
const token = localStorage.getItem('lavander_token');

const modalBackdrop = document.querySelector('#modal-backdrop');
const editModal = document.querySelector('#edit-modal');
const editForm = document.querySelector('#edit-form');
const closeModalBtn = document.querySelector('#modal-close-btn');
const cancelModalBtn = document.querySelector('#modal-cancel-btn');
const saveModalBtn = document.querySelector('#modal-save-btn');
const editNombre = document.querySelector('#modal-nombre');
const editTelefono = document.querySelector('#modal-telefono');
const editDireccion = document.querySelector('#modal-direccion');
let clienteIdActual = null;

document.addEventListener('DOMContentLoaded', () => {
  if (!token) {
    window.location.href = 'index.html';
    return;
  }

  setupNavigation('#nav-clientes');
  setupRoles();

  cargarClientes();
  setupSearch();
  setupEventListeners();
});

async function cargarClientes() {
  const tbody = document.querySelector('#lista-clientes-body');
  tbody.innerHTML = '<tr><td colspan="6">Cargando clientes...</td></tr>';

  try {
    todosLosClientes = await getClientes(token);
    renderizarClientes(todosLosClientes);
  } catch (error) {
    console.error('Error de API:', error.message);
    tbody.innerHTML = `<tr><td colspan="6" class="error">Error al cargar clientes: ${error.message}</td></tr>`;
  }
}

function renderizarClientes(clientes) {
  const tbody = document.querySelector('#lista-clientes-body');
  tbody.innerHTML = '';

  if (clientes.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7">No se encontraron clientes.</td></tr>';
    return;
  }

  clientes.forEach(cliente => {
    const tr = document.createElement('tr');

    // 🔹 Menú de acciones igual que dashboard
    tr.innerHTML = `
      <td>${cliente.nombre}</td>
      <td>${cliente.telefono}</td>
      <td>${cliente.direccion || 'N/A'}</td>
      <td>${cliente.contador_lealtad} / 10</td>
      <td>${cliente.pedidos_totales}</td>
      <td>${cliente.pedidos_gratis_contador}</td>
      <td class="acciones">
        <button class="btn-acciones-toggle">Acciones</button>
        <div class="acciones-menu">
          <a href="historial_pedidos.html?search=${cliente.telefono}" class="btn-accion btn-ver">Ver Historial</a>
          <button class="btn-accion btn-editar" data-id="${cliente.id}">Editar</button>
          <button class="btn-accion btn-eliminar danger" data-id="${cliente.id}" data-nombre="${cliente.nombre}">Eliminar</button>
        </div>
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

function setupEventListeners() {
  const tbody = document.querySelector('#lista-clientes-body');

  // 🔹 Control de apertura/cierre del menú de acciones
  document.addEventListener('click', (e) => {
    const toggle = e.target.closest('.btn-acciones-toggle');
    const menus = document.querySelectorAll('.acciones-menu');
    menus.forEach(menu => menu.classList.remove('visible'));

    if (toggle) {
      const menu = toggle.nextElementSibling;
      menu.classList.toggle('visible');
      e.stopPropagation();
    }
  });

  // 🔹 Delegación de eventos dentro de la tabla
  tbody.addEventListener('click', async (event) => {
    const btnEliminar = event.target.closest('.btn-eliminar');
    const btnEditar = event.target.closest('.btn-editar');

    if (btnEliminar) {
      const clienteId = btnEliminar.dataset.id;
      const clienteNombre = btnEliminar.dataset.nombre;

      if (!confirm(`¿Estás seguro de que deseas eliminar a ${clienteNombre}?`)) return;

      try {
        btnEliminar.disabled = true;
        await deleteCliente(clienteId, token);
        await cargarClientes();
      } catch (error) {
        alert(`Error al eliminar: ${error.message}`);
        btnEliminar.disabled = false;
      }
    }

    if (btnEditar) {
      const clienteId = btnEditar.dataset.id;
      const cliente = todosLosClientes.find(c => c.id === clienteId);
      if (cliente) openEditModal(cliente);
    }
  });

  saveModalBtn?.addEventListener('click', async () => {
    saveModalBtn.disabled = true;
    saveModalBtn.textContent = 'Guardando...';

    const datosCliente = {
      nombre: editNombre.value,
      telefono: editTelefono.value,
      direccion: editDireccion.value,
    };

    try {
      await updateCliente(clienteIdActual, datosCliente, token);
      closeEditModal();
      await cargarClientes();
    } catch (error) {
      alert(`Error al actualizar: ${error.message}`);
      saveModalBtn.disabled = false;
      saveModalBtn.textContent = 'Guardar Cambios';
    }
  });

  closeModalBtn?.addEventListener('click', closeEditModal);
  cancelModalBtn?.addEventListener('click', closeEditModal);
  modalBackdrop?.addEventListener('click', closeEditModal);
}

function openEditModal(cliente) {
  clienteIdActual = cliente.id;
  editNombre.value = cliente.nombre;
  editTelefono.value = cliente.telefono;
  editDireccion.value = cliente.direccion || '';
  modalBackdrop?.classList.remove('oculto');
  editModal?.classList.remove('oculto');
}

function closeEditModal() {
  modalBackdrop?.classList.add('oculto');
  editModal?.classList.add('oculto');
  saveModalBtn.disabled = false;
  saveModalBtn.textContent = 'Guardar Cambios';
}
