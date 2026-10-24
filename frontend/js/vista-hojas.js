// Muestra las hojas de una persona: resumen, hoja del día, Excel e historial.
// La usan las dos vistas: el admin (con puntos) y el usuario (sin puntos).

import { claseSigno, dinero, escapar, fechaBonita, redondear } from './calculos.js';
import { descargarExcel } from './excel.js';

export function aviso(contenedor, texto) {
  contenedor.innerHTML = '<p class="aviso"></p>';
  contenedor.querySelector('.aviso').textContent = texto;
}

// hojas: lista de la más nueva a la más vieja
export function mostrarHojas(contenedor, hojas, { conPuntos }) {
  if (!hojas.length) {
    aviso(contenedor, 'Todavía no hay hojas para mostrar.');
    return;
  }

  const acumulado = redondear(hojas.reduce((suma, h) => suma + h.total, 0));

  contenedor.innerHTML = `
    <div class="tarjetas-resumen">
      <div class="tarjeta-dato">
        <span>Días jugados</span>
        <strong>${hojas.length}</strong>
      </div>
      <div class="tarjeta-dato">
        <span>Total acumulado</span>
        <strong class="${claseSigno(acumulado)}">${dinero(acumulado)}</strong>
      </div>
    </div>

    <div class="hojas-barra">
      <label class="campo">Fecha
        <select class="hojas-fecha"></select>
      </label>
      <button class="btn btn-excel">Descargar Excel</button>
    </div>

    <div class="hoja"></div>

    <h3 class="subtitulo">Historial</h3>
    <ul class="historial"></ul>`;

  const select = contenedor.querySelector('.hojas-fecha');
  const hojaCont = contenedor.querySelector('.hoja');
  const lista = contenedor.querySelector('.historial');

  hojas.forEach((h, i) => {
    select.add(new Option(fechaBonita(h.fecha), i));

    const item = document.createElement('li');
    item.innerHTML = `
      <button class="historial-dia">
        <span>${fechaBonita(h.fecha)}</span>
        <strong class="${claseSigno(h.total)}">${dinero(h.total)}</strong>
      </button>`;
    item.querySelector('button').addEventListener('click', () => {
      ver(i);
      hojaCont.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    lista.appendChild(item);
  });

  let mostrarTodas = false; // también las peleas en las que no jugó

  function ver(i) {
    select.value = i;
    hojaCont.innerHTML = tablaHoja(hojas[i], conPuntos);
    hojaCont.classList.toggle('mostrar-todas', mostrarTodas);

    const interruptor = hojaCont.querySelector('.interruptor input');
    interruptor.checked = mostrarTodas;
    interruptor.addEventListener('change', () => {
      mostrarTodas = interruptor.checked;
      hojaCont.classList.toggle('mostrar-todas', mostrarTodas);
    });

    lista.querySelectorAll('.historial-dia').forEach((b, j) => b.classList.toggle('activo', j === i));
  }

  select.addEventListener('change', () => ver(Number(select.value)));
  contenedor.querySelector('.btn-excel').addEventListener('click', () => {
    descargarExcel(hojas[Number(select.value)], conPuntos);
  });

  ver(0);
}

// Hoja de un día: totales arriba y una fila por pelea.
// El admin además ve cuántos puntos apostó en cada pelea.
function tablaHoja(h, conPuntos) {
  const filas = h.filas.map(f => {
    const jugo = f.gana || f.pierde;
    const monto = redondear(f.gana - f.pierde);
    return `
      <tr class="${jugo ? '' : 'sin-jugar'}">
        <td class="pelea-no">${f.no}</td>
        ${conPuntos ? `<td class="num">${jugo ? dinero(f.puntos + f.pierde) : '—'}</td>` : ''}
        <td>${pastilla(f)}</td>
        <td class="num monto ${claseSigno(monto)}">${jugo ? conSigno(monto) : '—'}</td>
      </tr>`;
  }).join('');

  return `
    <div class="hoja-cabeza">
      <div>
        <span class="hoja-etq">Hoja de</span>
        <h3>${escapar(h.nombre)}</h3>
      </div>
      <span class="hoja-fecha">${fechaBonita(h.fecha)}</span>
    </div>

    <div class="hoja-totales">
      <div class="total-caja">
        <span>Perdido</span>
        <strong class="negativo">${dinero(h.totalPierde)}</strong>
      </div>
      <div class="total-caja">
        <span>Ganado</span>
        <strong class="positivo">${dinero(h.totalGana)}</strong>
      </div>
      <div class="total-caja neto">
        <span>Total del día</span>
        <strong class="${claseSigno(h.total)}">${conSigno(h.total)}</strong>
      </div>
    </div>

    <div class="hoja-tabla-cabeza">
      <span>Peleas</span>
      <label class="interruptor"><input type="checkbox"> Mostrar todas</label>
    </div>

    <div class="tabla-scroll">
      <table class="tabla-hoja">
        <thead>
          <tr>
            <th>Pelea</th>
            ${conPuntos ? '<th class="num">Puntos</th>' : ''}
            <th>Resultado</th>
            <th class="num">Monto</th>
          </tr>
        </thead>
        <tbody>${filas}</tbody>
        <tfoot>
          <tr>
            <td colspan="${conPuntos ? 3 : 2}">Total</td>
            <td class="num ${claseSigno(h.total)}">${conSigno(h.total)}</td>
          </tr>
        </tfoot>
      </table>
    </div>`;
}

function pastilla(f) {
  if (f.gana && f.pierde) return '<span class="pastilla mixta">Mixto</span>';
  if (f.gana) return '<span class="pastilla gano">Ganó</span>';
  if (f.pierde) return '<span class="pastilla perdio">Perdió</span>';
  return '<span class="pastilla neutra">No jugó</span>';
}

// 9000 -> "+$9,000"   -5000 -> "-$5,000"
function conSigno(n) {
  return n > 0 ? '+' + dinero(n) : dinero(n);
}
