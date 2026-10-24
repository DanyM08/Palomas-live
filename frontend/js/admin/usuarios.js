// Pestaña "Usuarios": solo el admin crea las cuentas de los jugadores

import { cambiarContrasena, crearUsuario, eliminarUsuario, listarUsuarios, usuarioActual } from '../api.js';
import { escapar } from '../calculos.js';
import { aviso } from '../vista-hojas.js';
import { actualizarJugadores } from './jugadores.js';

const MIN_CONTRASENA = 6;

const formulario = document.getElementById('nuevo-usuario');
const campoNombre = document.getElementById('nu-nombre');
const campoUsuario = document.getElementById('nu-usuario');
const campoContrasena = document.getElementById('nu-contrasena');
const mensaje = document.getElementById('usuarios-mensaje');
const lista = document.getElementById('usuarios-lista');

export function iniciar() {
  formulario.addEventListener('submit', async e => {
    e.preventDefault();
    try {
      await crearUsuario({
        nombre: campoNombre.value.trim().replace(/\s+/g, ' '),
        usuario: campoUsuario.value.trim(),
        contrasena: campoContrasena.value,
      });
      mostrarMensaje(`Cuenta "${campoUsuario.value.trim()}" creada ✔`);
      formulario.reset();
      refrescar();
    } catch (err) {
      mostrarMensaje(err.message, true);
    }
  });
}

export function alAbrir() {
  actualizarJugadores();
  refrescar();
}

function mostrarMensaje(texto, esError = false) {
  mensaje.textContent = texto;
  mensaje.classList.toggle('error', esError);
}

async function refrescar() {
  let usuarios;
  try {
    usuarios = await listarUsuarios();
  } catch (err) {
    aviso(lista, err.message);
    return;
  }

  const yo = usuarioActual();
  lista.innerHTML = `
    <div class="tabla-scroll tarjeta">
      <table class="tabla-datos">
        <thead>
          <tr><th>Jugador</th><th>Usuario</th><th>Rol</th><th></th></tr>
        </thead>
        <tbody>
          ${usuarios.map(u => `
            <tr data-id="${u.id}">
              <td>${escapar(u.nombre)}</td>
              <td>${escapar(u.usuario)}</td>
              <td><span class="etiqueta ${u.rol}">${u.rol === 'admin' ? 'Admin' : 'Usuario'}</span></td>
              <td class="acciones-fila">
                <button class="btn btn-chico cambiar">Contraseña</button>
                ${u.id === yo.id ? '' : '<button class="btn btn-chico btn-peligro eliminar">Eliminar</button>'}
              </td>
            </tr>`).join('')}
        </tbody>
      </table>
    </div>`;

  lista.querySelectorAll('tbody tr').forEach(fila => {
    const usuario = usuarios.find(u => String(u.id) === fila.dataset.id);
    fila.querySelector('.cambiar').addEventListener('click', () => nuevaContrasena(usuario));
    fila.querySelector('.eliminar')?.addEventListener('click', () => borrar(usuario));
  });
}

async function nuevaContrasena(usuario) {
  const contrasena = prompt(`Nueva contraseña para "${usuario.usuario}" (mínimo ${MIN_CONTRASENA} caracteres):`);
  if (contrasena === null) return;
  if (contrasena.length < MIN_CONTRASENA) {
    mostrarMensaje(`La contraseña debe tener al menos ${MIN_CONTRASENA} caracteres.`, true);
    return;
  }
  try {
    await cambiarContrasena(usuario.id, contrasena);
    mostrarMensaje(`Contraseña de "${usuario.usuario}" actualizada ✔`);
  } catch (err) {
    mostrarMensaje(err.message, true);
  }
}

async function borrar(usuario) {
  if (!confirm(`¿Eliminar la cuenta de "${usuario.usuario}"? Sus hojas no se borran.`)) return;
  try {
    await eliminarUsuario(usuario.id);
    mostrarMensaje(`Cuenta "${usuario.usuario}" eliminada.`);
    refrescar();
  } catch (err) {
    mostrarMensaje(err.message, true);
  }
}
