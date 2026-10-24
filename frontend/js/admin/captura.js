// Pestaña "Capturar": se escriben las peleas de un día y quién apostó en cada una.
// Los puntos se escriben en miles: 10 = 10,000.

import { guardarDia, obtenerDia } from '../api.js';
import { dinero, fechaBonita, hoy, MIL } from '../calculos.js';
import { actualizarJugadores } from './jugadores.js';

const inputFecha = document.getElementById('fecha');
const contPeleas = document.getElementById('peleas');
const mensaje = document.getElementById('mensaje');
const botonGuardar = document.getElementById('guardar-dia');
const tplPelea = document.getElementById('tpl-pelea');
const tplApuesta = document.getElementById('tpl-apuesta');

let dia;                // el día que se está capturando
let sinGuardar = false; // para avisar si se cambia de fecha sin guardar

export function iniciar() {
  inputFecha.addEventListener('change', cambiarFecha);
  document.getElementById('agregar-pelea').addEventListener('click', agregarPelea);
  botonGuardar.addEventListener('click', guardar);

  // Aviso del navegador si se cierra la página con cambios sin guardar
  window.addEventListener('beforeunload', e => {
    if (sinGuardar) e.preventDefault();
  });

  inputFecha.value = hoy();
  cargarFecha(inputFecha.value);
}

export function alAbrir() {}

function diaNuevo(fecha) {
  return { fecha, peleas: [{ apuestas: [apuestaVacia()] }] };
}

function apuestaVacia() {
  return { nombre: '', puntos: 0, resultado: 'gana' };
}

async function cargarFecha(fecha) {
  try {
    dia = (await obtenerDia(fecha)) || diaNuevo(fecha);
    mostrarMensaje('');
  } catch (err) {
    dia = diaNuevo(fecha);
    mostrarMensaje(err.message, true);
  }
  sinGuardar = false;
  dibujarPeleas();
}

function cambiarFecha() {
  if (!inputFecha.value) return;
  if (sinGuardar && !confirm('Hay cambios sin guardar. ¿Cambiar de fecha de todos modos?')) {
    inputFecha.value = dia.fecha;
    return;
  }
  cargarFecha(inputFecha.value);
}

function agregarPelea() {
  dia.peleas.push({ apuestas: [apuestaVacia()] });
  huboCambio();
  dibujarPeleas();
  enfocarUltimoNombre(dia.peleas.length - 1);
}

// Vuelve a dibujar todas las tarjetas de pelea a partir de "dia"
function dibujarPeleas() {
  contPeleas.innerHTML = '';

  dia.peleas.forEach((pelea, i) => {
    const tarjeta = tplPelea.content.cloneNode(true).firstElementChild;
    tarjeta.querySelector('.pelea-titulo').textContent = 'P' + (i + 1);

    const lista = tarjeta.querySelector('.apuestas');
    const total = tarjeta.querySelector('.pelea-total');
    const actualizarTotal = () => {
      const suma = pelea.apuestas.reduce((s, a) => s + a.puntos, 0);
      total.textContent = `${pelea.apuestas.length} persona(s) · ${dinero(suma)} en juego`;
    };

    pelea.apuestas.forEach((apuesta, j) => {
      lista.appendChild(crearFilaApuesta(pelea, apuesta, j, actualizarTotal));
    });
    actualizarTotal();

    tarjeta.querySelector('.agregar-apuesta').addEventListener('click', () => {
      pelea.apuestas.push(apuestaVacia());
      huboCambio();
      dibujarPeleas();
      enfocarUltimoNombre(i);
    });

    tarjeta.querySelector('.quitar-pelea').addEventListener('click', () => {
      if (!confirm(`¿Eliminar la pelea P${i + 1}?`)) return;
      dia.peleas.splice(i, 1);
      huboCambio();
      dibujarPeleas();
    });

    contPeleas.appendChild(tarjeta);
  });
}

function crearFilaApuesta(pelea, apuesta, j, actualizarTotal) {
  const fila = tplApuesta.content.cloneNode(true).firstElementChild;
  const nombre = fila.querySelector('.apuesta-nombre');
  const puntos = fila.querySelector('.apuesta-puntos');
  const resultado = fila.querySelector('.apuesta-resultado');

  nombre.value = apuesta.nombre;
  puntos.value = apuesta.puntos ? apuesta.puntos / MIL : '';
  pintarResultado(resultado, apuesta.resultado);

  nombre.addEventListener('input', () => {
    apuesta.nombre = nombre.value;
    huboCambio();
  });

  // Se escribe en miles y se guarda completo: 10 -> 10000
  puntos.addEventListener('input', () => {
    apuesta.puntos = Math.round((Number(puntos.value) || 0) * MIL);
    actualizarTotal();
    huboCambio();
  });

  resultado.addEventListener('click', () => {
    apuesta.resultado = apuesta.resultado === 'gana' ? 'pierde' : 'gana';
    pintarResultado(resultado, apuesta.resultado);
    huboCambio();
  });

  fila.querySelector('.quitar-apuesta').addEventListener('click', () => {
    pelea.apuestas.splice(j, 1);
    huboCambio();
    dibujarPeleas();
  });

  return fila;
}

function pintarResultado(boton, resultado) {
  boton.textContent = resultado === 'gana' ? 'Ganó' : 'Perdió';
  boton.className = 'apuesta-resultado ' + resultado;
}

function enfocarUltimoNombre(numPelea) {
  const nombres = contPeleas.children[numPelea].querySelectorAll('.apuesta-nombre');
  nombres[nombres.length - 1].focus();
}

function huboCambio() {
  sinGuardar = true;
  mostrarMensaje('');
}

function mostrarMensaje(texto, esError = false) {
  mensaje.textContent = texto;
  mensaje.classList.toggle('error', esError);
}

// Revisa que no falte un nombre o unos puntos. Regresa el error o null si todo está bien.
function revisarDia() {
  for (let i = 0; i < dia.peleas.length; i++) {
    for (const a of dia.peleas[i].apuestas) {
      const tieneNombre = a.nombre.trim() !== '';
      const tienePuntos = a.puntos > 0;
      if (tieneNombre && !tienePuntos) return `En P${i + 1}, "${a.nombre.trim()}" no tiene puntos.`;
      if (!tieneNombre && tienePuntos) return `En P${i + 1} hay puntos sin nombre.`;
    }
  }
  return null;
}

async function guardar() {
  const error = revisarDia();
  if (error) return mostrarMensaje(error, true);

  // Quita las filas vacías y los espacios de más en los nombres
  dia.peleas.forEach(pelea => {
    pelea.apuestas = pelea.apuestas.filter(a => a.nombre.trim() && a.puntos > 0);
    pelea.apuestas.forEach(a => { a.nombre = a.nombre.trim().replace(/\s+/g, ' '); });
  });

  botonGuardar.disabled = true;
  try {
    await guardarDia(dia);
    sinGuardar = false;
    dibujarPeleas();
    actualizarJugadores();
    mostrarMensaje(`Día ${fechaBonita(dia.fecha)} guardado ✔`);
  } catch (err) {
    mostrarMensaje(`No se pudo guardar: ${err.message}`, true);
  } finally {
    botonGuardar.disabled = false;
  }
}
