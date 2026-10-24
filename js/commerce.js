/* ==========================================================================
   ★ COMMERCE ADAPTER — נקודות החיבור לפלטפורמה ולסליקה
   --------------------------------------------------------------------------
   היום: עובד עם נתוני דוגמה (js/data.js) ובלי שרת. הסל נשמר ב-localStorage (js/cart.js).
   כשנבחרת פלטפורמה — מחליפים רק את גוף הפונקציות כאן. העיצוב והרכיבים לא משתנים.

   Shopify (Storefront API):
     getProducts()       → query { products(first: 250) { ... } }
     placeOrder(order)   → cartCreate(lines) → window.location = cart.checkoutUrl
   WooCommerce (REST / Store API):
     getProducts()       → GET /wp-json/wc/store/v1/products
     placeOrder(order)   → POST /wp-json/wc/store/v1/checkout
   סליקה ישראלית (עד 12 תשלומים + ביט): דרך תוסף/אפליקציה של ספק הסליקה בפלטפורמה.
   ========================================================================== */

import { CATALOG, CATEGORIES, GUIDES, SHIPPING_ZONES, SHOP_RULES, getProduct } from './data.js';
import { url } from './routes.js';

const read = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } };
const write = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* private mode */ } };

/** קטלוג מוצרים. TODO(platform): להחליף ב-fetch מה-API. */
export async function getProducts() {
  return CATALOG;
}

export async function getProductById(id) {
  return getProduct(id) || null;
}

export async function getCategories() {
  return CATEGORIES;
}

/** חיפוש מקומי בשמות מוצרים, קטגוריות ומדריכים (להצעות בהאדר). TODO(platform): חיפוש של הפלטפורמה. */
export function searchLocal(q, limit = 7) {
  const s = q.trim();
  if (!s) return [];
  const hits = [];
  CATEGORIES.forEach(c => {
    if (c.name.includes(s)) hits.push({ type: 'קטגוריה', label: c.name, href: url.category(c.id) });
    c.subs.filter(x => x.includes(s)).forEach(x => hits.push({ type: c.short, label: x, href: url.category(c.id, x) }));
  });
  CATALOG.forEach(p => {
    if (p.name.includes(s) || (p.sub || '').includes(s) || (p.woodType || '').includes(s)) hits.push({ type: 'מוצר', label: p.name, href: url.product(p.id) });
  });
  GUIDES.forEach(g => {
    if (g.title.includes(s)) hits.push({ type: 'מדריך', label: g.title, href: url.guide(g.id) });
  });
  return hits.slice(0, limit);
}

/** חיפוש מלא לעמוד תוצאות החיפוש: { products, guides, categories } */
export function searchAll(q) {
  const s = (q || '').trim();
  if (!s) return { products: [], guides: [], categories: [] };
  const inP = p => [p.name, p.sub, p.woodType, p.shortDesc, p.dims].some(v => (v || '').includes(s));
  return {
    products: CATALOG.filter(inP),
    guides: GUIDES.filter(g => g.title.includes(s) || (g.excerpt || '').includes(s) || g.cat.includes(s)),
    categories: CATEGORIES.filter(c => c.name.includes(s) || c.subs.some(x => x.includes(s))),
  };
}

/** מחיר משלוח לאזור. weightKg אופציונלי (ברירת מחדל: מדרגה ראשונה). */
export function shippingQuote(zoneId, subtotal, weightKg = 0) {
  const z = SHIPPING_ZONES.find(x => x.id === zoneId);
  if (!z) return null;
  const tier = weightKg > 1500 ? 2 : weightKg > 500 ? 1 : 0;
  const free = z.free && subtotal >= SHOP_RULES.freeShippingOver;
  return { zone: z, price: free ? 0 : z.prices[tier], free, days: z.days };
}

/** קופון (דוגמה): WOOD5 = 5%, BUILD10 = 10% מעל 2,000 ₪. TODO(platform): discount codes. */
export async function applyCoupon(code, subtotal) {
  const c = (code || '').trim().toUpperCase();
  if (c === 'WOOD5') return { ok: true, code: c, pct: 5, amount: Math.round(subtotal * 0.05), message: '5% הנחה הופעלה' };
  if (c === 'BUILD10' && subtotal >= 2000) return { ok: true, code: c, pct: 10, amount: Math.round(subtotal * 0.1), message: '10% הנחה הופעלה' };
  if (c === 'BUILD10') return { ok: false, message: 'הקוד BUILD10 תקף בהזמנה מעל 2,000 ₪' };
  return { ok: false, message: 'הקוד לא תקף. בדקו את האיות או נסו קוד אחר.' };
}

/**
 * ביצוע הזמנה (מעמוד הקופה).
 * order = { items, customer, shipping, payment, totals }
 * TODO(platform): ליצור הזמנה בפלטפורמה ולהעביר לסליקה (בעיצוב האתר — אותו מראה, לא דף זר).
 */
export async function placeOrder(order) {
  console.info('[commerce] placeOrder() — demo only, nothing is charged.', order);
  const id = `ETZ-${String(Date.now()).slice(-6)}`;
  const saved = { ...order, id, date: new Date().toISOString(), status: 'התקבלה' };
  write('etz_last_order', saved);
  const all = read('etz_orders', []);
  write('etz_orders', [saved, ...all].slice(0, 20));
  return { ok: true, orderId: id, redirect: url.thankYou(id) };
}
export const getLastOrder = () => read('etz_last_order', null);
export const getOrders = () => read('etz_orders', []);

/** תאימות לאחור (מגירת הסל הישנה) */
export async function checkout() {
  location.href = url.checkout();
  return { ok: true, message: '' };
}

/* ---------- חשבון משתמש (דמו — אין שרת, לא נשמרת סיסמה) ---------- */
export const getUser = () => read('etz_user', null);
export async function signIn(email) {
  // TODO(platform): customerAccessTokenCreate / wp-json login. בדמו: כל מייל נכנס.
  const user = { name: (email || '').split('@')[0] || 'לקוח', email };
  write('etz_user', user);
  return { ok: true, user };
}
export async function signUp({ name, phone, email }) {
  const user = { name, phone, email };
  write('etz_user', user);
  return { ok: true, user };
}
export function signOut() { try { localStorage.removeItem('etz_user'); } catch { /* ignore */ } }
export async function resetPassword(email) {
  console.info('[commerce] resetPassword() — not connected:', email);
  return { ok: true, message: 'אם המייל רשום אצלנו, נשלח אליו קישור לאיפוס (בדמו לא נשלח בפועל).' };
}

/** טופס צור קשר. TODO(platform): Formspree / מייל / CRM. */
export async function sendContact(form) {
  console.info('[commerce] sendContact() — not connected yet:', form);
  return { ok: true, message: 'תודה! קיבלנו את הפנייה ונחזור אליכם תוך יום עסקים (בדמו לא נשלח בפועל).' };
}

/** הרשמה לניוזלטר. TODO(platform): Klaviyo / Mailchimp / הדיוור של הפלטפורמה. */
export async function subscribeNewsletter(email) {
  console.info('[commerce] subscribeNewsletter() — not connected yet:', email);
  return { ok: true, message: 'נרשמתם! קוד 5% הנחה יישלח למייל (בדמו לא נשלח בפועל).' };
}
