/* script.js - Robust full implementation for Part 3
   - preserves your contact form IDs exactly:
     #contactForm, #name, #email, #contactType, #message, #contact-success
   - tabs, accordion (animated), modal/lightbox, gallery keyboard support
   - dynamic services + search/filter
   - contact + enquiry form validation + simulated AJAX + spinner + mailto fallback
   - Leaflet map init (graceful if L missing)
   - defensive coding so pages without elements won't crash
*/

/* ---------- short helpers ---------- */
const $ = sel => document.querySelector(sel);
const $$ = sel => Array.from(document.querySelectorAll(sel));

/* ---------- UTILS: set/clear error ---------- */
function setError(inputId, message) {
  const errorField = document.querySelector(`#${inputId}-error`);
  if (errorField) errorField.textContent = message;
}
function clearError(inputId) {
  const errorField = document.querySelector(`#${inputId}-error`);
  if (errorField) errorField.textContent = "";
}

/* ---------- TABS ---------- */
function initTabs() {
  const tabs = $$('.tab');
  const panels = $$('.tab-panel');
  if (!tabs.length || !panels.length) return;

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      panels.forEach(p => p.classList.remove('active'));
      const targetId = tab.dataset.target;
      if (targetId) {
        const target = document.getElementById(targetId);
        if (target) target.classList.add('active');
      }
    });
  });
}

/* ---------- ACCORDION (animated height) ---------- */
function initAccordion() {
  const buttons = $$('.accordion-btn');
  if (!buttons.length) return;

  buttons.forEach(btn => {
    const panel = btn.nextElementSibling;
    if (!panel) return;
    btn.addEventListener('click', () => {
      const isOpen = btn.classList.toggle('open');
      if (isOpen) {
        panel.classList.add('expanded');
        panel.style.maxHeight = panel.scrollHeight + 'px';
      } else {
        panel.style.maxHeight = null;
        panel.classList.remove('expanded');
      }
    });
  });
}

/* ---------- LIGHTBOX / GALLERY ---------- */
function initLightbox() {
  const galleryItems = $$('.gallery-item');
  const lightbox = $('#lightbox');
  const lbImg = $('#lightbox-img');
  const lbCaption = $('#lightbox-caption');

  if (!galleryItems.length || !lightbox || !lbImg) return;

  galleryItems.forEach(img => {
    // ensure keyboard accessible
    img.setAttribute('tabindex', img.getAttribute('tabindex') || '0');
    img.addEventListener('click', () => openLightbox(img));
    img.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') openLightbox(img);
    });
  });

  function openLightbox(img) {
    lbImg.src = img.src;
    lbImg.alt = img.alt || '';
    if (lbCaption) lbCaption.textContent = img.alt || '';
    lightbox.setAttribute('aria-hidden', 'false');
    // focus the close button if exists
    const close = lightbox.querySelector('.modal-close');
    if (close) setTimeout(() => close.focus(), 150);
  }

  // close handlers
  $$('.modal-close').forEach(btn => {
    btn.addEventListener('click', () => {
      const modal = btn.closest('.modal');
      if (modal) modal.setAttribute('aria-hidden', 'true');
    });
  });

  // click backdrop to close
  [ '#lightbox', '#infoModal' ].forEach(sel => {
    const modal = $(sel);
    if (modal) {
      modal.addEventListener('click', e => {
        if (e.target === modal) modal.setAttribute('aria-hidden', 'true');
      });
    }
  });

  // ESC to close
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      $$('.modal').forEach(m => m.setAttribute('aria-hidden', 'true'));
    }
  });
}

/* ---------- DYNAMIC SERVICES + SEARCH / FILTER ---------- */
const servicesData = [
  { id:1, title:'After-school Tutoring', category:'Education', desc:'Weekly tutoring for learners 5–18', keywords:['tutoring','education']},
  { id:2, title:'Community Garden', category:'Food Security', desc:'Volunteer to maintain gardens and harvest', keywords:['garden','food']},
  { id:3, title:'Skills Workshop', category:'Community Development', desc:'Tailored skills workshops (sewing, carpentry)', keywords:['workshop','skills']},
  { id:4, title:'Food Distribution', category:'Food Security', desc:'Monthly food parcels for families', keywords:['food','distribution']},
  { id:5, title:'Volunteer Mentorship', category:'Education', desc:'Become a mentor for young learners', keywords:['mentor','volunteer']}
];

function renderServices(list) {
  const container = $('#servicesList');
  if (!container) return;
  container.innerHTML = '';

  list.forEach(s => {
    const card = document.createElement('article');
    card.className = 'card';
    // embed data attributes for safety if needed later
    card.innerHTML = `
      <h3>${escapeHtml(s.title)}</h3>
      <p><strong>Category:</strong> ${escapeHtml(s.category)}</p>
      <p>${escapeHtml(s.desc)}</p>
      <button class="btn small more-btn" data-id="${s.id}">More</button>
    `;
    container.appendChild(card);
  });

  // wire more buttons after adding cards
  const moreBtns = container.querySelectorAll('.more-btn');
  moreBtns.forEach(b => {
    b.addEventListener('click', () => {
      const id = Number(b.dataset.id);
      const service = servicesData.find(x => x.id === id);
      if (!service) return;
      const infoModalContent = $('#infoModalContent');
      const infoModal = $('#infoModal');
      if (infoModalContent && infoModal) {
        infoModalContent.innerHTML = `
          <h3>${escapeHtml(service.title)}</h3>
          <p>${escapeHtml(service.desc)}</p>
          <p><strong>Category:</strong> ${escapeHtml(service.category)}</p>
        `;
        infoModal.setAttribute('aria-hidden', 'false');
        // focus close after a moment
        setTimeout(() => {
          const close = infoModal.querySelector('.modal-close');
          if (close) close.focus();
        }, 150);
      }
    });
  });
}

function initSearch() {
  const search = $('#searchInput');
  const filter = $('#filterSelect');
  if (!search || !filter) return;

  const cats = ['All', ...Array.from(new Set(servicesData.map(s => s.category)))];
  filter.innerHTML = cats.map(c => `<option value="${c.toLowerCase()}">${escapeHtml(c)}</option>`).join('');

  function applyFilter() {
    const q = (search.value || '').trim().toLowerCase();
    const fc = filter.value;
    const results = servicesData.filter(s => {
      const matchesQ = q === '' || s.title.toLowerCase().includes(q) || s.desc.toLowerCase().includes(q) || s.keywords.join(' ').includes(q);
      const matchesC = fc === 'all' || s.category.toLowerCase() === fc;
      return matchesQ && matchesC;
    });
    renderServices(results);
  }

  search.addEventListener('input', applyFilter);
  filter.addEventListener('change', applyFilter);
  renderServices(servicesData);
}

/* ---------- LEAFLET MAP ---------- */
function initMap() {
  // if map div not present or L not loaded, skip
  const mapEl = $('#map');
  if (!mapEl || typeof L === 'undefined') return;
  const coords = [-29.1211, 26.2140];
  try {
    const map = L.map('map').setView(coords, 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap contributors'
    }).addTo(map);
    L.marker(coords).addTo(map).bindPopup('Bloemfontein Community Support (BCS)').openPopup();
  } catch (err) {
    console.warn('Leaflet initialization failed', err);
  }
}

/* ---------- SPINNER helper ---------- */
function applySpinner(btn, turnOn = true) {
  if (!btn) return;
  if (turnOn) {
    btn.disabled = true;
    btn.classList.add('btn-spinner');
    // insert spinner if not present
    if (!btn.querySelector('.spinner')) {
      const s = document.createElement('span');
      s.className = 'spinner';
      s.setAttribute('aria-hidden', 'true');
      btn.prepend(s);
    }
  } else {
    btn.disabled = false;
    btn.classList.remove('btn-spinner');
    const spinner = btn.querySelector('.spinner');
    if (spinner) spinner.remove();
  }
}

/* ---------- ESCAPE HTML (safety for injected content) ---------- */
function escapeHtml(str) {
  if (typeof str !== 'string') return str;
  return str.replace(/[&<>"'`]/g, function (m) {
    return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;','`':'&#96;'})[m];
  });
}

/* ---------- CONTACT FORM: validation + simulated AJAX + mailto fallback ----------
   IMPORTANT: This preserves your exact contact form IDs:
   #contactForm, #name, #email, #contactType, #message, #contact-success
*/
function initContactForm() {
  const form = $('#contactForm');
  if (!form) return;
  const submitBtn = form.querySelector('button[type="submit"]');

  form.addEventListener('submit', function (e) {
    e.preventDefault();

    const name = ($('#name') ? $('#name').value.trim() : '');
    const email = ($('#email') ? $('#email').value.trim() : '');
    const type = ($('#contactType') ? $('#contactType').value : 'general');
    const message = ($('#message') ? $('#message').value.trim() : '');

    // clear previous
    clearError('name'); clearError('email'); clearError('message');
    const successEl = $('#contact-success');
    if (successEl) successEl.textContent = '';

    let valid = true;
    if (name.length < 3) { setError('name', 'Name must be at least 3 characters.'); valid = false; }
    if (!/^\S+@\S+\.\S+$/.test(email)) { setError('email', 'Enter a valid email address.'); valid = false; }
    if (message.length < 10) { setError('message', 'Message must be at least 10 characters.'); valid = false; }
    if (!valid) return;

    // show spinner on button
    applySpinner(submitBtn, true);

    // Simulate AJAX save
    setTimeout(() => {
      applySpinner(submitBtn, false);

      // Save locally for demonstration (replace with real backend)
      try {
        const saved = JSON.parse(localStorage.getItem('bcs_messages') || '[]');
        saved.push({ type:'contact', name, email, message, contactType: type, ts: Date.now() });
        localStorage.setItem('bcs_messages', JSON.stringify(saved));
      } catch (err) {
        console.warn('localStorage save failed', err);
      }

      // Typing auto response into success element
      const out = $('#contact-success');
      if (out) {
        autoType(out, 'Thank you! Your message was received. An email draft has been prepared for your convenience.', 20, () => {
          // create mailto link for user to send
          const subject = encodeURIComponent(`BCS Contact — ${type} — ${name}`);
          const body = encodeURIComponent(`Name: ${name}\nEmail: ${email}\nType: ${type}\n\nMessage:\n${message}`);
          const mailtoLink = document.createElement('a');
          mailtoLink.href = `mailto:info@bcs.org.za?subject=${subject}&body=${body}`;
          mailtoLink.textContent = 'Open email client to send';
          mailtoLink.className = 'btn';
          out.appendChild(document.createElement('br'));
          out.appendChild(mailtoLink);
        });
      }

      form.reset();
    }, 1100);
  });
}

/* ---------- ENQUIRY FORM: validation + simulated AJAX ----------
   IMPORTANT: preserves your enquiry form IDs used earlier:
   #enquiry-form, #fullName, #phone, #enquiryType, #details, #enquiry-success
*/
function initEnquiryForm() {
  const form = $('#enquiry-form');
  if (!form) return;
  const submitBtn = form.querySelector('button[type="submit"]');

  form.addEventListener('submit', function (e) {
    e.preventDefault();

    const fullName = ($('#fullName') ? $('#fullName').value.trim() : '');
    const phone = ($('#phone') ? $('#phone').value.trim() : '');
    const type = ($('#enquiryType') ? $('#enquiryType').value : 'services');
    const details = ($('#details') ? $('#details').value.trim() : '');

    // clear
    clearError('fullName'); clearError('phone'); clearError('details');
    const out = $('#enquiry-success'); if (out) out.textContent = '';

    let valid = true;
    if (fullName.length < 3) { setError('fullName', 'Full name must be at least 3 characters.'); valid = false; }
    if (!/^[0-9]{10}$/.test(phone)) { setError('phone', 'Phone number must be exactly 10 digits.'); valid = false; }
    if (details.length < 5) { setError('details', 'Please enter more details.'); valid = false; }
    if (!valid) return;

    applySpinner(submitBtn, true);

    setTimeout(() => {
      applySpinner(submitBtn, false);

      // store simulated
      try {
        const store = JSON.parse(localStorage.getItem('bcs_enquiries') || '[]');
        store.push({ fullName, phone, type, details, ts: Date.now() });
        localStorage.setItem('bcs_enquiries', JSON.stringify(store));
      } catch (err) {
        console.warn('localStorage save failed', err);
      }

      let response = '';
      if (type === 'volunteer') response = 'Thank you for your interest in volunteering. There is no cost to volunteer. We will contact you about available slots.';
      else if (type === 'sponsor') response = 'Sponsorship packages start at R500 per month. We will email you a sponsorship brochure.';
      else response = 'Our community services are offered depending on availability. We will check and get back to you.';

      if (out) autoType(out, response, 20);
      form.reset();
    }, 900);
  });
}

/* ---------- Auto-type (typing animation) ---------- */
function autoType(container, text, speed = 25, cb) {
  if (!container) return;
  container.textContent = '';
  let i = 0;
  const tid = setInterval(() => {
    container.textContent += text[i++] || '';
    if (i > text.length) {
      clearInterval(tid);
      if (typeof cb === 'function') cb();
    }
  }, speed);
}

/* ---------- INITIALIZE EVERYTHING (defensive) ---------- */
document.addEventListener('DOMContentLoaded', () => {
  try {
    initTabs();
    initAccordion();
    initLightbox();
    initSearch();
    initMap();
    initContactForm();
    initEnquiryForm();
  } catch (err) {
    console.error('Script initialization error:', err);
  }
});