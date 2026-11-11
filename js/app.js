/* ═══════════════════════════════════════════════════════════
   CONFIGURACIÓN · Edita solo este bloque
   ═══════════════════════════════════════════════════════════ */
const CONFIG = {
  // Fecha del evento (día completo, sin hora exacta). Formato AAAA-MM-DD
  fecha: '2026-12-06',

  // Cuando se confirme la hora y el lugar, escríbelos aquí y se mostrarán en el calendario
  lugar: 'Por confirmar',

  // Google Apps Script NUEVO para esta comunión (RSVP + subida de fotos).
  // Déjalo vacío hasta crearlo: el álbum se oculta y el RSVP usa WhatsApp.
  appsScriptUrl: '',

  // ID de la carpeta de Google Drive donde quedan las fotos del álbum
  driveFolderId: '',

  // Número de WhatsApp (con indicativo, sin +) para recibir confirmaciones si no hay Apps Script
  whatsapp: '',

  // Enlaces de Google Maps (déjalos vacíos mientras no haya lugar)
  mapas: { misa: '', fiesta: '' },

  // Datos bancarios (si están vacíos, el botón de transferencia no aparece)
  banco: { nombre: '', cuenta: '', titular: '' },

  // Texto del reproductor
  musica: { titulo: 'MÚSICA', artista: 'Mi Primera Comunión' },
};

/* ── 0. AJUSTES SEGÚN CONFIG ───────────────────────────────── */
document.getElementById('p-title').textContent  = CONFIG.musica.titulo;
document.getElementById('p-artist').textContent = CONFIG.musica.artista;

document.querySelectorAll('[data-map]').forEach(a => {
  const url = CONFIG.mapas[a.dataset.map];
  if (url) { a.href = url; a.target = '_blank'; a.rel = 'noopener'; a.hidden = false; }
});

// Fotos de la galería: si aún no existen, se muestra un marco decorativo
document.querySelectorAll('.gallery-item img').forEach(img => {
  const mark = () => img.parentElement.classList.add('empty');
  if (img.complete && img.naturalWidth === 0) mark();
  img.addEventListener('error', mark);
});

/* ── 1. SOBRE + AUDIO ──────────────────────────────────────── */
const overlay = document.getElementById('overlay');
const audio   = document.getElementById('bg-audio');
const pBtn    = document.getElementById('p-btn');
const vinyl   = document.getElementById('vinyl');
const waves   = document.getElementById('waves');
const player  = document.getElementById('player');
let playing   = false;

function setPlaying(on) {
  playing = on;
  pBtn.textContent = on ? '⏸' : '▶';
  vinyl.classList.toggle('on', on);
  waves.classList.toggle('off', !on);
}

function tryPlay() {
  audio.volume = 0.6;
  audio.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
}

function openInvitation(e) {
  if (e) e.preventDefault();
  if (overlay.classList.contains('opening')) return;
  overlay.classList.add('opening');           // se rompe el sello, abre la solapa y sale la tarjeta
  tryPlay();
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  setTimeout(() => {
    overlay.classList.add('out');
    document.body.classList.remove('locked');
    player.classList.add('show');
  }, reduce ? 0 : 1900);
}
overlay.addEventListener('click', openInvitation);
overlay.addEventListener('keydown', e => {
  if (e.key === 'Enter' || e.key === ' ') openInvitation(e);
});

pBtn.addEventListener('click', () => {
  if (playing) { audio.pause(); setPlaying(false); } else { tryPlay(); }
});

/* ── 2. CUENTA REGRESIVA (hasta el inicio del día) ─────────── */
const [Y, M, D] = CONFIG.fecha.split('-').map(Number);
const EVENT_START = new Date(Y, M - 1, D, 0, 0, 0);
const EVENT_END   = new Date(Y, M - 1, D + 1, 0, 0, 0);
const pad = n => String(n).padStart(2, '0');
const grid = document.getElementById('countdown-grid');

function tick() {
  const now  = new Date();
  const diff = EVENT_START - now;
  if (diff <= 0) {
    if (now < EVENT_END) {
      grid.classList.add('is-done');
    } else {
      ['days', 'hours', 'minutes', 'seconds'].forEach(id => { document.getElementById(id).textContent = '00'; });
    }
    return;
  }
  document.getElementById('days').textContent    = pad(Math.floor(diff / 86400000));
  document.getElementById('hours').textContent   = pad(Math.floor(diff % 86400000 / 3600000));
  document.getElementById('minutes').textContent = pad(Math.floor(diff % 3600000 / 60000));
  document.getElementById('seconds').textContent = pad(Math.floor(diff % 60000 / 1000));
}
tick();
setInterval(tick, 1000);

/* ── 3. CALENDARIO (evento de día completo) ────────────────── */
const ymd = d => `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`;
const EVT = {
  title:    'Primera Comunión de Mariana',
  location: CONFIG.lugar,
  desc:     'Reserva todo el día para acompañar a Mariana en su Primera Comunión. Celebración en Casa Aurora. Hora por confirmar.',
  start:    ymd(EVENT_START),
  end:      ymd(EVENT_END),
};

function ics() {
  return [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Primera Comunion Mariana//ES', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:primera-comunion-mariana-${EVT.start}`,
    `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z`,
    `DTSTART;VALUE=DATE:${EVT.start}`, `DTEND;VALUE=DATE:${EVT.end}`,
    `SUMMARY:${EVT.title}`, `LOCATION:${EVT.location}`, `DESCRIPTION:${EVT.desc}`,
    'BEGIN:VALARM', 'TRIGGER:-P1D', 'ACTION:DISPLAY', 'DESCRIPTION:¡Mañana es la Primera Comunión de Mariana!', 'END:VALARM',
    'END:VEVENT', 'END:VCALENDAR'
  ].join('\r\n');
}

function dlICS() {
  const a = Object.assign(document.createElement('a'), {
    href: URL.createObjectURL(new Blob([ics()], { type: 'text/calendar' })),
    download: 'primera-comunion-mariana.ics'
  });
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

const calToggle = document.getElementById('cal-toggle');
const calDD     = document.getElementById('cal-dropdown');
const closeCal  = () => { calDD.classList.remove('open'); calToggle.setAttribute('aria-expanded', 'false'); };

calToggle.addEventListener('click', e => {
  e.stopPropagation();
  calToggle.setAttribute('aria-expanded', calDD.classList.toggle('open'));
});
document.addEventListener('click', closeCal);

document.getElementById('cal-google').addEventListener('click', () => {
  window.open('https://calendar.google.com/calendar/render?' + new URLSearchParams({
    action: 'TEMPLATE',
    text: EVT.title,
    dates: `${EVT.start}/${EVT.end}`,
    location: EVT.location,
    details: EVT.desc
  }), '_blank');
  closeCal();
});
document.getElementById('cal-apple').addEventListener('click',   () => { dlICS(); closeCal(); });
document.getElementById('cal-outlook').addEventListener('click', () => { dlICS(); closeCal(); });

/* ── 4. ÁLBUM — SUBIDA A GOOGLE DRIVE ──────────────────────── */
if (CONFIG.appsScriptUrl && CONFIG.driveFolderId) {
  document.getElementById('album').hidden = false;

  const photoInput   = document.getElementById('photo-input');
  const uploadZone   = document.getElementById('upload-zone');
  const uploadList   = document.getElementById('upload-list');
  const galleryFrame = document.getElementById('gallery-frame');
  galleryFrame.src = `https://drive.google.com/embeddedfolderview?id=${CONFIG.driveFolderId}#grid`;

  uploadZone.addEventListener('dragover',  e => { e.preventDefault(); uploadZone.classList.add('drag'); });
  uploadZone.addEventListener('dragleave', () => uploadZone.classList.remove('drag'));
  uploadZone.addEventListener('drop', e => {
    e.preventDefault();
    uploadZone.classList.remove('drag');
    processFiles([...e.dataTransfer.files].filter(f => f.type.startsWith('image/')));
  });
  photoInput.addEventListener('change', () => { processFiles([...photoInput.files]); photoInput.value = ''; });
  document.getElementById('gallery-reload').addEventListener('click', () => {
    const src = galleryFrame.src;
    galleryFrame.src = '';
    galleryFrame.src = src;
  });

  async function processFiles(files) {
    for (const file of files) {
      const item = addUploadItem(file.name);
      try {
        const b64 = await toBase64(file);
        await fetch(CONFIG.appsScriptUrl, {
          method: 'POST',
          mode: 'no-cors',
          body: JSON.stringify({ type: 'photo', filename: file.name.replace(/\.[^.]+$/, '.jpg'), mimeType: 'image/jpeg', data: b64 })
        });
        setUploadStatus(item, 'ok', '✓ Subida');
      } catch {
        setUploadStatus(item, 'err', 'Sin conexión. Intenta de nuevo.');
      }
    }
  }

  function toBase64(file) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        const MAX = 1600;
        let w = img.width, h = img.height;
        if (w > MAX || h > MAX) {
          if (w > h) { h = Math.round(h * MAX / w); w = MAX; } else { w = Math.round(w * MAX / h); h = MAX; }
        }
        const canvas = document.createElement('canvas');
        canvas.width = w; canvas.height = h;
        canvas.getContext('2d').drawImage(img, 0, 0, w, h);
        URL.revokeObjectURL(url);
        resolve(canvas.toDataURL('image/jpeg', 0.82).split(',')[1]);
      };
      img.onerror = reject;
      img.src = url;
    });
  }

  function addUploadItem(name) {
    const div = document.createElement('div');
    div.className = 'up-item';
    const n = Object.assign(document.createElement('span'), { className: 'up-name', textContent: name });
    const s = Object.assign(document.createElement('span'), { className: 'up-status loading', textContent: 'Subiendo…' });
    div.append(n, s);
    uploadList.appendChild(div);
    return div;
  }

  function setUploadStatus(item, type, text) {
    const s = item.querySelector('.up-status');
    s.textContent = text;
    s.className   = 'up-status ' + type;
  }
}

/* ── 5. RSVP ───────────────────────────────────────────────── */
const form    = document.getElementById('rsvp-form');
const formMsg = document.getElementById('form-msg');
const submit  = document.getElementById('rsvp-submit');

function showFormMsg(text, type) {
  formMsg.textContent = text;
  formMsg.className   = 'form-msg ' + type;
}

form.addEventListener('submit', async e => {
  e.preventDefault();
  const attend = form.querySelector('input[name=attend]:checked')?.value;
  const name   = document.getElementById('rsvp-name').value.trim();
  if (!attend) { showFormMsg('Cuéntame si podrás asistir.', 'err'); return; }
  if (!name)   { showFormMsg('Por favor escribe tu nombre.', 'err'); return; }

  const data = {
    attend, name,
    count: document.getElementById('rsvp-count').value,
    kids:  document.getElementById('rsvp-kids').value.trim(),
    msg:   document.getElementById('rsvp-msg').value.trim(),
  };
  const thanks = attend === 'si'
    ? `¡Gracias ${name}! Me alegra mucho que me acompañes. ♡`
    : `Gracias ${name} por avisarme. ¡Te tendré en mis oraciones!`;

  // Opción A: Google Apps Script
  if (CONFIG.appsScriptUrl) {
    submit.disabled = true;
    submit.textContent = 'Enviando…';
    try {
      await fetch(CONFIG.appsScriptUrl, { method: 'POST', mode: 'no-cors', body: JSON.stringify(data) });
      submit.textContent = '¡Enviado! ♡';
      showFormMsg(thanks, 'ok');
      form.reset();
    } catch {
      submit.disabled = false;
      submit.textContent = 'Confirmar';
      showFormMsg('Sin conexión. Intenta de nuevo.', 'err');
    }
    return;
  }

  // Opción B: WhatsApp
  if (CONFIG.whatsapp) {
    const lines = [
      '*Confirmación · Primera Comunión de Mariana*',
      `Nombre: ${name}`,
      `Asistencia: ${attend === 'si' ? 'Sí asistiré' : 'No podré asistir'}`,
      attend === 'si' ? `Personas: ${data.count}` : '',
      data.kids ? `Niños: ${data.kids}` : '',
      data.msg ? `Mensaje: ${data.msg}` : '',
    ].filter(Boolean);
    window.open(`https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(lines.join('\n'))}`, '_blank');
    showFormMsg(thanks, 'ok');
    return;
  }

  showFormMsg('La confirmación estará disponible muy pronto. ¡Gracias!', 'err');
});

/* ── 6. TRANSFERENCIA ──────────────────────────────────────── */
const btnTransfer = document.getElementById('btn-transferencia');
const modal       = document.getElementById('modal-transferencia');
if (CONFIG.banco.cuenta) {
  btnTransfer.hidden = false;
  document.getElementById('modal-bank').textContent    = CONFIG.banco.nombre;
  document.getElementById('modal-account').textContent = CONFIG.banco.cuenta;
  document.getElementById('modal-holder').textContent  = CONFIG.banco.titular;

  btnTransfer.addEventListener('click', e => { e.preventDefault(); modal.classList.add('active'); });
  document.getElementById('close-modal').addEventListener('click', () => modal.classList.remove('active'));
  modal.addEventListener('click', e => { if (e.target === modal) modal.classList.remove('active'); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') modal.classList.remove('active'); });

  const copyBtn = document.getElementById('copy-bank');
  copyBtn.addEventListener('click', () => {
    navigator.clipboard?.writeText(CONFIG.banco.cuenta).then(() => {
      copyBtn.textContent = '¡Copiado!';
      setTimeout(() => { copyBtn.textContent = 'Copiar número'; }, 2000);
    });
  });
}

/* ── 7. REVEAL AL HACER SCROLL ─────────────────────────────── */
const io = new IntersectionObserver(entries => {
  entries.forEach(en => {
    if (en.isIntersecting) { en.target.classList.add('active'); io.unobserve(en.target); }
  });
}, { threshold: 0.12 });
document.querySelectorAll('.reveal').forEach(el => io.observe(el));

/* ── 8. PARALLAX SUAVE ─────────────────────────────────────── */
const wc1 = document.querySelector('.watercolor-1');
const wc2 = document.querySelector('.watercolor-2');
window.addEventListener('scroll', () => {
  const s = window.pageYOffset;
  wc1.style.transform = `translateY(${s * .08}px)`;
  wc2.style.transform = `translateY(${s * -.05}px)`;
}, { passive: true });

/* ── 9. LOADER ─────────────────────────────────────────────── */
window.addEventListener('load', () => {
  setTimeout(() => {
    const loader = document.getElementById('loader');
    loader.style.opacity = '0';
    setTimeout(() => loader.remove(), 1000);
  }, 1200);
});
