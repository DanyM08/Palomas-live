// Protege las páginas: si no hay sesión, o el rol no es el correcto, manda a otra página.
// OJO: esto solo cuida la pantalla. Quien de verdad protege los datos es el backend.

import { cerrarSesion, usuarioActual } from './api.js';

export function paginaDeInicio(usuario) {
  return usuario.rol === 'admin' ? 'admin.html' : 'usuario.html';
}

// Regresa el usuario si puede estar aquí, o null si se le está redirigiendo
export function protegerPagina(rol) {
  const usuario = usuarioActual();

  if (!usuario) {
    location.replace('index.html');
    return null;
  }
  if (usuario.rol !== rol) {
    location.replace(paginaDeInicio(usuario));
    return null;
  }

  document.getElementById('usuario-nombre').textContent = usuario.nombre;
  document.getElementById('salir').addEventListener('click', () => {
    cerrarSesion();
    location.replace('index.html');
  });
  document.body.classList.remove('cargando');
  return usuario;
}
