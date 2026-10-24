// Pestaña "Comisiones": cuánto se quedó la casa (10%) de lo que ganó cada persona

import { comisiones } from '../api.js';
import { COMISION, dinero, escapar, redondear } from '../calculos.js';
import { aviso } from '../vista-hojas.js';

const formulario = document.getElementById('filtro-comisiones');
const desde = document.getElementById('comisiones-desde');
const hasta = document.getElementById('comisiones-hasta');
const resultado = document.getElementById('comisiones-resultado');

export function iniciar() {
  formulario.addEventListener('submit', e => {
    e.preventDefault();
    consultar();
  });
  document.getElementById('comisiones-todo').addEventListener('click', () => {
    desde.value = '';
    hasta.value = '';
    consultar();
  });
}

export function alAbrir() {
  consultar();
}

async function consultar() {
  try {
    mostrar(await comisiones(desde.value, hasta.value));
  } catch (err) {
    aviso(resultado, err.message);
  }
}

function mostrar(filas) {
  if (!filas.length) {
    aviso(resultado, 'No hay ganancias en esas fechas.');
    return;
  }

  const totalGanado = redondear(filas.reduce((s, f) => s + f.ganado, 0));
  const totalComision = redondear(filas.reduce((s, f) => s + f.comision, 0));
  const porcentaje = Math.round(COMISION * 100);

  resultado.innerHTML = `
    <div class="tarjetas-resumen">
      <div class="tarjeta-dato">
        <span>Comisión total (${porcentaje}%)</span>
        <strong class="dorado">${dinero(totalComision)}</strong>
      </div>
      <div class="tarjeta-dato">
        <span>Puntos ganados</span>
        <strong>${dinero(totalGanado)}</strong>
      </div>
    </div>

    <div class="tabla-scroll tarjeta">
      <table class="tabla-datos">
        <thead>
          <tr><th>Persona</th><th class="num">Ganado</th><th class="num">Comisión ${porcentaje}%</th></tr>
        </thead>
        <tbody>
          ${filas.map(f => `
            <tr>
              <td>${escapar(f.nombre)}</td>
              <td class="num">${dinero(f.ganado)}</td>
              <td class="num dorado">${dinero(f.comision)}</td>
            </tr>`).join('')}
        </tbody>
        <tfoot>
          <tr><th>Total</th><th class="num">${dinero(totalGanado)}</th><th class="num dorado">${dinero(totalComision)}</th></tr>
        </tfoot>
      </table>
    </div>`;
}
