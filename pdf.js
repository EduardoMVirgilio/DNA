// ── PDF GENERATION ──
let isPdfLibLoaded = false;

// Cargar la librería dinámicamente
function loadPDFLibrary() {
  if (isPdfLibLoaded || document.getElementById('jspdf-script')) return;
  
  const script = document.createElement('script');
  script.id = 'jspdf-script';
  script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
  script.onload = () => {
    isPdfLibLoaded = true;
    const btn = document.querySelector('.btn-pdf');
    if (btn && btn.dataset.waiting === 'true') {
      btn.dataset.waiting = 'false';
      btn.innerHTML = btn.dataset.originalHtml;
      generatePDF();
    }
  };
  document.body.appendChild(script);
}

function generatePDF() {
  // Si la librería aún no está disponible
  if (!window.jspdf) {
    const btn = document.querySelector('.btn-pdf');
    if (btn) {
      if (!btn.dataset.originalHtml) btn.dataset.originalHtml = btn.innerHTML;
      btn.dataset.waiting = 'true';
      btn.innerHTML = 'Cargando librería...';
    }
    loadPDFLibrary();
    return;
  }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });

  const W = 210, H = 297;
  const ml = 22, mr = 22;
  const cw = W - ml - mr;
  let y = 0;

  const C = {
    ink:    [26, 26, 24],
    soft:   [90, 90, 84],
    faint:  [160, 160, 155],
    paper:  [247, 245, 240],
    warm:   [237, 233, 224],
    accent: [200, 169, 110],
    white:  [255, 255, 255],
  };

  const addPage = () => {
    doc.addPage();
    y = 24;
    // subtle page bg
    doc.setFillColor(...C.paper);
    doc.rect(0, 0, W, H, 'F');
    // page number
    const pn = doc.internal.getCurrentPageInfo().pageNumber;
    doc.setFontSize(8);
    doc.setTextColor(...C.faint);
    doc.setFont('helvetica', 'normal');
    doc.text(`ADN de Marca · ${val('q_nombre') !== '—' ? val('q_nombre') : 'Mi Marca'}`, ml, H - 10);
    doc.text(String(pn), W - mr, H - 10, { align: 'right' });
  };

  const checkY = (need) => { if (y + need > H - 18) addPage(); };

  const txtLines = (text, x, maxW, size) => {
    doc.setFontSize(size || 10);
    return doc.splitTextToSize(text, maxW);
  };

  // ── COVER ──
  doc.setFillColor(...C.ink);
  doc.rect(0, 0, W, H, 'F');

  // accent bar
  doc.setFillColor(...C.accent);
  doc.rect(0, 0, 4, H, 'F');

  // label
  doc.setTextColor(...C.accent);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('HERRAMIENTA DE MARCA', ml, 55, { charSpace: 1.5 });

  // main title
  const nombre = val('q_nombre') !== '—' ? val('q_nombre') : 'Mi Marca';
  doc.setTextColor(...C.paper);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(36);
  const nameLines = doc.splitTextToSize(nombre, cw);
  doc.text(nameLines, ml, 72);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(18);
  doc.setTextColor(...C.accent);
  doc.text('ADN de Marca', ml, 72 + nameLines.length * 13 + 5);

  // propuesta
  if (val('q_propuesta') !== '—') {
    doc.setFontSize(11);
    doc.setTextColor(180, 178, 170);
    doc.setFont('helvetica', 'normal');
    const pLines = doc.splitTextToSize(val('q_propuesta'), cw - 20);
    doc.text(pLines, ml, 72 + nameLines.length * 13 + 22);
  }

  // mantra box
  if (val('q_mantra') !== '—') {
    const boxY = H - 80;
    doc.setFillColor(42, 40, 38);
    doc.roundedRect(ml, boxY, cw, 44, 3, 3, 'F');
    doc.setFontSize(8);
    doc.setTextColor(...C.accent);
    doc.setFont('helvetica', 'bold');
    doc.text('MANTRA DE MARCA', ml + 12, boxY + 13, { charSpace: 1 });
    doc.setFontSize(16);
    doc.setTextColor(...C.paper);
    doc.text(val('q_mantra'), ml + 12, boxY + 27);
  }

  // date
  doc.setFontSize(9);
  doc.setTextColor(100, 98, 92);
  doc.setFont('helvetica', 'normal');
  const dateStr = new Date().toLocaleDateString('es-AR', { year: 'numeric', month: 'long', day: 'numeric' });
  doc.text(dateStr, ml, H - 14);

  // ── PAGE 2+ ──
  addPage();

  // Helpers
  const sectionHeader = (num, title) => {
    checkY(20);
    doc.setFillColor(...C.ink);
    doc.rect(ml - 6, y - 5, cw + 12, 14, 'F');
    doc.setFillColor(...C.accent);
    doc.rect(ml - 6, y - 5, 3, 14, 'F');
    doc.setTextColor(...C.paper);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text(`${num}  ·  ${title.toUpperCase()}`, ml, y + 4, { charSpace: 0.5 });
    y += 18;
  };

  const question = (label, answer) => {
    if (answer === '—') return;
    checkY(16);
    // label
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...C.soft);
    const lblLines = txtLines(label, ml, cw, 8.5);
    doc.text(lblLines, ml, y);
    y += lblLines.length * 4.5 + 2;

    // answer
    doc.setFontSize(10.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...C.ink);
    const ansLines = txtLines(answer, ml + 4, cw - 8, 10.5);
    checkY(ansLines.length * 5.5 + 6);
    doc.text(ansLines, ml + 4, y);
    y += ansLines.length * 5.5 + 10;
  };

  const sliderRow = (label, leftTxt, rightTxt, rawVal) => {
    checkY(18);
    const v = parseInt(rawVal);
    const barX = ml + 4;
    const barW = cw - 8;

    // label
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...C.soft);
    doc.text(label, ml + 4, y);

    // side labels
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...C.faint);
    doc.text(leftTxt, barX, y + 8);
    doc.text(rightTxt, barX + barW, y + 8, { align: 'right' });

    // bar
    doc.setFillColor(...C.warm);
    doc.rect(barX, y + 10, barW, 2.5, 'F');
    const fillW = ((v - 1) / 9) * barW;
    doc.setFillColor(...C.accent);
    doc.rect(barX, y + 10, fillW, 2.5, 'F');

    // thumb
    const thumbX = barX + fillW;
    doc.setFillColor(...C.ink);
    doc.circle(thumbX, y + 11.25, 2.5, 'F');

    // value
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...C.ink);
    doc.text(String(v), thumbX, y + 8, { align: 'center' });

    y += 22;
  };

  const spacer = (n = 4) => { y += n; };

  // ── SECTION 1 ──
  sectionHeader('01', 'Tu propuesta en el mundo');
  question('Nombre o proyecto', val('q_nombre'));
  question('Tipo de clases o sesiones', val('q_servicio'));
  question('Propuesta de valor en una oración', val('q_propuesta'));
  question('Experiencia en el campo', getChips('chips_exp'));
  spacer(4);

  // ── SECTION 2 ──
  sectionHeader('02', 'Tu cliente ideal');
  question('¿A quién ayudás principalmente?', val('q_cliente'));
  question('Problema o deseo principal del cliente', val('q_problema'));
  question('Cómo se siente el cliente después de trabajar con vos', val('q_resultado'));
  question('Perfil de tus alumnos / clientes', getChips('chips_perfil'));
  spacer(4);

  // ── SECTION 3 ──
  sectionHeader('03', 'Personalidad de marca');
  question('Palabras que definen tu marca', getChips('chips_personalidad'));
  spacer(6);
  sliderRow('Tono general', 'Formal y profesional', 'Informal y cercano', sliderVal('s_formalidad'));
  sliderRow('Enfoque', 'Racional y técnica', 'Emocional e intuitiva', sliderVal('s_emocional'));
  sliderRow('Estética', 'Clásica y tradicional', 'Moderna e innovadora', sliderVal('s_moderna'));
  sliderRow('Posicionamiento', 'Exclusiva y premium', 'Accesible y para todos', sliderVal('s_accesible'));
  spacer(4);

  // ── SECTION 4 ──
  sectionHeader('04', 'Tu diferencial');
  question('¿Qué hacés diferente a otros?', val('q_diferencial'));
  question('Qué no hacés o en qué no cedés', val('q_nohace'));
  question('Tu filosofía central de enseñanza', val('q_filosofia'));
  question('Palabras que jamás usarías', val('q_nowords'));
  spacer(4);

  // ── SECTION 5 ──
  sectionHeader('05', 'Comunicación y presencia');
  question('¿Cómo conseguís tus clientes?', getChips('chips_canales'));
  question('Tu estilo de comunicación', val('q_comstyle'));
  question('Primera impresión que querés generar', val('q_primeraimpresion'));
  question('Lo que un cliente diría al recomendarte', val('q_recomendacion'));
  spacer(4);

  // ── SECTION 6 ──
  sectionHeader('06', 'Visión y propósito');
  question('¿Por qué empezaste con esto?', val('q_porque'));
  question('¿Cómo imaginás tu proyecto en 3 años?', val('q_vision'));
  question('Tu mantra de marca', val('q_mantra'));
  question('Algo más que quieras expresar', val('q_libre'));
  spacer(8);

  // ── CIERRE ──
  checkY(55);
  doc.setFillColor(...C.ink);
  doc.roundedRect(ml - 6, y, cw + 12, 48, 3, 3, 'F');
  doc.setFillColor(...C.accent);
  doc.rect(ml - 6, y, 3, 48, 'F');

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...C.accent);
  doc.text('TU ESENCIA EN TRES PALABRAS', ml + 8, y + 13, { charSpace: 1 });

  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...C.paper);
  const mantra = val('q_mantra') !== '—' ? val('q_mantra') : 'Tu mantra aquí';
  doc.text(mantra, ml + 8, y + 28);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(160, 158, 152);
  if (val('q_propuesta') !== '—') {
    const pLine = doc.splitTextToSize(val('q_propuesta'), cw - 20)[0];
    doc.text(pLine, ml + 8, y + 40);
  }

  // ── SAVE ──
  const fname = (val('q_nombre') !== '—' ? val('q_nombre').replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_\-áéíóúüñÁÉÍÓÚÜÑ]/g, '') : 'MiMarca') + '_ADN-Marca.pdf';
  doc.save(fname);
}
