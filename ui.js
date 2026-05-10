let current = 1;
const total = 6;

// ── CHIP LOGIC ──
function setupUI() {
  document.querySelectorAll('.chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const group = chip.dataset.group;
      const isSingle = chip.dataset.single === 'true';
      if (isSingle) {
        document.querySelectorAll(`[data-group="${group}"]`).forEach(c => c.classList.remove('selected'));
      }
      chip.classList.toggle('selected');
      
      // Limpiar estilos de error si los había
      chip.parentElement.style.border = '';
      chip.parentElement.style.padding = '';
      
      saveState();
    });
  });
  
  document.querySelectorAll('input, textarea').forEach(el => {
    el.addEventListener('input', () => {
      // Limpiar estilos de error
      el.style.borderColor = '';
      el.style.boxShadow = '';
      saveState();
    });
  });
  
  restoreState();
  updateSidebarNav();
}

// ── SLIDER LOGIC ──
function updateSlider(sliderId, valId) {
  const val = document.getElementById(sliderId).value;
  document.getElementById(valId).textContent = val + ' / 10';
}

// ── NAVIGATION ──
function navigate(dir) {
  if (dir === 1 && !validateSection(current)) {
    const btn = document.getElementById('btn-next');
    const originalText = btn.textContent;
    btn.textContent = 'Faltan respuestas';
    btn.style.backgroundColor = 'rgba(239, 68, 68, 0.9)'; // rojo de alerta
    btn.style.boxShadow = '0 4px 15px rgba(239, 68, 68, 0.4)';
    setTimeout(() => {
      btn.textContent = originalText;
      btn.style.backgroundColor = '';
      btn.style.boxShadow = '';
    }, 2000);
    return;
  }

  const next = current + dir;
  if (next < 1 || next > total + 1) return;

  document.getElementById('s' + current)?.classList.remove('active');
  current = next;

  if (current > total) {
    document.getElementById('quiz-main').style.display = 'none';
    const done = document.getElementById('done-screen');
    done.style.display = 'block';
    updateMantraPreview();
    if (typeof loadPDFLibrary === 'function') loadPDFLibrary();
    return;
  }

  const sec = document.getElementById('s' + current);
  if (sec) {
    sec.classList.remove('active');
    void sec.offsetWidth; // force reflow for animation
    sec.classList.add('active');
  }

  document.getElementById('progress-fill').style.width = ((current / total) * 100) + '%';
  document.getElementById('step-indicator').textContent = current + ' de ' + total;
  document.getElementById('btn-prev').disabled = current === 1;
  document.getElementById('btn-next').textContent = current === total ? 'Finalizar ✓' : 'Siguiente →';

  updateSidebarNav();
  saveState();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function goToSection(n) {
  if (n > current) return; // only go back via sidebar
  document.getElementById('s' + current)?.classList.remove('active');
  current = n;
  document.getElementById('s' + current)?.classList.add('active');
  document.getElementById('progress-fill').style.width = ((current / total) * 100) + '%';
  document.getElementById('step-indicator').textContent = current + ' de ' + total;
  document.getElementById('btn-prev').disabled = current === 1;
  document.getElementById('btn-next').textContent = current === total ? 'Finalizar ✓' : 'Siguiente →';
  updateSidebarNav();
  saveState();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function updateSidebarNav() {
  document.querySelectorAll('#sidebar-nav .nav-item').forEach((item, idx) => {
    const sNum = idx + 1;
    item.classList.remove('active', 'done');
    if (sNum === current) item.classList.add('active');
    else if (sNum < current) item.classList.add('done');
  });
}

// ── VALIDATION ──
function validateSection(secNum) {
  const sec = document.getElementById('s' + secNum);
  if (!sec) return true;
  
  let isValid = true;
  
  // Validar inputs de texto y textareas (q_libre es opcional)
  const inputs = sec.querySelectorAll('input[type="text"], textarea');
  inputs.forEach(el => {
    if (el.id === 'q_libre') return; 
    
    if (!el.value.trim()) {
      isValid = false;
      el.style.borderColor = 'rgba(239, 68, 68, 0.6)';
      el.style.boxShadow = '0 0 0 1px rgba(239, 68, 68, 0.6)';
    }
  });
  
  // Validar grupos de chips
  const chipGroups = new Set([...sec.querySelectorAll('.chip')].map(c => c.dataset.group));
  chipGroups.forEach(group => {
    const selected = sec.querySelectorAll(`.chip[data-group="${group}"].selected`);
    if (selected.length === 0) {
      isValid = false;
      const container = sec.querySelector(`.chip[data-group="${group}"]`).parentElement;
      container.style.border = '1px solid rgba(239, 68, 68, 0.6)';
      container.style.padding = '8px';
      container.style.borderRadius = 'var(--radius-md)';
    }
  });
  
  return isValid;
}

// ── HELPERS ──
function val(id) {
  const el = document.getElementById(id);
  return el ? (el.value.trim() || '—') : '—';
}

function getChips(groupId) {
  const selected = [...document.querySelectorAll(`[data-group="${groupId}"].selected`)].map(c => c.textContent);
  return selected.length ? selected.join(', ') : '—';
}

function sliderVal(id) {
  const el = document.getElementById(id);
  return el ? el.value : '5';
}

function updateMantraPreview() {
  const mantra = val('q_mantra');
  const propuesta = val('q_propuesta');
  document.getElementById('mantra-display').textContent = mantra !== '—' ? mantra : 'Sin definir aún';
  document.getElementById('propuesta-display').textContent = propuesta !== '—' ? propuesta : '';
}

// ── RESET ──
function resetQuiz() {
  localStorage.removeItem('adn_marca_state');
  current = 1;
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  document.getElementById('s1').classList.add('active');
  document.getElementById('done-screen').style.display = 'none';
  document.getElementById('quiz-main').style.display = 'block';
  document.getElementById('progress-fill').style.width = '16.66%';
  document.getElementById('step-indicator').textContent = '1 de 6';
  document.getElementById('btn-prev').disabled = true;
  document.getElementById('btn-next').textContent = 'Siguiente →';
  document.querySelectorAll('input[type="text"], textarea').forEach(el => el.value = '');
  document.querySelectorAll('.chip.selected').forEach(c => c.classList.remove('selected'));
  document.querySelectorAll('input[type="range"]').forEach(el => {
    el.value = 5;
  });
  ['v_formalidad','v_emocional','v_moderna','v_accesible'].forEach(id => {
    document.getElementById(id).textContent = '5 / 10';
  });
  
  // Limpiar estilos de error si habían
  document.querySelectorAll('input, textarea').forEach(el => {
    el.style.borderColor = '';
    el.style.boxShadow = '';
  });
  document.querySelectorAll('.chips').forEach(container => {
    container.style.border = '';
    container.style.padding = '';
  });

  updateSidebarNav();
  window.scrollTo({ top: 0 });
}

// ── LOCAL STORAGE LOGIC ──
function saveState() {
  const state = {
    current: current,
    inputs: {},
    chips: {}
  };
  
  document.querySelectorAll('input[type="text"], textarea, input[type="range"]').forEach(el => {
    if (el.id) state.inputs[el.id] = el.value;
  });
  
  document.querySelectorAll('.chip.selected').forEach(chip => {
    if (!state.chips[chip.dataset.group]) state.chips[chip.dataset.group] = [];
    state.chips[chip.dataset.group].push(chip.textContent);
  });
  
  localStorage.setItem('adn_marca_state', JSON.stringify(state));
}

function restoreState() {
  const saved = localStorage.getItem('adn_marca_state');
  if (!saved) return;
  
  try {
    const state = JSON.parse(saved);
    
    // Restaurar inputs de texto, textareas y rangos
    if (state.inputs) {
      for (const [id, value] of Object.entries(state.inputs)) {
        const el = document.getElementById(id);
        if (el) {
          el.value = value;
          // Si es slider, actualizar su texto visual
          if (el.type === 'range') {
            const valId = 'v_' + id.split('_')[1];
            const displayEl = document.getElementById(valId);
            if (displayEl) displayEl.textContent = value + ' / 10';
          }
        }
      }
    }
    
    // Restaurar chips seleccionados
    if (state.chips) {
      document.querySelectorAll('.chip').forEach(c => c.classList.remove('selected'));
      for (const [group, texts] of Object.entries(state.chips)) {
        document.querySelectorAll(`[data-group="${group}"]`).forEach(chip => {
          if (texts.includes(chip.textContent)) {
            chip.classList.add('selected');
          }
        });
      }
    }
    
    // Restaurar posición actual
    if (state.current) {
      current = state.current;
      document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
      
      if (current > total) {
        // Estaba en la pantalla final
        document.getElementById('quiz-main').style.display = 'none';
        document.getElementById('done-screen').style.display = 'block';
        updateMantraPreview();
        if (typeof loadPDFLibrary === 'function') loadPDFLibrary();
      } else {
        // Está en alguna de las 6 pantallas
        const sec = document.getElementById('s' + current);
        if (sec) sec.classList.add('active');
        
        document.getElementById('progress-fill').style.width = ((current / total) * 100) + '%';
        document.getElementById('step-indicator').textContent = current + ' de ' + total;
        document.getElementById('btn-prev').disabled = current === 1;
        document.getElementById('btn-next').textContent = current === total ? 'Finalizar ✓' : 'Siguiente →';
      }
    }
  } catch (e) {
    console.error('Error al restaurar el estado desde LocalStorage:', e);
  }
}
