// TODO lo que guarda o pide datos pasa por este archivo.
//
// Cada función tiene dos caminos:
//   - USAR_SERVIDOR = true  -> le pide los datos a tu backend (la ruta está escrita ahí mismo)
//   - USAR_SERVIDOR = false -> modo de prueba: guarda todo en el navegador (localStorage)
//
// Cuando tu backend esté listo, solo cambias USAR_SERVIDOR a true y URL_API a tu servidor.
// La lista completa de rutas y qué debe responder cada una está en docs/API.md

import { calcularComisiones, hojaDePersona, nombresDe, normalizar, sinPuntos } from './calculos.js';

const USAR_SERVIDOR = false;
const URL_API = 'http://localhost:3000/api';

export const MODO_PRUEBA = !USAR_SERVIDOR;

/* ================= Sesión ================= */

const CLAVE_SESION = 'palomas-live:sesion';

// El usuario que inició sesión: { id, usuario, nombre, rol } o null
export function usuarioActual() {
  try {
    return JSON.parse(localStorage.getItem(CLAVE_SESION))?.usuario || null;
  } catch {
    return null;
  }
}

export async function iniciarSesion(usuario, contrasena) {
  const sesion = USAR_SERVIDOR
    ? await pedir('POST', '/login', { usuario, contrasena })
    : loginLocal(usuario, contrasena);
  localStorage.setItem(CLAVE_SESION, JSON.stringify(sesion));
  return sesion.usuario;
}

export function cerrarSesion() {
  localStorage.removeItem(CLAVE_SESION);
}

/* ================= Días y capturas (solo admin) ================= */

export async function obtenerDia(fecha) {
  if (USAR_SERVIDOR) return pedir('GET', `/dias/${fecha}`);
  return diasLocales()[fecha] || null;
}

export async function guardarDia(dia) {
  if (USAR_SERVIDOR) return pedir('PUT', `/dias/${dia.fecha}`, dia);
  const dias = diasLocales();
  dias[dia.fecha] = dia;
  escribir(CLAVE_DIAS, dias);
  return dia;
}

// Nombres de todas las personas que se han capturado
export async function listarJugadores() {
  if (USAR_SERVIDOR) return pedir('GET', '/jugadores');
  return nombresDe(Object.values(diasLocales()));
}

/* ================= Hojas ================= */

// Admin: todas las hojas de una persona (con puntos), de la más nueva a la más vieja
export async function hojasDeJugador(nombre) {
  if (USAR_SERVIDOR) return pedir('GET', `/hojas?nombre=${encodeURIComponent(nombre)}`);
  return hojasLocales(nombre);
}

// Usuario: solo SUS hojas y SIN puntos (el servidor lo decide por el token, no por un nombre)
export async function misHojas() {
  if (USAR_SERVIDOR) return pedir('GET', '/mis-hojas');
  return hojasLocales(usuarioActual().nombre).map(sinPuntos);
}

/* ================= Comisiones (solo admin) ================= */

// desde / hasta son opcionales ("2026-10-01"); vacío = sin límite
export async function comisiones(desde, hasta) {
  if (USAR_SERVIDOR) {
    const params = new URLSearchParams({ desde, hasta });
    return pedir('GET', `/comisiones?${params}`);
  }
  return calcularComisiones(Object.values(diasLocales()), desde, hasta);
}

/* ================= Usuarios (solo admin) ================= */

export async function listarUsuarios() {
  if (USAR_SERVIDOR) return pedir('GET', '/usuarios');
  return usuariosLocales().map(publico);
}

// datos = { nombre, usuario, contrasena }. Siempre crea cuentas con rol "usuario".
export async function crearUsuario(datos) {
  if (USAR_SERVIDOR) return pedir('POST', '/usuarios', datos);

  const usuarios = usuariosLocales();
  if (usuarios.some(u => u.usuario.toLowerCase() === datos.usuario.toLowerCase())) {
    throw new Error(`El usuario "${datos.usuario}" ya existe.`);
  }
  const nuevo = { id: Date.now(), ...datos, rol: 'usuario' };
  usuarios.push(nuevo);
  escribir(CLAVE_USUARIOS, usuarios);
  return publico(nuevo);
}

export async function cambiarContrasena(id, contrasena) {
  if (USAR_SERVIDOR) return pedir('PUT', `/usuarios/${id}/contrasena`, { contrasena });
  const usuarios = usuariosLocales();
  usuarios.find(u => u.id === id).contrasena = contrasena;
  escribir(CLAVE_USUARIOS, usuarios);
}

export async function eliminarUsuario(id) {
  if (USAR_SERVIDOR) return pedir('DELETE', `/usuarios/${id}`);
  escribir(CLAVE_USUARIOS, usuariosLocales().filter(u => u.id !== id));
}

/* ================= Conexión con el servidor ================= */

async function pedir(metodo, ruta, cuerpo) {
  const token = JSON.parse(localStorage.getItem(CLAVE_SESION) || 'null')?.token;
  const respuesta = await fetch(URL_API + ruta, {
    method: metodo,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: cuerpo ? JSON.stringify(cuerpo) : undefined,
  });

  // Sesión vencida o inválida: de regreso al login
  if (respuesta.status === 401 && ruta !== '/login') {
    cerrarSesion();
    location.replace('index.html');
  }
  if (respuesta.status === 404) return null;
  if (respuesta.status === 204) return null;

  const datos = await respuesta.json();
  if (!respuesta.ok) throw new Error(datos.error || 'Error del servidor.');
  return datos;
}

/* ================= Modo de prueba (sin backend) ================= */

const CLAVE_DIAS = 'palomas-live:dias';
const CLAVE_USUARIOS = 'palomas-live:usuarios';

function leer(clave, porDefecto) {
  try {
    return JSON.parse(localStorage.getItem(clave)) ?? porDefecto;
  } catch {
    return porDefecto;
  }
}

function escribir(clave, valor) {
  localStorage.setItem(clave, JSON.stringify(valor));
}

function diasLocales() {
  return leer(CLAVE_DIAS, {});
}

// Si no hay usuarios todavía, existe un admin de prueba: admin / admin123
function usuariosLocales() {
  const usuarios = leer(CLAVE_USUARIOS, []);
  if (!usuarios.length) {
    usuarios.push({ id: 1, usuario: 'admin', contrasena: 'admin123', nombre: 'Administrador', rol: 'admin' });
  }
  return usuarios;
}

function hojasLocales(nombre) {
  return Object.values(diasLocales())
    .sort((a, b) => b.fecha.localeCompare(a.fecha))
    .map(dia => hojaDePersona(dia, nombre))
    .filter(hoja => hoja.participo);
}

function loginLocal(usuario, contrasena) {
  const encontrado = usuariosLocales().find(u =>
    normalizar(u.usuario) === normalizar(usuario) && u.contrasena === contrasena);
  if (!encontrado) throw new Error('Usuario o contraseña incorrectos.');
  return { token: `prueba-${encontrado.id}`, usuario: publico(encontrado) };
}

// Lo que se puede mostrar de un usuario (nunca la contraseña)
function publico({ id, usuario, nombre, rol }) {
  return { id, usuario, nombre, rol };
}
