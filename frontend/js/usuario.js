// Página del usuario: solo ve sus propias hojas, sin la columna de puntos

import { misHojas } from './api.js';
import { protegerPagina } from './sesion.js';
import { aviso, mostrarHojas } from './vista-hojas.js';

const usuario = protegerPagina('usuario');

if (usuario) {
  const contenedor = document.getElementById('mis-hojas');
  document.getElementById('saludo').textContent = `Hola, ${usuario.nombre}`;

  try {
    mostrarHojas(contenedor, await misHojas(), { conPuntos: false });
  } catch (err) {
    aviso(contenedor, err.message);
  }
}
