// frontend/src/dashboard.js

// Importa las funciones necesarias desde la API
import { getDashboardPedidos, actualizarEstadoPedido } from './services/api.js';

// Espera a que el DOM (HTML) esté completamente cargado
document.addEventListener('DOMContentLoaded', () => {

  // --- 1. Elementos del DOM (Usando los IDs del nav) ---
  const pedidosListaContainer = document.querySelector('#pedidos-lista');
  const logoutButton = document.querySelector('.nav-link.logout');
  
  // Selectores de la barra lateral (Sidebar)
  const contabilidadButton = document.querySelector('#nav-contabilidad');
  const clientesButton = document.querySelector('#nav-clientes');
  const historialButton = document.querySelector('#nav-historial');
  const crearOrdenSidebarButton = document.querySelector('#nav-crear-orden');
  const dashboardSidebarButton = document.querySelector('#nav-dashboard');

  // Selector del botón principal en el contenido
  const crearOrdenMainButton = document.querySelector('#btn-crear-orden');


  // --- 2. Verificación de Seguridad ---
  const token = localStorage.getItem('lavander_token');
  const userString = localStorage.getItem('lavander_user');
  
  if (!token || !userString) { // Si falta el token O el usuario
    // Limpiamos por si acaso y redirigimos
    localStorage.removeItem('lavander_token');
    localStorage.removeItem('lavander_user');
    window.location.href = 'index.html';
    return; // Detenemos la ejecución
  }
  
  // Convertimos el string del usuario de vuelta a un objeto
  const user = JSON.parse(userString);

  
  // --- 3. Lógica de "Cerrar Sesión" ---
  logoutButton.addEventListener('click', (event) => {
    event.preventDefault(); 
    localStorage.removeItem('lavander_token');
    localStorage.removeItem('lavander_user');
    window.location.href = 'index.html';
  });

  
  // --- 4. Lógica de Roles ---
  const setupRoles = () => {
    if (user.rol !== 'admin') {
      // Si no es admin, oculta el botón de Contabilidad
      if (contabilidadButton) {
        contabilidadButton.style.display = 'none';
      }
    }
  };

  
  // --- 5. Navegación de Botones (Corregida con tus nombres de archivo) ---
  const setupNavigation = () => {
    
    // Botón principal en el contenido
    if (crearOrdenMainButton) {
      crearOrdenMainButton.addEventListener('click', () => {
        window.location.href = 'new_order.html'; // Corregido
      });
    }

    // --- Sidebar Links ---
    if (dashboardSidebarButton) {
        dashboardSidebarButton.addEventListener('click', (e) => e.preventDefault()); // Ya está aquí
    }
    if (crearOrdenSidebarButton) {
      crearOrdenSidebarButton.addEventListener('click', (e) => {
          e.preventDefault();
          window.location.href = 'new_order.html'; // Corregido
      });
    }
    if (clientesButton) {
      clientesButton.addEventListener('click', (e) => {
          e.preventDefault();
          window.location.href = 'gestion_clientes.html'; // Corregido
      });
    }
    if (historialButton) {
        historialButton.addEventListener('click', (e) => {
            e.preventDefault();
            window.location.href = 'historial_pedidos.html'; // Corregido
        });
    }
    if (contabilidadButton) {
        contabilidadButton.addEventListener('click', (e) => {
            e.preventDefault();
            alert('¡Página de Contabilidad en construcción!');
        });
    }
  };

  
  // --- 6. Función Principal: Cargar Pedidos ---
  const cargarPedidos = async () => {
    try {
      const pedidos = await getDashboardPedidos(token);
      pedidosListaContainer.innerHTML = ''; // Limpiamos

      if (pedidos.length === 0) {
        pedidosListaContainer.innerHTML = '<p>No hay pedidos en curso.</p>';
        return;
      }

      pedidos.forEach(pedido => {
        const tarjeta = crearTarjetaPedido(pedido);
        pedidosListaContainer.appendChild(tarjeta);
      });

    } catch (error) {
      console.error('Error al cargar pedidos:', error.message);
      if (error.message.includes('Token') || error.message.includes('inválido')) {
        // Token inválido o expirado, forzamos cierre de sesión
        localStorage.removeItem('lavander_token');
        localStorage.removeItem('lavander_user');
        window.location.href = 'index.html';
      } else {
        pedidosListaContainer.innerHTML = `<p class="error">Error al cargar pedidos: ${error.message}</p>`;
      }
    }
  };

  
  // --- 7. Función de Ayuda: Crear Tarjeta (Con botones de estado) ---
  const crearTarjetaPedido = (pedido) => {
    // Lógica de tiempo y colores
    const fechaCreacion = new Date(pedido.fecha_creacion);
    const ahora = new Date();
    const horasPasadas = (ahora.getTime() - fechaCreacion.getTime()) / 3600000;

    let estadoClase = '', estadoTexto = '';
    if (horasPasadas < 18) {
      estadoClase = 'estado-verde';
      estadoTexto = 'A Tiempo';
    } else if (horasPasadas >= 18 && horasPasadas < 24) {
      estadoClase = 'estado-amarillo';
      estadoTexto = 'Demorado';
    } else {
      estadoClase = 'estado-rojo';
      estadoTexto = 'Atrasado';
    }

    const tarjetaElement = document.createElement('div');
    tarjetaElement.className = `tarjeta-pedido ${estadoClase}`;

    const horaFormateada = fechaCreacion.toLocaleTimeString('es-MX', {
      hour: '2-digit', minute: '2-digit'
    });

    // Lógica de botones de estado
    let botonHtml = '';
    if (pedido.estado_flujo === 'En Proceso') {
      botonHtml = `<button 
                      class="btn-actualizar-estado btn-secondary-small"
                      data-folio="${pedido.folio}"
                      data-nuevo-estado="Listo">
                      Marcar como Listo
                   </button>`;
    } else if (pedido.estado_flujo === 'Listo') {
      botonHtml = `<button 
                      class="btn-actualizar-estado btn-primary-small"
                      data-folio="${pedido.folio}"
                      data-nuevo-estado="Entregado"
                      data-nuevo-pago="Pagado">
                      Entregar y Pagar
                   </button>`;
    }

    // Plantilla HTML de la tarjeta
    tarjetaElement.innerHTML = `
      <div class="tarjeta-header">
        <h4 class="cliente-nombre">${pedido.nombre_cliente}</h4>
        <span class="estado-badge">${estadoTexto}</span>
      </div>
      <div class="tarjeta-body">
        <p class="folio"><strong>Folio:</strong> ${pedido.folio.substring(0, 8)}...</p>
        <p class="hora"><strong>Hora:</strong> ${horaFormateada}</p>
      </div>
      <div class="tarjeta-footer">
        <span class="precio">$${Number(pedido.precio_total).toFixed(2)}</span>
        ${botonHtml} </div>
    `;
    
    return tarjetaElement;
  };

  
  // --- 8. ¡Iniciamos todo! ---
  setupRoles();
  setupNavigation(); 
  cargarPedidos();

  
  // --- 9. Event Listener Delegado (Para botones de estado) ---
  // Un solo "escuchador" en el contenedor principal
  pedidosListaContainer.addEventListener('click', async (event) => {
    
    // Verificamos si el clic fue en un botón de actualizar
    if (event.target.classList.contains('btn-actualizar-estado')) {
      const boton = event.target;
      
      // Obtenemos los datos que guardamos en los 'data-attributes'
      const folio = boton.dataset.folio;
      const nuevoEstado = boton.dataset.nuevoEstado;
      const nuevoPago = boton.dataset.nuevoPago; // Será 'Pagado' o 'undefined'

      // Construimos el objeto para enviar a la API
      const datosActualizados = {
        estado_flujo: nuevoEstado
      };
      if (nuevoPago) {
        datosActualizados.estado_pago = nuevoPago;
      }

      // Pedimos confirmación al usuario
      let confirmMessage = `¿Estás seguro de marcar este pedido como "${nuevoEstado}"?`;
      if (nuevoPago) {
          confirmMessage = `¿Confirmar entrega y pago del pedido? (Esto sumará +1 al contador de lealtad del cliente).`;
      }
      if (!confirm(confirmMessage)) {
          return; // Si el usuario cancela, no hacemos nada
      }

      try {
        // Deshabilitamos el botón para evitar doble clic
        boton.disabled = true;
        boton.textContent = 'Actualizando...';

        // Llamamos a la API
        await actualizarEstadoPedido(folio, datosActualizados, token);

        // ¡Éxito! Volvemos a cargar todos los pedidos
        // La tarjeta actualizada cambiará o desaparecerá (si se 'Entregó')
        await cargarPedidos();

      } catch (error) {
        alert(`Error al actualizar el pedido: ${error.message}`);
        // Si falla, el botón se volverá a habilitar en la próxima carga de pedidos
      }
    }
  });

});