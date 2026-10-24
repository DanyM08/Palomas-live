// Crea el archivo .xlsx con el mismo diseño de la hoja original.
// Usa la librería ExcelJS, que se carga en el HTML.
// Admin: con columna "Puntos" y fórmulas. Usuario: solo Pierde y Gana.

import { COMISION, fechaBonita } from './calculos.js';

const FORMATO_PESOS = '_-"$"* #,##0_-;-"$"* #,##0_-;_-"$"* "-"_-;_-@_-';
const FORMATO_TOTAL = '"$"#,##0;-"$"#,##0;"$ -"';

const COLOR = {
  negro: 'FF000000',
  blanco: 'FFFFFFFF',
  durazno: 'FFF8CBAD',
  gris: 'FFD9D9D9',
  rojo: 'FFFF5050',
  rojoClaro: 'FFFFD0D4',
  rojoMedio: 'FFE06666',
  rojoFuerte: 'FFC00000',
  verde: 'FF70AD47',
  verdeClaro: 'FFC6EFCE',
  verdeSuave: 'FFE2EFDA',
  verdeTotal: 'FFB4E09B',
  verdeOscuro: 'FF1E7B1E',
  azul: 'FF0070C0',
};

const BORDE = {
  top: { style: 'thin' },
  left: { style: 'thin' },
  bottom: { style: 'thin' },
  right: { style: 'thin' },
};

export async function descargarExcel(hoja, conPuntos) {
  if (typeof ExcelJS === 'undefined') {
    alert('No se pudo cargar la librería de Excel. Revisa tu conexión a internet.');
    return;
  }

  // En qué columna va cada cosa (sin puntos, todo se recorre una columna a la izquierda)
  const col = conPuntos
    ? { pierde: 'B', puntos: 'C', gana: 'D', izq: 'E', der: 'F' }
    : { pierde: 'B', gana: 'C', izq: 'D', der: 'E' };

  const libro = new ExcelJS.Workbook();
  const ws = libro.addWorksheet('Hoja');
  ws.columns = (conPuntos ? [8, 14, 14, 14, 18, 18] : [8, 14, 14, 18, 18]).map(width => ({ width }));

  // Fila 1: fecha
  ws.mergeCells('A1:B1');
  ws.mergeCells(`C1:${col.der}1`);
  estilo(ws.getCell('A1'), 'Fecha', { fondo: COLOR.durazno, negrita: true, tam: 14 });
  estilo(ws.getCell('C1'), fechaBonita(hoja.fecha), { fondo: COLOR.durazno, negrita: true, tam: 14 });

  // Fila 2: títulos de la tabla y nombre de la persona
  estilo(ws.getCell('A2'), 'No.', { fondo: COLOR.gris, negrita: true });
  estilo(ws.getCell(`${col.pierde}2`), 'Pierde', { fondo: COLOR.rojo, negrita: true, color: COLOR.blanco });
  if (conPuntos) estilo(ws.getCell(`${col.puntos}2`), 'Puntos', { fondo: COLOR.verdeClaro, negrita: true });
  estilo(ws.getCell(`${col.gana}2`), 'Gana', { fondo: COLOR.verde, negrita: true });
  ws.mergeCells(`${col.izq}2:${col.der}2`);
  estilo(ws.getCell(`${col.izq}2`), hoja.nombre, { negrita: true, tam: 14 });

  // Una fila por pelea
  hoja.filas.forEach((f, i) => {
    const r = 3 + i;
    estilo(ws.getCell(`A${r}`), f.no, { fondo: COLOR.gris, negrita: true });
    estilo(ws.getCell(`${col.pierde}${r}`), f.pierde, {
      fondo: f.pierde ? COLOR.rojoClaro : null, color: COLOR.rojoFuerte, formato: FORMATO_PESOS,
    });
    if (conPuntos) {
      estilo(ws.getCell(`${col.puntos}${r}`), f.puntos, {
        fondo: f.puntos ? COLOR.verdeClaro : null, formato: FORMATO_PESOS,
      });
    }
    const gana = conPuntos ? { formula: `${col.puntos}${r}*${1 - COMISION}`, result: f.gana } : f.gana;
    estilo(ws.getCell(`${col.gana}${r}`), gana, {
      fondo: f.gana ? COLOR.verdeSuave : null, color: COLOR.verdeOscuro, negrita: true, formato: FORMATO_PESOS,
    });
  });
  const ultima = 2 + hoja.filas.length;

  // Resumen de la derecha
  estilo(ws.getCell(`${col.izq}3`), 'Pierde:', { fondo: COLOR.rojoFuerte, color: COLOR.blanco, negrita: true, izquierda: true });
  estilo(ws.getCell(`${col.der}3`), 'Gana:', { fondo: COLOR.verde, negrita: true, izquierda: true });
  estilo(ws.getCell(`${col.izq}4`), { formula: `SUM(${col.pierde}3:${col.pierde}${ultima})`, result: hoja.totalPierde }, {
    fondo: COLOR.rojoMedio, negrita: true, tam: 14, formato: FORMATO_TOTAL,
  });
  estilo(ws.getCell(`${col.der}4`), { formula: `SUM(${col.gana}3:${col.gana}${ultima})`, result: hoja.totalGana }, {
    fondo: COLOR.verdeTotal, negrita: true, tam: 14, formato: FORMATO_TOTAL,
  });
  ws.mergeCells(`${col.izq}5:${col.der}5`);
  estilo(ws.getCell(`${col.izq}5`), 'Total', { fondo: COLOR.azul, color: COLOR.blanco, negrita: true, tam: 14 });
  ws.mergeCells(`${col.izq}6:${col.der}7`);
  estilo(ws.getCell(`${col.izq}6`), { formula: `${col.der}4-${col.izq}4`, result: hoja.total }, {
    fondo: COLOR.verdeTotal, color: hoja.total < 0 ? COLOR.rojoFuerte : COLOR.verdeOscuro,
    negrita: true, tam: 16, formato: FORMATO_TOTAL,
  });

  await agregarLogo(libro, ws, conPuntos ? 4 : 3);

  const datos = await libro.xlsx.writeBuffer();
  const archivo = new Blob([datos], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const nombreArchivo = `${hoja.nombre} ${hoja.fecha}.xlsx`.replace(/[\\/:*?"<>|]/g, '');

  const enlace = document.createElement('a');
  enlace.href = URL.createObjectURL(archivo);
  enlace.download = nombreArchivo;
  enlace.click();
  setTimeout(() => URL.revokeObjectURL(enlace.href), 1000);
}

// Pone valor y diseño a una celda
function estilo(celda, valor, o = {}) {
  celda.value = valor;
  celda.border = BORDE;
  celda.alignment = { horizontal: o.izquierda ? 'left' : 'center', vertical: 'middle' };
  celda.font = { bold: !!o.negrita, size: o.tam || 11, color: { argb: o.color || COLOR.negro } };
  if (o.fondo) celda.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: o.fondo } };
  if (o.formato) celda.numFmt = o.formato;
}

// Pone el logo debajo del resumen. Si no se encuentra la imagen, el Excel sale sin logo.
async function agregarLogo(libro, ws, columna) {
  try {
    const respuesta = await fetch('img/logo.png');
    if (!respuesta.ok) return;
    const imagen = await respuesta.blob();
    const base64 = await new Promise((listo, error) => {
      const lector = new FileReader();
      lector.onload = () => listo(lector.result);
      lector.onerror = error;
      lector.readAsDataURL(imagen);
    });
    const id = libro.addImage({ base64, extension: 'png' });
    ws.addImage(id, { tl: { col: columna, row: 8 }, ext: { width: 260, height: 212 } });
  } catch {
    // sin logo
  }
}
