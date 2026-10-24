// Reglas del juego y formatos. Si cambia la comisión, solo se cambia aquí.
// El backend debe usar exactamente las mismas reglas.

export const COMISION = 0.10; // la casa se queda con el 10% de lo que se gana
export const MIL = 1000;      // en la captura, "10" significa 10,000 puntos

// Arma la hoja de una persona en un día: una fila por pelea + los totales.
export function hojaDePersona(dia, nombre) {
  const buscado = normalizar(nombre);
  let nombreGuardado = nombre.trim();

  const filas = dia.peleas.map((pelea, i) => {
    let pierde = 0;
    let puntos = 0;
    pelea.apuestas.forEach(a => {
      if (normalizar(a.nombre) !== buscado) return;
      nombreGuardado = a.nombre;
      if (a.resultado === 'gana') puntos += a.puntos;
      else pierde += a.puntos;
    });
    return { no: 'P' + (i + 1), pierde, puntos, gana: redondear(puntos * (1 - COMISION)) };
  });

  const totalPierde = sumar(filas, 'pierde');
  const totalGana = sumar(filas, 'gana');

  return {
    fecha: dia.fecha,
    nombre: nombreGuardado,
    filas,
    totalPierde,
    totalGana,
    total: redondear(totalGana - totalPierde),
    participo: filas.some(f => f.pierde || f.puntos),
  };
}

// La versión de la hoja que ve el usuario: sin la columna de puntos
export function sinPuntos(hoja) {
  return { ...hoja, filas: hoja.filas.map(({ no, pierde, gana }) => ({ no, pierde, gana })) };
}

// Cuánto se quedó la casa de cada persona: solo cuenta lo que ganó
export function calcularComisiones(dias, desde, hasta) {
  const porPersona = new Map();

  dias.forEach(dia => {
    if ((desde && dia.fecha < desde) || (hasta && dia.fecha > hasta)) return;
    dia.peleas.forEach(pelea => {
      pelea.apuestas.forEach(a => {
        if (a.resultado !== 'gana') return;
        const clave = normalizar(a.nombre);
        const fila = porPersona.get(clave) || { nombre: a.nombre, ganado: 0 };
        fila.ganado += a.puntos;
        porPersona.set(clave, fila);
      });
    });
  });

  return [...porPersona.values()]
    .map(f => ({ ...f, comision: redondear(f.ganado * COMISION) }))
    .sort((a, b) => b.comision - a.comision);
}

// Nombres sin repetir de una lista de días ("juan" y "Juan" cuentan como uno)
export function nombresDe(dias) {
  const vistos = new Map();
  dias.forEach(dia => {
    dia.peleas.forEach(pelea => {
      pelea.apuestas.forEach(a => {
        const clave = normalizar(a.nombre);
        if (clave && !vistos.has(clave)) vistos.set(clave, a.nombre);
      });
    });
  });
  return [...vistos.values()].sort((a, b) => a.localeCompare(b));
}

function sumar(filas, campo) {
  return redondear(filas.reduce((suma, f) => suma + f[campo], 0));
}

export function redondear(n) {
  return Math.round(n * 100) / 100;
}

// "  José  Pérez " -> "jose perez", para comparar nombres sin fallar por acentos o mayúsculas
export function normalizar(texto) {
  return texto
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .trim().replace(/\s+/g, ' ')
    .toLowerCase();
}

// 9000 -> "$9,000"   0 -> "$ -"
export function dinero(n) {
  if (!n) return '$ -';
  const texto = '$' + Math.abs(n).toLocaleString('es-MX', { maximumFractionDigits: 2 });
  return n < 0 ? '-' + texto : texto;
}

// Clase para pintar un número de verde (positivo) o rojo (negativo)
export function claseSigno(n) {
  if (n > 0) return 'positivo';
  if (n < 0) return 'negativo';
  return '';
}

// Fecha de hoy como "2026-10-24" (el formato que usa <input type="date">)
export function hoy() {
  return new Date().toLocaleDateString('en-CA');
}

// "2026-10-24" -> "24/10/2026"
export function fechaBonita(fecha) {
  const [anio, mes, dia] = fecha.split('-');
  return `${dia}/${mes}/${anio}`;
}

// Para meter texto escrito por personas dentro de HTML sin romperlo
export function escapar(texto) {
  return String(texto)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
