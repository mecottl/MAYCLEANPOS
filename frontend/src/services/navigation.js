// frontend/src/services/navigation.js

/**
 * Configura los event listeners para la barra de navegación lateral.
 * @param {string} currentPageId - El ID del enlace que debe estar 'active' (ej: '#nav-dashboard').
 */
export function setupNavigation(currentPageId = '') {
  
  // Define todos los enlaces de navegación
  const navLinks = {
    '#nav-dashboard': 'dashboard.html',
    '#nav-crear-orden': 'new_order.html',
    '#nav-clientes': 'gestion_clientes.html',
    '#nav-historial': 'historial_pedidos.html'
  };

  // Asigna los listeners
  for (const [id, url] of Object.entries(navLinks)) {
    const link = document.querySelector(id);
    if (link) {
      if (id === currentPageId) {
        // Estamos en la página actual, la marcamos como activa
        link.classList.add('active');
        link.addEventListener('click', (e) => e.preventDefault());
      } else {
        // No estamos en esta página, la marcamos como inactiva y le damos el enlace
        link.classList.remove('active');
        link.addEventListener('click', (e) => {
          e.preventDefault();
          window.location.href = url;
        });
      }
    }
  }

  // Lógica de Contabilidad
  const contabilidadBtn = document.querySelector('#nav-contabilidad');
  if(contabilidadBtn) {
    contabilidadBtn.addEventListener('click', (e) => {
      e.preventDefault();
      alert('¡Página de Contabilidad en construcción!');
    });
  }

  // Lógica de Logout
  const logoutBtn = document.querySelector('.logout');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', (e) => {
      e.preventDefault();
      localStorage.clear();
      window.location.href = 'index.html';
    });
  }
}

/**
 * Oculta enlaces de la barra lateral según el rol del usuario.
 */
export function setupRoles() {
  const userString = localStorage.getItem('lavander_user');
  if (!userString) return;
  
  const user = JSON.parse(userString);
  if (user.rol !== 'admin') {
    // Oculta Contabilidad (y futura gestión de empleados)
    const contabilidadBtn = document.querySelector('#nav-contabilidad');
    if (contabilidadBtn) contabilidadBtn.style.display = 'none';
  }
}