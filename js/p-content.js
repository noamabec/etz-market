/* p-content.js — owner: קבוצת תוכן ושירותים (content): cutting.html, delivery.html, deck-calculator.html, guides.html, guide.html, about.html
   ממתין למעטפת (shell.js) ואז מרנדר לפי <body data-page>. */
import { ready } from './shell.js';
import {
  FAQ, CUT_PRICES, SHIPPING_ZONES, WEIGHT_TIERS, PICKUP, BRANCHES, STORE, SHOP_RULES,
  DECK_TYPES, getProduct, productImage, GUIDES, GUIDE_CATS, guideById, guideImage, TONES,
} from './data.js';
import { crumbs, guideCard, icon, esc, arrow } from './ui.js';
import { url, param } from './routes.js';
import { cart, fmt, toast, openCart, flyToCart } from './cart.js';
import { subscribeNewsletter } from './commerce.js';

await ready;

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const page = document.body.dataset.page;
const nf = (n, d = 1) => Number(n).toLocaleString('he-IL', { maximumFractionDigits: d });
const waHref = text => `${STORE.wa}?text=${encodeURIComponent(text)}`;

/* ---------------- shared bits ---------------- */
function setCrumbs(list) { const el = $('[data-crumbs]'); if (el) el.innerHTML = crumbs(list); }

function renderFaq() {
  $$('[data-faq]').forEach(el => {
    const cat = FAQ.find(c => c.id === el.dataset.faq);
    if (!cat) return;
    el.innerHTML = cat.items.map(f => `<div class="faq-item"><h3 class="faq-q">${esc(f.q)}</h3><div class="faq-a"><p>${esc(f.a)}</p></div></div>`).join('');
  });
}

function initWaLinks() { $$('[data-wa-link]').forEach(a => { a.href = waHref(a.dataset.waLink); }); }

function initNews() {
  $$('[data-news-form]').forEach(f => {
    const inp = $('input[type="email"]', f), msg = $('[data-news-msg]', f);
    f.addEventListener('submit', async e => {
      e.preventDefault();
      msg.classList.remove('is-error', 'is-ok');
      if (!inp.value || !inp.checkValidity()) {
        msg.textContent = 'נא להזין כתובת מייל תקינה, למשל name@gmail.com';
        msg.classList.add('is-error'); inp.setAttribute('aria-invalid', 'true'); inp.focus(); return;
      }
      inp.removeAttribute('aria-invalid');
      const res = await subscribeNewsletter(inp.value);
      msg.textContent = res.message; msg.classList.add('is-ok'); f.reset();
    });
  });
}

/* ====================================================================
   18. חיתוך לפי מידה
   ==================================================================== */
function cutting() {
  setCrumbs([{ label: 'שירותים' }, { label: 'חיתוך לפי מידה' }]);
  const kinds = [
    { cat: 'construction', ico: 'ruler', t: 'קורות', d: 'קורות אורן ומרישים — לאורך, לכמות ובזווית.' },
    { cat: 'boards', ico: 'grid', t: 'לוחות', d: 'דיקט, MDF ו-OSB — חיתוך לפי שרטוט, עד 2.8 × 2.1 מ׳.' },
    { cat: 'decking', ico: 'saw', t: 'דקים', d: 'לוחות דק ותת-מבנה באורך שמתאים לשטח שלכם.' },
    { cat: 'hardwood', ico: 'box', t: 'עץ מלא', d: 'אלון, אגוז ובוק — חיתוך והקצעה לעובי מבוקש.' },
  ];
  $('[data-cut-kinds]').innerHTML = kinds.map((k, i) => `
    <li data-anim style="--d:${i * .07}s">
      <a class="cx-card" href="${url.category(k.cat)}">
        <span class="cx-card-ico">${icon(k.ico)}</span>
        <h3 class="h3">${k.t}</h3>
        <p class="muted">${k.d}</p>
        <span class="link-arrow">למוצרים ${arrow}</span>
      </a>
    </li>`).join('');
  $('[data-cut-prices]').innerHTML = CUT_PRICES.map(r => `
    <tr${r.price === 'חינם' ? ' class="is-hl"' : ''}><th scope="row">${esc(r.item)}</th><td data-label="מחיר" class="num-cell"><bdi>${esc(r.price)}</bdi></td></tr>`).join('');
}

/* ====================================================================
   19. משלוחים והובלה
   ==================================================================== */
function delivery() {
  setCrumbs([{ label: 'שירותים' }, { label: 'משלוחים והובלה עם מנוף' }]);
  let zone = SHIPPING_ZONES[1].id, tier = 0;

  // table
  $$('[data-tier-head]').forEach(th => { th.textContent = WEIGHT_TIERS[th.dataset.tierHead]; });
  const rows = $('[data-zone-rows]');
  rows.innerHTML = SHIPPING_ZONES.map(z => `
    <tr data-row="${z.id}">
      <th scope="row">${z.name}<small class="dx-areas">${z.areas}</small></th>
      ${z.prices.map((p, i) => `<td data-label="${WEIGHT_TIERS[i]}" class="num-cell"><bdi>${fmt(p)}</bdi></td>`).join('')}
      <td data-label="זמן אספקה">${z.days}${z.free ? '' : '<small class="dx-areas">ללא משלוח חינם</small>'}</td>
    </tr>`).join('');

  // schematic map (north → south ruler)
  const map = $('[data-zone-map]');
  map.innerHTML = SHIPPING_ZONES.map(z => `
    <button type="button" class="dx-zone-btn" data-zone="${z.id}" aria-pressed="false">
      <span class="dx-zone-name">${z.name}</span>
      <span class="dx-zone-from">מ-<bdi>${fmt(z.prices[0])}</bdi></span>
    </button>`).join('');

  const detail = $('[data-zone-detail]');
  const render = () => {
    const z = SHIPPING_ZONES.find(x => x.id === zone);
    $$('.dx-zone-btn', map).forEach(b => b.setAttribute('aria-pressed', b.dataset.zone === zone));
    $$('tr[data-row]', rows).forEach(r => r.classList.toggle('is-hl', r.dataset.row === zone));
    detail.innerHTML = `
      <div class="dx-q-top">
        <div><p class="note">אזור נבחר</p><h3 class="h3">${z.name}</h3><p class="muted dx-q-areas">${z.areas}</p></div>
        <p class="dx-q-price"><strong><bdi>${fmt(z.prices[tier])}</bdi></strong><span>${z.days}</span></p>
      </div>
      <fieldset class="chips dx-q-tiers">
        <legend class="field-lbl">משקל ההזמנה</legend>
        <div class="chip-row">${WEIGHT_TIERS.map((t, i) => `<label class="chip"><input type="radio" name="tier" value="${i}"${i === tier ? ' checked' : ''}><span>${t}</span></label>`).join('')}</div>
      </fieldset>
      <p class="dx-q-free">${icon('check')} ${z.free
        ? `<span>בהזמנה מעל <bdi>${fmt(SHOP_RULES.freeShippingOver)}</bdi> — <strong>המשלוח חינם</strong></span>`
        : '<span>לאילת והערבה אין משלוח חינם, אבל אפשר לאסוף מהמחסן</span>'}</p>`;
  };
  map.addEventListener('click', e => { const b = e.target.closest('[data-zone]'); if (b) { zone = b.dataset.zone; render(); } });
  detail.addEventListener('change', e => { if (e.target.name === 'tier') { tier = Number(e.target.value); render(); $(`input[name="tier"][value="${tier}"]`, detail)?.focus(); } });
  render();

  // delivery times — bars on a ruler
  const hours = d => (/48/.test(d) ? 48 : /72/.test(d) ? 72 : 144);
  $('[data-zone-days]').innerHTML = SHIPPING_ZONES.map(z => `
    <li><span class="dx-day-name">${z.name}</span><span class="dx-day-bar" aria-hidden="true"><i style="--w:${hours(z.days) / 144}"></i></span><span class="dx-day-val">${z.days}</span></li>`).join('');

  // pickup
  const b = BRANCHES.find(x => x.status === 'open');
  $('[data-pickup]').innerHTML = `
    <div class="split-grid split-rev">
      <div class="split-media"><div class="ph ph-rounded" data-tone="oak"><img class="ph-img" src="${b.img}" alt="המחסן בירכא" loading="lazy"></div></div>
      <div class="split-text">
        <p class="eyebrow" data-anim>חוסכים את המשלוח</p>
        <h2 class="h2" id="pickup-title" data-anim>איסוף עצמי מהמחסן</h2>
        <p class="pill-note" data-anim>${icon('box')} ${PICKUP.name} · חינם</p>
        <p class="lead" data-anim>${PICKUP.note}. ${b.note}.</p>
        <div class="dx-pick-info" data-anim>
          <p>${icon('pin')} <span>${b.address}</span></p>
          <table class="table table-spec dx-hours"><caption class="sr-only">שעות פתיחה</caption><tbody>
            ${b.hours.map(([d, h]) => `<tr><th scope="row">${d}</th><td class="num-cell"><bdi>${h}</bdi></td></tr>`).join('')}
          </tbody></table>
        </div>
        <div class="cta-row" data-anim>
          <a class="btn btn-primary" href="${b.waze}" target="_blank" rel="noopener">${icon('pin')} ניווט ב-Waze</a>
          <a class="btn btn-ghost" href="${b.maps}" target="_blank" rel="noopener">Google Maps</a>
        </div>
      </div>
    </div>`;
}

/* ====================================================================
   20. מחשבון כמויות לדק
   ==================================================================== */
const BOARD = { // רוחב לוח (מ׳) ואורך לוח טיפוסי (מ׳) — דוגמה
  ipe: { w: .145, len: 3 }, bamboo: { w: .137, len: 1.85 }, composite: { w: .14, len: 2.9 }, pine: { w: .12, len: 3.6 },
};
const WASTE = 1.10, JOIST_SPACING = .4, JOIST_LEN = 4, SCREWS_BOX = 500, OIL_M2 = 40, OIL_COATS = 2, CLIPS_M2 = 10;

/** חישוב טהור — מיוצא לבדיקה */
export function deckQuote({ type, rects, gapMm, dir, joistId }) {
  const t = DECK_TYPES.find(x => x.id === type) || DECK_TYPES[0];
  const bd = BOARD[t.id];
  const pitch = bd.w + gapMm / 1000;
  let area = 0, joistLinear = 0;
  rects.forEach(({ l, w }) => {
    if (!(l > 0 && w > 0)) return;
    area += l * w;
    const run = dir === 'along' ? l : w;      // הלוחות רצים לאורך run
    const span = dir === 'along' ? w : l;     // הקורות בניצב
    joistLinear += (Math.ceil(run / JOIST_SPACING) + 1) * span;
  });
  const boardLinear = area / pitch;                       // מטר רץ בלי פחת
  const boards = Math.ceil((boardLinear * WASTE) / bd.len);
  const boardM2 = Math.ceil(area * WASTE);
  const joists = Math.ceil((joistLinear * 1.05) / JOIST_LEN);
  const composite = t.id === 'composite';
  const screwsBoxes = composite ? 0 : Math.ceil(((boardLinear / JOIST_SPACING) * 2) / SCREWS_BOX);
  const clips = composite ? Math.ceil(area / CLIPS_M2) : 0;
  const oil = composite ? 0 : Math.ceil((area * OIL_COATS) / OIL_M2);
  const lines = area > 0 ? [
    { id: t.product, qty: boardM2, label: `לוחות דק ${t.name}`, detail: `${nf(boardM2, 0)} מ"ר · כ-${nf(boards, 0)} לוחות ${nf(bd.len)} מ׳ (כולל 10% פחת)` },
    { id: joistId, qty: joists, label: 'קורות תת-מבנה', detail: `${nf(joists, 0)} קורות ${JOIST_LEN} מ׳ · כל ${JOIST_SPACING * 100} ס"מ` },
    composite
      ? { id: 'hidden-clips', qty: clips, label: 'קליפסים נסתרים', detail: `${clips === 1 ? "ערכה אחת" : `${nf(clips, 0)} ערכות`} (ערכה ל-${CLIPS_M2} מ"ר)` }
      : { id: 'deck-screws-ss', qty: screwsBoxes, label: 'ברגי נירוסטה', detail: `${screwsBoxes === 1 ? "קופסה אחת" : `${nf(screwsBoxes, 0)} קופסאות`} של ${SCREWS_BOX} יח׳` },
    ...(oil ? [{ id: 'deck-oil-4l', qty: oil, label: 'שמן לדק 4 ל׳', detail: `${oil === 1 ? "פח אחד" : `${nf(oil, 0)} פחים`} · ${OIL_COATS} שכבות` }] : []),
  ].filter(l => l.qty > 0).map(l => ({ ...l, product: getProduct(l.id), total: l.qty * getProduct(l.id).price })) : [];
  return { type: t, area, boards, boardM2, joists, screwsBoxes, clips, oil, lines, total: lines.reduce((s, l) => s + l.total, 0) };
}

function deckCalculator() {
  setCrumbs([{ label: 'מחשבון כמויות לדק' }]);
  const form = $('#deck-calc');
  const deckTone = { ipe: TONES.ipe, bamboo: TONES.oak, composite: '#7D7268', pine: TONES.pine };
  const num = v => { const n = parseFloat(String(v).replace(',', '.')); return Number.isFinite(n) ? n : 0; };
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const MAX_RECTS = 6;

  // step 1 — type cards
  const pType = param('type');
  const startType = DECK_TYPES.some(t => t.id === pType) ? pType : DECK_TYPES[0].id;
  $('[data-dc-types]').innerHTML = DECK_TYPES.map(t => {
    const p = getProduct(t.product);
    return `<label class="dc-type">
      <input type="radio" name="type" value="${t.id}"${t.id === startType ? ' checked' : ''}>
      <span class="dc-type-in">
        <span class="ph" data-tone="${p.tone}"><img class="ph-img" src="${productImage(p)}" alt="" loading="lazy"></span>
        <span class="dc-type-name">${t.name}</span>
        <span class="dc-type-price"><bdi>${fmt(p.price)}</bdi> <small>למ"ר</small></span>
      </span>
    </label>`;
  }).join('');

  // step 2 — rectangles
  let rects = [{ l: clamp(num(param('l', 5)) || 5, .5, 30), w: clamp(num(param('w', 4)) || 4, .5, 30) }];
  const rectsEl = $('[data-dc-rects]');
  const numField = (i, key, label, val) => `
    <div class="dc-num">
      <label class="field-lbl" for="r${i}-${key}">${label}</label>
      <div class="num">
        <button type="button" class="num-btn" data-step="-0.5" data-r="${i}" data-k="${key}" aria-label="הפחתת ${label}">${icon('minus')}</button>
        <input id="r${i}-${key}" type="number" inputmode="decimal" min="0.5" max="30" step="0.5" value="${val}" data-r="${i}" data-k="${key}">
        <button type="button" class="num-btn" data-step="0.5" data-r="${i}" data-k="${key}" aria-label="הוספת ${label}">${icon('plus')}</button>
      </div>
    </div>`;
  const complex = () => form.elements.mode.value === 'complex';
  const renderRects = () => {
    rectsEl.innerHTML = rects.map((r, i) => `
      <div class="dc-rect" role="group" aria-label="${complex() ? `מלבן ${String.fromCharCode(1488 + i)}` : 'מידות השטח'}">
        ${complex() ? `<span class="dc-rect-tag" aria-hidden="true">${String.fromCharCode(1488 + i)}</span>` : ''}
        ${numField(i, 'l', 'אורך (מטר)', r.l)}
        ${numField(i, 'w', 'רוחב (מטר)', r.w)}
        ${complex() && rects.length > 1 ? `<button type="button" class="dc-rect-del" data-del="${i}" aria-label="הסרת מלבן ${String.fromCharCode(1488 + i)}">${icon('trash')}</button>` : ''}
      </div>`).join('');
    $('[data-complex-only]').hidden = !complex();
    $('[data-add-rect]').disabled = rects.length >= MAX_RECTS;
  };

  // plan (top view)
  const plan = $('[data-dc-plan]');
  const drawPlan = (st) => {
    const valid = rects.filter(r => r.l > 0 && r.w > 0);
    const sumL = valid.reduce((s, r) => s + r.l, 0) || 1, maxW = Math.max(...valid.map(r => r.w), 1);
    const box = plan.parentElement.getBoundingClientRect().width || 300;
    const maxH = Math.min(260, box * .8);
    let wPx = box - 40, hPx = wPx * (maxW / sumL);
    if (hPx > maxH) { hPx = maxH; wPx = hPx * (sumL / maxW); }
    plan.style.width = `${wPx}px`; plan.style.height = `${hPx}px`;
    const pxPerM = wPx / sumL;
    const pitchPx = clamp((BOARD[st.type].w + st.gapMm / 1000) * pxPerM, 3, 40);
    let off = 0;
    plan.innerHTML = valid.map((r, i) => {
      const s = `inset-inline-start:${(off / sumL) * 100}%;width:${(r.l / sumL) * 100}%;height:${(r.w / maxW) * 100}%;`;
      off += r.l;
      return `<div class="dc-piece dc-dir-${st.dir}" style="${s}--bw:${pitchPx}px;--deck:${deckTone[st.type]}"><span>${valid.length > 1 ? `${String.fromCharCode(1488 + i)} · ` : ''}<bdi>${nf(r.l)} × ${nf(r.w)}</bdi></span></div>`;
    }).join('');
    $('[data-plan-caption]').textContent = `מבט על · הלוחות ${st.dir === 'along' ? 'לאורך' : 'לרוחב'} השטח · מרווח ${st.gapMm} מ"מ`;
  };

  const state = () => ({
    type: form.elements.type.value, rects, gapMm: Number(form.elements.gap.value),
    dir: form.elements.dir.value, joistId: form.elements.joist.value,
  });
  let last;
  const update = () => {
    const st = state();
    const q = deckQuote(st);
    last = { st, q };
    $('[data-r-area]').textContent = nf(q.area);
    $('[data-r-lines]').innerHTML = q.lines.length ? q.lines.map(l => `
      <li><div><strong>${l.label}</strong><span>${l.detail}</span></div><bdi>${fmt(l.total)}</bdi></li>`).join('')
      : '<li class="dc-empty">הזינו אורך ורוחב כדי לראות את הכמויות</li>';
    $('[data-r-total]').textContent = fmt(q.total);
    const left = SHOP_RULES.freeShippingOver - q.total;
    $('[data-r-hint]').innerHTML = q.total === 0 ? '' : left > 0
      ? `עוד <bdi>${fmt(left)}</bdi> למשלוח חינם`
      : `${icon('check')} <span>כולל משלוח חינם וחיתוך חינם</span>`;
    $('[data-add-all]').disabled = !q.lines.length;
    const wa = $('[data-wa-list]');
    wa.href = waHref(waText(st, q));
    drawPlan(st);
  };
  const waText = (st, q) => [
    'שלום, זו רשימת הכמויות לדק שלי (מהמחשבון באתר עץ מרקט):',
    `סוג דק: ${q.type.name} · שטח: ${nf(q.area)} מ"ר`,
    `מידות: ${st.rects.filter(r => r.l > 0 && r.w > 0).map(r => `${nf(r.l)}×${nf(r.w)} מ׳`).join(' + ')} · לוחות ${st.dir === 'along' ? 'לאורך' : 'לרוחב'} · מרווח ${st.gapMm} מ"מ`,
    '',
    ...q.lines.map(l => `• ${l.product.name} — ${l.detail}`),
    '',
    `מחיר משוער: ${fmt(q.total)}`,
    'אשמח שתעברו על זה איתי.',
  ].join('\n');

  // events
  form.addEventListener('submit', e => e.preventDefault());
  form.addEventListener('input', e => {
    const t = e.target;
    if (t.dataset.r !== undefined) { rects[t.dataset.r][t.dataset.k] = clamp(num(t.value), 0, 30); }
    if (t.name === 'mode') {
      if (!complex()) rects = [rects[0]];
      else if (rects.length === 1) rects.push({ l: 3, w: 2 });
      renderRects();
    }
    update();
  });
  form.addEventListener('click', e => {
    const s = e.target.closest('[data-step]');
    if (s) {
      const r = rects[s.dataset.r]; const k = s.dataset.k;
      r[k] = clamp(Math.round((num(r[k]) + Number(s.dataset.step)) * 2) / 2, .5, 30);
      $(`#r${s.dataset.r}-${k}`).value = r[k];
      update();
    }
    const d = e.target.closest('[data-del]');
    if (d) { rects.splice(Number(d.dataset.del), 1); renderRects(); update(); $('[data-add-rect]').focus(); }
    if (e.target.closest('[data-add-rect]') && rects.length < MAX_RECTS) {
      rects.push({ l: 2, w: 2 }); renderRects(); update();
      $(`#r${rects.length - 1}-l`)?.focus();
    }
  });

  $('[data-add-all]').addEventListener('click', e => {
    if (!last?.q.lines.length) return;
    last.q.lines.forEach(l => cart.add(l.id, l.qty));
    flyToCart(e.currentTarget);
    const n = last.q.lines.length;
    toast(`<strong>${n} מוצרים</strong> מהמחשבון נוספו לסל · <bdi>${fmt(last.q.total)}</bdi>`, { label: 'לצפייה בסל', fn: openCart });
  });

  renderRects();
  update();
  let raf;
  window.addEventListener('resize', () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(() => drawPlan(state())); });
}

/* ====================================================================
   21. מדריכים
   ==================================================================== */
function guides() {
  const cat = GUIDE_CATS.includes(param('cat')) ? param('cat') : '';
  setCrumbs(cat ? [{ label: 'מדריכים', href: url.guides() }, { label: cat }] : [{ label: 'מדריכים ורעיונות' }]);
  if (cat) document.title = `${cat} — מדריכים | עץ מרקט`;
  const count = c => GUIDES.filter(g => g.cat === c).length;
  $('[data-gs-cats]').innerHTML = [['', 'הכל', GUIDES.length], ...GUIDE_CATS.map(c => [c, c, count(c)])].map(([v, l, n]) =>
    `<a class="chip-link" href="${url.guides(v || undefined)}"${v === cat ? ' aria-current="page"' : ''}>${l} <small class="muted">${n}</small></a>`).join('');

  const featured = GUIDES.find(g => g.featured);
  const input = $('#gs-q');
  input.value = param('q', '');
  const draw = () => {
    const q = input.value.trim();
    const showFeat = !cat && !q && featured;
    $('[data-gs-featured-wrap]').hidden = !showFeat;
    if (showFeat) {
      const g = featured;
      $('[data-gs-featured]').innerHTML = `
        <a class="gs-feat" href="${url.guide(g.id)}">
          <div class="ph" data-tone="${g.tone}"><img class="ph-img" src="${guideImage(g)}" alt="" loading="lazy"></div>
          <div class="gs-feat-text">
            <div class="g-meta"><span class="badge badge-sale">מדריך מוביל</span><span class="badge">${g.cat}</span><span>${g.mins} דק׳ קריאה</span></div>
            <h3 class="h2">${g.title}</h3>
            <p class="lead">${g.excerpt}</p>
            <p class="note">${g.author}</p>
            <span class="btn btn-primary">לקריאת המדריך ${arrow}</span>
          </div>
        </a>`;
    }
    let list = GUIDES.filter(g => (!cat || g.cat === cat) && (!showFeat || g !== featured));
    if (q) list = list.filter(g => [g.title, g.excerpt, g.cat].join(' ').includes(q));
    $('[data-gs-list-title]').textContent = q ? `תוצאות עבור "${q}"` : cat ? `מדריכי ${cat}` : 'עוד מדריכים';
    $('[data-gs-count]').textContent = `${list.length} מדריכים`;
    $('[data-gs-grid]').innerHTML = list.map((g, i) => guideCard(g, i, true)).join('');
    const empty = $('[data-gs-empty]');
    empty.hidden = list.length > 0;
    if (!list.length) empty.innerHTML = `<div class="empty-state"><span class="empty-ico">${icon('search')}</span><p class="h3">לא מצאנו מדריך כזה</p><p>נסו מילה אחרת, או כתבו לנו — אולי זה המדריך הבא שנכתוב.</p><div class="cta-row"><a class="btn btn-primary" href="${url.guides()}">לכל המדריכים</a></div></div>`;
  };
  $('[data-gs-search]').addEventListener('submit', e => { e.preventDefault(); draw(); });
  input.addEventListener('input', draw);
  draw();
}

/* ====================================================================
   22. מאמר
   ==================================================================== */
function guide() {
  const g = guideById(param('id'));
  const host = $('[data-guide]');
  if (!g) {
    setCrumbs([{ label: 'מדריכים', href: url.guides() }, { label: 'לא נמצא' }]);
    host.innerHTML = `<div class="container section-sm"><div class="empty-state"><span class="empty-ico">${icon('search')}</span><h1 class="h3">המדריך לא נמצא</h1><p>ייתכן שהקישור ישן. כל המדריכים מחכים לכם כאן:</p><div class="cta-row"><a class="btn btn-primary" href="${url.guides()}">לכל המדריכים</a></div></div></div>`;
    $('[data-related]').innerHTML = GUIDES.slice(0, 3).map((x, i) => guideCard(x, i)).join('');
    return;
  }
  document.title = `${g.title} — עץ מרקט`;
  $('meta[name="description"]')?.setAttribute('content', g.excerpt || g.title);
  const date = new Date(g.date).toLocaleDateString('he-IL', { day: 'numeric', month: 'long', year: 'numeric' });
  const prods = (g.products || []).map(getProduct).filter(Boolean);
  const prodList = prods.map(p => `
    <li class="gd-prod">
      <a class="ph" data-tone="${p.tone}" href="${url.product(p.id)}" tabindex="-1" aria-hidden="true"><img class="ph-img" src="${productImage(p)}" alt="" loading="lazy"></a>
      <div><a class="gd-prod-name" href="${url.product(p.id)}">${p.name}</a><p class="gd-prod-price"><bdi>${fmt(p.price)}</bdi> <small>${p.unit}</small></p></div>
      <button class="btn btn-add" type="button" data-add="${p.id}" aria-label="הוספה לסל: ${esc(p.name)}">הוספה לסל</button>
    </li>`).join('');
  const prodBox = (cls) => prods.length ? `<div class="gd-prods ${cls}"><p class="h3">המוצרים במדריך</p><ul>${prodList}</ul></div>` : '';
  const sec = (s, i) => `
    <section class="gd-sec" aria-labelledby="s${i + 1}">
      <h2 id="s${i + 1}"><span class="gd-sec-n" aria-hidden="true">${String(i + 1).padStart(2, '0')}</span>${s.h}</h2>
      ${(s.p || []).map(t => `<p>${t}</p>`).join('')}
      ${s.list ? `<ul class="ticks gd-ticks">${s.list.map(t => `<li>${icon('check')} <span>${t}</span></li>`).join('')}</ul>` : ''}
      ${s.tip ? `<p class="tip"><strong>טיפ מהמחסן:</strong> ${s.tip}</p>` : ''}
    </section>`;
  const share = encodeURIComponent(location.href);
  host.innerHTML = `
    <header class="container gd-head">
      <div data-crumbs></div>
      <div class="g-meta"><a class="badge" href="${url.guides(g.cat)}">${g.cat}</a><span>${g.mins} דק׳ קריאה</span></div>
      <h1 class="page-title" id="page-title">${g.title}</h1>
      <p class="page-intro">${g.excerpt || ''}</p>
      <p class="gd-by">${icon('user')} <span>${g.author}</span><span aria-hidden="true">·</span><time datetime="${g.date}">${date}</time></p>
    </header>
    <div class="container"><figure class="gd-hero ph" data-tone="${g.tone}"><img class="ph-img" src="${guideImage(g)}" alt="${esc(g.title)}" fetchpriority="high"></figure></div>
    <div class="container layout gd-layout">
      <div class="layout-main">
        <nav class="toc panel panel-tint gd-toc" aria-label="תוכן העניינים">
          <p class="toc-title">תוכן העניינים</p>
          <ol>${g.body.map((s, i) => `<li><a href="#s${i + 1}">${s.h}</a></li>`).join('')}</ol>
        </nav>
        <div class="prose gd-body">
          ${g.body.map((s, i) => sec(s, i) + (i === Math.min(1, g.body.length - 1) ? prodBox('gd-prods--inline') : '')).join('')}
        </div>
        <div class="gd-share">
          <p class="field-lbl">שיתוף המדריך</p>
          <div class="cluster">
            <a class="btn btn-ghost" href="https://wa.me/?text=${encodeURIComponent(g.title + ' ')}${share}" target="_blank" rel="noopener">${icon('wa')} WhatsApp</a>
            <a class="btn btn-ghost" href="https://www.facebook.com/sharer/sharer.php?u=${share}" target="_blank" rel="noopener">${icon('fb')} פייסבוק</a>
            <button class="btn btn-ghost" type="button" data-copy>העתקת קישור</button>
          </div>
        </div>
      </div>
      <aside class="layout-aside" aria-label="המוצרים במדריך">
        <div class="aside-sticky">${prodBox('gd-prods--aside panel')}
          <div class="panel panel-dark gd-help"><p class="h3">שאלה על הפרויקט?</p><p class="note">נגר שלנו עונה בטלפון ובוואטסאפ — בחינם.</p><a class="btn btn-primary btn-block" href="${waHref(`שלום, יש לי שאלה על המדריך: ${g.title}`)}" target="_blank" rel="noopener">${icon('wa')} שאלה לנגר</a></div>
        </div>
      </aside>
    </div>`;
  setCrumbs([{ label: 'מדריכים', href: url.guides() }, { label: g.cat, href: url.guides(g.cat) }, { label: g.title }]);

  $('[data-copy]').addEventListener('click', async e => {
    try { await navigator.clipboard.writeText(location.href); toast('הקישור הועתק'); }
    catch { toast('לא הצלחנו להעתיק — אפשר להעתיק מסרגל הכתובת'); }
    e.currentTarget.blur();
  });

  // reading progress
  const bar = $('[data-read-bar]');
  const art = host;
  const onScroll = () => {
    const r = art.getBoundingClientRect();
    const total = r.height - innerHeight;
    bar.style.transform = `scaleX(${total > 0 ? Math.min(1, Math.max(0, -r.top / total)) : 1})`;
  };
  addEventListener('scroll', onScroll, { passive: true }); addEventListener('resize', onScroll); onScroll();

  // TOC — current section
  const links = $$('.gd-toc a');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(ents => ents.forEach(en => {
      if (!en.isIntersecting) return;
      links.forEach(a => (a.hash === `#${en.target.id}` ? a.setAttribute('aria-current', 'true') : a.removeAttribute('aria-current')));
    }), { rootMargin: '-20% 0px -70% 0px' });
    $$('.gd-sec h2').forEach(h => io.observe(h));
  }

  // related
  const rel = [...GUIDES.filter(x => x.cat === g.cat && x.id !== g.id), ...GUIDES.filter(x => x.cat !== g.cat)].slice(0, 3);
  $('[data-related]').innerHTML = rel.map((x, i) => guideCard(x, i, true)).join('');
}

/* ====================================================================
   23. אודות
   ==================================================================== */
function about() {
  setCrumbs([{ label: 'אודות' }]);
  const soon = BRANCHES.filter(b => b.status === 'soon').map(b => b.name);
  const el = $('[data-next-branches]');
  if (el && soon.length) el.textContent = `${soon.join(' ו')} — בקרוב.`;
}

/* ---------------- run ---------------- */
({ cutting, delivery, 'deck-calculator': deckCalculator, guides, guide, about })[page]?.();
renderFaq();
initWaLinks();
initNews();
