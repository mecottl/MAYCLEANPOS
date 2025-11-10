import { buscarCliente, crearCliente, crearPedido } from './services/api.js';
import { setupNavigation, setupRoles } from './services/navigation.js';
import { generarTicketWhatsApp } from './services/whatsapp.js';

const PRECIO_POR_KG = 18;
const TARIFA_DOMICILIO_FIJA = 20;
const MIN_KG = 5;
const MAX_KG_GRATIS = 10;
const PUNTOS_PARA_GRATIS = 9;

let clienteSeleccionado = null;

document.addEventListener('DOMContentLoaded', () => {
  const token = localStorage.getItem('lavander_token');
  if (!token) {
    window.location.href = 'index.html';
    return;
  }

  setupNavigation('#nav-crear-orden');
  setupRoles();

  const formPedido = document.querySelector('.orden-form');
  const inputBuscarTelefono = document.querySelector('#telefono-buscar');
  const btnBuscar = document.querySelector('.form-row-search .btn-secondary');
  const btnMostrarNuevo = document.querySelector('#btn-mostrar-nuevo');
  const infoContainer = document.querySelector('#cliente-info-container');
  const infoNombre = document.querySelector('#cliente-nombre');
  const infoTelefono = document.querySelector('#cliente-telefono');
  const infoDireccion = document.querySelector('#cliente-direccion');
  const seccionNuevoCliente = document.querySelector('.nuevo-cliente-section');
  const inputNombreNuevo = document.querySelector('#nombre-completo');
  const inputTelefonoNuevo = document.querySelector('#telefono-nuevo');
  const inputDireccionNuevo = document.querySelector('#direccion-cliente');
  const btnGuardarCliente = seccionNuevoCliente.querySelector('.btn-secondary');
  const fieldsetPedido = document.querySelector('.pedido-fieldset');
  const inputKilos = document.querySelector('#input-kilos');
  const checkDomicilio = document.querySelector('#check-domicilio');
  const displayPrecioTotal = document.querySelector('#precio-total');
  const checkPagado = document.querySelector('#check-pagado');

  const seleccionarCliente = (cliente) => {
    clienteSeleccionado = cliente;
    infoNombre.textContent = cliente.nombre;
    infoTelefono.textContent = cliente.telefono;
    infoDireccion.textContent = cliente.direccion || 'N/A';
    infoContainer.classList.remove('oculto');
    seccionNuevoCliente.classList.add('oculto');
    fieldsetPedido.disabled = false;
    actualizarTotal();
  };

  const mostrarFormularioNuevoCliente = (telefonoBuscado = '') => {
    clienteSeleccionado = null;
    infoContainer.classList.add('oculto');
    fieldsetPedido.disabled = true;
    inputTelefonoNuevo.value = telefonoBuscado;
    seccionNuevoCliente.classList.remove('oculto');
    inputBuscarTelefono.value = '';
    inputNombreNuevo.focus();
    actualizarTotal();
  };

  const actualizarTotal = () => {
    let kilos = parseFloat(inputKilos.value) || 0;
    const domicilio = checkDomicilio.checked ? TARIFA_DOMICILIO_FIJA : 0;

    let servicio = 0;
    let esPedidoGratis = false;
    let descuento = 0;

    const servicioBruto = kilos * PRECIO_POR_KG;

    if (clienteSeleccionado && clienteSeleccionado.contador_lealtad >= PUNTOS_PARA_GRATIS) {
      esPedidoGratis = true;
      if (kilos <= MAX_KG_GRATIS) {
        descuento = servicioBruto;
        servicio = 0;
      } else {
        descuento = MAX_KG_GRATIS * PRECIO_POR_KG;
        servicio = (kilos - MAX_KG_GRATIS) * PRECIO_POR_KG;
      }
    } else {
      servicio = servicioBruto;
    }

    const total = servicio + domicilio;
    if (esPedidoGratis) {
      displayPrecioTotal.innerHTML = `$${total.toFixed(2)} <span class="free-order-tag">(Descuento de $${descuento.toFixed(2)} aplicado)</span>`;
    } else {
      displayPrecioTotal.innerHTML = `$${total.toFixed(2)}`;
    }
  };

  const resetFormularioCompleto = () => {
    clienteSeleccionado = null;
    fieldsetPedido.disabled = true;
    infoContainer.classList.add('oculto');
    seccionNuevoCliente.classList.add('oculto');
    inputBuscarTelefono.value = '';
    inputKilos.value = MIN_KG;
    checkDomicilio.checked = false;
    checkPagado.checked = false;
    actualizarTotal();
  };

  btnBuscar.addEventListener('click', async () => {
    const telefono = inputBuscarTelefono.value;
    if (!telefono) return;
    try {
      const data = await buscarCliente(telefono, token);
      seleccionarCliente(data.cliente);
    } catch (error) {
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

  inputKilos.addEventListener('input', actualizarTotal);
  checkDomicilio.addEventListener('change', actualizarTotal);
  actualizarTotal();

  formPedido.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!clienteSeleccionado) {
      alert('Debe seleccionar un cliente antes de crear un pedido.');
      return;
    }

    const kilos = parseFloat(inputKilos.value) || 0;
    if (kilos < MIN_KG) {
      alert(`El mínimo es de ${MIN_KG} kg.`);
      inputKilos.value = MIN_KG;
      actualizarTotal();
      return;
    }

    const datosPedido = {
      cliente_id: clienteSeleccionado.id,
      kilos: kilos,
      es_domicilio: checkDomicilio.checked,
      estado_pago: checkPagado.checked ? 'Pagado' : 'Pendiente'
    };

    try {
      const data = await crearPedido(datosPedido, token);
      const pedidoCreado = data.pedido;

      const confirmacionWA = confirm(`${data.message}\n\n¿Deseas enviar el ticket por WhatsApp al cliente?`);

      if (confirmacionWA) {
        const esPedidoGratis = data.message.includes('gratis');

        if (esPedidoGratis) {
          clienteSeleccionado.contador_lealtad = 0;
        } else {
          clienteSeleccionado.contador_lealtad += 1;
        }

        const waLink = generarTicketWhatsApp(pedidoCreado, clienteSeleccionado, kilos, esPedidoGratis);
        window.open(waLink, '_blank');
      }

      alert('¡Pedido guardado! Listo para crear el siguiente.');
      resetFormularioCompleto();
    } catch (error) {
      alert(`Error al crear el pedido: ${error.message}`);
    }
  });
});
