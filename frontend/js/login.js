// Página de inicio de sesión

import { iniciarSesion, MODO_PRUEBA, usuarioActual } from './api.js';
import { paginaDeInicio } from './sesion.js';

const formulario = document.getElementById('login');
const campoUsuario = document.getElementById('usuario');
const campoContrasena = document.getElementById('contrasena');
const boton = document.getElementById('entrar');
const error = document.getElementById('login-error');

// Si ya tenía sesión, no tiene que volver a entrar
const actual = usuarioActual();
if (actual) location.replace(paginaDeInicio(actual));

if (MODO_PRUEBA) document.getElementById('aviso-prueba').hidden = false;

formulario.addEventListener('submit', async e => {
  e.preventDefault();
  error.textContent = '';
  boton.disabled = true;
  boton.textContent = 'Entrando…';

  try {
    const usuario = await iniciarSesion(campoUsuario.value.trim(), campoContrasena.value);
    location.replace(paginaDeInicio(usuario));
  } catch (err) {
    error.textContent = err.message;
    campoContrasena.value = '';
    campoContrasena.focus();
  } finally {
    boton.disabled = false;
    boton.textContent = 'Entrar';
  }
});
