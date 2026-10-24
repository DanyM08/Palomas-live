// Página del admin: arranca cada pestaña y cambia entre ellas

import { protegerPagina } from './sesion.js';
import { actualizarJugadores } from './admin/jugadores.js';
import * as captura from './admin/captura.js';
import * as hojas from './admin/hojas.js';
import * as comisiones from './admin/comisiones.js';
import * as usuarios from './admin/usuarios.js';

const modulos = { captura, hojas, comisiones, usuarios };

if (protegerPagina('admin')) {
  Object.values(modulos).forEach(m => m.iniciar());
  actualizarJugadores();

  const pestanas = document.querySelectorAll('.pestana');
  const secciones = document.querySelectorAll('.seccion');

  pestanas.forEach(boton => {
    boton.addEventListener('click', () => {
      const elegida = boton.dataset.seccion;
      pestanas.forEach(b => b.classList.toggle('activa', b === boton));
      secciones.forEach(s => s.classList.toggle('activa', s.id === elegida));
      modulos[elegida].alAbrir();
    });
  });
}
