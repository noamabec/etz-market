/* ==========================================================================
   עץ מרקט — routes.js
   מקור אמת אחד לכתובות האתר. תמיד לקשר דרך url.*() ולא לכתוב כתובות ידנית.
   (באתר אמיתי על פלטפורמה הכתובות יהיו /shop/decking וכו' — מחליפים רק כאן.)
   ========================================================================== */

const enc = encodeURIComponent;
const qs = params => {
  const s = Object.entries(params || {})
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .map(([k, v]) => `${enc(k)}=${enc(v)}`).join('&');
  return s ? `?${s}` : '';
};

export const url = {
  home: () => 'index.html',
  /** חנות — אפשר להעביר מסננים: url.shop({ wood: 'אלון', sort: 'price-asc' }) */
  shop: params => `shop.html${qs(params)}`,
  /** קטגוריה (#3–10) ותת-קטגוריה (#11): url.category('decking', 'דק איפאה') */
  category: (id, sub) => `category.html${qs({ c: id, sub })}`,
  product: id => `product.html${qs({ id })}`,
  cart: () => 'cart.html',
  checkout: () => 'checkout.html',
  thankYou: order => `thank-you.html${qs({ order })}`,
  login: (tab, next) => `login.html${qs({ tab, next })}`,          // tab: 'login' | 'register'
  account: section => `account.html${section ? `#${section}` : ''}`, // dashboard | orders | addresses | details | wishlist
  wishlist: () => 'wishlist.html',
  cutting: () => 'cutting.html',
  delivery: () => 'delivery.html',
  deckCalculator: params => `deck-calculator.html${qs(params)}`,   // { type, l, w }
  guides: cat => `guides.html${qs({ cat })}`,
  guide: id => `guide.html${qs({ id })}`,
  about: () => 'about.html',
  contact: topic => `contact.html${qs({ topic })}`,
  faq: cat => `faq.html${cat ? `#${cat}` : ''}`,                   // cat = FAQ[].id
  search: q => `search.html${qs({ q })}`,
  terms: () => 'terms.html',
  shippingReturns: () => 'shipping-returns.html',
  privacy: () => 'privacy.html',
  accessibility: () => 'accessibility.html',
  sitemap: () => 'sitemap.html',
  notFound: () => '404.html',
};

/** קריאת פרמטר מה-URL הנוכחי: param('id') */
export const param = (name, fallback = null) => new URLSearchParams(location.search).get(name) ?? fallback;

/**
 * טבלת העמודים — key = הערך של <body data-page="...">
 * spec = מספר העמוד באפיון · group = קבוצת הבונים (shop / checkout / content / info)
 */
export const ROUTES = [
  { key: 'home', file: 'index.html', title: 'דף הבית', spec: '1', group: '—' },
  { key: 'shop', file: 'shop.html', title: 'חנות — כל המוצרים', spec: '2', group: 'shop' },
  { key: 'category', file: 'category.html?c=<id>[&sub=<שם>]', title: 'קטגוריה / תת-קטגוריה', spec: '3–11', group: 'shop' },
  { key: 'product', file: 'product.html?id=<id>', title: 'עמוד מוצר', spec: '12', group: 'shop' },
  { key: 'search', file: 'search.html?q=<מילה>', title: 'תוצאות חיפוש', spec: '26', group: 'shop' },
  { key: 'wishlist', file: 'wishlist.html', title: 'רשימת מועדפים', spec: '27', group: 'shop' },
  { key: 'cart', file: 'cart.html', title: 'סל קניות', spec: '13', group: 'checkout' },
  { key: 'checkout', file: 'checkout.html', title: 'קופה', spec: '14', group: 'checkout' },
  { key: 'thank-you', file: 'thank-you.html?order=<מספר>', title: 'אישור הזמנה', spec: '15', group: 'checkout' },
  { key: 'login', file: 'login.html[?tab=register]', title: 'התחברות / הרשמה', spec: '16', group: 'checkout' },
  { key: 'account', file: 'account.html[#orders]', title: 'החשבון שלי', spec: '17', group: 'checkout' },
  { key: 'cutting', file: 'cutting.html', title: 'חיתוך לפי מידה', spec: '18', group: 'content' },
  { key: 'delivery', file: 'delivery.html', title: 'משלוחים והובלה עם מנוף', spec: '19', group: 'content' },
  { key: 'deck-calculator', file: 'deck-calculator.html', title: 'מחשבון כמויות לדק', spec: '20', group: 'content' },
  { key: 'guides', file: 'guides.html[?cat=<קטגוריה>]', title: 'מדריכים ורעיונות', spec: '21', group: 'content' },
  { key: 'guide', file: 'guide.html?id=<id>', title: 'מאמר', spec: '22', group: 'content' },
  { key: 'about', file: 'about.html', title: 'אודות — הסיפור שלנו', spec: '23', group: 'content' },
  { key: 'contact', file: 'contact.html', title: 'צור קשר וסניפים', spec: '24', group: 'info' },
  { key: 'faq', file: 'faq.html[#<cat>]', title: 'שאלות נפוצות', spec: '25', group: 'info' },
  { key: 'terms', file: 'terms.html', title: 'תקנון', spec: '28', group: 'info' },
  { key: 'shipping-returns', file: 'shipping-returns.html', title: 'משלוחים, החזרות וביטולים', spec: '29', group: 'info' },
  { key: 'privacy', file: 'privacy.html', title: 'מדיניות פרטיות', spec: '30', group: 'info' },
  { key: 'accessibility', file: 'accessibility.html', title: 'הצהרת נגישות', spec: '31', group: 'info' },
  { key: 'sitemap', file: 'sitemap.html', title: 'מפת אתר', spec: '32', group: 'info' },
  { key: '404', file: '404.html', title: 'העמוד לא נמצא', spec: '33', group: 'info' },
];

const CATEGORY_KEYS = ['construction', 'decking', 'pergolas', 'boards', 'hardwood', 'firewood', 'accessories', 'sale'];

/** המרה מכתובת ישנה page.html?p=<key>&... לכתובת החדשה (null = לא מוכר → 404) */
export function legacyToUrl(search) {
  const p = new URLSearchParams(search);
  const key = p.get('p') || '';
  if (CATEGORY_KEYS.includes(key)) return url.category(key, p.get('sub') || undefined);
  const map = {
    shop: () => url.shop(), product: () => url.product(p.get('id')), cart: url.cart, checkout: url.checkout,
    login: url.login, account: url.account, wishlist: url.wishlist, cutting: url.cutting, delivery: url.delivery,
    'deck-calculator': url.deckCalculator, guides: () => url.guides(), guide: () => url.guide(p.get('id')),
    about: url.about, contact: () => url.contact(), faq: () => url.faq(), search: () => url.search(p.get('q') || ''),
    terms: url.terms, 'shipping-returns': url.shippingReturns, privacy: url.privacy,
    accessibility: url.accessibility, sitemap: url.sitemap, 'thank-you': () => url.thankYou(),
  };
  return map[key] ? map[key]() : null;
}
