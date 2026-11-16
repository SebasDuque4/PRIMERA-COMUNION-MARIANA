# Conectar el RSVP a Google Sheets

1. Crea una hoja de cálculo nueva en Google Sheets (por ejemplo, «RSVP Primera Comunión Mariana»).
2. En la hoja, ve a **Extensiones → Apps Script**.
3. Borra lo que aparece en `Código.gs` y pega todo el contenido de `google-apps-script/Code.gs`. Guarda (💾).
4. Arriba, elige la función **`prepararHoja`** y pulsa **Ejecutar**. Google pedirá permisos:
   **Revisar permisos → tu cuenta → Configuración avanzada → Ir a … (no seguro) → Permitir**.
   Es normal: el script es tuyo. Al terminar, la hoja tendrá una pestaña «Confirmaciones» con encabezados.
5. Pulsa **Implementar → Nueva implementación**.
   - Tipo: **Aplicación web**
   - Ejecutar como: **Yo**
   - Quién tiene acceso: **Cualquier usuario**
   - Pulsa **Implementar** y copia la **URL de la aplicación web** (termina en `/exec`).
6. Pega esa URL en `js/app.js`, en `appsScriptUrl: ''`, y sube los cambios a GitHub.

Para comprobarlo, abre la URL `/exec` en el navegador: debe mostrar `"RSVP de Mariana activo"`.

**Si después cambias el script:** Implementar → Gestionar implementaciones → ✏️ → Versión: **Nueva versión** → Implementar. Así la URL no cambia.
