// frontend/src/login.js
import { login } from './services/api.js';

// Espera a que el DOM (tu HTML) esté completamente cargado
document.addEventListener('DOMContentLoaded', () => {
  
  // 1. Seleccionamos los elementos del HTML por sus clases e IDs
  const loginForm = document.querySelector('.login-form');
  const emailInput = document.querySelector('#email');
  const passwordInput = document.querySelector('#password');
  const errorElement = document.querySelector('#login-error');

  // Si no encuentra el formulario, no hace nada
  if (!loginForm) return;

  // 2. Añadimos el "escuchador" al formulario
  loginForm.addEventListener('submit', async (event) => {
    // Evitamos que la página se recargue (comportamiento por defecto del form)
    event.preventDefault(); 
    
    // Obtenemos los valores de los inputs
    const email = emailInput.value;
    const password = passwordInput.value;

    try {
      // 3. Llamamos a nuestra función de API (de api.js)
      const data = await login(email, password);

      // 4. ¡Éxito! Guardamos el token en localStorage
      // localStorage es una mini-base de datos en el navegador
      localStorage.setItem('lavander_token', data.token);
      
      // Guardamos también el usuario (lo necesitaremos en el dashboard)
      localStorage.setItem('lavander_user', JSON.stringify(data.user));

      // 5. Redirigimos al dashboard
      window.location.href = 'dashboard.html';

    } catch (error) {
      // 6. Si hay un error (ej. credenciales inválidas)
      // mostramos el mensaje de error que nos dio el backend.
      errorElement.textContent = error.message;
      // (Opcional) Añade una clase para que se vea (si v0 lo ocultó)
      errorElement.classList.add('visible'); 
    }
  });
});