// Lista de sugerencias con los nombres ya capturados.
// Ayuda a escribir siempre igual el nombre de cada persona.

import { listarJugadores } from '../api.js';

const lista = document.getElementById('lista-jugadores');

export async function actualizarJugadores() {
  try {
    const nombres = await listarJugadores();
    lista.innerHTML = '';
    nombres.forEach(n => lista.appendChild(new Option(n)));
  } catch {
    // sin sugerencias no pasa nada
  }
}
