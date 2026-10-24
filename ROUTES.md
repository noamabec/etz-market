# עץ מרקט — טבלת עמודים וכללי עבודה לבונים

אפיון: `../specs/etz-market-אפיון-מלא.md` · כתובות בקוד: תמיד דרך `url.*()` מ-`js/routes.js`.
קישורים ישנים `page.html?p=<key>` מועברים אוטומטית לקובץ החדש (מפתח לא מוכר → `404.html`).

## טבלת עמודים

| קובץ | `data-page` | עמוד באפיון | קבוצה | helper |
|---|---|---|---|---|
| index.html | home | 1. דף הבית | — (קיים, לא לגעת) | `url.home()` |
| shop.html | shop | 2. חנות — כל המוצרים | **shop** | `url.shop({...})` |
| category.html?c=`<id>` | category | 3–10. קטגוריות | **shop** | `url.category(id)` |
| category.html?c=`<id>`&sub=`<שם>` | category | 11. תת-קטגוריה | **shop** | `url.category(id, sub)` |
| product.html?id=`<id>` | product | 12. עמוד מוצר | **shop** | `url.product(id)` |
| search.html?q=`<מילה>` | search | 26. תוצאות חיפוש | **shop** | `url.search(q)` |
| wishlist.html | wishlist | 27. מועדפים | **shop** | `url.wishlist()` |
| cart.html | cart | 13. סל קניות | **checkout** | `url.cart()` |
| checkout.html | checkout (+ `data-shell="checkout"`) | 14. קופה | **checkout** | `url.checkout()` |
| thank-you.html?order=`<מספר>` | thank-you | 15. אישור הזמנה | **checkout** | `url.thankYou(id)` |
| login.html[?tab=register] | login | 16. התחברות / הרשמה | **checkout** | `url.login(tab, next)` |
| account.html[#orders] | account | 17. החשבון שלי | **checkout** | `url.account(section)` |
| cutting.html | cutting | 18. חיתוך לפי מידה | **content** | `url.cutting()` |
| delivery.html | delivery | 19. משלוחים והובלה | **content** | `url.delivery()` |
| deck-calculator.html | deck-calculator | 20. מחשבון דק | **content** | `url.deckCalculator()` |
| guides.html[?cat=] | guides | 21. מדריכים | **content** | `url.guides(cat)` |
| guide.html?id=`<id>` | guide | 22. מאמר | **content** | `url.guide(id)` |
| about.html | about | 23. אודות | **content** | `url.about()` |
| contact.html | contact | 24. צור קשר וסניפים | **info** | `url.contact()` |
| faq.html[#cat] | faq | 25. שאלות נפוצות | **info** | `url.faq(cat)` |
| terms.html | terms | 28. תקנון | **info** | `url.terms()` |
| shipping-returns.html | shipping-returns | 29. משלוחים, החזרות וביטולים | **info** | `url.shippingReturns()` |
| privacy.html | privacy | 30. פרטיות | **info** | `url.privacy()` |
| accessibility.html | accessibility | 31. הצהרת נגישות | **info** | `url.accessibility()` |
| sitemap.html | sitemap | 32. מפת אתר | **info** | `url.sitemap()` |
| 404.html | 404 | 33. 404 | **info** | `url.notFound()` |

כל קבוצה כותבת **רק** בקבצים שלה: עמודי ה-HTML שלה + `css/p-<group>.css` + `js/p-<group>.js`.
קבצים משותפים (לא לערוך במקביל): `index.html`, `css/styles.css`, `css/pages.css`, `js/main.js`, `js/shell.js`, `js/ui.js`, `js/data.js`, `js/cart.js`, `js/commerce.js`, `js/routes.js`.
צריכים שינוי בקובץ משותף? לרשום ולבקש — לא לערוך.

## איך בונים עמוד
1. מעתיקים את `_template.html` → שם הקובץ מהטבלה.
2. `<body data-page="...">` לפי הטבלה (קופה: גם `data-shell="checkout"` → האדר מינימלי בלי WhatsApp).
3. מחליפים את `css/p-info.css` בקובץ הקבוצה, וטוענים `<script type="module" src="js/p-<group>.js">`.
4. בקובץ ה-JS של הקבוצה: `import { ready } from './shell.js'; await ready;` ואז מרנדרים לפי `document.body.dataset.page`.
   לא לייבא את `main.js` ישירות — `shell.js` טוען אותו אחרי שההאדר והפוטר נכנסו.
5. אלמנטים עם `data-anim` שנוספים ל-`<main>` נחשפים אוטומטית (אין צורך ב-observer).

## JS משותף — מה יש
- `js/routes.js` — `url.*()`, `param(name)`, `ROUTES`.
- `js/ui.js` — `productCard(p,i)` (קוביית המוצר מהאפיון), `catCard(c,i)`, `guideCard(g,i,withExcerpt)`, `crumbs([{label,href},…,{label}])`, `stars(r)`, `icon(id)`, `esc(s)`, `observeReveal(root)`.
- `js/cart.js` — `cart.add(id, qty, { variant, price, cut:{len,pcs} })`, `cart.items()` (כולל `unitPrice`, `lineTotal`), `cart.setQty(key,q)`, `cart.remove(key)`, `cart.clear()`, `cart.total()`, `cart.count()`, `cart.onChange(fn)`, `lineMeta(line)`; `wishlist.ids()/has/toggle/remove/onChange`; `fmt(n)` → "1,234 ₪"; `toast(html, {label, fn})`, `openCart()`, `flyToCart(el)`, `FREE_SHIPPING`.
- כל כפתור `data-add="<id>"` (אופציונלי `data-qty`) ו-`data-wish="<id>"` עובד בכל עמוד בלי קוד נוסף (main.js).
- `js/commerce.js` — `searchLocal(q)`, `searchAll(q)`, `shippingQuote(zoneId, subtotal, kg)`, `applyCoupon(code, subtotal)` (דוגמה: WOOD5, BUILD10), `placeOrder(order)` → `{orderId, redirect}`, `getLastOrder()`, `getOrders()`, `getUser()/signIn/signUp/signOut/resetPassword`, `sendContact(form)`, `subscribeNewsletter(email)`.
- `js/data.js` (דוגמה) — `CATALOG` (55 מוצרים), `PRODUCTS` (8 נמכרים), `getProduct`, `productsByCategory(id, sub)` ('sale' = כל מוצר עם `was`), `productImage(p)` (צילום או תמונת הקטגוריה), `productTexture(p)`, `catLabel(p)`, `discountPct(p)`, `CATEGORIES` (+`intro`), `WOOD_TYPES`, `USES`, `GUIDES` (+`body`, `products`, `excerpt`, `author`, `date`), `GUIDE_CATS`, `guideById`, `guideImage`, `FAQ` (6 קטגוריות), `SHIPPING_ZONES`, `WEIGHT_TIERS`, `PICKUP`, `CUT_PRICES`, `SHOP_RULES`, `STORE`, `BRANCHES`, `DECK_TYPES` (+`product`).

## CSS משותף (css/pages.css) — מחלקות
`.crumbs` · `.page-head` / `--media` / `--dark` + `.page-head-in .page-head-text .page-head-media .page-title .page-intro` · `.section-sm` · `.sec-title` · `.panel` / `.panel-tint` / `.panel-dark` · `.stack` `.stack-lg` `.cluster` `.divider` `.muted` ·
`.p-grid.p-grid-wrap` (2 עמודות במובייל במקום גלילה) · `.p-grid-3` · `.p-grid.is-list` · `.grid-2/3/4` · `.chips-scroll` · `.chip-link` · `.g-excerpt` ·
`.layout` + `.layout-main` + `.layout-aside` > `.aside-sticky` (`.layout--start` = צד ימני, לסינון) ·
`.faq-list` > `.faq-item` > `.faq-q` + `.faq-a` (פתוח תמיד) · `.table-wrap` > `.table` (+`.table-stack` עם `data-label`, `.table-spec`, `.num-cell`) ·
`.form-grid` > `.fld` (+`.fld-full`, `.is-error`) > `.field-lbl` + `.input` (input/select/textarea) + `.fld-hint` / `.fld-error` · `.input-row` · `.check` · `.opt-cards` > `.opt-card` · `fieldset.fieldset` · `.form-alert` ·
`.progress` (li `.is-done` / `.is-current`) · `.empty-state` (+`.empty-ico`) · `.load-more` · `.pager` · `.prose` · `.toc` · `.tabs` · `.side-nav` · `.notice` (`--ok`, `--warn`).
מ-styles.css (לשימוש חוזר): `.btn .btn-primary .btn-ghost .btn-lg .btn-block`, `.badge .badge-sale .badge-best`, `.chip` (רדיו/צ'קבוקס כגלולה — לבחירת וריאציות), `.num` + `.num-btn` (שדה כמות), `.ticks`, `.pill-note`, `.sec-head`, `.eyebrow`, `.h1 .h2 .h3 .lead .note`, `.ph` + `data-tone` + `.ph-img`, `.dim` (קווי מידה), `.cat-grid`, `.guide-grid`, `.steps`, `.split-grid`, `.meter`.

## כללים
- כל הטקסט בעברית; נתונים = דוגמה (לסמן `.tag-sample` היכן שמוצגות ביקורות/המלצות).
- טוקנים בלבד (צבע, טיפוגרפיה, מרווחים, רדיוסים, תנועה). מאפיינים לוגיים (RTL).
- אין אפקטים שעוקבים אחרי הסמן. שאלות נפוצות — פתוחות, בלי אקורדיון.
- בקופה ובטפסים — אפס "תכשיטים" (מילת רפאים, קווי מידה וכו').
- לא להשתמש ב-`id="calc-form"` (שמור למחשבון המקוצר של דף הבית ב-main.js).
