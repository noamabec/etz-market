/* ==========================================================================
   עץ מרקט — shell.js
   הופך כל עמוד פנימי לעמוד מלא באתר: מעתיק את ה"מעטפת" מ-index.html
   (ספרייט אייקונים, דילוג לתוכן, סטריפ עליון, האדר, פוטר, WhatsApp, נגישות,
   סרגל תחתון, מגירת מובייל, מגירת סל, toast), מסמן את הפריט הפעיל בתפריט
   ובסרגל התחתון לפי <body data-page="...">, ואז טוען את js/main.js.

   שימוש בעמוד:
     <body data-page="shop">            ← מפתח מ-ROUTES (js/routes.js)
     <body data-page="checkout" data-shell="checkout">  ← מעטפת מינימלית לקופה
     <main id="main">…</main>

     import { ready } from './shell.js';
     await ready;          // המעטפת קיימת ו-main.js רץ — אפשר לרנדר
   או: document.addEventListener('shell:ready', fn)
   (מקור אמת אחד לאב-טיפוס; בפלטפורמה זה יהיה header/footer partials)
   ========================================================================== */

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

const TOP = ['svg[aria-hidden="true"]', '.skip-link', '#topstrip', '#site-header'];
const BOTTOM = ['#site-footer', '.fab-wa', '.a11y', '#drawer', '[data-scrim]', '#cart-drawer', '#toast'];
// checkout (אפיון #14): בלי האדר ופוטר מלאים, בלי WhatsApp — רק לוגו, "סליקה מאובטחת" וטלפון
const TOP_MIN = ['svg[aria-hidden="true"]', '.skip-link'];
const BOTTOM_MIN = ['.a11y', '#toast'];

/** איזה פריט בתפריט הראשי פעיל לכל עמוד */
const NAV_FOR = {
  shop: 'shop', category: 'shop', product: 'shop', search: 'shop', wishlist: 'shop',
  cutting: 'cutting.html', delivery: 'cutting.html',
  'deck-calculator': 'deck-calculator.html',
  guides: 'guides.html', guide: 'guides.html',
  about: 'about.html', contact: 'contact.html',
};

function minimalHeader(doc) {
  const logo = doc.querySelector('#site-header .logo');
  const hdr = document.createElement('header');
  hdr.className = 'co-hdr';
  hdr.innerHTML = `
    <div class="container co-hdr-in">
      ${logo ? logo.outerHTML : '<a class="logo" href="index.html">עץ מרקט</a>'}
      <p class="co-secure"><svg class="ico" aria-hidden="true"><use href="#i-lock"/></svg> סליקה מאובטחת</p>
      <a class="co-help" href="tel:+97245550000"><svg class="ico" aria-hidden="true"><use href="#i-phone"/></svg><span><small>עזרה בטלפון</small><bdi dir="ltr">04-555-0000</bdi></span></a>
    </div>`;
  return hdr;
}

function minimalFooter() {
  const f = document.createElement('footer');
  f.className = 'co-ftr';
  f.innerHTML = `
    <div class="container co-ftr-in">
      <p>© <bdi>2026</bdi> עץ מרקט בע"מ · סליקה מאובטחת · עד 12 תשלומים</p>
      <ul class="co-ftr-links">
        <li><a href="terms.html">תקנון</a></li>
        <li><a href="shipping-returns.html">משלוחים והחזרות</a></li>
        <li><a href="privacy.html">פרטיות</a></li>
        <li><a href="accessibility.html">נגישות</a></li>
      </ul>
    </div>`;
  return f;
}

function markActive(page) {
  // main nav (desktop) + drawer (mobile)
  const target = NAV_FOR[page];
  const cat = new URLSearchParams(location.search).get('c');
  const navTarget = page === 'category' && (cat === 'pergolas' || cat === 'decking') ? 'c=pergolas' : target;
  $$('.nav-list .nav-link, .drawer-nav a').forEach(a => { a.classList.remove('is-current'); a.removeAttribute('aria-current'); });
  if (navTarget === 'shop') {
    $('.nav-mega-btn')?.classList.add('is-current');
    $$('.drawer-nav ol a[href="shop.html"]').forEach(a => a.setAttribute('aria-current', 'page'));
  } else if (navTarget) {
    $$(`.nav-list a.nav-link[href*="${navTarget}"], .drawer-nav ol a[href*="${navTarget}"]`).forEach(a => a.setAttribute('aria-current', 'page'));
  }
}

async function build() {
  const body = document.body;
  const page = body.dataset.page || '';
  const minimal = body.dataset.shell === 'checkout';
  document.documentElement.dataset.page = page;
  const main = document.getElementById('main') || document.querySelector('main');

  try {
    const res = await fetch('index.html', { cache: 'no-cache' });
    const doc = new DOMParser().parseFromString(await res.text(), 'text/html');
    const take = sel => { const n = doc.querySelector(sel); return n ? document.importNode(n, true) : null; };

    const top = (minimal ? TOP_MIN : TOP).map(take).filter(Boolean);
    if (minimal) top.push(minimalHeader(doc));
    const bottom = (minimal ? BOTTOM_MIN : BOTTOM).map(take).filter(Boolean);
    if (minimal) bottom.unshift(minimalFooter());

    if (main) { main.before(...top); main.after(...bottom); }
    else { body.prepend(...top); body.append(...bottom); }
    if (minimal) body.classList.add('is-checkout');
    markActive(page);
  } catch (err) {
    console.error('[shell] could not load the shared header/footer from index.html — open the site through the local server (serve.ps1), not file://', err);
  }

  await import('./main.js');
  document.dispatchEvent(new CustomEvent('shell:ready', { detail: { page } }));
}

/** Promise שמתממש כשהמעטפת והסקריפטים המשותפים מוכנים */
export const ready = build();
