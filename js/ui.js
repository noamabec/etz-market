/* ==========================================================================
   עץ מרקט — ui.js
   רכיבי HTML משותפים (ללא תופעות לוואי בייבוא) — לשימוש דף הבית וכל העמודים.
     productCard(p, i) · stars(rating) · catCard(c, i) · guideCard(g, i)
     crumbs([{label, href}, ...]) · esc(str) · observeReveal(root) · countUp(el)
   ========================================================================== */
import { BADGES, catLabel, productImage, productTexture, guideImage } from './data.js';
import { wishlist, fmt } from './cart.js';
import { url } from './routes.js';

export const arrow = '<svg class="ico" aria-hidden="true"><use href="#i-arrow"/></svg>';
export const icon = (id, cls = 'ico') => `<svg class="${cls}" aria-hidden="true"><use href="#i-${id}"/></svg>`;
export const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/** 5 כוכבים (חצי כוכב לפי הדירוג) */
export function stars(rating) {
  return Array.from({ length: 5 }, (_, k) =>
    `<svg aria-hidden="true"${rating < k + .75 && rating >= k + .25 ? ' class="half"' : ''}><use href="#i-star"/></svg>`).join('');
}

/** בחירת וריאציה בקוביה — אותו פורמט כמו בעמוד המוצר (כדי ששורות בסל יתמזגו) */
export function cardVariant(p, picks = []) {
  const sel = p.variants.map((v, vi) => v.options[picks[vi] || 0]);
  return {
    unit: p.price + sel.reduce((s, x) => s + x.delta, 0),
    variant: p.variants.map((v, vi) => `${v.name}: ${sel[vi].label}`).join(' · '),
  };
}

let cardSeq = 0;
const cardVars = p => {
  if (!p.variants?.length) return '';
  const uid = ++cardSeq;
  return `<div class="p-vars">${p.variants.map((v, vi) => `
        <fieldset class="p-var"><legend>${v.name}</legend><div class="p-var-opts">${v.options.map((o, oi) => `
          <label class="p-chip"><input type="radio" name="pv${uid}-${vi}" value="${oi}" data-pv="${vi}"${oi ? '' : ' checked'}><span>${esc(o.label)}</span></label>`).join('')}</div></fieldset>`).join('')}
      </div>`;
};

/** קוביית מוצר — אותו רכיב בכל האתר (אפיון: "קוביית מוצר") */
export function productCard(p, i = 0) {
  const badgeCls = p.badge === 'sale' ? 'badge-sale' : p.badge === 'best' ? 'badge-best' : '';
  const href = url.product(p.id);
  const pressed = wishlist.has(p.id);
  const tex = productTexture(p);
  const hasVars = p.variants?.length > 0;
  const start = hasVars ? cardVariant(p).unit : p.price;
  return `
  <article class="p-card" data-anim style="--d:${(i % 4) * .07}s">
    <div class="p-media">
      <a href="${href}" tabindex="-1" aria-hidden="true">
        <div class="ph ph-a" data-tone="${p.tone}"><img class="ph-img" src="${productImage(p)}" alt="${esc(p.name)}" loading="lazy"></div>
        <div class="ph ph-b" data-tone="${p.tone}">${tex ? `<img class="ph-img" src="${tex}" alt="" loading="lazy">` : ''}</div>
      </a>
      ${p.badge ? `<span class="badge ${badgeCls}">${BADGES[p.badge]}</span>` : ''}
      <button class="wish" type="button" data-wish="${p.id}" aria-pressed="${pressed}" aria-label="הוספה למועדפים: ${esc(p.name)}"><svg class="ico" aria-hidden="true"><use href="#i-heart"/></svg></button>
    </div>
    <div class="p-body">
      <span class="p-cat">${catLabel(p)}</span>
      <h3 class="p-name"><a href="${href}">${p.name}</a></h3>
      <p class="p-dims"><bdi>${p.dims}</bdi></p>
      <div class="p-rating"><span class="stars" aria-hidden="true">${stars(p.rating)}</span><span><bdi>${p.rating}</bdi> (<bdi>${p.reviews}</bdi>)</span><span class="sr-only">דירוג ${p.rating} מתוך 5, ${p.reviews} ביקורות</span></div>
      ${cardVars(p)}
      <p class="p-price" aria-live="polite">${hasVars ? '' : '<span class="from">החל מ-</span>'}<bdi class="now">${fmt(start)}</bdi><span class="unit">${p.unit}</span>${p.was ? `<s${start === p.price ? '' : ' hidden'}><span class="sr-only">במקום </span><bdi>${fmt(p.was)}</bdi></s>` : ''}</p>
      <button class="btn btn-add" type="button" data-add="${p.id}"${p.inStock ? "" : " disabled"}>${p.inStock ? "הוספה לסל" : "אזל מהמלאי"}</button>
    </div>
  </article>`;
}

/** כרטיס קטגוריה (כמו בדף הבית) — עטוף ב-<li> */
export function catCard(c, i = 0) {
  return `
    <li data-anim style="--d:${(i % 4) * .07}s">
      <a class="cat-card${c.id === 'sale' ? ' cat-sale' : ''}" href="${url.category(c.id)}">
        <div class="ph" data-tone="${c.tone}"><img class="ph-img" src="assets/img/cat-${c.id}.webp" alt="" loading="lazy"></div>
        <div class="cat-meta">
          <div><h3>${c.name}</h3><small>${c.count} מוצרים</small></div>
          <span class="cat-go" aria-hidden="true">${arrow}</span>
        </div>
      </a>
    </li>`;
}

/** כרטיס מדריך (כמו בדף הבית) — עטוף ב-<li>. withExcerpt מוסיף תקציר. */
export function guideCard(g, i = 0, withExcerpt = false) {
  return `
    <li data-anim style="--d:${(i % 3) * .08}s">
      <a class="guide-card" href="${url.guide(g.id)}">
        <div class="ph" data-tone="${g.tone}"><img class="ph-img" src="${guideImage(g)}" alt="" loading="lazy"></div>
        <div class="g-meta"><span class="badge">${g.cat}</span><span>${g.mins} דק׳ קריאה</span></div>
        <h3>${g.title}</h3>
        ${withExcerpt && g.excerpt ? `<p class="g-excerpt">${g.excerpt}</p>` : ''}
      </a>
    </li>`;
}

/** פירורי לחם. הפריט האחרון = העמוד הנוכחי (בלי href). דף הבית נוסף אוטומטית. */
export function crumbs(list) {
  const all = [{ label: 'דף הבית', href: url.home() }, ...list];
  return `<nav class="crumbs" aria-label="פירורי לחם"><ol>${all.map((c, i) => i === all.length - 1 || !c.href
    ? `<li><span aria-current="page">${c.label}</span></li>`
    : `<li><a href="${c.href}">${c.label}</a></li>`).join('')}</ol></nav>`;
}

/* ---------------- Reveal on enter ---------------- */
const html = document.documentElement;
export const reduceMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches || html.classList.contains('a11y-nomotion');

export function countUp(el) {
  const to = Number(el.dataset.count), suffix = el.dataset.suffix || '';
  if (reduceMotion()) { el.textContent = to.toLocaleString('he-IL') + suffix; return; }
  const t0 = performance.now(), dur = 1400;
  const tick = now => {
    const p = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - p, 3);
    el.textContent = Math.round(to * e).toLocaleString('he-IL') + suffix;
    if (p < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

const SEL = '[data-anim], [data-split], .dim, .mark';
let io;
/** מתחיל לעקוב אחרי אלמנטים לחשיפה בתוך root (גם root עצמו). בטוח לקרוא כמה פעמים. */
export function observeReveal(root = document) {
  const targets = [...(root.matches?.(SEL) ? [root] : []), ...root.querySelectorAll(SEL)].filter(t => !t.classList.contains('is-in'));
  if (!('IntersectionObserver' in window)) { targets.forEach(t => t.classList.add('is-in')); return; }
  io ||= new IntersectionObserver(entries => {
    entries.forEach(en => {
      if (!en.isIntersecting) return;
      en.target.classList.add('is-in');
      en.target.querySelectorAll('[data-count]').forEach(countUp);
      io.unobserve(en.target);
    });
  }, { rootMargin: '0px', threshold: .05 });
  targets.forEach(t => io.observe(t));
}

/** תוכן שמתווסף ל-<main> אחרי הטעינה נחשף אוטומטית (אין צורך לקרוא ל-observeReveal ידנית) */
export function autoReveal(root = document.getElementById('main')) {
  if (!root || !('MutationObserver' in window)) return;
  new MutationObserver(muts => muts.forEach(m => m.addedNodes.forEach(n => { if (n.nodeType === 1) observeReveal(n); })))
    .observe(root, { childList: true, subtree: true });
}
