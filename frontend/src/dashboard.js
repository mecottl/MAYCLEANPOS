import {
  getDashboardPedidos,
  actualizarEstadoPedido,
  toggleDomicilio,
  buscarCliente
} from './services/api.js';

import { setupNavigation, setupRoles } from './services/navigation.js';
import { generarAvisoListo, generarTicketReenvio } from './services/whatsapp.js';

const PUNTOS_PARA_GRATIS = 9;

document.addEventListener('DOMContentLoaded', () => {
  const pedidosTbody = document.querySelector('#pedidos-lista-body');
  const token = localStorage.getItem('lavander_token');
  const userString = localStorage.getItem('lavander_user');

  if (!token || !userString) {
    localStorage.clear();
    window.location.href = 'index.html';
    return;
  }

  setupNavigation('#nav-dashboard');
  setupRoles();
  cargarPedidos();

  window.addEventListener('click', (event) => {
    if (!event.target.closest('.acciones-container')) {
      document.querySelectorAll('.acciones-menu.visible').forEach(menu => {
        menu.classList.remove('visible');
      });
    }
  });

  async function cargarPedidos() {
    try {
      const pedidos = await getDashboardPedidos(token);
      pedidosTbody.innerHTML = '';

      if (pedidos.length === 0) {
        pedidosTbody.innerHTML = '<tr><td colspan="6">No hay pedidos en curso. ¡Buen trabajo!</td></tr>';
        return;
      }
      pedidos.forEach(pedido => {
        pedidosTbody.appendChild(crearFilaPedido(pedido));
      });
    } catch (error) {
      console.error('Error al cargar pedidos:', error.message);
      pedidosTbody.innerHTML = `<tr><td colspan="6" class="error">Error al cargar pedidos: ${error.message}</td></tr>`;
    }
  }

  function crearFilaPedido(pedido) {
    const tr = document.createElement('tr');
    const fechaCreacion = new Date(pedido.fecha_creacion);
    const fechaEntregaMax = new Date(fechaCreacion.getTime() + 24 * 60 * 60 * 1000);
    const ahora = new Date();
    const horasPasadas = (ahora.getTime() - fechaCreacion.getTime()) / 3600000;
    let estadoTiempoTag = '';
    if (horasPasadas < 18) {
      estadoTiempoTag = `<span class="estado-badge estado-entregado">A Tiempo</span>`;
    } else if (horasPasadas >= 18 && horasPasadas < 24) {
      estadoTiempoTag = `<span class="estado-badge estado-pendiente">Demorado</span>`;
    } else {
      estadoTiempoTag = `<span class="estado-badge estado-cancelado">Atrasado</span>`;
    }
    const formatFechaHora = (fecha) => `${fecha.toLocaleDateString('es-MX')} ${fecha.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}`;
    const formatMoneda = (valor) => valor ? `$${Number(valor).toFixed(2)}` : '$0.00';
    let estadoFlujoTag = '';
    if (pedido.estado_flujo === 'En Proceso') {
      estadoFlujoTag = `<span class="estado-badge estado-pendiente">En Proceso</span>`;
    } else if (pedido.estado_flujo === 'Listo') {
      estadoFlujoTag = `<span class="estado-badge estado-entregado">Listo</span>`;
    }
    const estadoPagoTag = pedido.estado_pago === 'Pagado' ? `<span class="estado-badge estado-entregado">Pagado</span>` : `<span class="estado-badge estado-pendiente">Pendiente</span>`;
    const domicilioTag = pedido.es_domicilio ? `<span class="estado-badge tag-domicilio">Domicilio</span>` : '';

    let botonesMenu = '';
    if (pedido.estado_flujo === 'En Proceso') {
      botonesMenu += `<button class="btn-actualizar-estado" data-folio="${pedido.folio}" data-nuevo-estado="Listo">Marcar Listo</button>`;
    } else if (pedido.estado_flujo === 'Listo') {
      botonesMenu += `<button class="btn-actualizar-estado" data-folio="${pedido.folio}" data-nuevo-estado="Entregado" data-nuevo-pago="Pagado">Entregar y Pagar</button>`;
      if (pedido.telefono_cliente) {
        botonesMenu += `<button class="btn-avisar-listo" data-folio="${pedido.folio}" data-telefono="${pedido.telefono_cliente}" data-nombre="${pedido.nombre_cliente}">Avisar (WhatsApp)</button>`;
      }
    }
    if (pedido.es_domicilio) {
      botonesMenu += `<button class="btn-toggle-domicilio danger" data-folio="${pedido.folio}" data-accion="quitar">Quitar Domicilio</button>`;
    } else {
      botonesMenu += `<button class="btn-toggle-domicilio" data-folio="${pedido.folio}" data-accion="agregar">Agregar Domicilio</button>`;
    }

    botonesMenu += `<button 
                      class="btn-reenviar-ticket" 
                      data-folio="${pedido.folio}" 
                      data-telefono="${pedido.telefono_cliente}" 
                      data-kilos="${pedido.kilos}"
                    >Reenviar Ticket (WA)</button>`;

    if (pedido.estado_flujo !== 'Listo') {
      botonesMenu += `<button class="btn-actualizar-estado danger" data-folio="${pedido.folio}" data-nuevo-estado="Cancelado">Cancelar Pedido</button>`;
    }

    tr.innerHTML = `
   <td data-label="Cliente">
    <strong>${pedido.nombre_cliente}</strong>
    <small>${pedido.numero_pedido || pedido.folio.substring(0, 8)}</small>
   </td>
   <td data-label="Hora Pedido">${formatFechaHora(fechaCreacion)}</td>
   <td data-label="Entrega Máx.">${formatFechaHora(fechaEntregaMax)}</td>
   <td data-label="Total">
    <strong class="precio-total-tabla">${formatMoneda(pedido.precio_total)}</strong>
   </td>
   <td data-label="Estado">
    <div class="tags-container">
     <div>${estadoFlujoTag}</div>
     <div>${estadoPagoTag}</div>
     <div>${estadoTiempoTag}</div>
     <div>${domicilioTag}</div>
    </div>
   </td>
   <td data-label="Acciones">
    <div class="acciones-container">
     <button class="btn-acciones-toggle">Acciones</button>
     <div class="acciones-menu">
      ${botonesMenu}
     </div>
    </div>
   </td>
  `;

    return tr;
  }

  pedidosTbody.addEventListener('click', async (event) => {
    const boton = event.target.closest('button');
    if (!boton) return;
    event.stopPropagation();

    if (boton.classList.contains('btn-acciones-toggle')) {
      const menu = boton.nextElementSibling;
      document.querySelectorAll('.acciones-menu.visible').forEach(m => {
        if (m !== menu) m.classList.remove('visible');
      });
      menu.classList.toggle('visible');
      return;
    }

    const folio = boton.dataset.folio;
    if (!folio) return;

    boton.closest('.acciones-menu')?.classList.remove('visible');

    if (boton.classList.contains('btn-actualizar-estado')) {
      const nuevoEstado = boton.dataset.nuevoEstado;
      const nuevoPago = boton.dataset.nuevoPago;
      let datosActualizados = { estado_flujo: nuevoEstado };
      if (nuevoPago) datosActualizados.estado_pago = nuevoPago;

      let confirmMessage = `¿Marcar pedido como "${nuevoEstado}"?`;
      if (nuevoEstado === 'Entregado') confirmMessage = `¿Confirmar entrega y pago? (El contador de lealtad ya sumó al crear).`;
      if (nuevoEstado === 'Cancelado') confirmMessage = `¿ESTÁS SEGURO DE CANCELAR ESTE PEDIDO?`;

      if (!confirm(confirmMessage)) return;

      try {
        boton.disabled = true;
        boton.textContent = '...';
        await actualizarEstadoPedido(folio, datosActualizados, token);
        await cargarPedidos();
      } catch (error) {
        alert(`Error: ${error.message}`);
        boton.disabled = false;
      }
    }

    else if (boton.classList.contains('btn-toggle-domicilio')) {
      const accion = boton.dataset.accion;
      const esDomicilio = (accion === 'agregar');
      const confirmMessage = esDomicilio ? `¿Añadir servicio a domicilio por $30.00?` : `¿Quitar servicio a domicilio y restar $30.00?`;

      if (!confirm(confirmMessage)) return;

      try {
        boton.disabled = true;
        boton.textContent = '...';
        await toggleDomicilio(folio, esDomicilio, token);
        await cargarPedidos();
      } catch (error) {
        alert(`Error: ${error.message}`);
        boton.disabled = false;
      }
    }

    else if (boton.classList.contains('btn-avisar-listo')) {
      const pedido = {
        nombre_cliente: boton.dataset.nombre,
        telefono_cliente: boton.dataset.telefono
      };
      const waLink = generarAvisoListo(pedido);
      window.open(waLink, '_blank');
    }

    else if (boton.classList.contains('btn-reenviar-ticket')) {
      const waTab = window.open('', '_blank');
      waTab.document.write('Buscando datos del pedido y cliente...');

      try {
        const telefono = boton.dataset.telefono;
        const kilos = boton.dataset.kilos;
        let cliente = null;
        try {
          const dataCliente = await buscarCliente(telefono, token);
          cliente = dataCliente.cliente;
          cliente.contador_lealtad = cliente.contador_lealtad ?? 0;
        } catch (e) {
          console.error("No se pudo encontrar el cliente para el ticket:", e.message);
          cliente = { contador_lealtad: 0 };
        }

        const pedido = (await getDashboardPedidos(token)).find(p => p.folio === folio);
        if (!pedido) {
          waTab.close();
          throw new Error("No se encontró el pedido.");
        }

        const waLink = generarTicketReenvio(pedido, cliente, kilos);
        waTab.location.href = waLink;
      } catch (error) {
        waTab.close();
        alert("Error al generar el ticket: " + error.message);
      }
    }
  });
});
