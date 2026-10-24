/* p-info.js — owner: קבוצת מידע ועמודי חובה (info): contact.html, faq.html, terms.html, shipping-returns.html, privacy.html, accessibility.html, sitemap.html, 404.html
   כל עמוד מזוהה לפי <body data-page="..."> ומאותחל אחרי שהמעטפת מוכנה. */
import { ready } from './shell.js';
import { FAQ, BRANCHES, CATEGORIES, GUIDES, SHIPPING_ZONES, WEIGHT_TIERS, PICKUP, SHOP_RULES } from './data.js';
import { crumbs, catCard, esc } from './ui.js';
import { url, ROUTES } from './routes.js';
import { fmt } from './cart.js';
import { sendContact } from './commerce.js';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const page = document.body.dataset.page;

await ready;

const TITLES = Object.fromEntries(ROUTES.map(r => [r.key, r.title]));
const setCrumbs = (list) => { const el = $('[data-crumbs]'); if (el) el.innerHTML = crumbs(list); };

/** אחרי רינדור דינמי — לגלול לעוגן שבכתובת (הוא לא היה קיים בטעינה) */
function scrollToHash() {
  const id = decodeURIComponent(location.hash.slice(1));
  if (!id) return;
  const el = document.getElementById(id);
  if (el) setTimeout(() => el.scrollIntoView({ block: 'start', behavior: 'instant' }), 0);
}

/* ======================================================================
   צור קשר
   ====================================================================== */
const TOPICS = { order: 'הזמנה', shipping: 'משלוח', cutting: 'חיתוך', other: 'אחר', advice: 'אחר' };

function initContact() {
  setCrumbs([{ label: 'צור קשר וסניפים' }]);
  const form = $('#contact-form');
  if (!form) return;

  // נושא מראש: contact.html?topic=cutting (או בעברית)
  const t = new URLSearchParams(location.search).get('topic');
  const sel = form.elements.topic;
  if (t) {
    const val = TOPICS[t] || t;
    if ([...sel.options].some(o => o.value === val)) sel.value = val;
    if (t === 'advice') form.elements.message.value = 'אשמח לייעוץ עם נגר לגבי ';
  }
  // כרטיס "ייעוץ נגר" ממלא את הטופס
  $$('[data-advice]').forEach(a => a.addEventListener('click', () => {
    sel.value = 'אחר';
    const m = form.elements.message;
    if (!m.value.trim()) m.value = 'אשמח לייעוץ עם נגר לגבי ';
    setTimeout(() => { m.focus(); m.setSelectionRange(m.value.length, m.value.length); }, 350);
  }));

  const rules = {
    name: v => v.trim().length >= 2 ? '' : (v.trim() ? 'השם קצר מדי — נא להזין שם מלא' : 'נא להזין שם'),
    phone: v => {
      const d = v.replace(/[\s\-()]/g, '').replace(/^\+972/, '0');
      if (!d) return 'נא להזין מספר טלפון';
      return /^0(5\d{8}|7\d{8}|[23489]\d{7})$/.test(d) ? '' : 'מספר הטלפון לא תקין — למשל 050-1234567';
    },
    topic: v => v ? '' : 'נא לבחור נושא',
    message: v => v.trim().length >= 5 ? '' : (v.trim() ? 'ההודעה קצרה מדי — ספרו לנו עוד קצת' : 'נא לכתוב הודעה'),
  };
  let tried = false;

  const check = name => {
    const el = form.elements[name];
    const msg = rules[name](el.value);
    const fld = el.closest('.fld');
    const err = $(`#cf-${name}-err`);
    fld.classList.toggle('is-error', !!msg);
    if (msg) el.setAttribute('aria-invalid', 'true'); else el.removeAttribute('aria-invalid');
    err.textContent = msg;
    return !msg;
  };

  Object.keys(rules).forEach(name => {
    const el = form.elements[name];
    el.addEventListener('blur', () => { if (tried || el.value) check(name); });
    el.addEventListener('input', () => { if (tried || el.closest('.fld').classList.contains('is-error')) check(name); });
    el.addEventListener('change', () => { if (tried) check(name); });
  });

  form.addEventListener('submit', async e => {
    e.preventDefault();
    tried = true;
    const alert = $('.form-alert', form);
    const bad = Object.keys(rules).filter(n => !check(n));
    if (bad.length) {
      alert.className = 'form-alert is-error';
      alert.textContent = bad.length === 1 ? 'יש שדה אחד שצריך לתקן.' : `יש ${bad.length} שדות שצריך לתקן.`;
      form.elements[bad[0]].focus();
      return;
    }
    alert.className = 'form-alert'; alert.textContent = '';
    const btn = $('button[type="submit"]', form);
    btn.disabled = true; btn.textContent = 'שולחים…';
    const data = Object.fromEntries(new FormData(form));
    try {
      const res = await sendContact(data);
      if (!res?.ok) throw new Error(res?.message);
      const box = $('#contact-success');
      $('[data-success-msg]', box).textContent = res.message || 'תודה! קיבלנו את הפנייה.';
      $('[data-success-name]', box).textContent = data.name.trim().split(/\s+/)[0];
      form.hidden = true; box.hidden = false; box.focus();
    } catch (err) {
      alert.className = 'form-alert is-error';
      alert.textContent = 'משהו השתבש בשליחה. נסו שוב, או התקשרו אלינו ל-04-555-0000.';
    } finally {
      btn.disabled = false; btn.textContent = 'שליחה';
    }
  });

  $('[data-again]')?.addEventListener('click', () => {
    form.reset(); tried = false;
    Object.keys(rules).forEach(n => { form.elements[n].removeAttribute('aria-invalid'); form.elements[n].closest('.fld').classList.remove('is-error'); $(`#cf-${n}-err`).textContent = ''; });
    $('#contact-success').hidden = true; form.hidden = false; form.elements.name.focus();
  });

  // סניפים נוספים — מ-BRANCHES
  const soon = $('[data-soon]');
  if (soon) soon.innerHTML = BRANCHES.filter(b => b.status === 'soon').map(b => `
    <article class="soon-card">
      <span class="badge">בקרוב</span>
      <h3 class="h3">${esc(b.name)}</h3>
      <p class="muted">${esc(b.note)}</p>
    </article>`).join('');
}

/* ======================================================================
   שאלות נפוצות
   ====================================================================== */
function initFaq() {
  setCrumbs([{ label: 'שאלות נפוצות' }]);
  const list = $('[data-faq]');
  const nav = $('[data-faq-nav]');
  const total = FAQ.reduce((n, c) => n + c.items.length, 0);

  nav.innerHTML = FAQ.map(c => `<a href="#${c.id}">${c.name}<small>${c.items.length}</small></a>`).join('');
  list.innerHTML = FAQ.map(c => `
    <section class="faq-cat" id="${c.id}" aria-labelledby="h-${c.id}">
      <h2 class="sec-title" id="h-${c.id}">${c.name} <small data-cat-count>${c.items.length} שאלות</small></h2>
      <div class="faq-list">
        ${c.items.map(f => `
        <div class="faq-item">
          <h3 class="faq-q" data-raw="${esc(f.q)}">${esc(f.q)}</h3>
          <div class="faq-a"><p data-raw="${esc(f.a)}">${esc(f.a)}</p></div>
        </div>`).join('')}
      </div>
    </section>`).join('');

  // מצב פעיל בניווט הצד
  const links = $$('a', nav);
  const mark = id => links.forEach(a => a.getAttribute('href') === `#${id}` ? a.setAttribute('aria-current', 'true') : a.removeAttribute('aria-current'));
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) mark(e.target.id); }), { rootMargin: '-30% 0px -60% 0px' });
    $$('.faq-cat', list).forEach(s => io.observe(s));
  }

  // חיפוש
  const input = $('#faq-q');
  const count = $('[data-faq-count]');
  const empty = $('[data-faq-empty]');
  const norm = s => s.toLowerCase().replace(/["'״׳]/g, '');
  const hl = (raw, words) => {
    let h = esc(raw);
    words.forEach(w => {
      const re = new RegExp(`(${esc(w).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
      h = h.replace(re, '<mark>$1</mark>');
    });
    return h;
  };
  let tmr;
  const run = () => {
    const q = input.value.trim();
    const words = q.split(/\s+/).filter(w => w.length > 1);
    let shown = 0;
    $$('.faq-cat', list).forEach(sec => {
      let n = 0;
      $$('.faq-item', sec).forEach(item => {
        const qEl = $('.faq-q', item), aEl = $('.faq-a p', item);
        const text = norm(qEl.dataset.raw + ' ' + aEl.dataset.raw);
        const ok = !words.length || words.every(w => text.includes(norm(w)));
        item.hidden = !ok;
        qEl.innerHTML = words.length && ok ? hl(qEl.dataset.raw, words) : esc(qEl.dataset.raw);
        aEl.innerHTML = words.length && ok ? hl(aEl.dataset.raw, words) : esc(aEl.dataset.raw);
        if (ok) n++;
      });
      sec.hidden = n === 0;
      $('[data-cat-count]', sec).textContent = words.length ? (n === 1 ? 'תוצאה אחת' : `${n} תוצאות`) : `${n} שאלות`;
      shown += n;
    });
    empty.hidden = shown > 0;
    $('[data-faq-empty-q]').textContent = q;
    count.textContent = !words.length ? `${total} שאלות ב-${FAQ.length} נושאים` : shown === 1 ? `נמצאה תשובה אחת עבור "${q}"` : shown ? `נמצאו ${shown} תשובות עבור "${q}"` : `לא נמצאו תשובות עבור "${q}"`;
  };
  input.addEventListener('input', () => { clearTimeout(tmr); tmr = setTimeout(run, 120); });
  $('#faq-search').addEventListener('submit', e => { e.preventDefault(); run(); });
  $('[data-faq-clear]')?.addEventListener('click', () => { input.value = ''; run(); input.focus(); });
  const q0 = new URLSearchParams(location.search).get('q');
  if (q0) input.value = q0;
  run();
  scrollToHash();
}

/* ======================================================================
   עמודים משפטיים — פירורי לחם, טבלת משלוחים, הדגשת הסעיף הפעיל בתוכן העניינים
   ====================================================================== */
function initLegal() {
  setCrumbs([{ label: 'מידע ותקנונים', href: url.sitemap() }, { label: TITLES[page] }]);

  const ship = $('[data-ship-table] tbody');
  if (ship) {
    ship.innerHTML = SHIPPING_ZONES.map(z => `
      <tr>
        <th scope="row">${z.name}<br><small class="muted">${z.areas}</small></th>
        ${z.prices.map((p, i) => `<td data-label="${esc(WEIGHT_TIERS[i])}" class="num-cell"><bdi>${fmt(p)}</bdi></td>`).join('')}
        <td data-label="זמן אספקה">${z.days}</td>
      </tr>`).join('') + `
      <tr><th scope="row">${PICKUP.name}</th><td data-label="מחיר" class="num-cell" colspan="3">חינם</td><td data-label="מתי">${PICKUP.note}</td></tr>`;
    $$('[data-free-over]').forEach(el => { el.textContent = fmt(SHOP_RULES.freeShippingOver); });
  }

  const links = $$('.legal-toc a');
  if (links.length && 'IntersectionObserver' in window) {
    const setCur = id => links.forEach(a => a.getAttribute('href') === `#${id}` ? a.setAttribute('aria-current', 'true') : a.removeAttribute('aria-current'));
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) setCur(e.target.id); }), { rootMargin: '-20% 0px -70% 0px' });
    $$('.legal > section[id]').forEach(s => io.observe(s));
  }
}

/* ======================================================================
   מפת אתר — מ-ROUTES ומהנתונים
   ====================================================================== */
function initSitemap() {
  setCrumbs([{ label: 'מפת אתר' }]);
  const li = (href, label, inner = '') => `<li><a href="${href}">${label}</a>${inner}</li>`;
  const r = key => TITLES[key];
  const groups = [
    { title: 'חנות', items: [
      li(url.home(), r('home')),
      li(url.shop(), r('shop')),
      ...CATEGORIES.map(c => li(url.category(c.id), c.name, `<ul>${c.subs.map(s => li(url.category(c.id, s), s)).join('')}</ul>`)),
    ] },
    { title: 'שירותים וכלים', items: [
      li(url.cutting(), r('cutting')), li(url.delivery(), r('delivery')), li(url.deckCalculator(), r('deck-calculator')),
      li(url.search(''), 'חיפוש באתר'),
    ] },
    { title: 'הקנייה שלי', items: [
      li(url.cart(), r('cart')), li(url.checkout(), r('checkout')), li(url.login(), r('login')), li(url.login('register'), 'הרשמה'),
      li(url.account(), r('account')), li(url.account('orders'), 'ההזמנות שלי'), li(url.wishlist(), r('wishlist')),
    ] },
    { title: 'החברה', items: [
      li(url.about(), r('about')), li(url.contact(), r('contact')), li(url.faq(), r('faq'),
        `<ul>${FAQ.map(c => li(url.faq(c.id), c.name)).join('')}</ul>`),
    ] },
    { title: 'מידע ותקנונים', items: [
      li(url.terms(), r('terms')), li(url.shippingReturns(), r('shipping-returns')), li(url.privacy(), r('privacy')),
      li(url.accessibility(), r('accessibility')), li(url.sitemap(), r('sitemap')),
    ] },
    { title: 'מדריכים ורעיונות', wide: true, items: [
      li(url.guides(), 'כל המדריכים'),
      ...GUIDES.map(g => li(url.guide(g.id), g.title)),
    ] },
  ];
  $('[data-sitemap]').innerHTML = groups.map((g, i) => `
    <nav class="sm-col${g.wide ? ' sm-wide' : ''}" aria-labelledby="sm-h-${i}">
      <h2 id="sm-h-${i}">${g.title}</h2>
      <ul>${g.items.join('')}</ul>
    </nav>`).join('');
}

/* ======================================================================
   404
   ====================================================================== */
function init404() {
  // כשהעמוד מוגש לכתובת מקוננת (/x/y) — עוגנים פנימיים (#main וכו') צריכים להישאר בעמוד הזה ולא לעבור ל-<base>
  if ($('base')) {
    const here = location.pathname + location.search;
    $$('a[href^="#"]').forEach(a => { a.setAttribute('href', here + a.getAttribute('href')); });
  }
  setCrumbs([{ label: 'העמוד לא נמצא' }]);
  const cats = $('[data-nf-cats]');
  if (cats) cats.innerHTML = CATEGORIES.map(catCard).join('');
  const path = $('[data-nf-path]');
  const asked = location.pathname.replace(/^\/+/, '');
  if (path && asked && !/(^|\/)404\.html$/.test(asked)) {
    path.textContent = `הכתובת שביקשתם: /${decodeURIComponent(asked)}`;
    path.hidden = false;
  }
}

const INIT = {
  contact: initContact, faq: initFaq, sitemap: initSitemap, 404: init404,
  terms: initLegal, 'shipping-returns': initLegal, privacy: initLegal, accessibility: initLegal,
};
INIT[page]?.();
