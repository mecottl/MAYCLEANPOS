// frontend/src/new_order.js
import { buscarCliente, crearCliente, crearPedido } from './services/api.js';

// --- CONSTANTES DE PRECIOS ---
const PRECIO_POR_KG = 15;
const TARIFA_DOMICILIO_FIJA = 30;
const MIN_KG = 5;

let clienteSeleccionado = null;

document.addEventListener('DOMContentLoaded', () => {
  // --- SEGURIDAD ---
  const token = localStorage.getItem('lavander_token');
  if (!token) {
    window.location.href = 'index.html';
    return;
  }

  // --- NAVEGACIÓN ---
  setupNavigation();

  // --- 1. SELECCIONAR ELEMENTOS DEL DOM ---
  const form = document.querySelector('.orden-form');
  
  // Sección 1
  const inputBuscarTelefono = document.querySelector('#telefono-buscar');
  const btnBuscar = form.querySelector('.btn-secondary'); // Botón "Buscar"
  const btnMostrarNuevo = document.querySelector('#btn-mostrar-nuevo');
  const infoContainer = document.querySelector('#cliente-info-container');
  const infoNombre = document.querySelector('#cliente-nombre');
  const infoTelefono = document.querySelector('#cliente-telefono');
  const infoDireccion = document.querySelector('#cliente-direccion');
  
  // Sección 2
  const seccionNuevoCliente = document.querySelector('.nuevo-cliente-section');
  const inputNombreNuevo = document.querySelector('#nombre-completo');
  const inputTelefonoNuevo = document.querySelector('#telefono-nuevo');
  const inputDireccionNuevo = document.querySelector('#direccion-cliente');
  const btnGuardarCliente = seccionNuevoCliente.querySelector('.btn-secondary');

  // Sección 3 (Con lógica de precios nueva)
  const fieldsetPedido = document.querySelector('.pedido-fieldset');
  const inputKilos = document.querySelector('#input-kilos');
  const checkDomicilio = document.querySelector('#check-domicilio');
  const displayPrecioTotal = document.querySelector('#precio-total');

  
  // --- 2. FUNCIONES DE AYUDA (Helpers) ---
  
  const seleccionarCliente = (cliente) => {
    clienteSeleccionado = cliente; 
    infoNombre.textContent = cliente.nombre;
    infoTelefono.textContent = cliente.telefono;
    infoDireccion.textContent = cliente.direccion || 'N/A';
    infoContainer.classList.remove('oculto');
    seccionNuevoCliente.classList.add('oculto');
    fieldsetPedido.disabled = false;
  };

  const mostrarFormularioNuevoCliente = (telefonoBuscado = '') => {
    clienteSeleccionado = null; 
    infoContainer.classList.add('oculto'); 
    fieldsetPedido.disabled = true; 
    inputTelefonoNuevo.value = telefonoBuscado;
    seccionNuevoCliente.classList.remove('oculto');
    inputBuscarTelefono.value = '';
    inputNombreNuevo.focus();
  };

  // Calcula el total basado en kg y checkbox
  const actualizarTotal = () => {
    let kilos = parseFloat(inputKilos.value) || 0;
    
    // Forzamos el mínimo si el usuario escribe menos
    if (kilos > 0 && kilos < MIN_KG) {
        kilos = MIN_KG;
        inputKilos.value = MIN_KG;
    }

    const servicio = kilos * PRECIO_POR_KG;
    const domicilio = checkDomicilio.checked ? TARIFA_DOMICILIO_FIJA : 0;
    const total = servicio + domicilio;
    
    displayPrecioTotal.textContent = `$${total.toFixed(2)}`;
  };


  // --- 3. EVENT LISTENERS ---
  
  btnBuscar.addEventListener('click', async () => {
    const telefono = inputBuscarTelefono.value;
    if (!telefono) return;
    try {
      const data = await buscarCliente(telefono, token);
      seleccionarCliente(data.cliente);
    } catch (error) {
      console.warn(error.message);
      mostrarFormularioNuevoCliente(telefono);
    }
  });

  btnMostrarNuevo.addEventListener('click', () => {
    mostrarFormularioNuevoCliente(); 
  });

  btnGuardarCliente.addEventListener('click', async () => {
    const datosCliente = {
      nombre: inputNombreNuevo.value,
      telefono: inputTelefonoNuevo.value,
      direccion: inputDireccionNuevo.value,
    };
    if (!datosCliente.nombre || !datosCliente.telefono) {
      alert('Nombre y teléfono son requeridos');
      return;
    }
    try {
      const data = await crearCliente(datosCliente, token);
      seleccionarCliente(data.cliente);
    } catch (error) {
      alert(`Error al guardar cliente: ${error.message}`);
    }
  });

  // Escuchamos los nuevos inputs de precio
  inputKilos.addEventListener('input', actualizarTotal);
  checkDomicilio.addEventListener('change', actualizarTotal);
  
  // Calculamos el total inicial (5kg)
  actualizarTotal();

  // Formulario Principal "Crear Pedido"
  form.addEventListener('submit', async (event) => {
    event.preventDefault(); 
    if (!clienteSeleccionado) {
      alert('Debe seleccionar un cliente antes de crear un pedido.');
      return;
    }

    // Lógica de precios
    const kilos = parseFloat(inputKilos.value) || 0;
    if (kilos < MIN_KG) {
      alert(`El mínimo es de ${MIN_KG} kg.`);
      inputKilos.value = MIN_KG;
      actualizarTotal();
      return;
    }
    const precio_servicio = kilos * PRECIO_POR_KG;
    const tarifa_domicilio = checkDomicilio.checked ? TARIFA_DOMICILIO_FIJA : 0;

    const datosPedido = {
      cliente_id: clienteSeleccionado.id,
      precio_servicio: precio_servicio,
      tarifa_domicilio: tarifa_domicilio,
    };

    try {
      await crearPedido(datosPedido, token);
      alert('¡Pedido creado exitosamente!');
      window.location.href = 'dashboard.html';
    } catch (error) {
      alert(`Error al crear el pedido: ${error.message}`);
    }
  });
});

// --- FUNCIÓN DE NAVEGACIÓN (Corregida) ---
function setupNavigation() {
  document.querySelector('#nav-dashboard').addEventListener('click', (e) => { e.preventDefault(); window.location.href = 'dashboard.html'; });
  document.querySelector('#nav-crear-orden').addEventListener('click', (e) => e.preventDefault()); // Ya está aquí
  document.querySelector('#nav-clientes').addEventListener('click', (e) => { e.preventDefault(); window.location.href = 'gestion_clientes.html'; });
  document.querySelector('#nav-historial').addEventListener('click', (e) => { e.preventDefault(); window.location.href = 'historial_pedidos.html'; });
  document.querySelector('.logout').addEventListener('click', (e) => {
    e.preventDefault();
    localStorage.clear();
    window.location.href = 'index.html';
  });
  const contabilidadBtn = document.querySelector('#nav-contabilidad');
  if(contabilidadBtn) {
      contabilidadBtn.addEventListener('click', (e) => {
          e.preventDefault();
          alert('¡Página de Contabilidad en construcción!');
      });
  }
}