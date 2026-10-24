/* ==========================================================================
   עץ מרקט — main.js
   Header (sticky, mega menu, mobile drawer, search), home sections,
   deck calculator, reveal-on-enter, accessibility widget.
   No dependencies (store = calm motion, per design-brief §10).
   ========================================================================== */
import { CATEGORIES, PRODUCTS, GUIDES, DECK_TYPES, TONES, getProduct } from './data.js';
import { searchLocal, subscribeNewsletter } from './commerce.js';
import { cart, wishlist, initCart, flyToCart, toast, openCart, fmt } from './cart.js';
import { url } from './routes.js';
import { productCard, cardVariant, catCard, guideCard, observeReveal, autoReveal } from './ui.js';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const html = document.documentElement;

/* ---------------- Render: mega menu + drawer categories ---------------- */
function renderMenus() {
  const cols = $('[data-mega-cols]');
  if (cols) cols.innerHTML = CATEGORIES.map(c => `
    <div class="mega-col">
      <h3><a href="${url.category(c.id)}">${c.name} <small>(${c.count})</small></a></h3>
      <ul>${c.subs.map(s => `<li><a href="${url.category(c.id, s)}">${s}</a></li>`).join('')}</ul>
    </div>`).join('');
  const dc = $('[data-drawer-cats]');
  if (dc) dc.innerHTML = CATEGORIES.map(c => `<li><a href="${url.category(c.id)}">${c.short}</a></li>`).join('');
}

/* ---------------- Render: home sections (each guarded — safe on every page) ---------------- */
function renderHome() {
  const cg = $('[data-cat-grid]');
  if (cg) cg.innerHTML = CATEGORIES.map(catCard).join('');

  const pg = $('[data-product-grid]');
  if (pg) pg.innerHTML = PRODUCTS.map((p, i) => productCard(p, i)).join('');

  const gg = $('[data-guide-grid]');
  if (gg) gg.innerHTML = GUIDES.slice(0, 3).map((g, i) => guideCard(g, i)).join('');
}

/* ---------------- Product interactions (any [data-add] / [data-wish] on any page) ----------------
   <button data-add="<id>" [data-qty="3"]>  → adds to cart with fly-dot + toast
   <button data-wish="<id>" aria-pressed>    → toggles wishlist                                  */
function initProductActions() {
  document.addEventListener('click', e => {
    const add = e.target.closest('[data-add]');
    if (add) {
      const p = getProduct(add.dataset.add);
      if (!p) return;
      const label = add.textContent;
      const card = add.closest('.p-card');
      const picks = card && p.variants?.length ? p.variants.map((_, vi) => Number(card.querySelector(`[data-pv="${vi}"]:checked`)?.value || 0)) : null;
      const v = picks ? cardVariant(p, picks) : null;
      cart.add(p.id, Number(add.dataset.qty) || 1, v ? { variant: v.variant, price: v.unit } : {});
      flyToCart(add);
      add.classList.add('added'); add.textContent = 'נוסף לסל ✓';
      setTimeout(() => { add.classList.remove('added'); add.textContent = label; }, 1800);
      toast(`<strong>${p.name}</strong> נוסף לסל`, { label: 'לצפייה בסל', fn: openCart });
    }
    // variant chip in a card → update that card's price
    const pv = e.target.closest('[data-pv]');
    if (pv) {
      const card = pv.closest('.p-card'), p = getProduct(card.querySelector('[data-add]')?.dataset.add);
      if (!p) return;
      const { unit } = cardVariant(p, p.variants.map((_, vi) => Number(card.querySelector(`[data-pv="${vi}"]:checked`)?.value || 0)));
      card.querySelector('.p-price .now').textContent = fmt(unit);
      const was = card.querySelector('.p-price s');
      if (was) was.hidden = unit !== p.price;
    }
    const w = e.target.closest('[data-wish]');
    if (w) {
      const on = wishlist.toggle(w.dataset.wish);
      w.setAttribute('aria-pressed', on);
      w.classList.remove('pop'); void w.offsetWidth; w.classList.add('pop');
    }
  });
}

/* ---------------- Header: scroll state ---------------- */
function initHeader() {
  const header = $('#site-header');
  if (!header) return;
  const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 40);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });
}

/* ---------------- Mega menu ---------------- */
function initMega() {
  const btn = $('.nav-mega-btn');
  const mega = $('#mega');
  if (!btn || !mega) return;
  let t;
  const open = () => {
    clearTimeout(t);
    if (!mega.hidden) return;
    mega.hidden = false; btn.setAttribute('aria-expanded', 'true');
    requestAnimationFrame(() => mega.classList.add('is-open'));
  };
  const close = (focusBtn) => {
    clearTimeout(t);
    if (mega.hidden) return;
    mega.classList.remove('is-open'); btn.setAttribute('aria-expanded', 'false');
    setTimeout(() => { if (!mega.classList.contains('is-open')) mega.hidden = true; }, 240);
    if (focusBtn) btn.focus();
  };
  btn.addEventListener('click', () => (mega.hidden ? open() : close()));
  // hover intent (desktop pointers only)
  const hoverable = matchMedia('(hover: hover)').matches;
  if (hoverable) {
    [btn.parentElement, mega].forEach(el => {
      el.addEventListener('mouseenter', () => { clearTimeout(t); t = setTimeout(open, 120); });
      el.addEventListener('mouseleave', () => { clearTimeout(t); t = setTimeout(() => close(), 220); });
    });
  }
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && !mega.hidden) close(true); });
  document.addEventListener('click', e => { if (!mega.hidden && !e.target.closest('#mega, .nav-mega-btn')) close(); });
  mega.addEventListener('focusout', e => { if (!mega.contains(e.relatedTarget) && e.relatedTarget !== btn) close(); });
}

/* ---------------- Mobile drawer ---------------- */
function initDrawer() {
  const drawer = $('#drawer');
  const scrim = $('[data-scrim]');
  const toggles = $$('[data-open-drawer]');
  if (!drawer) return;
  let last;
  const open = () => {
    last = document.activeElement;
    drawer.hidden = false;
    requestAnimationFrame(() => drawer.classList.add('is-open'));
    toggles.forEach(b => b.setAttribute('aria-expanded', 'true'));
    document.body.style.overflow = 'hidden';
    setTimeout(() => $('[data-close-drawer]', drawer).focus(), 60);
  };
  const close = () => {
    if (drawer.hidden) return;
    drawer.classList.remove('is-open');
    toggles.forEach(b => b.setAttribute('aria-expanded', 'false'));
    document.body.style.overflow = '';
    setTimeout(() => { drawer.hidden = true; }, 450);
    last?.focus?.();
  };
  toggles.forEach(b => b.addEventListener('click', open));
  $('[data-close-drawer]', drawer).addEventListener('click', close);
  drawer.addEventListener('click', e => { if (e.target.closest('a')) close(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
  document.addEventListener('scrim-close', close);
  drawer.addEventListener('keydown', e => {
    if (e.key !== 'Tab') return;
    const f = $$('a[href], button', drawer);
    if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f.at(-1).focus(); }
    else if (!e.shiftKey && document.activeElement === f.at(-1)) { e.preventDefault(); f[0].focus(); }
  });
  matchMedia('(min-width: 901px)').addEventListener('change', e => { if (e.matches) close(); });
  if (scrim) scrim.hidden = scrim.hidden; // shared with cart
}

/* ---------------- Search with live suggestions ---------------- */
function initSearch() {
  const form = $('#hdr-search');
  const input = $('#q');
  const box = $('#suggest');
  if (!form) return;
  if (document.body.dataset.page === 'search') input.value = new URLSearchParams(location.search).get('q') || '';
  let idx = -1;
  const esc = s => s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const hl = (label, q) => esc(label).replace(esc(q), m => `<mark>${m}</mark>`);
  const render = () => {
    const q = input.value.trim();
    idx = -1;
    if (q.length < 2) { box.hidden = true; input.setAttribute('aria-expanded', 'false'); return; }
    const hits = searchLocal(q);
    box.innerHTML = hits.length
      ? hits.map((h, i) => `<a role="option" id="sg-${i}" href="${h.href}" aria-selected="false"><span>${hl(h.label, q)}</span><small>${h.type}</small></a>`).join('')
        + `<a role="option" id="sg-all" href="${url.search(q)}" aria-selected="false"><span>כל התוצאות עבור "${esc(q)}"</span><small>חיפוש</small></a>`
      : `<p class="sg-empty">לא מצאנו "${esc(q)}". נסו "דק", "קורה" או "דיקט" — או התקשרו ונעזור.</p>`;
    box.hidden = false; input.setAttribute('aria-expanded', 'true');
  };
  input.addEventListener('input', render);
  input.addEventListener('focus', render);
  input.addEventListener('keydown', e => {
    const opts = $$('a', box);
    if (box.hidden || !opts.length) return;
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      idx = (idx + (e.key === 'ArrowDown' ? 1 : -1) + opts.length) % opts.length;
      opts.forEach((o, i) => o.setAttribute('aria-selected', i === idx));
      input.setAttribute('aria-activedescendant', opts[idx].id);
    } else if (e.key === 'Enter' && idx >= 0) {
      e.preventDefault(); location.href = opts[idx].href;
    } else if (e.key === 'Escape') {
      box.hidden = true;
    }
  });
  document.addEventListener('click', e => { if (!e.target.closest('#hdr-search')) box.hidden = true; });

  // mobile: search as a top sheet
  const openSheet = () => { html.classList.add('search-open'); setTimeout(() => input.focus(), 30); };
  const closeSheet = () => { html.classList.remove('search-open'); box.hidden = true; };
  $$('[data-open-search]').forEach(b => b.addEventListener('click', openSheet));
  $('.hdr-search-close', form).addEventListener('click', closeSheet);
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && html.classList.contains('search-open')) closeSheet(); });
}

/* ---------------- Deck calculator (short) ---------------- */
function initCalc() {
  const form = $('#calc-form');
  if (!form) return;
  const typesEl = $('[data-deck-types]', form);
  const deckTone = { ipe: TONES.ipe, bamboo: TONES.oak, composite: '#7D7268', pine: TONES.pine };
  typesEl.innerHTML = DECK_TYPES.map((t, i) => `
    <label class="chip"><input type="radio" name="deck-type" value="${t.id}"${i === 0 ? ' checked' : ''}>
      <span>${t.name} <small><bdi>${t.price}&nbsp;₪</bdi>/מ"ר</small></span></label>`).join('');

  const L = $('#deck-l'), W = $('#deck-w');
  const plan = $('[data-deck-plan]');
  const BOARD_W = 0.09, GAP = 0.005, BOARD_LEN = 2.4, WASTE = 1.10;
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const num = v => { const n = parseFloat(String(v).replace(',', '.')); return Number.isFinite(n) ? n : 0; };

  const update = () => {
    const l = clamp(num(L.value), 0, 30), w = clamp(num(W.value), 0, 30);
    const type = DECK_TYPES.find(t => t.id === form.elements['deck-type'].value);
    const area = l * w;
    const linear = (area / (BOARD_W + GAP)) * WASTE;           // running metres incl. 10% waste
    const boards = Math.ceil(linear / BOARD_LEN);
    const price = area * WASTE * type.price;
    $('[data-res-area]').textContent = area.toLocaleString('he-IL', { maximumFractionDigits: 1 });
    $('[data-res-boards]').textContent = boards.toLocaleString('he-IL');
    $('[data-res-price]').textContent = Math.round(price).toLocaleString('he-IL');
    // live top-view plan (the brand's dimension-line motif)
    if (l > 0 && w > 0) {
      plan.style.setProperty('--ar', `${l} / ${w}`);
      const hPx = plan.getBoundingClientRect().height || 300;
      plan.style.setProperty('--bw', `${clamp(hPx / (w / (BOARD_W + GAP)), 4, 40)}px`);
    }
    plan.style.setProperty('--deck', deckTone[type.id]);
    $('[data-dim-l]').textContent = l.toLocaleString('he-IL');
    $('[data-dim-w]').textContent = w.toLocaleString('he-IL');
  };
  form.addEventListener('input', update);
  form.addEventListener('submit', e => e.preventDefault());
  $$('[data-step]', form).forEach(b => b.addEventListener('click', () => {
    const inp = $(`#${b.dataset.for}`);
    inp.value = clamp(num(inp.value) + Number(b.dataset.step), 1, 30);
    update();
  }));
  update();
  // re-measure after layout settles
  setTimeout(update, 600);
  window.addEventListener('resize', () => requestAnimationFrame(update));
}

/* ---------------- Reveal on enter + H1 word split + counters ---------------- */
function splitH1() {
  $$('[data-split]').forEach(h => {
    let k = 0;
    const walk = node => {
      [...node.childNodes].forEach(n => {
        if (n.nodeType === 3) {
          const parts = n.textContent.split(/(\s+)/);
          const frag = document.createDocumentFragment();
          parts.forEach(p => {
            if (!p) return;
            if (/^\s+$/.test(p)) { frag.appendChild(document.createTextNode(' ')); return; }
            const w = document.createElement('span'); w.className = 'w';
            const wi = document.createElement('span'); wi.className = 'wi';
            wi.style.setProperty('--wd', `${.12 + k++ * .07}s`);
            wi.textContent = p; w.appendChild(wi); frag.appendChild(w);
          });
          n.replaceWith(frag);
        } else if (n.nodeType === 1) walk(n);
      });
    };
    walk(h);
    h.setAttribute('aria-label', h.textContent.replace(/\s+/g, ' ').trim());
  });
}

function initReveal() {
  observeReveal(document);
  autoReveal(); // content rendered later into <main> (inner pages) is revealed automatically
}

/* ---------------- Newsletter ---------------- */
function initNewsletter() {
  const f = $('#news-form');
  if (!f) return;
  f.addEventListener('submit', async e => {
    e.preventDefault();
    const inp = $('#news-email', f), msg = $('.form-msg', f);
    if (!inp.checkValidity() || !inp.value) {
      msg.textContent = 'נא להזין כתובת מייל תקינה, למשל name@gmail.com';
      msg.classList.add('err'); inp.setAttribute('aria-invalid', 'true'); inp.focus(); return;
    }
    inp.removeAttribute('aria-invalid'); msg.classList.remove('err');
    const res = await subscribeNewsletter(inp.value);
    msg.textContent = res.message; f.reset();
  });
}

/* ---------------- Accessibility widget ---------------- */
function initA11y() {
  const btn = $('.fab-a11y'), panel = $('#a11y-panel');
  if (!btn) return;
  const KEY = 'etz_a11y';
  const state = (() => { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch { return {}; } })();
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* ignore */ } };
  const apply = () => {
    ['a11y-fs1', 'a11y-fs2', 'a11y-contrast', 'a11y-links', 'a11y-nomotion'].forEach(c => html.classList.toggle(c, !!state[c]));
    $$('[data-a11y="contrast"]').forEach(b => b.setAttribute('aria-pressed', !!state['a11y-contrast']));
    $$('[data-a11y="links"]').forEach(b => b.setAttribute('aria-pressed', !!state['a11y-links']));
    $$('[data-a11y="motion"]').forEach(b => b.setAttribute('aria-pressed', !!state['a11y-nomotion']));
    save();
  };
  btn.addEventListener('click', () => {
    const open = panel.hidden;
    panel.hidden = !open; btn.setAttribute('aria-expanded', open);
  });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && !panel.hidden) { panel.hidden = true; btn.setAttribute('aria-expanded', 'false'); btn.focus(); } });
  document.addEventListener('click', e => { if (!panel.hidden && !e.target.closest('.a11y')) { panel.hidden = true; btn.setAttribute('aria-expanded', 'false'); } });
  panel.addEventListener('click', e => {
    const a = e.target.closest('[data-a11y]')?.dataset.a11y;
    if (!a) return;
    const lvl = state['a11y-fs2'] ? 2 : state['a11y-fs1'] ? 1 : 0;
    if (a === 'font-up' || a === 'font-down') {
      const n = Math.max(0, Math.min(2, lvl + (a === 'font-up' ? 1 : -1)));
      state['a11y-fs1'] = n === 1; state['a11y-fs2'] = n === 2;
    }
    if (a === 'contrast') state['a11y-contrast'] = !state['a11y-contrast'];
    if (a === 'links') state['a11y-links'] = !state['a11y-links'];
    if (a === 'motion') state['a11y-nomotion'] = !state['a11y-nomotion'];
    if (a === 'reset') Object.keys(state).forEach(k => delete state[k]);
    apply();
  });
  apply();
}

/* ---------------- Boot ---------------- */
if (location.hash === '#qa') html.classList.add('a11y-nomotion'); // static render for QA screenshots
renderMenus();
renderHome();
splitH1();
initCart();
initProductActions();
initHeader();
initMega();
initDrawer();
initSearch();
initCalc();
initNewsletter();
initA11y();
initReveal();

/* Hero crane drop — runs once, after fonts so the scene doesn't shift mid-animation */
if (document.querySelector('.hv-crane')) {
  Promise.race([document.fonts.ready, new Promise(r => setTimeout(r, 1200))])
    .then(() => requestAnimationFrame(() => document.documentElement.classList.add('hero-go')));
}

export { renderMenus, productCard };
