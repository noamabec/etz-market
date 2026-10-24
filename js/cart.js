/* ==========================================================================
   Cart + wishlist — client-side (localStorage).
   In a platform build the same API (add / setQty / remove / items) is backed
   by the platform cart; only js/commerce.js changes.

   A cart LINE = one product + one choice of variants/cut:
     { key, id, qty, variant?: 'עובי: 21 מ"מ · אורך: 3 מ׳', price?: unit price incl. variant deltas,
       cut?: { len: 120, pcs: 4 } (ס"מ, חתיכות) }
   cart.add(id, qty, { variant, price, cut })  → same id+variant+cut merges into one line
   cart.setQty(key, qty) · cart.remove(key) · cart.clear()
   cart.items() → [{ ...line, product, unitPrice, lineTotal }]
   ========================================================================== */
import { getProduct, productImage, SHOP_RULES } from './data.js';

const CART_KEY = 'etz_cart_v1';
const WISH_KEY = 'etz_wish_v1';
export const FREE_SHIPPING = SHOP_RULES.freeShippingOver;

const read = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } };
const write = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* private mode */ } };

export const fmt = n => `${Math.round(n).toLocaleString('he-IL')} ₪`;
const byId = getProduct;
const lineKey = (id, o = {}) => [id, o.variant || '', o.cut ? `${o.cut.len}x${o.cut.pcs}` : ''].join('|');
const unitPrice = l => (typeof l.price === 'number' ? l.price : byId(l.id).price);

// load + migrate old lines ({id, qty} without key)
const load = () => read(CART_KEY, []).filter(i => byId(i.id)).map(i => ({ ...i, key: i.key || lineKey(i.id, i) }));
let items = load();
let wish = new Set(read(WISH_KEY, []));
const listeners = new Set();
const wishListeners = new Set();
const emit = () => { write(CART_KEY, items); listeners.forEach(fn => fn()); };
const findLine = keyOrId => items.find(i => i.key === keyOrId) || items.find(i => i.id === keyOrId);

export const cart = {
  items: () => items.map(i => ({ ...i, product: byId(i.id), unitPrice: unitPrice(i), lineTotal: unitPrice(i) * i.qty })),
  count: () => items.reduce((s, i) => s + i.qty, 0),
  total: () => items.reduce((s, i) => s + i.qty * unitPrice(i), 0),
  /** add(id, qty = 1, { variant, price, cut }) */
  add(id, qty = 1, o = {}) {
    if (!byId(id)) return;
    const key = lineKey(id, o);
    const it = items.find(i => i.key === key);
    if (it) it.qty = Math.min(it.qty + qty, 999);
    else items.push({ key, id, qty, ...(o.variant ? { variant: o.variant } : {}), ...(typeof o.price === 'number' ? { price: o.price } : {}), ...(o.cut ? { cut: o.cut } : {}) });
    emit();
  },
  /** setQty(key | id, qty) — 0 removes */
  setQty(keyOrId, qty) {
    const it = findLine(keyOrId);
    if (!it) return;
    if (qty <= 0) return cart.remove(it.key);
    it.qty = Math.min(qty, 999); emit();
  },
  remove(keyOrId) { const it = findLine(keyOrId); if (!it) return; items = items.filter(i => i !== it); emit(); },
  clear() { items = []; emit(); },
  onChange(fn) { listeners.add(fn); },
};

export const wishlist = {
  has: id => wish.has(id),
  ids: () => [...wish],
  toggle(id) {
    wish.has(id) ? wish.delete(id) : wish.add(id);
    write(WISH_KEY, [...wish]);
    renderCounts();
    wishListeners.forEach(fn => fn());
    return wish.has(id);
  },
  remove(id) { if (wish.has(id)) wishlist.toggle(id); },
  count: () => wish.size,
  onChange(fn) { wishListeners.add(fn); },
};

/* ---------------- UI ---------------- */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

let drawer, scrim, lastFocus;

function renderCounts() {
  const n = cart.count();
  $$('[data-cart-count]').forEach(el => {
    const changed = el.textContent !== String(n);
    el.textContent = n; el.hidden = n === 0;
    if (changed && n > 0) { el.classList.remove('bump'); void el.offsetWidth; el.classList.add('bump'); }
  });
  const cb = $('#cart-btn');
  if (cb) cb.setAttribute('aria-label', `סל הקניות, ${n} פריטים`);
  const w = wishlist.count();
  $$('[data-wish-count]').forEach(el => { el.textContent = w; el.hidden = w === 0; });
}

/** Meta line under a cart line name: dims · variant · cut */
export function lineMeta(line) {
  const p = line.product || byId(line.id);
  return [p.dims, line.variant, line.cut ? `חיתוך: ${line.cut.pcs} × ${line.cut.len} ס"מ` : ''].filter(Boolean).join(' · ');
}

function renderDrawer() {
  if (!drawer) return;
  const list = $('[data-cart-items]', drawer);
  const rows = cart.items();
  drawer.classList.toggle('is-empty', rows.length === 0);
  list.innerHTML = rows.map(line => {
    const { key, qty, product: p } = line;
    return `
    <li class="c-item">
      <div class="ph" data-tone="${p.tone}"><img class="ph-img" src="${productImage(p)}" alt="" loading="lazy"></div>
      <div>
        <p class="c-name">${p.name}</p>
        <p class="c-meta">${lineMeta(line)}</p>
        <div class="c-qty" role="group" aria-label="כמות: ${p.name}">
          <button type="button" data-q="+1" data-id="${key}" aria-label="הוספת יחידה"><svg class="ico" aria-hidden="true"><use href="#i-plus"/></svg></button>
          <output aria-live="polite">${qty}</output>
          <button type="button" data-q="-1" data-id="${key}" aria-label="הפחתת יחידה"><svg class="ico" aria-hidden="true"><use href="#i-minus"/></svg></button>
        </div>
      </div>
      <div class="c-side">
        <button type="button" class="c-remove" data-remove="${key}" aria-label="הסרת ${p.name} מהסל"><svg class="ico" aria-hidden="true"><use href="#i-trash"/></svg></button>
        <span class="c-price"><bdi>${fmt(line.lineTotal)}</bdi></span>
      </div>
    </li>`;
  }).join('');
  const total = cart.total();
  $('[data-cart-total]', drawer).innerHTML = `<bdi>${fmt(total)}</bdi>`;
  const left = FREE_SHIPPING - total;
  $('[data-ship-text]', drawer).innerHTML = left > 0
    ? `עוד <bdi>${fmt(left)}</bdi> למשלוח חינם`
    : '<strong>יש לכם משלוח חינם!</strong>';
  $('[data-ship-bar]', drawer).style.width = `${Math.min(100, (total / FREE_SHIPPING) * 100)}%`;
}

export function openCart() {
  if (!drawer) return;
  lastFocus = document.activeElement;
  scrim.hidden = false; drawer.hidden = false;
  requestAnimationFrame(() => { scrim.classList.add('is-open'); drawer.classList.add('is-open'); });
  document.body.style.overflow = 'hidden';
  setTimeout(() => $('[data-close-cart]', drawer).focus(), 50);
}

export function closeCart() {
  if (!drawer || drawer.hidden) return;
  scrim.classList.remove('is-open'); drawer.classList.remove('is-open');
  document.body.style.overflow = '';
  setTimeout(() => { drawer.hidden = true; if (!document.querySelector('.drawer.is-open')) scrim.hidden = true; }, 450);
  lastFocus?.focus?.();
}

/** Toast with an action */
let toastTimer;
export function toast(html, action) {
  const t = $('#toast');
  if (!t) return;
  t.innerHTML = `<svg class="ico" aria-hidden="true"><use href="#i-check"/></svg><span>${html}</span>${action ? `<button type="button">${action.label}</button>` : ''}`;
  if (action) $('button', t).addEventListener('click', () => { hideToast(); action.fn(); });
  t.hidden = false;
  requestAnimationFrame(() => t.classList.add('is-on'));
  clearTimeout(toastTimer);
  toastTimer = setTimeout(hideToast, 4200);
}
function hideToast() {
  const t = $('#toast');
  t.classList.remove('is-on');
  setTimeout(() => { if (!t.classList.contains('is-on')) t.hidden = true; }, 300);
}

/** Add-to-cart micro-interaction: a dot flies to the cart icon, then the icon shakes. */
export function flyToCart(fromEl) {
  const target = [...document.querySelectorAll('#cart-btn, .tabbar [data-open-cart]')].find(el => el.offsetParent !== null) || $('#cart-btn');
  if (!target) return;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches || document.documentElement.classList.contains('a11y-nomotion');
  const done = () => { target.classList.remove('shake'); void target.offsetWidth; target.classList.add('shake'); };
  if (!fromEl || reduce) return done();
  const a = fromEl.getBoundingClientRect(), b = target.getBoundingClientRect();
  const dot = document.createElement('span');
  dot.className = 'fly-dot';
  dot.style.left = `${a.left + a.width / 2}px`; dot.style.top = `${a.top + a.height / 2}px`;
  document.body.appendChild(dot);
  const dx = b.left + b.width / 2 - (a.left + a.width / 2);
  const dy = b.top + b.height / 2 - (a.top + a.height / 2);
  dot.animate([
    { transform: 'translate(0,0) scale(1)', opacity: 1 },
    { transform: `translate(${dx * .5}px, ${dy * .5 - 120}px) scale(1.1)`, opacity: 1, offset: .5 },
    { transform: `translate(${dx}px, ${dy}px) scale(.4)`, opacity: .6 },
  ], { duration: 700, easing: 'cubic-bezier(.65,0,.35,1)' }).onfinish = () => { dot.remove(); done(); };
}

export function initCart() {
  drawer = $('#cart-drawer');
  scrim = $('[data-scrim]');
  cart.onChange(renderCounts);
  renderCounts();
  if (!drawer) return;

  cart.onChange(renderDrawer);
  renderDrawer();

  document.addEventListener('click', e => {
    if (e.target.closest('[data-open-cart]')) { e.preventDefault(); openCart(); }
    if (e.target.closest('[data-close-cart]')) closeCart();
    const q = e.target.closest('[data-q]');
    if (q) { const it = findLine(q.dataset.id); if (it) cart.setQty(it.key, it.qty + Number(q.dataset.q)); }
    const r = e.target.closest('[data-remove]');
    if (r) cart.remove(r.dataset.remove);
  });
  scrim.addEventListener('click', () => { closeCart(); document.dispatchEvent(new CustomEvent('scrim-close')); });
  document.addEventListener('keydown', e => {
    if (e.key !== 'Escape' || drawer.hidden) return;
    closeCart();
  });
  // simple focus trap
  drawer.addEventListener('keydown', e => {
    if (e.key !== 'Tab') return;
    const f = $$('button, a[href], input', drawer).filter(el => el.offsetParent !== null);
    if (!f.length) return;
    if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f.at(-1).focus(); }
    else if (!e.shiftKey && document.activeElement === f.at(-1)) { e.preventDefault(); f[0].focus(); }
  });

  // keep other tabs in sync
  window.addEventListener('storage', e => {
    if (e.key === CART_KEY) { items = load(); listeners.forEach(fn => fn()); }
    if (e.key === WISH_KEY) { wish = new Set(read(WISH_KEY, [])); renderCounts(); wishListeners.forEach(fn => fn()); }
  });
}
