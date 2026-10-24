// Pestaña "Hojas" del admin: busca a cualquier persona y ve sus hojas con puntos

import { hojasDeJugador } from '../api.js';
import { aviso, mostrarHojas } from '../vista-hojas.js';
import { actualizarJugadores } from './jugadores.js';

const formulario = document.getElementById('buscar-jugador');
const campo = document.getElementById('jugador');
const resultado = document.getElementById('hojas-resultado');

export function iniciar() {
  formulario.addEventListener('submit', e => {
    e.preventDefault();
    buscar();
  });
}

export function alAbrir() {
  actualizarJugadores();
}

async function buscar() {
  const nombre = campo.value.trim();
  if (!nombre) return;

  aviso(resultado, 'Buscando…');
  try {
    const hojas = await hojasDeJugador(nombre);
    if (hojas.length) mostrarHojas(resultado, hojas, { conPuntos: true });
    else aviso(resultado, `No hay hojas de "${nombre}".`);
  } catch (err) {
    aviso(resultado, err.message);
  }
}
