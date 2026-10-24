/* ==========================================================================
   p-checkout.js — owner: קבוצת סל וקופה (checkout)
   cart.html · checkout.html · thank-you.html · login.html · account.html
   מרנדר לפי <body data-page="...">. נתוני דוגמה בלבד — שום פרט אשראי לא נאסף.
   ========================================================================== */
import { ready } from './shell.js';
import { url, param } from './routes.js';
import { cart, wishlist, fmt, lineMeta, toast, FREE_SHIPPING } from './cart.js';
import { PRODUCTS, CATEGORIES, GUIDES, SHIPPING_ZONES, SHOP_RULES, STORE, PICKUP, getProduct, productImage } from './data.js';
import { productCard, guideCard, crumbs, icon, esc } from './ui.js';
import { shippingQuote, applyCoupon, placeOrder, getOrders, getLastOrder, getUser, signIn, signUp, signOut, resetPassword } from './commerce.js';

await ready;

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const page = document.body.dataset.page;

/* ---------------- local state (keys owned by this group) ---------------- */
const K = { zone: 'etz_co_zone', coupon: 'etz_co_coupon', addr: 'etz_co_addresses' };
const read = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } };
const write = (k, v) => { try { v == null ? localStorage.removeItem(k) : localStorage.setItem(k, JSON.stringify(v)); } catch { /* private mode */ } };
const money = n => `<bdi>${fmt(n)}</bdi>`;

/* ---------------- totals ---------------- */
const CUT_PER = 4, CUT_MIN = 40;
const lineKg = l => { const m = String(l.product?.weight || '').match(/([\d.]+)/); return m ? Number(m[1]) * l.qty : 0; };
const weightOf = lines => lines.reduce((s, l) => s + lineKg(l), 0);
function cuttingCost(lines, subtotal) {
  const cuts = lines.reduce((s, l) => s + (l.cut ? (Number(l.cut.pcs) || 1) * l.qty : 0), 0);
  if (!cuts) return { has: false, price: 0, free: false };
  const free = subtotal >= SHOP_RULES.freeCuttingOver;
  return { has: true, free, price: free ? 0 : Math.max(CUT_MIN, cuts * CUT_PER) };
}
/** { lines, subtotal, cut, ship (null = עוד לא נבחר אזור), coupon, discount, total } */
async function computeTotals({ lines = cart.items(), zone = read(K.zone, ''), method = 'delivery' } = {}) {
  const subtotal = lines.reduce((s, l) => s + l.lineTotal, 0);
  const cut = cuttingCost(lines, subtotal);
  const ship = method === 'pickup' ? { price: 0, pickup: true, free: true } : zone ? shippingQuote(zone, subtotal, weightOf(lines)) : null;
  const code = read(K.coupon, '');
  let coupon = null;
  if (code && subtotal) { const c = await applyCoupon(code, subtotal); coupon = c.ok ? c : null; }
  const discount = coupon ? coupon.amount : 0;
  const total = Math.max(0, subtotal + cut.price + (ship ? ship.price : 0) - discount);
  return { lines, subtotal, cut, ship, coupon, discount, total };
}
function totalsRows(t, { shipLabel = true } = {}) {
  const row = (k, v, cls = '') => `<div class="ck-row${cls}"><dt>${k}</dt><dd>${v}</dd></div>`;
  return `<dl class="ck-rows">
    ${row(`סכום ביניים <span class="muted">(<bdi>${t.lines.reduce((s, l) => s + l.qty, 0)}</bdi> פריטים)</span>`, money(t.subtotal))}
    ${t.cut.has ? row('חיתוך לפי מידה', t.cut.free ? '<strong>חינם</strong>' : money(t.cut.price)) : ''}
    ${row('משלוח', !t.ship ? '<span class="muted">לפי אזור</span>' : t.ship.pickup ? 'איסוף עצמי — חינם' : t.ship.free ? '<strong>חינם</strong>' : money(t.ship.price))}
    ${t.discount ? row(`הנחה <span class="muted">(${esc(t.coupon.code)})</span>`, `<bdi>−${fmt(t.discount)}</bdi>`, ' ck-row-disc') : ''}
    ${row('סה"כ לתשלום', money(t.total), ' ck-row-total')}
  </dl>
  <p class="note">המחירים כוללים מע"מ.${!t.ship && shipLabel ? ' דמי המשלוח יחושבו לפי אזור המשלוח.' : ''}</p>`;
}
const payIcons = `<ul class="pay ck-pay" aria-label="אמצעי תשלום"><li>Visa</li><li>Mastercard</li><li>Amex</li><li>Isracard</li><li>bit</li></ul>`;
const secureNote = `<p class="ck-secure">${icon('lock')} סליקה מאובטחת · עד <bdi>${SHOP_RULES.maxInstallments}</bdi> תשלומים</p>`;

/* ---------------- form helpers + validation ---------------- */
function fld({ id, name = id, label, type = 'text', ac, req, hint, full, attrs = '', v, opt, options }) {
  const desc = [hint ? `${id}-hint` : '', `${id}-err`].filter(Boolean).join(' ');
  const common = `class="input" id="${id}" name="${name}"${ac ? ` autocomplete="${ac}"` : ''}${req ? ` required data-req="${req}"` : ''}${v ? ` data-v="${v}"` : ''} aria-describedby="${desc}" ${attrs}`;
  const control = type === 'textarea' ? `<textarea ${common}></textarea>`
    : type === 'select' ? `<select ${common}>${options}</select>`
    : `<input type="${type}" ${common}>`;
  return `<div class="fld${full ? ' fld-full' : ''}">
    <label class="field-lbl" for="${id}">${label}${req ? ' <span class="req" aria-hidden="true">*</span>' : opt ? ' <span class="opt">(לא חובה)</span>' : ''}</label>
    ${control}
    ${hint ? `<p class="fld-hint" id="${id}-hint">${hint}</p>` : ''}
    <p class="fld-error" id="${id}-err"></p>
  </div>`;
}
function checkbox({ id, name = id, label, req, checked }) {
  return `<div class="fld fld-full">
    <label class="check"><input type="checkbox" id="${id}" name="${name}"${req ? ` required data-req="${req}" aria-describedby="${id}-err"` : ''}${checked ? ' checked' : ''}><span>${label}</span></label>
    ${req ? `<p class="fld-error" id="${id}-err"></p>` : ''}
  </div>`;
}
function radios({ name, legend, req, options, hint }) {
  return `<fieldset class="fieldset ck-group fld-full" data-group="${name}"${req ? ` data-req="${req}"` : ''} aria-describedby="${hint ? `${name}-hint ` : ''}${name}-err">
    <legend class="field-lbl">${legend}${req ? ' <span class="req" aria-hidden="true">*</span>' : ''}</legend>
    ${hint ? `<p class="fld-hint" id="${name}-hint">${hint}</p>` : ''}
    <div class="opt-cards">${options.map(o => `<label class="opt-card"><input type="radio" name="${name}" value="${o.v}"${o.checked ? ' checked' : ''}${req ? ' required' : ''}><span>${o.label}${o.small ? `<small>${o.small}</small>` : ''}</span></label>`).join('')}</div>
    <p class="fld-error" id="${name}-err"></p>
  </fieldset>`;
}
const digits = s => String(s).replace(/[\s\-–()]/g, '');
const CHECKS = {
  name: v => v.length >= 2 || 'נא להזין שם מלא (לפחות 2 אותיות)',
  phone: v => /^0(5\d{8}|[23489]\d{7}|7\d{8})$/.test(digits(v)) || 'מספר הטלפון לא תקין. למשל: 050-1234567',
  email: v => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v) || 'כתובת המייל לא תקינה. למשל: name@gmail.com',
  hp: v => /^\d{9}$/.test(digits(v)) || 'מספר ח.פ. / עוסק מורשה הוא 9 ספרות',
  pass: v => v.length >= 8 || 'הסיסמה צריכה להכיל לפחות 8 תווים',
  floor: v => /^-?\d{1,2}$/.test(v) || 'נא להזין מספר קומה (0 = קרקע)',
  match: (v, el) => v === ($(el.dataset.match)?.value || '') || 'הסיסמאות לא זהות',
};
const isHidden = el => !!el.closest('[hidden]') || el.disabled;
function showErr(el, msg) {
  const err = document.getElementById(`${el.id}-err`);
  if (err) err.textContent = msg || '';
  el.setAttribute('aria-invalid', msg ? 'true' : 'false');
  el.closest('.fld')?.classList.toggle('is-error', !!msg);
}
function checkField(el) {
  if (isHidden(el)) return true;
  const v = (el.value || '').trim();
  let msg = '';
  if (el.type === 'checkbox') msg = el.required && !el.checked ? el.dataset.req : '';
  else if (!v) msg = el.required ? (el.dataset.req || 'שדה חובה') : '';
  else if (el.dataset.v && CHECKS[el.dataset.v]) { const r = CHECKS[el.dataset.v](v, el); msg = r === true ? '' : r; }
  showErr(el, msg);
  return !msg;
}
function checkGroup(fs) {
  if (isHidden(fs)) return true;
  const ok = !!$('input:checked', fs);
  $(`#${fs.dataset.group}-err`).textContent = ok ? '' : fs.dataset.req;
  fs.classList.toggle('is-error', !ok);
  $$('input', fs).forEach(i => i.setAttribute('aria-invalid', ok ? 'false' : 'true'));
  return ok;
}
function validate(scope) {
  let first = null, n = 0;
  $$('.input, .check input[required]', scope).forEach(el => { if (!checkField(el)) { n++; first ||= el; } });
  $$('fieldset[data-req]', scope).forEach(fs => { if (!checkGroup(fs)) { n++; first ||= $('input', fs); } });
  return { ok: n === 0, n, first };
}
/** live re-validation: after blur, and while fixing a field that is already in error */
function liveValidate(form) {
  form.addEventListener('focusout', e => {
    const el = e.target;
    if (el.matches('.input') && (el.value.trim() || el.dataset.touched)) { el.dataset.touched = '1'; checkField(el); }
  });
  const re = e => {
    const el = e.target;
    if (el.matches('.input, .check input') && el.getAttribute('aria-invalid') === 'true') checkField(el);
    const fs = el.closest('fieldset[data-req]');
    if (fs && fs.classList.contains('is-error')) checkGroup(fs);
  };
  form.addEventListener('input', re);
  form.addEventListener('change', re);
}
function failAlert(alertEl, res) {
  alertEl.className = 'form-alert is-error';
  alertEl.textContent = res.n === 1 ? 'יש שדה אחד שצריך לתקן — סימנו אותו באדום.' : `יש ${res.n} שדות שצריך לתקן — סימנו אותם באדום.`;
  res.first?.focus();
}
const clearAlert = el => { el.className = 'form-alert'; el.textContent = ''; };
const showPassBtn = id => `<button class="ck-eye" type="button" data-eye="${id}" aria-pressed="false" aria-label="הצגת הסיסמה">הצגה</button>`;
document.addEventListener('click', e => {
  const b = e.target.closest('[data-eye]');
  if (!b) return;
  const inp = document.getElementById(b.dataset.eye);
  const show = inp.type === 'password';
  inp.type = show ? 'text' : 'password';
  b.setAttribute('aria-pressed', show); b.textContent = show ? 'הסתרה' : 'הצגה';
  b.setAttribute('aria-label', show ? 'הסתרת הסיסמה' : 'הצגת הסיסמה');
});
const pwd = o => fld({ ...o, type: 'password', attrs: `${o.attrs || ''} dir="ltr"` }).replace('</label>', '</label><div class="ck-pass">').replace(/(<p class="fld-hint"|<p class="fld-error")/, `${showPassBtn(o.id)}</div>$1`);

/* order lines for storage / display */
const snapLines = lines => lines.map(l => ({ id: l.id, name: l.product.name, qty: l.qty, variant: l.variant || '', cut: l.cut || null, unitPrice: l.unitPrice, lineTotal: l.lineTotal }));
const snapMeta = l => [getProduct(l.id)?.dims, l.variant, l.cut ? `חיתוך: ${l.cut.pcs} × ${l.cut.len} ס"מ` : ''].filter(Boolean).join(' · ');
function miniLines(lines) {
  return `<ul class="ck-mini">${lines.map(l => {
    const p = getProduct(l.id);
    return `<li>
      <div class="ph ck-thumb" data-tone="${p?.tone || 'pine'}">${p ? `<img class="ph-img" src="${productImage(p)}" alt="" loading="lazy">` : ''}<span class="ck-qty-badge" aria-hidden="true"><bdi>${l.qty}</bdi></span></div>
      <div><p class="ck-mini-name">${esc(l.name || p?.name)}</p><p class="note">${esc(snapMeta(l))} · <span class="sr-only">כמות </span><bdi>${l.qty}</bdi> × ${money(l.unitPrice)}</p></div>
      <span class="ck-mini-price">${money(l.lineTotal)}</span>
    </li>`;
  }).join('')}</ul>`;
}
const fmtDate = iso => new Date(iso).toLocaleDateString('he-IL', { day: 'numeric', month: 'numeric', year: 'numeric' });

/* =========================================================================
   13. CART
   ========================================================================= */
function initCartPage() {
  $('[data-crumbs]').innerHTML = crumbs([{ label: 'סל קניות' }]);
  const root = $('[data-cart-root]');
  const xsell = $('[data-xsell]');
  let couponMsg = null; // { ok, text }

  async function render() {
    const lines = cart.items();
    const focusId = document.activeElement?.dataset?.fid;
    $('[data-cart-head-count]').textContent = lines.length ? `${cart.count()} פריטים בסל` : '';
    if (!lines.length) { renderEmpty(); xsell.hidden = true; return; }
    xsell.hidden = false;
    const t = await computeTotals({ lines });
    const left = FREE_SHIPPING - t.subtotal;
    const zone = read(K.zone, '');
    const cutLeft = SHOP_RULES.freeCuttingOver - t.subtotal;
    root.innerHTML = `
    <div class="layout">
      <div class="layout-main stack-lg">
        <div class="ck-mtotal panel">
          <p><span class="muted">סה"כ</span> <strong>${money(t.total)}</strong></p>
          <a class="btn btn-primary" href="${url.checkout()}">לתשלום</a>
        </div>
        <div class="ck-free panel panel-tint" aria-live="polite">
          <p class="ck-free-txt">${icon('crane')} ${left > 0 ? `עוד ${money(left)} למשלוח חינם עם מנוף` : '<strong>יש לכם משלוח חינם!</strong> (לא כולל אילת והערבה)'}</p>
          <div class="meter" role="progressbar" aria-label="התקדמות למשלוח חינם" aria-valuemin="0" aria-valuemax="${FREE_SHIPPING}" aria-valuenow="${Math.min(FREE_SHIPPING, Math.round(t.subtotal))}"><span style="width:${Math.min(100, (t.subtotal / FREE_SHIPPING) * 100)}%"></span></div>
          ${t.cut.has ? `<p class="note">${t.cut.free ? 'החיתוך לפי מידה בהזמנה הזו — חינם.' : `עוד ${money(cutLeft)} וגם החיתוך לפי מידה חינם.`}</p>` : ''}
        </div>

        <div>
          <h2 class="sec-title sr-only" id="lines-title">הפריטים בסל</h2>
          <ul class="ck-lines" aria-labelledby="lines-title">
            ${lines.map(l => lineHTML(l)).join('')}
          </ul>
          <p class="ck-continue"><a href="${url.shop()}">${icon('arrow', 'ico ck-flip')} להמשך קניות</a></p>
        </div>

        <div class="grid-2">
          <section class="panel" aria-labelledby="ship-title">
            <h2 class="h3 ck-h" id="ship-title">${icon('crane')} כמה עולה המשלוח?</h2>
            <div class="fld">
              <label class="field-lbl" for="ship-zone">אזור משלוח</label>
              <select class="input" id="ship-zone" data-fid="ship-zone">
                <option value="">בחרו אזור</option>
                ${SHIPPING_ZONES.map(z => `<option value="${z.id}"${z.id === zone ? ' selected' : ''}>${z.name}</option>`).join('')}
              </select>
              <p class="fld-hint">${zone ? esc(SHIPPING_ZONES.find(z => z.id === zone)?.areas || '') : 'צפון · מרכז · ירושלים · דרום · אילת'}</p>
            </div>
            <div class="ck-ship-out" aria-live="polite">${t.ship
              ? `<p><strong>${t.ship.free ? 'משלוח חינם' : money(t.ship.price)}</strong> · ${t.ship.days} · כולל פריקה עם מנוף</p><p class="note">משקל משוער: <bdi>${Math.round(weightOf(lines)).toLocaleString('he-IL')}</bdi> ק"ג</p>`
              : `<p class="note">או ${PICKUP.name.replace('איסוף', 'איסוף')} — חינם.</p>`}</div>
          </section>

          <section class="panel" aria-labelledby="coupon-title">
            <h2 class="h3 ck-h" id="coupon-title">${icon('tag')} קוד קופון</h2>
            ${t.coupon ? `
              <div class="ck-coupon-on">
                <p><strong><bdi dir="ltr">${esc(t.coupon.code)}</bdi></strong> — ${t.coupon.message} (<bdi>−${fmt(t.discount)}</bdi>)</p>
                <button class="btn btn-ghost ck-btn-sm" type="button" data-coupon-remove>הסרה</button>
              </div>` : `
              <form class="fld" data-coupon-form novalidate>
                <label class="field-lbl" for="coupon">יש לכם קוד הנחה?</label>
                <div class="input-row">
                  <input class="input" id="coupon" name="coupon" dir="ltr" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="למשל WOOD5" aria-describedby="coupon-err" data-fid="coupon"${couponMsg && !couponMsg.ok ? ' aria-invalid="true"' : ''}>
                  <button class="btn btn-ghost" type="submit">החל</button>
                </div>
                <p class="fld-error" id="coupon-err" role="alert">${couponMsg && !couponMsg.ok ? esc(couponMsg.text) : ''}</p>
                <p class="fld-hint">קודים לדוגמה: <bdi dir="ltr">WOOD5</bdi> (5%), <bdi dir="ltr">BUILD10</bdi> (10% מעל 2,000 ₪)</p>
              </form>`}
          </section>
        </div>
      </div>

      <aside class="layout-aside" aria-labelledby="sum-title">
        <div class="aside-sticky panel ck-summary">
          <h2 class="h3" id="sum-title">סיכום הזמנה</h2>
          ${totalsRows(t)}
          <a class="btn btn-primary btn-lg btn-block" href="${url.checkout()}">${icon('lock')} לתשלום</a>
          ${secureNote}
          ${payIcons}
          <ul class="ck-trust">
            <li>${icon('ruler')} נציג יאשר איתכם מידות לפני המשלוח</li>
            <li>${icon('crane')} משלוח עם מנוף לכל הארץ, עד <bdi>${SHOP_RULES.deliveryHours}</bdi> שעות</li>
          </ul>
        </div>
      </aside>
    </div>`;
    if (focusId) $(`[data-fid="${CSS.escape(focusId)}"]`, root)?.focus();
    renderXsell(lines);
  }

  function lineHTML(l) {
    const p = l.product, k = esc(l.key);
    return `<li class="ck-line">
      <a class="ph ck-line-img" data-tone="${p.tone}" href="${url.product(p.id)}" tabindex="-1" aria-hidden="true"><img class="ph-img" src="${productImage(p)}" alt="" loading="lazy"></a>
      <div class="ck-line-info">
        <h3 class="ck-line-name"><a href="${url.product(p.id)}">${esc(p.name)}</a></h3>
        <p class="note">${esc(lineMeta(l))}</p>
        <p class="ck-line-unit">${money(l.unitPrice)} <span class="muted">${esc(p.unit || 'ליחידה')}</span></p>
      </div>
      <div class="ck-line-qty">
        <div class="num ck-num" role="group" aria-label="כמות: ${esc(p.name)}">
          <button class="num-btn" type="button" data-lq="1" data-key="${k}" data-fid="p-${k}" aria-label="הוספת יחידה">${icon('plus')}</button>
          <input type="number" inputmode="numeric" min="1" max="999" value="${l.qty}" data-lqty="${k}" data-fid="q-${k}" aria-label="כמות">
          <button class="num-btn" type="button" data-lq="-1" data-key="${k}" data-fid="m-${k}" aria-label="הפחתת יחידה"${l.qty <= 1 ? ' disabled' : ''}>${icon('minus')}</button>
        </div>
      </div>
      <p class="ck-line-total"><span class="sr-only">סה"כ לשורה: </span>${money(l.lineTotal)}</p>
      <div class="ck-line-acts">
        <button class="ck-link" type="button" data-to-wish="${k}">${icon('heart')} העברה למועדפים</button>
        <button class="ck-link" type="button" data-lremove="${k}">${icon('trash')} הסרה<span class="sr-only"> של ${esc(p.name)}</span></button>
      </div>
    </li>`;
  }

  function renderEmpty() {
    root.innerHTML = `
      <div class="empty-state ck-empty">
        <span class="empty-ico">${icon('cart')}</span>
        <p class="h3">הסל עדיין ריק</p>
        <p>מתחילים פרויקט? בחרו קטגוריה — ואם צריך, נחתוך לכם לפי מידה ונביא עם מנוף עד הבית.</p>
        <ul class="cluster ck-empty-cats">${CATEGORIES.map(c => `<li><a class="chip-link" href="${url.category(c.id)}">${esc(c.name)}</a></li>`).join('')}</ul>
        <div class="cta-row"><a class="btn btn-primary" href="${url.shop()}">לכל המוצרים</a>${wishlist.count() ? `<a class="btn btn-ghost" href="${url.wishlist()}">למועדפים שלי (<bdi>${wishlist.count()}</bdi>)</a>` : ''}</div>
      </div>
      <div class="section-sm">
        <h2 class="sec-title">הנמכרים ביותר</h2>
        <div class="p-grid p-grid-wrap">${PRODUCTS.slice(0, 4).map(productCard).join('')}</div>
      </div>`;
  }

  function renderXsell(lines) {
    const inCart = new Set(lines.map(l => l.id));
    const ids = [];
    lines.forEach(l => [l.product.upsell, ...(l.product.related || [])].forEach(id => { if (id && !inCart.has(id) && !ids.includes(id) && getProduct(id)) ids.push(id); }));
    PRODUCTS.forEach(p => { if (!inCart.has(p.id) && !ids.includes(p.id)) ids.push(p.id); });
    $('[data-xsell-grid]').innerHTML = ids.slice(0, 4).map(id => productCard(getProduct(id))).join('');
  }

  root.addEventListener('click', e => {
    const q = e.target.closest('[data-lq]');
    if (q) { const l = cart.items().find(i => i.key === q.dataset.key); if (l) cart.setQty(l.key, Math.max(1, l.qty + Number(q.dataset.lq))); return; }
    const rm = e.target.closest('[data-lremove]');
    if (rm) {
      const l = cart.items().find(i => i.key === rm.dataset.lremove);
      if (!l) return;
      cart.remove(l.key);
      toast(`<strong>${esc(l.product.name)}</strong> הוסר מהסל`, { label: 'ביטול', fn: () => cart.add(l.id, l.qty, { variant: l.variant, price: l.price, cut: l.cut }) });
      $('h1')?.focus();
      return;
    }
    const w = e.target.closest('[data-to-wish]');
    if (w) {
      const l = cart.items().find(i => i.key === w.dataset.toWish);
      if (!l) return;
      if (!wishlist.has(l.id)) wishlist.toggle(l.id);
      cart.remove(l.key);
      toast(`<strong>${esc(l.product.name)}</strong> הועבר למועדפים`, { label: 'למועדפים', fn: () => { location.href = url.wishlist(); } });
      $('h1')?.focus();
      return;
    }
    if (e.target.closest('[data-coupon-remove]')) { write(K.coupon, null); couponMsg = null; render(); }
  });
  root.addEventListener('change', e => {
    if (e.target.matches('[data-lqty]')) {
      const n = Math.round(Number(e.target.value));
      const l = cart.items().find(i => i.key === e.target.dataset.lqty);
      if (!l) return;
      if (!n || n < 1) { e.target.value = l.qty; return; }
      cart.setQty(l.key, Math.min(999, n));
    }
    if (e.target.id === 'ship-zone') { write(K.zone, e.target.value || null); render(); }
  });
  root.addEventListener('submit', async e => {
    if (!e.target.matches('[data-coupon-form]')) return;
    e.preventDefault();
    const code = $('#coupon', root).value.trim();
    if (!code) { couponMsg = { ok: false, text: 'נא להזין קוד קופון' }; render().then(() => $('#coupon')?.focus()); return; }
    const res = await applyCoupon(code, cart.total());
    if (res.ok) { write(K.coupon, res.code); couponMsg = null; toast(`קוד <bdi dir="ltr">${esc(res.code)}</bdi> הופעל — ${res.message}`); }
    else couponMsg = { ok: false, text: res.message };
    await render();
    if (!res.ok) { const i = $('#coupon'); if (i) { i.value = code; i.focus(); } }
  });

  cart.onChange(render);
  render();
}

/* =========================================================================
   14. CHECKOUT
   ========================================================================= */
function initCheckoutPage() {
  const root = $('[data-co-root]');
  const STEPS = ['details', 'shipping', 'payment'];
  const NAMES = { details: 'פרטים', shipping: 'משלוח', payment: 'תשלום' };
  let current = 0;

  if (!cart.items().length) {
    root.innerHTML = `<div class="empty-state">
      <span class="empty-ico">${icon('cart')}</span>
      <p class="h3">אין מה לשלם — הסל ריק</p>
      <p>הוסיפו מוצרים לסל וחזרו לכאן כדי להשלים את ההזמנה.</p>
      <div class="cta-row"><a class="btn btn-primary" href="${url.shop()}">לכל המוצרים</a><a class="btn btn-ghost" href="${url.cart()}">לסל הקניות</a></div>
    </div>`;
    $('[data-co-progress]').hidden = true;
    return;
  }

  const user = getUser();
  const zone = read(K.zone, '');
  const lastShip = getLastOrder()?.shipping;
  root.innerHTML = `
  <div class="layout">
    <div class="layout-main">
      <div class="ck-login panel panel-tint">
        ${user
          ? `<p>${icon('user')} מחוברים כ-<strong>${esc(user.name)}</strong> <span class="muted">(<bdi dir="ltr">${esc(user.email || '')}</bdi>)</span> — מילאנו בשבילכם את מה שאנחנו יודעים.</p>`
          : `<p>${icon('user')} <strong>יש לכם חשבון?</strong> <a href="${url.login('login', url.checkout())}">התחברות</a> — או המשיכו כאורחים, לא צריך חשבון כדי להזמין.</p>`}
      </div>

      <form class="ck-form" id="co-form" novalidate aria-label="פרטי ההזמנה">
        <p class="form-alert" id="co-alert" role="alert"></p>

        <section class="ck-step panel" data-step="details" aria-labelledby="st-details">
          <div class="ck-step-head">
            <h2 class="ck-step-title" id="st-details" tabindex="-1"><span class="ck-step-n" aria-hidden="true">1</span> פרטי המזמין</h2>
            <button class="ck-link ck-edit" type="button" data-edit="0" hidden>שינוי<span class="sr-only"> פרטי המזמין</span></button>
          </div>
          <div class="ck-step-sum" data-sum hidden></div>
          <div class="ck-step-body form-grid">
            ${fld({ id: 'co-name', name: 'name', label: 'שם מלא', ac: 'name', req: 'נא להזין שם מלא', v: 'name', full: true })}
            ${fld({ id: 'co-phone', name: 'phone', label: 'טלפון נייד', type: 'tel', ac: 'tel', req: 'נא להזין מספר טלפון', v: 'phone', hint: 'הנציג והנהג יתקשרו למספר הזה', attrs: 'inputmode="tel" dir="ltr" placeholder="050-1234567"' })}
            ${fld({ id: 'co-email', name: 'email', label: 'מייל', type: 'email', ac: 'email', req: 'נא להזין כתובת מייל', v: 'email', hint: 'לשם נשלח את אישור ההזמנה והחשבונית', attrs: 'inputmode="email" dir="ltr" placeholder="name@gmail.com"' })}
            ${checkbox({ id: 'co-company', name: 'company', label: 'חשבונית על שם חברה' })}
            <div class="ck-company form-grid fld-full" id="co-company-fields" hidden>
              ${fld({ id: 'co-org', name: 'org', label: 'שם החברה', ac: 'organization', req: 'נא להזין את שם החברה' })}
              ${fld({ id: 'co-hp', name: 'hp', label: 'ח.פ. / עוסק מורשה', ac: 'off', req: 'נא להזין מספר ח.פ.', v: 'hp', attrs: 'inputmode="numeric" dir="ltr" maxlength="11" placeholder="512345678"' })}
            </div>
            <div class="fld-full ck-next"><button class="btn btn-primary btn-lg" type="submit">המשך למשלוח</button></div>
          </div>
        </section>

        <section class="ck-step panel" data-step="shipping" aria-labelledby="st-shipping">
          <div class="ck-step-head">
            <h2 class="ck-step-title" id="st-shipping" tabindex="-1"><span class="ck-step-n" aria-hidden="true">2</span> משלוח</h2>
            <button class="ck-link ck-edit" type="button" data-edit="1" hidden>שינוי<span class="sr-only"> פרטי המשלוח</span></button>
          </div>
          <div class="ck-step-sum" data-sum hidden></div>
          <div class="ck-step-body form-grid" hidden>
            ${radios({ name: 'method', legend: 'איך תרצו לקבל את ההזמנה?', req: 'נא לבחור משלוח או איסוף עצמי', options: [
              { v: 'delivery', label: 'משלוח עם מנוף', small: `לכל הארץ, עד ${SHOP_RULES.deliveryHours} שעות`, checked: true },
              { v: 'pickup', label: 'איסוף עצמי — חינם', small: 'מהמחסן בירכא, תוך יום עסקים' },
            ] })}
            <div class="form-grid fld-full" id="co-delivery">
              ${fld({ id: 'co-zone', name: 'zone', label: 'אזור משלוח', type: 'select', req: 'נא לבחור אזור משלוח', full: true,
                options: `<option value="">בחרו אזור</option>${SHIPPING_ZONES.map(z => `<option value="${z.id}"${z.id === zone ? ' selected' : ''}>${z.name} — ${z.areas}</option>`).join('')}` })}
              ${fld({ id: 'co-street', name: 'street', label: 'רחוב ומספר בית', ac: 'shipping address-line1', req: 'נא להזין רחוב ומספר בית', full: true, attrs: 'placeholder="למשל: הזית 12"' })}
              ${fld({ id: 'co-city', name: 'city', label: 'עיר / יישוב', ac: 'shipping address-level2', req: 'נא להזין עיר או יישוב' })}
              ${fld({ id: 'co-floor', name: 'floor', label: 'קומה', opt: true, v: 'floor', hint: '0 = קומת קרקע', attrs: 'inputmode="numeric" maxlength="3"' })}
              ${radios({ name: 'crane', legend: 'יש גישה למשאית עם מנוף?', req: 'נא לבחור אחת מהאפשרויות', hint: 'משאית באורך כ-10 מ׳ צריכה לעמוד ליד הבית. לא בטוחים? הנציג יבדוק איתכם בטלפון.', options: [
                { v: 'yes', label: 'כן' }, { v: 'no', label: 'לא', small: 'נתאם פריקה ידנית' }, { v: 'unsure', label: 'לא בטוח' },
              ] })}
              ${radios({ name: 'window', legend: 'חלון משלוח מועדף', req: 'נא לבחור חלון משלוח', options: [
                { v: 'morning', label: 'בוקר', small: '07:00–12:00' }, { v: 'noon', label: 'צהריים', small: '12:00–17:00' }, { v: 'any', label: 'לא משנה לי', small: 'הכי מהר שאפשר' },
              ] })}
              ${fld({ id: 'co-notes', name: 'notes', label: 'הערות לנהג', type: 'textarea', opt: true, full: true, hint: 'למשל: קוד שער, מקום פריקה, חניה צרה', attrs: 'maxlength="300" rows="3"' })}
            </div>
            <div class="fld-full notice" id="co-pickup" hidden>${icon('pin')}<span><strong>${PICKUP.name}</strong><br>${STORE.address} · ${PICKUP.note}</span></div>
            <div class="fld-full ck-next"><button class="btn btn-primary btn-lg" type="submit">המשך לתשלום</button></div>
          </div>
        </section>

        <section class="ck-step panel" data-step="payment" aria-labelledby="st-payment">
          <div class="ck-step-head">
            <h2 class="ck-step-title" id="st-payment" tabindex="-1"><span class="ck-step-n" aria-hidden="true">3</span> תשלום</h2>
          </div>
          <div class="ck-step-body form-grid" hidden>
            ${radios({ name: 'pay', legend: 'אמצעי תשלום', req: 'נא לבחור אמצעי תשלום', options: [
              { v: 'card', label: 'כרטיס אשראי', small: `עד ${SHOP_RULES.maxInstallments} תשלומים`, checked: true },
              { v: 'bit', label: 'ביט', small: 'בקשת תשלום לנייד' },
            ] })}
            <div class="fld-full stack" id="co-card">
              ${fld({ id: 'co-inst', name: 'installments', label: 'מספר תשלומים', type: 'select', full: true, options: '' })}
              <div class="ck-gateway" role="note" aria-label="אזור התשלום המאובטח">
                ${icon('lock')}
                <div><p><strong>תשלום מאובטח יוצג כאן</strong></p>
                <p class="note">באתר החי ייפתח כאן טופס כרטיס האשראי של חברת הסליקה (מוצפן, בעיצוב האתר). <strong>זו גרסת דמו — לא מזינים פרטי כרטיס ולא מתבצע חיוב.</strong></p></div>
              </div>
            </div>
            <div class="fld-full notice" id="co-bit" hidden>${icon('phone')}<span>אחרי הלחיצה על "לביצוע התשלום" תישלח בקשת תשלום בביט למספר <bdi dir="ltr" data-bit-phone></bdi>. בדמו לא נשלחת בקשה.</span></div>
            ${checkbox({ id: 'co-terms', name: 'terms', req: 'כדי להמשיך צריך לאשר את התקנון', label: `קראתי ואני מאשר/ת את <a href="${url.terms()}" target="_blank" rel="noopener">התקנון</a> ואת <a href="${url.shippingReturns()}" target="_blank" rel="noopener">מדיניות המשלוחים וההחזרות</a>` })}
            ${checkbox({ id: 'co-news', name: 'marketing', label: 'אשמח לקבל מבצעים ומדריכים במייל (אפשר להסיר בכל רגע)' })}
            <div class="fld-full ck-next">
              <button class="btn btn-primary btn-lg btn-block" type="submit" data-pay-btn>${icon('lock')} לביצוע התשלום</button>
              <p class="note ck-center">נציג יתקשר תוך 24 שעות לאשר מידות ומועד משלוח.</p>
            </div>
          </div>
        </section>
      </form>
    </div>

    <aside class="layout-aside" aria-labelledby="co-sum-title">
      <div class="aside-sticky panel ck-summary">
        <div class="ck-sum-head"><h2 class="h3" id="co-sum-title">סיכום הזמנה</h2><a class="ck-link" href="${url.cart()}">עריכת הסל</a></div>
        <div data-co-sum></div>
        ${secureNote}
      </div>
    </aside>
  </div>`;

  const form = $('#co-form'), alertEl = $('#co-alert');
  const sections = $$('.ck-step', form);
  const val = n => form.elements[n]?.value?.trim?.() ?? '';
  const method = () => form.elements.method.value || 'delivery';

  // prefill (logged-in user / last order)
  if (user) { form.elements.name.value = user.name || ''; form.elements.email.value = user.email || ''; form.elements.phone.value = user.phone || ''; }
  if (lastShip && lastShip.method === 'delivery') { form.elements.street.value = lastShip.street || ''; form.elements.city.value = lastShip.city || ''; }

  liveValidate(form);

  async function refresh() {
    const t = await computeTotals({ zone: val('zone'), method: method() });
    $('[data-co-sum]').innerHTML = miniLines(snapLines(t.lines)) + totalsRows(t);
    const inst = $('#co-inst');
    const cur = Number(inst.value) || 1;
    inst.innerHTML = Array.from({ length: SHOP_RULES.maxInstallments }, (_, i) => i + 1)
      .map(n => `<option value="${n}"${n === cur ? ' selected' : ''}>${n === 1 ? 'תשלום אחד' : `${n} תשלומים`} — ${fmt(t.total / n)}${n > 1 ? ' לחודש' : ''}</option>`).join('');
    $('[data-pay-btn]').innerHTML = `${icon('lock')} לביצוע התשלום · ${money(t.total)}`;
    return t;
  }

  function summaryOf(i) {
    if (i === 0) return `<p>${esc(val('name'))} · <bdi dir="ltr">${esc(val('phone'))}</bdi> · <bdi dir="ltr">${esc(val('email'))}</bdi>${form.elements.company.checked ? `<br>חשבונית: ${esc(val('org'))}, ח.פ. <bdi>${esc(val('hp'))}</bdi>` : ''}</p>`;
    if (method() === 'pickup') return `<p>איסוף עצמי מהמחסן בירכא — חינם</p>`;
    const z = SHIPPING_ZONES.find(x => x.id === val('zone'));
    const lbl = (n, v) => $(`input[name="${n}"][value="${v}"]`, form)?.closest('label')?.querySelector('span')?.firstChild?.textContent || '';
    return `<p>${esc(val('street'))}, ${esc(val('city'))}${val('floor') ? `, קומה ${esc(val('floor'))}` : ''} · ${esc(z?.name || '')}<br>מנוף: ${lbl('crane', form.elements.crane.value)} · חלון: ${lbl('window', form.elements.window.value)}</p>`;
  }

  function goTo(i, focus = true) {
    current = i;
    sections.forEach((s, j) => {
      $('.ck-step-body', s).hidden = j !== i;
      const sum = $('[data-sum]', s);
      if (sum) { sum.hidden = j >= i; if (j < i) sum.innerHTML = summaryOf(j); }
      const ed = $('.ck-edit', s); if (ed) ed.hidden = j >= i;
      s.classList.toggle('is-current', j === i);
      s.classList.toggle('is-done', j < i);
      s.classList.toggle('is-next', j > i);
    });
    $$('[data-co-progress] li').forEach((li, j) => {
      // li 0 = סל (always done)
      const k = j - 1;
      li.classList.toggle('is-done', j === 0 || k < i);
      li.classList.toggle('is-current', k === i);
      if (k === i) li.setAttribute('aria-current', 'step'); else li.removeAttribute('aria-current');
    });
    if (focus) { const h = $('.ck-step-title', sections[i]); h.focus({ preventScroll: true }); sections[i].scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' }); }
    if (i === 2) $('[data-bit-phone]').textContent = val('phone');
  }

  form.addEventListener('change', e => {
    const n = e.target.name;
    if (n === 'company') $('#co-company-fields').hidden = !e.target.checked;
    if (n === 'method') { const pick = method() === 'pickup'; $('#co-delivery').hidden = pick; $('#co-pickup').hidden = !pick; refresh(); }
    if (n === 'zone') { write(K.zone, e.target.value || null); refresh(); }
    if (n === 'pay') { const bit = form.elements.pay.value === 'bit'; $('#co-card').hidden = bit; $('#co-bit').hidden = !bit; }
  });
  form.addEventListener('click', e => { const ed = e.target.closest('[data-edit]'); if (ed) { clearAlert(alertEl); goTo(Number(ed.dataset.edit)); } });

  form.addEventListener('submit', async e => {
    e.preventDefault();
    const res = validate(sections[current]);
    if (!res.ok) { failAlert(alertEl, res); return; }
    clearAlert(alertEl);
    if (current < 2) { goTo(current + 1); return; }
    // final: re-check every step (in case something was edited)
    for (let i = 0; i < 2; i++) { const r = validate(sections[i]); if (!r.ok) { goTo(i); failAlert(alertEl, r); return; } }
    const btn = $('[data-pay-btn]');
    btn.disabled = true; btn.textContent = 'מעבדים את ההזמנה…';
    const t = await refresh();
    btn.disabled = true; btn.textContent = 'מעבדים את ההזמנה…';
    const z = SHIPPING_ZONES.find(x => x.id === val('zone'));
    const order = {
      items: snapLines(t.lines),
      customer: { name: val('name'), phone: val('phone'), email: val('email'), company: form.elements.company.checked ? { name: val('org'), hp: digits(val('hp')) } : null, marketing: form.elements.marketing.checked },
      shipping: method() === 'pickup' ? { method: 'pickup', label: PICKUP.name }
        : { method: 'delivery', zone: val('zone'), zoneName: z?.name, days: z?.days, street: val('street'), city: val('city'), floor: val('floor'), crane: form.elements.crane.value, window: form.elements.window.value, notes: val('notes') },
      payment: { method: form.elements.pay.value, installments: form.elements.pay.value === 'card' ? Number(form.elements.installments.value) || 1 : 1 },
      totals: { subtotal: t.subtotal, cutting: t.cut.price, shipping: t.ship ? t.ship.price : 0, discount: t.discount, coupon: t.coupon?.code || '', total: t.total },
    };
    const r = await placeOrder(order);
    if (r.ok) { cart.clear(); write(K.coupon, null); location.href = r.redirect; }
    else { btn.disabled = false; refresh(); alertEl.className = 'form-alert is-error'; alertEl.textContent = 'משהו השתבש בשליחת ההזמנה. נסו שוב או התקשרו אלינו: ' + STORE.phone; }
  });

  refresh().then(() => goTo(0, false));
}

/* =========================================================================
   15. THANK YOU
   ========================================================================= */
function initThankYou() {
  const id = param('order');
  const order = getOrders().find(o => o.id === id) || (id ? null : getLastOrder());
  const root = $('[data-ty-root]');
  if (!order) {
    root.innerHTML = `<div class="empty-state"><span class="empty-ico">${icon('box')}</span><h1 class="h3">לא מצאנו את ההזמנה הזו</h1>
      <p>ייתכן שהקישור שגוי. אפשר לראות את כל ההזמנות בחשבון שלכם, או להתקשר אלינו: <bdi dir="ltr">${STORE.phone}</bdi>.</p>
      <div class="cta-row"><a class="btn btn-primary" href="${url.account('orders')}">להזמנות שלי</a><a class="btn btn-ghost" href="${url.home()}">לדף הבית</a></div></div>`;
    return;
  }
  const s = order.shipping || {};
  const t = order.totals || {};
  const first = (order.customer?.name || '').split(' ')[0];
  document.title = `ההזמנה ${order.id} התקבלה — עץ מרקט`;
  root.innerHTML = `
    <div class="ck-ty-head">
      <span class="ck-ty-check">${icon('check')}</span>
      <p class="eyebrow">תודה${first ? `, ${esc(first)}` : ''}!</p>
      <h1 class="page-title" id="page-title">ההזמנה התקבלה!</h1>
      <p class="page-intro">מספר הזמנה: <strong><bdi dir="ltr">${esc(order.id)}</bdi></strong>. אישור נשלח למייל <bdi dir="ltr">${esc(order.customer?.email || '')}</bdi>.</p>
    </div>

    <section class="section-sm" aria-labelledby="next-title">
      <h2 class="sec-title" id="next-title">מה עכשיו?</h2>
      <ol class="ck-next-steps">
        <li><span class="ck-ns-ico">${icon('headset')}</span><div><h3>נציג יתקשר תוך 24 שעות</h3><p class="note">לאשר איתכם מידות, חיתוכים וגישה למנוף.</p></div></li>
        <li><span class="ck-ns-ico">${icon('clock')}</span><div><h3>תיאום מועד</h3><p class="note">${s.method === 'pickup' ? 'נעדכן ב-SMS כשההזמנה מוכנה לאיסוף.' : `קובעים יום ושעה שנוחים לכם (${esc(s.days || 'עד 72 שעות')}).`}</p></div></li>
        <li><span class="ck-ns-ico">${icon(s.method === 'pickup' ? 'pin' : 'crane')}</span><div><h3>${s.method === 'pickup' ? 'איסוף מהמחסן בירכא' : 'משלוח עם מנוף'}</h3><p class="note">${s.method === 'pickup' ? esc(STORE.address) : 'פורקים לכם עד הבית — בלי לסחוב.'}</p></div></li>
      </ol>
    </section>

    <section class="section-sm" aria-labelledby="ord-title">
      <div class="grid-2 ck-ty-grid">
        <div class="panel">
          <h2 class="h3" id="ord-title">סיכום ההזמנה</h2>
          ${miniLines(order.items || [])}
          <dl class="ck-rows">
            <div class="ck-row"><dt>סכום ביניים</dt><dd>${money(t.subtotal || 0)}</dd></div>
            ${t.cutting ? `<div class="ck-row"><dt>חיתוך לפי מידה</dt><dd>${money(t.cutting)}</dd></div>` : ''}
            <div class="ck-row"><dt>משלוח</dt><dd>${t.shipping ? money(t.shipping) : 'חינם'}</dd></div>
            ${t.discount ? `<div class="ck-row ck-row-disc"><dt>הנחה (${esc(t.coupon)})</dt><dd><bdi>−${fmt(t.discount)}</bdi></dd></div>` : ''}
            <div class="ck-row ck-row-total"><dt>סה"כ</dt><dd>${money(t.total || 0)}</dd></div>
          </dl>
        </div>
        <div class="panel panel-tint stack">
          <h2 class="h3">פרטי משלוח ותשלום</h2>
          <dl class="ck-kv">
            <div><dt>${s.method === 'pickup' ? 'איסוף' : 'כתובת'}</dt><dd>${s.method === 'pickup' ? esc(s.label || PICKUP.name) : `${esc(s.street)}, ${esc(s.city)}${s.floor ? `, קומה ${esc(s.floor)}` : ''}`}</dd></div>
            <div><dt>טלפון</dt><dd><bdi dir="ltr">${esc(order.customer?.phone || '')}</bdi></dd></div>
            ${order.customer?.company ? `<div><dt>חשבונית על שם</dt><dd>${esc(order.customer.company.name)} · ח.פ. <bdi>${esc(order.customer.company.hp)}</bdi></dd></div>` : ''}
            <div><dt>תשלום</dt><dd>${order.payment?.method === 'bit' ? 'ביט' : `כרטיס אשראי · ${order.payment?.installments > 1 ? `<bdi>${order.payment.installments}</bdi> תשלומים` : 'תשלום אחד'}`} <span class="tag-sample">דמו</span></dd></div>
          </dl>
          <div class="cta-row">
            <a class="btn btn-primary" href="${url.account('orders')}">מעקב בחשבון שלי</a>
            <a class="btn btn-ghost" href="${STORE.wa}?text=${encodeURIComponent(`שלום, לגבי הזמנה ${order.id}`)}" target="_blank" rel="noopener">${icon('wa')} שאלה ב-WhatsApp</a>
          </div>
        </div>
      </div>
    </section>`;
  $('[data-ty-guides]').innerHTML = GUIDES.slice(0, 3).map((g, i) => guideCard(g, i, true)).join('');
}

/* =========================================================================
   16. LOGIN / REGISTER
   ========================================================================= */
const safeNext = () => { const n = param('next'); return n && /^[\w\-./?=&%#]+$/.test(n) && !n.includes('//') && !n.includes(':') ? n : url.account(); };

function initLogin() {
  $('[data-crumbs]').innerHTML = crumbs([{ label: 'התחברות / הרשמה' }]);
  const root = $('[data-login-root]');
  const user = getUser();
  if (user) {
    root.innerHTML = `<div class="panel stack ck-auth">
      <p class="h3">אתם כבר מחוברים כ-${esc(user.name)}</p>
      <div class="cta-row"><a class="btn btn-primary" href="${safeNext()}">${param('next') ? 'להמשך' : 'לחשבון שלי'}</a><button class="btn btn-ghost" type="button" data-signout>יציאה מהחשבון</button></div>
    </div>`;
    $('[data-signout]').addEventListener('click', () => { signOut(); location.reload(); });
    return;
  }
  let tab = param('tab') === 'register' ? 'register' : 'login';
  root.innerHTML = `
  <div class="panel ck-auth">
    <div class="tabs ck-tabs" role="tablist" aria-label="התחברות או הרשמה">
      <button role="tab" type="button" id="tab-login" aria-controls="pane-login" data-tab="login">התחברות</button>
      <button role="tab" type="button" id="tab-register" aria-controls="pane-register" data-tab="register">הרשמה</button>
    </div>

    <div role="tabpanel" id="pane-login" aria-labelledby="tab-login">
      <form class="form-grid ck-auth-form" id="login-form" novalidate>
        <p class="form-alert fld-full" id="login-alert" role="alert"></p>
        ${fld({ id: 'li-email', name: 'email', label: 'מייל', type: 'email', ac: 'username', req: 'נא להזין כתובת מייל', v: 'email', full: true, attrs: 'inputmode="email" dir="ltr"' })}
        ${pwd({ id: 'li-pass', name: 'password', label: 'סיסמה', ac: 'current-password', req: 'נא להזין סיסמה', full: true })}
        <div class="fld-full ck-forgot-row"><button class="ck-link" type="button" data-forgot aria-expanded="false" aria-controls="forgot-box">שכחתי סיסמה</button></div>
        <button class="btn btn-primary btn-lg btn-block fld-full" type="submit">התחברות</button>
      </form>
      <form class="form-grid ck-forgot panel-tint panel" id="forgot-box" novalidate hidden>
        <p class="fld-full"><strong>איפוס סיסמה</strong> — נשלח לכם קישור לבחירת סיסמה חדשה.</p>
        ${fld({ id: 'fp-email', name: 'email', label: 'המייל שאיתו נרשמתם', type: 'email', ac: 'email', req: 'נא להזין כתובת מייל', v: 'email', full: true, attrs: 'inputmode="email" dir="ltr"' })}
        <button class="btn btn-ghost fld-full" type="submit">שליחת קישור לאיפוס</button>
        <p class="form-alert fld-full" id="fp-alert" role="status"></p>
      </form>
    </div>

    <div role="tabpanel" id="pane-register" aria-labelledby="tab-register" hidden>
      <form class="form-grid ck-auth-form" id="reg-form" novalidate>
        <p class="form-alert fld-full" id="reg-alert" role="alert"></p>
        ${fld({ id: 'rg-name', name: 'name', label: 'שם מלא', ac: 'name', req: 'נא להזין שם מלא', v: 'name', full: true })}
        ${fld({ id: 'rg-phone', name: 'phone', label: 'טלפון נייד', type: 'tel', ac: 'tel', req: 'נא להזין מספר טלפון', v: 'phone', attrs: 'inputmode="tel" dir="ltr" placeholder="050-1234567"' })}
        ${fld({ id: 'rg-email', name: 'email', label: 'מייל', type: 'email', ac: 'email', req: 'נא להזין כתובת מייל', v: 'email', attrs: 'inputmode="email" dir="ltr"' })}
        ${pwd({ id: 'rg-pass', name: 'password', label: 'סיסמה', ac: 'new-password', req: 'נא לבחור סיסמה', v: 'pass', hint: 'לפחות 8 תווים', full: true })}
        ${checkbox({ id: 'rg-news', name: 'marketing', label: 'אשמח לקבל מבצעים ומדריכים במייל' })}
        <p class="note fld-full">בהרשמה אתם מאשרים את <a class="ck-u" href="${url.terms()}">התקנון</a> ואת <a class="ck-u" href="${url.privacy()}">מדיניות הפרטיות</a>.</p>
        <button class="btn btn-primary btn-lg btn-block fld-full" type="submit">יצירת חשבון</button>
      </form>
    </div>
  </div>
  <ul class="ck-auth-why">
    <li>${icon('box')} מעקב אחרי הזמנות ומשלוחים</li>
    <li>${icon('check')} הזמנה חוזרת בלחיצה אחת</li>
    <li>${icon('heart')} מועדפים וכתובות שמורות</li>
  </ul>`;

  const tabs = $$('[role="tab"]', root);
  const setTab = (t, focus) => {
    tab = t;
    tabs.forEach(b => { const on = b.dataset.tab === t; b.setAttribute('aria-selected', on); b.tabIndex = on ? 0 : -1; $(`#pane-${b.dataset.tab}`).hidden = !on; if (on && focus) b.focus(); });
    $('#page-title').textContent = t === 'register' ? 'הרשמה' : 'התחברות';
    history.replaceState(null, '', url.login(t === 'register' ? 'register' : undefined, param('next') || undefined));
  };
  tabs.forEach(b => {
    b.addEventListener('click', () => setTab(b.dataset.tab));
    b.addEventListener('keydown', e => {
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) return;
      e.preventDefault(); setTab(tab === 'login' ? 'register' : 'login', true);
    });
  });
  setTab(tab);

  const lf = $('#login-form'), rf = $('#reg-form'), ff = $('#forgot-box');
  [lf, rf, ff].forEach(liveValidate);
  $('[data-forgot]').addEventListener('click', e => {
    const open = ff.hidden;
    ff.hidden = !open; e.currentTarget.setAttribute('aria-expanded', open);
    if (open) { $('#fp-email').value = $('#li-email').value; $('#fp-email').focus(); }
  });
  lf.addEventListener('submit', async e => {
    e.preventDefault();
    const a = $('#login-alert'), r = validate(lf);
    if (!r.ok) return failAlert(a, r);
    await signIn(lf.elements.email.value.trim());
    location.href = safeNext();
  });
  ff.addEventListener('submit', async e => {
    e.preventDefault();
    const a = $('#fp-alert'), r = validate(ff);
    if (!r.ok) return failAlert(a, r);
    const res = await resetPassword(ff.elements.email.value.trim());
    a.className = 'form-alert fld-full is-ok'; a.textContent = res.message;
  });
  rf.addEventListener('submit', async e => {
    e.preventDefault();
    const a = $('#reg-alert'), r = validate(rf);
    if (!r.ok) return failAlert(a, r);
    await signUp({ name: rf.elements.name.value.trim(), phone: rf.elements.phone.value.trim(), email: rf.elements.email.value.trim() });
    location.href = safeNext();
  });
}

/* =========================================================================
   17. ACCOUNT
   ========================================================================= */
const STATUS = ['התקבלה', 'אושרה', 'בדרך', 'נמסרה'];
const statusBadge = s => `<span class="ck-status" data-status="${STATUS.indexOf(s)}">${esc(s)}</span>`;
const SAMPLE_ORDERS = [
  { id: 'ETZ-418207', date: '2026-09-28T09:10:00Z', status: 'בדרך', sample: true,
    items: [{ id: 'ipe-deck-21', qty: 18, unitPrice: 389, lineTotal: 7002 }, { id: 'deck-screws-ss', qty: 2, unitPrice: 0, lineTotal: 0 }],
    shipping: { method: 'delivery', street: 'הזית 12', city: 'כרמיאל', zoneName: 'צפון' }, totals: { total: 7002 + 190 } },
  { id: 'ETZ-377051', date: '2026-08-14T12:30:00Z', status: 'נמסרה', sample: true,
    items: [{ id: 'pine-beam-5x10', qty: 24, unitPrice: 42, lineTotal: 1008, cut: { len: 120, pcs: 2 } }, { id: 'deck-oil-4l', qty: 1, unitPrice: 0, lineTotal: 0 }],
    shipping: { method: 'delivery', street: 'הזית 12', city: 'כרמיאל', zoneName: 'צפון' }, totals: { total: 1520 } },
  { id: 'ETZ-301996', date: '2026-06-02T07:45:00Z', status: 'אושרה', sample: true,
    items: [{ id: 'plywood-18', qty: 6, unitPrice: 0, lineTotal: 0 }],
    shipping: { method: 'pickup' }, totals: { total: 0 } },
].map(o => { // fill prices from the catalog
  o.items = o.items.filter(i => getProduct(i.id)).map(i => { const p = getProduct(i.id); const u = i.unitPrice || p.price; return { ...i, name: p.name, unitPrice: u, lineTotal: u * i.qty }; });
  if (!o.totals.total || o.sample) { const sub = o.items.reduce((s, i) => s + i.lineTotal, 0); o.totals = { subtotal: sub, shipping: o.shipping.method === 'pickup' ? 0 : 190, total: sub + (o.shipping.method === 'pickup' ? 0 : 190) }; }
  return o;
});

function invoiceHTML(o) {
  const t = o.totals || {};
  const rows = (o.items || []).map(i => `<tr><td>${esc(i.name)}${i.variant ? ` — ${esc(i.variant)}` : ''}</td><td>${i.qty}</td><td>${fmt(i.unitPrice)}</td><td>${fmt(i.lineTotal)}</td></tr>`).join('');
  return `<!doctype html><html lang="he" dir="rtl"><head><meta charset="utf-8"><title>חשבונית ${o.id}</title>
<style>body{font-family:Arial,sans-serif;max-width:720px;margin:40px auto;color:#241C16;padding:0 16px}table{width:100%;border-collapse:collapse}td,th{border-bottom:1px solid #ddd;padding:8px;text-align:start}.t{font-weight:700;font-size:1.2em}</style></head>
<body><h1>עץ מרקט בע"מ — חשבונית מס / קבלה (דוגמה)</h1><p>${STORE.address} · ${STORE.phone}</p>
<p>מספר הזמנה: ${o.id} · תאריך: ${fmtDate(o.date)}</p>${o.customer?.company ? `<p>לכבוד: ${esc(o.customer.company.name)} · ח.פ. ${esc(o.customer.company.hp)}</p>` : o.customer ? `<p>לכבוד: ${esc(o.customer.name)}</p>` : ''}
<table><thead><tr><th>פריט</th><th>כמות</th><th>מחיר יחידה</th><th>סה"כ</th></tr></thead><tbody>${rows}</tbody></table>
<p>משלוח: ${fmt(t.shipping || 0)}${t.cutting ? ` · חיתוך: ${fmt(t.cutting)}` : ''}${t.discount ? ` · הנחה: −${fmt(t.discount)}` : ''}</p><p class="t">סה"כ כולל מע"מ: ${fmt(t.total || 0)}</p>
<p><small>מסמך לדוגמה בלבד — באתר החי החשבונית מופקת על ידי מערכת הנהלת החשבונות.</small></p></body></html>`;
}
function downloadInvoice(o) {
  const blob = new Blob([invoiceHTML(o)], { type: 'text/html;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = `חשבונית-${o.id}.html`;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}
function reorder(o) {
  let n = 0;
  (o.items || []).forEach(i => { if (getProduct(i.id)) { cart.add(i.id, i.qty, { variant: i.variant || undefined, price: i.variant ? i.unitPrice : undefined, cut: i.cut || undefined }); n += i.qty; } });
  toast(`<bdi>${n}</bdi> פריטים מהזמנה <bdi dir="ltr">${esc(o.id)}</bdi> נוספו לסל`, { label: 'לסל', fn: () => { location.href = url.cart(); } });
}

function initAccount() {
  $('[data-crumbs]').innerHTML = crumbs([{ label: 'החשבון שלי' }]);
  const root = $('[data-acc-root]');
  const user = getUser();
  if (!user) {
    $('#page-title').textContent = 'החשבון שלי';
    root.innerHTML = `<div class="empty-state"><span class="empty-ico">${icon('user')}</span><p class="h3">צריך להתחבר כדי לראות את החשבון</p>
      <p>בחשבון תמצאו את ההזמנות והסטטוס שלהן, חשבוניות להורדה, כתובות שמורות והזמנה חוזרת בלחיצה.</p>
      <div class="cta-row"><a class="btn btn-primary" href="${url.login('login', url.account())}">התחברות</a><a class="btn btn-ghost" href="${url.login('register', url.account())}">הרשמה</a></div></div>`;
    return;
  }
  const real = getOrders();
  const orders = [...real, ...SAMPLE_ORDERS];
  const SECTIONS = [
    { id: 'dashboard', label: 'לוח בקרה', ico: 'home' },
    { id: 'orders', label: 'הזמנות', ico: 'box' },
    { id: 'invoices', label: 'חשבוניות', ico: 'card' },
    { id: 'addresses', label: 'כתובות', ico: 'pin' },
    { id: 'details', label: 'פרטים אישיים', ico: 'user' },
  ];
  let addresses = read(K.addr, null);
  if (!addresses) {
    const src = real.find(o => o.shipping?.method === 'delivery')?.shipping;
    addresses = src ? [{ label: 'בית', street: src.street, city: src.city, floor: src.floor || '' }] : [];
    write(K.addr, addresses);
  }

  root.innerHTML = `
  <div class="layout layout--start">
    <aside class="layout-aside" aria-label="תפריט החשבון">
      <nav class="aside-sticky">
        <ul class="side-nav ck-side">
          ${SECTIONS.map(s => `<li><a href="#${s.id}" data-sec="${s.id}">${icon(s.ico)} ${s.label}</a></li>`).join('')}
          <li><a href="${url.wishlist()}">${icon('heart')} מועדפים</a></li>
          <li><button type="button" data-signout>${icon('arrow')} יציאה</button></li>
        </ul>
      </nav>
    </aside>
    <div class="layout-main">
      <section class="ck-sec" id="sec-dashboard" aria-labelledby="h-dashboard" data-pane="dashboard"></section>
      <section class="ck-sec" id="sec-orders" aria-labelledby="h-orders" data-pane="orders" hidden></section>
      <section class="ck-sec" id="sec-invoices" aria-labelledby="h-invoices" data-pane="invoices" hidden></section>
      <section class="ck-sec" id="sec-addresses" aria-labelledby="h-addresses" data-pane="addresses" hidden></section>
      <section class="ck-sec" id="sec-details" aria-labelledby="h-details" data-pane="details" hidden></section>
    </div>
  </div>`;
  const pane = id => $(`[data-pane="${id}"]`, root);
  const sampleNote = `<p class="note">הזמנות שמסומנות <span class="tag-sample">דוגמה</span> הן נתוני הדגמה.</p>`;
  const orderTag = o => o.sample ? '<span class="tag-sample">דוגמה</span>' : '';

  // --- dashboard
  const last = orders[0];
  pane('dashboard').innerHTML = `
    <h2 class="sec-title" id="h-dashboard">שלום, ${esc(user.name)}</h2>
    ${last ? `<div class="panel ck-last">
      <div class="ck-last-head"><div><p class="note">ההזמנה האחרונה ${orderTag(last)}</p><p class="h3"><bdi dir="ltr">${esc(last.id)}</bdi></p></div>${statusBadge(last.status)}</div>
      ${statusTrack(last.status)}
      <p class="muted">${fmtDate(last.date)} · <bdi>${(last.items || []).reduce((s, i) => s + i.qty, 0)}</bdi> פריטים · ${money(last.totals?.total || 0)}</p>
      <div class="cta-row"><button class="btn btn-primary" type="button" data-reorder="${esc(last.id)}">הזמנה חוזרת</button><a class="btn btn-ghost" href="#orders">לכל ההזמנות</a></div>
    </div>` : `<div class="empty-state"><span class="empty-ico">${icon('box')}</span><p class="h3">עוד אין הזמנות</p><div class="cta-row"><a class="btn btn-primary" href="${url.shop()}">לחנות</a></div></div>`}
    <div class="grid-3 ck-quick">
      <a class="panel" href="#orders">${icon('box')}<strong>ההזמנות שלי</strong><span class="note"><bdi>${orders.length}</bdi> הזמנות</span></a>
      <a class="panel" href="#addresses">${icon('pin')}<strong>כתובות שמורות</strong><span class="note"><bdi>${addresses.length}</bdi> כתובות</span></a>
      <a class="panel" href="${url.wishlist()}">${icon('heart')}<strong>מועדפים</strong><span class="note"><bdi>${wishlist.count()}</bdi> מוצרים</span></a>
    </div>`;

  // --- orders table
  pane('orders').innerHTML = `
    <h2 class="sec-title" id="h-orders">ההזמנות שלי</h2>
    <div class="table-wrap">
      <table class="table table-stack ck-orders">
        <caption class="sr-only">רשימת ההזמנות</caption>
        <thead><tr><th scope="col">מספר</th><th scope="col">תאריך</th><th scope="col">סטטוס</th><th scope="col">סכום</th><th scope="col"><span class="sr-only">פעולות</span></th></tr></thead>
        <tbody>${orders.map(o => `
          <tr>
            <th scope="row"><bdi dir="ltr">${esc(o.id)}</bdi> ${orderTag(o)}</th>
            <td data-label="תאריך">${fmtDate(o.date)}</td>
            <td data-label="סטטוס">${statusBadge(o.status)}</td>
            <td data-label="סכום" class="num-cell">${money(o.totals?.total || 0)}</td>
            <td class="ck-acts-cell"><div class="ck-acts">
              <button class="ck-link" type="button" data-view="${esc(o.id)}" aria-expanded="false" aria-controls="ov-${esc(o.id)}">צפייה</button>
              <button class="ck-link" type="button" data-invoice="${esc(o.id)}">${icon('arrow', 'ico ck-down')} חשבונית</button>
              <button class="ck-link" type="button" data-reorder="${esc(o.id)}">הזמנה חוזרת</button>
            </div></td>
          </tr>
          <tr class="ck-ov-row" id="ov-${esc(o.id)}" hidden><td colspan="5">${miniLines(o.items || [])}
            <p class="note">${o.shipping?.method === 'pickup' ? 'איסוף עצמי מירכא' : `משלוח ל${esc(o.shipping?.street || '')}, ${esc(o.shipping?.city || '')}`}</p></td></tr>`).join('')}
        </tbody>
      </table>
    </div>
    ${sampleNote}`;

  // --- invoices
  pane('invoices').innerHTML = `
    <h2 class="sec-title" id="h-invoices">חשבוניות</h2>
    <ul class="ck-inv">${orders.map(o => `<li class="panel">
      <div><p><strong>חשבונית להזמנה <bdi dir="ltr">${esc(o.id)}</bdi></strong> ${orderTag(o)}</p><p class="note">${fmtDate(o.date)} · ${money(o.totals?.total || 0)}</p></div>
      <button class="btn btn-ghost ck-btn-sm" type="button" data-invoice="${esc(o.id)}">הורדה<span class="sr-only"> של חשבונית ${esc(o.id)}</span></button>
    </li>`).join('')}</ul>
    <p class="note">החשבונית נשלחת גם למייל אחרי אישור ההזמנה. צריכים חשבונית על שם חברה? סמנו זאת בקופה.</p>`;

  // --- addresses
  function renderAddresses() {
    pane('addresses').innerHTML = `
      <h2 class="sec-title" id="h-addresses">כתובות שמורות</h2>
      ${addresses.length ? `<ul class="grid-2 ck-addr">${addresses.map((a, i) => `<li class="panel">
        <p><strong>${esc(a.label || 'כתובת')}</strong></p><p>${esc(a.street)}, ${esc(a.city)}${a.floor ? `, קומה ${esc(a.floor)}` : ''}</p>
        <button class="ck-link" type="button" data-addr-del="${i}">${icon('trash')} מחיקה<span class="sr-only"> של ${esc(a.label || 'הכתובת')}</span></button>
      </li>`).join('')}</ul>` : '<p class="muted">עוד אין כתובות שמורות. כתובת שתזינו בקופה תישמר כאן.</p>'}
      <form class="panel form-grid ck-addr-form" id="addr-form" novalidate>
        <h3 class="h3 fld-full">הוספת כתובת</h3>
        <p class="form-alert fld-full" id="addr-alert" role="alert"></p>
        ${fld({ id: 'ad-label', name: 'label', label: 'שם לכתובת', opt: true, attrs: 'placeholder="למשל: בית, אתר בנייה"' })}
        ${fld({ id: 'ad-city', name: 'city', label: 'עיר / יישוב', ac: 'address-level2', req: 'נא להזין עיר או יישוב' })}
        ${fld({ id: 'ad-street', name: 'street', label: 'רחוב ומספר בית', ac: 'address-line1', req: 'נא להזין רחוב ומספר בית' })}
        ${fld({ id: 'ad-floor', name: 'floor', label: 'קומה', opt: true, v: 'floor', attrs: 'inputmode="numeric" maxlength="3"' })}
        <div class="fld-full"><button class="btn btn-primary" type="submit">שמירת כתובת</button></div>
      </form>`;
    const f = $('#addr-form');
    liveValidate(f);
    f.addEventListener('submit', e => {
      e.preventDefault();
      const r = validate(f);
      if (!r.ok) return failAlert($('#addr-alert'), r);
      addresses.push({ label: f.elements.label.value.trim(), city: f.elements.city.value.trim(), street: f.elements.street.value.trim(), floor: f.elements.floor.value.trim() });
      write(K.addr, addresses); renderAddresses(); toast('הכתובת נשמרה');
      $('#h-addresses').focus?.();
    });
  }
  renderAddresses();

  // --- details + password
  pane('details').innerHTML = `
    <h2 class="sec-title" id="h-details">פרטים אישיים</h2>
    <div class="stack-lg">
      <form class="panel form-grid" id="det-form" novalidate>
        <p class="form-alert fld-full" id="det-alert" role="status"></p>
        ${fld({ id: 'dt-name', name: 'name', label: 'שם מלא', ac: 'name', req: 'נא להזין שם מלא', v: 'name', full: true })}
        ${fld({ id: 'dt-phone', name: 'phone', label: 'טלפון נייד', type: 'tel', ac: 'tel', req: 'נא להזין מספר טלפון', v: 'phone', attrs: 'inputmode="tel" dir="ltr"' })}
        ${fld({ id: 'dt-email', name: 'email', label: 'מייל', type: 'email', ac: 'email', req: 'נא להזין כתובת מייל', v: 'email', attrs: 'inputmode="email" dir="ltr"' })}
        <div class="fld-full"><button class="btn btn-primary" type="submit">שמירת פרטים</button></div>
      </form>
      <form class="panel form-grid" id="pw-form" novalidate>
        <h3 class="h3 fld-full">שינוי סיסמה</h3>
        <p class="form-alert fld-full" id="pw-alert" role="status"></p>
        ${pwd({ id: 'pw-cur', name: 'current', label: 'סיסמה נוכחית', ac: 'current-password', req: 'נא להזין את הסיסמה הנוכחית', full: true })}
        ${pwd({ id: 'pw-new', name: 'new', label: 'סיסמה חדשה', ac: 'new-password', req: 'נא לבחור סיסמה חדשה', v: 'pass', hint: 'לפחות 8 תווים' })}
        ${pwd({ id: 'pw-new2', name: 'confirm', label: 'אימות סיסמה חדשה', ac: 'new-password', req: 'נא להקליד שוב את הסיסמה החדשה', v: 'match', attrs: 'data-match="#pw-new"' })}
        <div class="fld-full"><button class="btn btn-ghost" type="submit">עדכון סיסמה</button></div>
      </form>
    </div>`;
  const df = $('#det-form'), pf = $('#pw-form');
  df.elements.name.value = user.name || ''; df.elements.phone.value = user.phone || ''; df.elements.email.value = user.email || '';
  [df, pf].forEach(liveValidate);
  df.addEventListener('submit', async e => {
    e.preventDefault();
    const a = $('#det-alert'), r = validate(df);
    if (!r.ok) return failAlert(a, r);
    await signUp({ name: df.elements.name.value.trim(), phone: df.elements.phone.value.trim(), email: df.elements.email.value.trim() });
    a.className = 'form-alert fld-full is-ok'; a.textContent = 'הפרטים נשמרו.';
    $('#h-dashboard').textContent = `שלום, ${df.elements.name.value.trim()}`;
  });
  pf.addEventListener('submit', e => {
    e.preventDefault();
    const a = $('#pw-alert'), r = validate(pf);
    if (!r.ok) return failAlert(a, r);
    pf.reset();
    a.className = 'form-alert fld-full is-ok'; a.textContent = 'הסיסמה עודכנה (בדמו הסיסמה לא נשמרת בפועל).';
  });

  // --- events
  const byId = id => orders.find(o => o.id === id);
  root.addEventListener('click', e => {
    const v = e.target.closest('[data-view]');
    if (v) { const row = document.getElementById(`ov-${v.dataset.view}`); const open = row.hidden; row.hidden = !open; v.setAttribute('aria-expanded', open); v.textContent = open ? 'הסתרה' : 'צפייה'; }
    const inv = e.target.closest('[data-invoice]'); if (inv) downloadInvoice(byId(inv.dataset.invoice));
    const re = e.target.closest('[data-reorder]'); if (re) reorder(byId(re.dataset.reorder));
    const del = e.target.closest('[data-addr-del]');
    if (del) { const [gone] = addresses.splice(Number(del.dataset.addrDel), 1); write(K.addr, addresses); renderAddresses(); toast('הכתובת נמחקה', { label: 'ביטול', fn: () => { addresses.push(gone); write(K.addr, addresses); renderAddresses(); } }); }
    if (e.target.closest('[data-signout]')) { signOut(); location.href = url.home(); }
  });

  // --- hash routing between sections
  const show = () => {
    const id = SECTIONS.some(s => s.id === location.hash.slice(1)) ? location.hash.slice(1) : 'dashboard';
    $$('[data-pane]', root).forEach(p => { p.hidden = p.dataset.pane !== id; });
    $$('[data-sec]', root).forEach(a => a.dataset.sec === id ? a.setAttribute('aria-current', 'page') : a.removeAttribute('aria-current'));
    $('#page-title').textContent = id === 'dashboard' ? 'החשבון שלי' : SECTIONS.find(s => s.id === id).label;
    return id;
  };
  window.addEventListener('hashchange', () => { const id = show(); const h = $(`#h-${id}`); h.tabIndex = -1; h.focus({ preventScroll: true }); window.scrollTo({ top: 0 }); });
  show();
}
function statusTrack(status) {
  const k = STATUS.indexOf(status);
  return `<ol class="progress ck-track" aria-label="סטטוס ההזמנה">${STATUS.map((s, i) => `<li class="${i < k ? 'is-done' : i === k ? 'is-current' : ''}"${i === k ? ' aria-current="step"' : ''}>${s}</li>`).join('')}</ol>`;
}

/* ---------------- boot ---------------- */
({ cart: initCartPage, checkout: initCheckoutPage, 'thank-you': initThankYou, login: initLogin, account: initAccount })[page]?.();
