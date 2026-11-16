/**
 * Confirmaciones (RSVP) · Primera Comunión de Mariana
 *
 * Guarda cada confirmación de la invitación en esta hoja de Google Sheets.
 * Se pega en: Hoja de cálculo → Extensiones → Apps Script.
 * Pasos completos en google-apps-script/LEEME.md
 */

// ID de la hoja de cálculo (lo que va entre /d/ y /edit en su URL).
// Necesario si el script se creó desde script.google.com y no desde la hoja.
const ID_HOJA = '';

const HOJA = 'Confirmaciones';
const ENCABEZADOS = ['Fecha y hora', 'Nombre', '¿Asiste?', 'Personas', 'Niños', 'Mensaje para Mariana'];

/** Recibe los datos que envía el formulario de la invitación. */
function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000); // evita que dos confirmaciones simultáneas se pisen
  try {
    const data = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    if (data.type && data.type !== 'rsvp') return respuesta({ ok: false, error: 'tipo no soportado' });

    const nombre = limpiar(data.name, 120);
    if (!nombre) return respuesta({ ok: false, error: 'falta el nombre' });

    const asiste = data.attend === 'si';
    hoja().appendRow([
      new Date(),
      nombre,
      asiste ? 'Sí' : 'No',
      asiste ? limpiar(data.count, 10) : '',
      asiste ? limpiar(data.kids, 20) : '',
      limpiar(data.msg, 1000),
    ]);
    return respuesta({ ok: true });
  } catch (err) {
    return respuesta({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}

/** Permite comprobar en el navegador que la aplicación web está publicada. */
function doGet() {
  return respuesta({ ok: true, mensaje: 'RSVP de Mariana activo' });
}

/** Crea la pestaña con encabezados la primera vez. */
function hoja() {
  const libro = ID_HOJA ? SpreadsheetApp.openById(ID_HOJA) : SpreadsheetApp.getActiveSpreadsheet();
  if (!libro) throw new Error('Escribe el ID de la hoja en ID_HOJA (arriba del todo).');
  let sh = libro.getSheetByName(HOJA);
  if (!sh) {
    sh = libro.insertSheet(HOJA);
    sh.appendRow(ENCABEZADOS);
    sh.getRange(1, 1, 1, ENCABEZADOS.length)
      .setFontWeight('bold').setBackground('#F0D5D5').setFontColor('#5C3D47');
    sh.setFrozenRows(1);
    sh.getRange('A:A').setNumberFormat('dd/mm/yyyy hh:mm');
    sh.setColumnWidths(1, ENCABEZADOS.length, 160);
    sh.setColumnWidth(6, 360);
  }
  return sh;
}

/** Recorta el texto y evita que Sheets lo interprete como fórmula. */
function limpiar(valor, max) {
  let t = String(valor == null ? '' : valor).trim().slice(0, max);
  if (/^[=+\-@]/.test(t)) t = "'" + t;
  return t;
}

function respuesta(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

/** Ejecútala una vez desde el editor para crear la pestaña y autorizar el script. */
function prepararHoja() {
  hoja();
}
