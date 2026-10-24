/* ==========================================================================
   p-shop.js — owner: קבוצת חנות (shop)
   עמודים: shop.html · category.html?c=&sub= · product.html?id= · search.html?q= · wishlist.html
   מבנה:
     1. עזרים + נתוני עמוד (שאלות לקטגוריה, הסברי תתי-קטגוריות, ביקורות דוגמה)
     2. מנוע רשימה וסינון (משותף לחנות / קטגוריה / חיפוש)
     3. חנות · 4. קטגוריה (+ אזורים ייעודיים) · 5. מוצר · 6. חיפוש · 7. מועדפים
   ========================================================================== */
import { ready } from './shell.js';
import {
  CATALOG, CATEGORIES, WOOD_TYPES, USES, PRODUCTS, getProduct, categoryById, productsByCategory,
  productImage, productTexture, catLabel, discountPct, saleSub, SHOP_RULES, STORE, DECK_TYPES, CUT_PRICES, BADGES,
} from './data.js';
import { productCard, catCard, guideCard, crumbs, stars, icon, esc, arrow, reduceMotion } from './ui.js';
import { url, param } from './routes.js';
import { cart, wishlist, fmt, toast, openCart, flyToCart } from './cart.js';
import { searchAll, searchLocal } from './commerce.js';

await ready;

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const root = $('[data-shop-root]');
const page = document.body.dataset.page;
const read = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } };
const write = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* private mode */ } };
const plural = (n, one, many) => (n === 1 ? one : `${n.toLocaleString('he-IL')} ${many}`);
const TOTAL_LABEL = '250'; // כמות המוצרים המוצהרת באתר (האדר + אפיון). בדמו יש פחות.

/** תאריך סיום אמיתי למבצע העונתי. null = אין תאריך → לא מציגים טיימר (אפיון #10). דוגמה: '2027-03-31T23:59:00+03:00' */
const SALE_ENDS = null;

/* ---------- שאלות נפוצות לכל קטגוריה (דוגמה) ---------- */
const CAT_FAQ = {
  construction: [
    ['אפשר לקבל את העץ ישר לאתר הבנייה?', 'כן. המשאית עם המנוף פורקת עד 72 שעות ישירות לאתר העבודה. נציג מתקשר יום לפני כדי לתאם שעה ומקום פריקה.'],
    ['העץ מיובש?', 'קורות האורן מיובשות בתנור לרטיבות של 15%–18%, כך שהן ישרות ויציבות יותר אחרי ההתקנה.'],
    ['מה ההבדל בין אורן רגיל למוקצה לחץ?', 'אורן מוקצה לחץ ספוג בחומר מגן נגד ריקבון ומזיקים ומתאים לחוץ ולמגע עם קרקע. לבנייה מתחת לגג מספיק אורן מיובש.'],
    ['אפשר להזמין קורות חתוכות לאורך מסוים?', 'כן. בעמוד המוצר מסמנים "חיתוך לפי מידה", מזינים אורך וכמות חתיכות, ונציג מאשר איתכם לפני החיתוך.'],
    ['יש חשבונית על שם חברה?', 'כן. בקופה מסמנים "חשבונית על שם חברה" ומזינים ח.פ. החשבונית נשלחת במייל.'],
  ],
  decking: [
    ['איזה דק הכי עמיד?', 'איפאה ובמבוק מעובה הם בדרגת העמידות הגבוהה ביותר ומחזיקים 25+ שנה. דק סינטטי לא צריך שמן בכלל. אורן מוקצה לחץ הוא האפשרות המשתלמת.'],
    ['כמה מ"ר להזמין?', 'מודדים אורך × רוחב ומוסיפים 10% לפחת ולחיתוכים. המחשבון בעמוד הזה עושה את זה בשבילכם.'],
    ['מה המרווח בין קורות התת-מבנה?', '40–50 ס"מ בין קורה לקורה, ו-5 מ"מ בין לוחות הדק לניקוז מים.'],
    ['כל כמה זמן צריך לשמן דק?', 'פעם בשנה, באביב. בלי שמן העץ יאפיר לגוון כסוף — זה טבעי ולא פוגע בחוזק.'],
  ],
  pergolas: [
    ['מה כוללת ערכת פרגולה?', 'עמודים, מרישים, קורות הצללה, פרזול מגולוון, ברגים ומדריך הרכבה מצולם. כל החלקים חתוכים וממוספרים.'],
    ['אפשר להזמין גם הרכבה?', 'כן, באזורים נבחרים. בוחרים "כולל הרכבה" בעמוד הערכה, ונציג מתקשר תוך 24 שעות לתאם.'],
    ['צריך היתר בנייה לפרגולה?', 'ברוב המקרים פרגולה עד 50 מ"ר פטורה מהיתר, אבל כדאי לבדוק מול הרשות המקומית שלכם לפני ההזמנה.'],
    ['איך שומרים על הפרגולה?', 'שמן או צבע לחוץ אחרי ההרכבה, וחידוש כל 1–2 שנים.'],
  ],
  boards: [
    ['אתם חותכים לוחות לפי מידה?', 'כן, במסור פאנלים בדיוק של מילימטר. 6 ₪ לחתך, וחינם בהזמנה מעל 1,500 ₪.'],
    ['מה ההבדל בין דיקט, MDF ו-OSB?', 'דיקט חזק ויפה לרהיטים, MDF חלק ומושלם לצבע, ו-OSB זול וחזק לבנייה ולחיפוי. יש לנו מדריך מלא על זה.'],
    ['איזה לוח מתאים לחדר רטוב?', 'דיקט ימי או MDF ירוק עמיד לחות.'],
    ['הלוחות מגיעים שטוחים?', 'כן. הלוחות נשמרים שטוחים במחסן ונשלחים על משטח, עטופים.'],
  ],
  hardwood: [
    ['העץ מיובש בתנור?', 'כן, לרטיבות של 8%–10% — מוכן לנגרות בלי עיוותים.'],
    ['איך מוכרים — למטר רץ?', 'רוב העץ המלא נמכר למטר רץ בעובי קבוע. אפשר לבקש רוחב מסוים ונבחר לוח מתאים.'],
    ['אפשר לבוא לבחור לוח בעצמי?', 'בטח. המחסן בירכא פתוח לביקור — כדאי להתקשר לפני.'],
    ['איזה זן מתאים לשולחן אוכל?', 'אלון הוא הבחירה הקלאסית: קשה, עמיד ויפה. אגוז נותן מראה כהה ויוקרתי.'],
  ],
  firewood: [
    ['העצים באמת יבשים?', 'כן — רטיבות מתחת ל-20%. הם נדלקים מהר ובוערים נקי בלי עשן כבד.'],
    ['כמה זה משטח?', 'משטח הוא כקוב אחד של עצים מסודרים — מספיק לכמה שבועות של הסקה יומית.'],
    ['מתי כדאי להזמין לחורף?', 'בסתיו. לקראת החורף המלאי נגמר מהר והזמני האספקה מתארכים.'],
    ['המשטח נפרק עם מנוף?', 'כן, המשאית פורקת עם מנוף ליד הבית או בחצר.'],
  ],
  accessories: [
    ['איזה בורג מתאים לדק?', 'ברגי נירוסטה A2 בגודל 5×50 מ"מ, או קליפסים נסתרים למראה נקי בלי ראשי ברגים.'],
    ['כמה שמן צריך לדק?', 'בערך ליטר ל-10 מ"ר בשכבה אחת. מומלצות שתי שכבות בפעם הראשונה.'],
    ['לא בטוחים מה מתאים?', 'התקשרו או כתבו ב-WhatsApp — נגר שלנו ימליץ על הסוג והכמות.'],
    ['אפשר להזמין אביזרים בלבד?', 'כן. אביזרים קטנים נשלחים גם בשליח רגיל, בלי מנוף.'],
  ],
  sale: [
    ['עד מתי המבצעים?', 'עד גמר המלאי, אלא אם כתוב אחרת על המוצר.'],
    ['אפשר לשלב קוד קופון במבצע?', 'קוד הקופון חל גם על מוצרים במבצע, אם לא כתוב אחרת בתנאי הקוד.'],
    ['מוצר במבצע ניתן להחזרה?', 'כן, באותם תנאים כמו כל מוצר — חוץ ממוצר שנחתך לפי מידה.'],
    ['האם "סוף סדרה" זה פגום?', 'לא. אלה מוצרים תקינים לחלוטין שאנחנו מפסיקים להחזיק במלאי.'],
  ],
};

/* ---------- טקסט SEO לקטגוריה (מקופל עם "קרא עוד") ---------- */
const CAT_SEO = {
  construction: 'עץ בנייה וקונסטרוקציה מבית עץ מרקט: קורות אורן מיובשות בתנור, עץ מוקצע, פלנקות, מרישים לגגות ולוחות טפסנות. אנחנו מספקים לקבלנים, לבוני בתים פרטיים ולבעלי מקצוע בכל הארץ, עם משלוח במשאית מנוף עד 72 שעות ישירות לאתר העבודה. כל קורה נבחרת ישרה ונקייה, ואפשר להזמין חתוכה לפי מידה במחסן. מחירי מחסן, חשבונית על שם חברה, ונציג שמאשר איתכם את המידות לפני שהמסור מתחיל לעבוד.',
  decking: 'עצי דק וחוץ: איפאה, במבוק מעובה, דק סינטטי ואורן מוקצה לחץ, וכל מה שצריך מסביב — תת-מבנה, ברגי נירוסטה, קליפסים נסתרים ושמן לדק. משתמשים במחשבון הדק כדי לדעת בדיוק כמה מ"ר להזמין, ומקבלים את כל הדק בהובלה אחת עם מנוף. מתאים לחצר, למרפסת, לגג ולסביב בריכה.',
  pergolas: 'פרגולות וגדרות מעץ אורן מוקצה לחץ: ערכות פרגולה מוכנות להרכבה במידות 3×3, 3×4 ו-4×5 מ׳, עמודים, מרישים, לוחות גדר ורפפות להצללה. החלקים נחתכים במחסן וממוספרים, ואפשר להוסיף הרכבה של הצוות שלנו. משלוח עם מנוף עד החצר.',
  boards: "לוחות דיקט, MDF, OSB, סנדוויץ' ולבידים בכל העוביים, עם חיתוך לפי מידה במסור פאנלים מדויק. מתאים לנגרים, למעצבים ולעושים בעצמם — רהיטים, ארונות, מדפים, חיפויים ובמות. חיתוך חינם בהזמנה מעל 1,500 ₪.",
  hardwood: 'עץ מלא לנגרות: אלון אמריקאי, אגוז, בוק מאודה, טיק בורמזי ומייפל קשה — מיובשים בתנור לרטיבות של 8%–10% ונבחרים לוח-לוח. נמכר למטר רץ, עם אפשרות לחיתוך ולהקצעה לעובי מבוקש.',
  firewood: 'עצי הסקה מיובשים לקמין ולתנור עצים, עצים לגריל ולעישון ופחם עץ קשה. בשק או במשטח, עם משלוח עד הבית ופריקה במנוף. כדאי להזמין לחורף כבר בסתיו.',
  accessories: 'אביזרים, שמנים וכלים לעבודה עם עץ: ברגי נירוסטה לדק, קליפסים נסתרים, פרזול לפרגולות, שמנים ולכות, בייץ וכלי עבודה. נבחרו על ידי הנגרים שלנו כי הם עובדים טוב עם העץ שאנחנו מוכרים.',
  sale: 'מבצעי העונה וסופי סדרה בעץ מרקט — דקים, פרגולות, לוחות ואביזרים במחיר מופחת, עד גמר המלאי. אותה איכות, אותו משלוח עם מנוף, ואותה אפשרות לחיתוך לפי מידה.',
};

/* ---------- הסבר על החומר לכל תת-קטגוריה (עמוד #11) ---------- */
const SUB_INFO = {
  'קורות אורן': 'קורות אורן נורדי מיובשות בתנור — ישרות, חזקות וקלות לעבודה. היתרון: מחיר נמוך וזמינות בכל החתכים. עמידות: לשימוש פנים ומתחת לגג; לחוץ בחרו מוקצה לחץ. תחזוקה: אחסון יבש ומוגבה.',
  'עץ מוקצע': 'אורן מוקצע מארבעה צדדים — משטח חלק ומוכן לצבע. מתאים לחיפויים, מדפים ועבודות גמר. מומלץ שיוף קל לפני צבע.',
  'פלנקות': 'פלנקות גולמיות לשימוש כללי באתר — משטחים, ארגזים ותמיכות. זולות, חזקות וזמינות בכמויות.',
  'עץ לגגות': 'מרישים וקורות לגגות רעפים ולשלד גג, ספוגים נגד מזיקים ובחתך אחיד לכל האורך.',
  'עץ לטפסנות': 'לוחות טפסנות ליציקות בטון ולתבניות — עמידים לשימוש חוזר ובמחיר נמוך לכמויות.',
  'דק איפאה': 'איפאה היא עץ טרופי קשה במיוחד — כמעט פי שניים מאלון. יתרונות: לא נרקבת, עמידה לטרמיטים ולאש. עמידות: 25+ שנה בחוץ. תחזוקה: שמן לדק פעם בשנה, או לתת לה להאפיר לגוון כסוף.',
  'דק במבוק': 'במבוק דחוס ומעובה בחום — קשה כמו עץ טרופי, יציב ואחיד בגוון, וגדל מחדש תוך 5 שנים. תחזוקה: שמן פעם בשנה.',
  'דק סינטטי': 'דק מרוכב מעץ ופולימר — בלי שמן, בלי קיסמים ובגוון שלא דוהה. מתאים לסביב בריכה ולמי שלא רוצה תחזוקה. ניקוי: שטיפה במים.',
  'אורן מוקצה לחץ': 'אורן נורדי ספוג בלחץ נגד ריקבון ומזיקים — הדק המשתלם ביותר. עמידות: 10–15 שנה עם שמן שנתי.',
  'תת-מבנה': 'קורות תת-מבנה לדק מאורן מוקצה לחץ או מאלומיניום. מרווח מומלץ: 40–50 ס"מ בין קורה לקורה.',
  'ערכות פרגולה': 'ערכות שלמות לפרגולה — עמודים, מרישים, קורות הצללה, פרזול וברגים, חתוכים וממוספרים. אורן מוקצה לחץ UC4, עם אפשרות הרכבה.',
  'עמודים': 'עמודי אורן מוקצה לחץ לפרגולות ולגדרות, בחתכים 12×12 ומעלה. מתאימים למגע עם קרקע.',
  'מרישים': 'קורות ראשיות לפרגולה — חזקות ומפתח ארוך בלי עיוות.',
  'לוחות גדר': 'לוחות גדר מאורן מוקצה לחץ לגדרות, מסתורים וחיפויים בחוץ.',
  'הצללה': 'רשתות הצללה ורפפות עץ לפרגולה — שמש מסוננת ואוורור טוב.',
  'דיקט': 'דיקט ליבנה רב-שכבתי — חזק, יציב ויפה בקנטים. מתאים לרהיטים, מדפים ובמות. דיקט ימי — גם לחדרים רטובים.',
  'MDF': 'MDF חלק ואחיד — מושלם לצבע ולחזיתות ארונות. MDF ירוק עמיד לחות למטבחים ולחדרי רחצה.',
  'OSB': 'OSB-3 — לוח שבבים מכוונים, חזק וזול. לחיפוי, לרצפות משנה ולבנייה קלה.',
  "סנדוויץ'": "סנדוויץ' אורן — ליבת עץ מלא עם פורניר משני הצדדים. קל, יציב ונראה כמו עץ מלא.",
  'לבידים': 'לבידי אורן מודבקים — משטחים רחבים מעץ מלא, למדפים, משטחי עבודה ושולחנות.',
  'אלון': 'אלון אמריקאי — קשה, עמיד ובעל סיבים יפים. הבחירה הקלאסית לשולחנות ולרהיטים. גימור: שמן או לכה.',
  'אגוז': 'אגוז אמריקאי — גוון שוקולד עמוק ומראה יוקרתי. נוח לעבודה וליטוש.',
  'בוק': 'בוק אירופאי מאודה — קשה, אחיד ובהיר. מתאים לכיסאות, צעצועים ומשטחי עבודה.',
  'טיק': 'טיק בורמזי — שמנוני מטבעו ועמיד במים. לרהיטי חוץ, לסירות ולחדרי רחצה.',
  'מייפל': 'מייפל קשה — בהיר, צפוף ועמיד לשריטות. לקרשי חיתוך, משטחים ורצפות.',
  'עצי הסקה מיובשים': 'עצי אלון ואקליפטוס מיובשים לרטיבות מתחת ל-20% — נדלקים מהר ובוערים נקי.',
  'עצים לגריל ולעישון': 'נתחי עץ ועצי הדרים לגריל ולמעשנה — טעם עשן עדין ובעירה אחידה.',
  'פחם': 'פחם עץ קשה — חום גבוה, מעט אפר ובעירה ארוכה.',
  'ברגים ומחברים': 'ברגי נירוסטה, קליפסים נסתרים ופרזול מגולוון — לא מחלידים ומחזיקים שנים בחוץ.',
  'שמנים ולכות': 'שמנים ולכות לעץ — הגנה מפני שמש, מים וכתמים, וגוון שמחזיק.',
  'צבעים לעץ': 'בייץ וצבעים לעץ — משנים גוון ושומרים על מרקם הסיבים.',
  'כלים': 'כלי עבודה שהנגרים שלנו משתמשים בהם — מסורים, שיוף ועוד.',
  'מבצעי פרגולות': 'ערכות פרגולה וחלקים במחיר מופחת, עד גמר המלאי.',
  'מבצעי דקים': 'עצי דק ואביזרים לדק במחיר מבצע.',
  'סוף סדרה': 'מוצרים תקינים לחלוטין שאנחנו מפסיקים להחזיק — במחיר נמוך.',
};

/* ---------- ביקורות דוגמה ---------- */
const REVIEWS = {
  construction: [['יוסי כ.', 'נצרת עילית', 5, 'קורות ישרות לגמרי, הגיעו לאתר עם מנוף ביום שנקבע. כבר הזמנתי פעם שנייה.'], ['אבי ל.', 'כרמיאל', 5, 'מחיר טוב משמעותית מהחנויות באזור, והנציג אישר איתי את המידות לפני החיתוך.'], ['רונית ש.', 'עפולה', 4, 'עץ איכותי. המשלוח התעכב ביום אבל עדכנו אותי מראש.']],
  decking: [['מיכל ר.', 'חיפה', 5, 'הדק על הגג נראה מדהים. המחשבון חישב בדיוק — נשארו רק שני לוחות.', 'assets/img/proj-deck.webp'], ['עמית ג.', 'רמת ישי', 5, 'העץ הגיע ממוין לפי אורכים, היה קל מאוד להתקין.'], ['שירה ד.', 'ראשון לציון', 4, 'גוון יפה מאוד. כדאי להזמין גם את הקליפסים — זה חוסך הרבה זמן.']],
  pergolas: [['דני מ.', 'זכרון יעקב', 5, 'הרכבנו את הערכה בשבת אחת. הכל ממוספר, ההוראות ברורות.', 'assets/img/proj-pergola.webp'], ['נועה א.', 'מודיעין', 5, 'לקחנו עם הרכבה — הצוות היה מקצועי ונקי.'], ['אלון ב.', 'קריית טבעון', 4, 'עץ טוב. הייתי שמח לעוד גוונים לבחירה.']],
  boards: [['תמר ס.', 'חיפה', 5, 'הזמנתי דיקט חתוך לארון — כל החלקים הגיעו במידה מדויקת.'], ['גיל פ.', 'נשר', 5, 'לוחות שטוחים ונקיים, ארוזים טוב.'], ['ליאת ק.', 'תל אביב', 4, 'שירות מעולה. החיתוך לקח יום נוסף אבל שווה.']],
  hardwood: [['רועי ה.', 'ירכא', 5, 'בניתי שולחן אוכל מהאלון. לוחות יבשים ויפים, בלי סדקים.', 'assets/img/proj-table.webp'], ['ענבל ט.', 'רעננה', 5, 'הנגר במחסן עזר לי לבחור לוחות עם סיבים יפים.'], ['משה נ.', 'באר שבע', 5, 'איכות ברמה של יבואן, במחיר טוב.']],
  firewood: [['אורית ז.', 'צפת', 5, 'העצים באמת יבשים — נדלקים מהר ובלי עשן.'], ['חיים ר.', 'גליל עליון', 5, 'המשטח הגיע עם מנוף עד החצר. מעולה.'], ['דנה ו.', 'מטולה', 4, 'עצים טובים. כדאי להזמין מוקדם לפני החורף.']],
  accessories: [['אריאל ס.', 'חדרה', 5, 'הברגים לא החלידו גם אחרי חורף שלם על הדק.'], ['יעל מ.', 'כפר סבא', 5, 'השמן נספג יפה והגוון נשאר אחיד.'], ['עידו ב.', 'קריית אתא', 4, 'מוצר טוב, הגיע מהר.']],
};

/* ---------- עזרי מידות (לסינון לפי עובי / רוחב / אורך) ---------- */
const DIM_CATS = ['construction', 'decking', 'pergolas', 'boards', 'hardwood'];
const dimCache = new Map();
function dimsOf(p) {
  if (dimCache.has(p.id)) return dimCache.get(p.id);
  const out = { t: null, w: [], len: [] };
  if (DIM_CATS.includes(p.cat)) {
    const d = p.dims;
    const m = d.match(/(\d+(?:\.\d+)?)×(\d+(?:\.\d+)?)\s*(ס"מ|מ"מ)/);
    if (m) {
      const k = m[3] === 'ס"מ' ? 10 : 1, a = +m[1] * k, b = +m[2] * k;
      if (p.cat === 'boards' && k === 10) { out.w = [Math.min(a, b)]; out.len = [Math.max(a, b) / 1000]; }
      else { out.t = a; out.w = [b]; }
    }
    if (out.t == null) { const t = d.match(/(?:^|·\s*)(\d+)\s*מ"מ/); if (t) out.t = +t[1]; }
    const wr = d.match(/רוחב\s*(\d+)–(\d+)\s*ס"מ/);
    if (wr) out.w = [+wr[1] * 10, +wr[2] * 10];
    const lv = (p.variants || []).find(v => v.name === 'אורך');
    const nums = s => (s.match(/\d+(?:\.\d+)?/g) || []).map(Number);
    if (lv) out.len = lv.options.flatMap(o => nums(o.label));
    else if (!out.len.length) {
      const re = /(?<!×)(?:עד\s*)?(\d+(?:\.\d+)?)(?:–(\d+(?:\.\d+)?))?\s*מ׳/g;
      let r; while ((r = re.exec(d))) { out.len.push(+r[1]); if (r[2]) out.len.push(+r[2]); }
    }
  }
  dimCache.set(p.id, out);
  return out;
}
const span = arr => (arr.length ? [Math.min(...arr), Math.max(...arr)] : null);
const overlaps = (r, lo, hi) => r && r[1] > lo && r[0] <= hi;
const B_THICK = [['עד 20 מ"מ', 0, 20], ['21–30 מ"מ', 20, 30], ['31–60 מ"מ', 30, 60], ['מעל 60 מ"מ', 60, 1e9]];
const B_WIDTH = [['עד 10 ס"מ', 0, 100], ['10–15 ס"מ', 100, 150], ['15–25 ס"מ', 150, 250], ['מעל 25 ס"מ', 250, 1e9]];
const B_LEN = [['עד 2 מ׳', 0, 2], ['2–3 מ׳', 2, 3], ['3–4 מ׳', 3, 4], ['מעל 4 מ׳', 4, 1e9]];
const bucket = (list, val) => (val == null ? [] : list.filter(([, lo, hi]) => val > lo && val <= hi).map(b => b[0]));
const bucketR = (list, r) => list.filter(([, lo, hi]) => overlaps(r, lo, hi)).map(b => b[0]);

const TONE_LABEL = { ipe: 'חום כהה', walnut: 'חום כהה', char: 'חום כהה', teak: 'חום דבש', oak: 'חום בינוני', pine: 'בהיר', ash: 'בהיר', board: 'אפור / ניטרלי' };
const NOT_WOOD = ['—', 'שמן', 'לכה', 'בייץ', 'נירוסטה', 'פלדה', 'פלדה מגולוונת', 'פוליאתילן', 'אלומיניום', 'MDF', 'OSB'];

/* ==========================================================================
   2. מנוע רשימה וסינון
   ========================================================================== */
function facetDefs(ctx) {
  const { catId, isSale } = ctx;
  const F = [];
  if (!catId) F.push({ id: 'cat', label: 'קטגוריה', get: p => [p.cat], order: CATEGORIES.filter(c => c.id !== 'sale').map(c => c.id), name: v => categoryById(v)?.short || v });
  if (catId && !ctx.sub) F.push({ id: 'sub', label: isSale ? 'לפי קטגוריה' : 'תת-קטגוריה', get: p => [isSale ? saleSub(p) : p.sub], order: categoryById(catId).subs });
  if (catId !== 'accessories' && catId !== 'firewood') F.push({ id: 'wood', label: catId === 'hardwood' ? 'זן' : 'סוג עץ', get: p => [p.woodType], order: catId ? null : WOOD_TYPES, skip: v => NOT_WOOD.includes(v) || (!catId && !WOOD_TYPES.includes(v)) });
  F.push({ id: 'use', label: 'שימוש', get: p => [p.use], order: USES });
  // מסננים ייעודיים לקטגוריה
  if (catId === 'construction') {
    F.push({ id: 'section', label: 'חתך', get: p => { const m = p.dims.match(/^(\d+×\d+)\s*ס"מ/); return m ? [`${m[1]} ס"מ`] : []; } });
    F.push({ id: 'treat', label: 'ספיגה', get: p => [/מוקצה|ספוג/.test(p.name + p.shortDesc + p.dims) ? 'מוקצה לחץ / ספוג' : 'ללא ספיגה'] });
  }
  if (catId === 'decking') {
    F.push({ id: 'tone', label: 'גוון', get: p => [TONE_LABEL[p.tone]].filter(Boolean) });
    F.push({ id: 'dur', label: 'עמידות', get: p => [/מאוד|דרגת עמידות 1/.test(p.durability || p.specs.find(s => s[0] === 'עמידות')?.[1] || '') ? 'גבוהה מאוד' : 'גבוהה / בינונית'] });
  }
  if (catId === 'pergolas') F.push({ id: 'kit', label: 'מידות ערכה', get: p => { const m = p.sub === 'ערכות פרגולה' && p.dims.match(/^(\d+×\d+)\s*מ׳/); return m ? [`${m[1]} מ׳`] : []; } });
  if (catId === 'boards') {
    F.push({ id: 'size', label: 'גודל לוח', get: p => { const m = p.dims.match(/^(\d+×\d+)\s*ס"מ/); return m ? [`${m[1]} ס"מ`] : []; } });
    F.push({ id: 'water', label: 'עמידות למים', get: p => [/ימי|עמיד|ירוק/.test(p.name) ? 'עמיד מים / לחות' : 'רגיל'] });
  }
  if (catId === 'hardwood') F.push({ id: 'dry', label: 'ייבוש', get: () => ['מיובש בתנור (8%–10%)'] });
  if (catId === 'firewood') F.push({ id: 'pack', label: 'כמות', get: p => [p.unit.replace(/^ל/, '')] });
  if (catId === 'accessories') F.push({ id: 'fit', label: 'התאמה לפרויקט', get: p => {
    const s = p.name + p.shortDesc; const r = [];
    if (/דק/.test(s)) r.push('דק'); if (/פרגולה/.test(s)) r.push('פרגולה'); if (/רהיט|לכה|בייץ|שיוף|מסור/.test(s)) r.push('רהיטים ונגרות');
    return r;
  } });
  if (isSale) F.push({ id: 'off', label: 'אחוז הנחה', get: p => { const d = discountPct(p); return [d >= 20 ? '20% ומעלה' : d >= 10 ? '10%–19%' : 'עד 10%']; }, order: ['20% ומעלה', '10%–19%', 'עד 10%'] });
  // מידות
  if (!catId || DIM_CATS.includes(catId) || isSale) {
    F.push({ id: 'thick', label: 'עובי', get: p => bucket(B_THICK, dimsOf(p).t), order: B_THICK.map(b => b[0]) });
    F.push({ id: 'width', label: 'רוחב', get: p => bucketR(B_WIDTH, span(dimsOf(p).w)), order: B_WIDTH.map(b => b[0]) });
    F.push({ id: 'len', label: 'אורך', get: p => bucketR(B_LEN, span(dimsOf(p).len)), order: B_LEN.map(b => b[0]) });
  }
  return F;
}

const SORTS = [
  ['popular', 'פופולרי', (a, b) => b.reviews * b.rating - a.reviews * a.rating],
  ['price-asc', 'מחיר: מהנמוך לגבוה', (a, b) => a.price - b.price],
  ['price-desc', 'מחיר: מהגבוה לנמוך', (a, b) => b.price - a.price],
  ['new', 'חדש', (a, b) => (b.badge === 'new') - (a.badge === 'new') || b.reviews * b.rating - a.reviews * a.rating],
  ['discount', 'הנחה גבוהה', (a, b) => discountPct(b) - discountPct(a)],
];

/**
 * מרנדר רשימת מוצרים עם סינון, מיון, תצוגה וטען-עוד בתוך mount.
 * ctx: { base, catId?, sub?, isSale?, banner?, keepParams: [] }
 */
function listing(mount, ctx) {
  const PAGE = 12;
  const base = ctx.base;
  const defs = facetDefs(ctx).map(f => {
    const all = new Map();
    base.forEach(p => f.get(p).forEach(v => { if (v && !(f.skip && f.skip(v))) all.set(v, (all.get(v) || 0) + 1); }));
    let opts = [...all.keys()];
    if (f.order) opts = f.order.filter(v => all.has(v)).concat(opts.filter(v => !f.order.includes(v)));
    else opts.sort((a, b) => all.get(b) - all.get(a));
    return { ...f, opts };
  }).filter(f => f.opts.length >= 2);

  const prices = base.map(p => p.price);
  const pMin = Math.floor(Math.min(...prices)), pMax = Math.ceil(Math.max(...prices));
  const qp = new URLSearchParams(location.search);
  const st = {
    sel: Object.fromEntries(defs.map(f => [f.id, new Set((qp.get(f.id) || '').split(',').filter(v => f.opts.includes(v)))])),
    min: qp.get('min') ? Number(qp.get('min')) : null,
    max: qp.get('max') ? Number(qp.get('max')) : null,
    cut: qp.get('cut') === '1', stock: qp.get('stock') === '1',
    sort: SORTS.some(s => s[0] === qp.get('sort')) ? qp.get('sort') : 'popular',
    shown: PAGE,
    view: read('etz_shop_view', 'grid'),
  };
  const sorts = SORTS.filter(s => s[0] !== 'discount' || ctx.isSale);
  const uid = Math.random().toString(36).slice(2, 7);

  const matches = (p, except) => {
    for (const f of defs) {
      if (f.id === except) continue;
      const s = st.sel[f.id];
      if (s.size && !f.get(p).some(v => s.has(v))) return false;
    }
    if (except !== 'price') {
      if (st.min != null && p.price < st.min) return false;
      if (st.max != null && p.price > st.max) return false;
    }
    if (except !== 'cut' && st.cut && !p.cuttable) return false;
    if (except !== 'stock' && st.stock && !p.inStock) return false;
    return true;
  };

  const optHtml = (f, v) => `
    <li><label class="check f-opt"><input type="checkbox" name="${f.id}" value="${esc(v)}"${st.sel[f.id].has(v) ? ' checked' : ''}><span>${esc(f.name ? f.name(v) : v)}</span><small class="f-count" data-count-for="${f.id}::${esc(v)}"></small></label></li>`;

  mount.innerHTML = `
    <div class="layout layout--start shop-layout">
      <aside class="layout-aside f-aside" aria-labelledby="f-title-${uid}">
        <div class="aside-sticky f-panel" id="f-panel-${uid}" tabindex="-1">
          <div class="f-head">
            <h2 class="h3" id="f-title-${uid}">סינון</h2>
            <button class="f-close icon-btn" type="button" data-f-close aria-label="סגירת הסינון">${icon('close')}</button>
          </div>
          <form class="f-form" novalidate onsubmit="return false">
            ${defs.map(f => `
              <fieldset class="fieldset f-group">
                <legend>${f.label}</legend>
                <ul class="f-list">${f.opts.map(v => optHtml(f, v)).join('')}</ul>
              </fieldset>`).join('')}
            <fieldset class="fieldset f-group">
              <legend>טווח מחיר <span class="muted f-legend-note">(₪)</span></legend>
              <div class="f-range">
                <div class="fld"><label class="field-lbl" for="f-min-${uid}">מ-</label><input class="input" id="f-min-${uid}" name="min" type="number" inputmode="numeric" min="0" step="1" placeholder="${pMin}" value="${st.min ?? ''}"></div>
                <span aria-hidden="true">–</span>
                <div class="fld"><label class="field-lbl" for="f-max-${uid}">עד</label><input class="input" id="f-max-${uid}" name="max" type="number" inputmode="numeric" min="0" step="1" placeholder="${pMax}" value="${st.max ?? ''}"></div>
              </div>
            </fieldset>
            <fieldset class="fieldset f-group">
              <legend>זמינות</legend>
              <ul class="f-list">
                <li><label class="check f-opt"><input type="checkbox" name="cut"${st.cut ? ' checked' : ''}><span>ניתן לחיתוך לפי מידה</span><small class="f-count" data-count-for="cut"></small></label></li>
                <li><label class="check f-opt"><input type="checkbox" name="stock"${st.stock ? ' checked' : ''}><span>במלאי</span><small class="f-count" data-count-for="stock"></small></label></li>
              </ul>
            </fieldset>
          </form>
          <div class="f-foot">
            <button class="btn btn-ghost" type="button" data-f-clear>נקה הכל</button>
            <button class="btn btn-primary f-apply" type="button" data-f-close data-f-apply>הצגת המוצרים</button>
          </div>
        </div>
      </aside>
      <div class="f-scrim" data-f-scrim hidden></div>

      <div class="layout-main">
        <div class="sort-bar">
          <p class="sort-count" aria-live="polite" data-count></p>
          <button class="btn btn-ghost f-open" type="button" data-f-open aria-controls="f-panel-${uid}" aria-expanded="false">${icon('menu')}<span>סינון</span><span class="f-badge" data-f-badge hidden></span></button>
          <div class="sort-ctrl">
            <label class="sort-lbl" for="sort-${uid}">מיון:</label>
            <select class="input sort-select" id="sort-${uid}" data-sort>${sorts.map(([v, l]) => `<option value="${v}"${v === st.sort ? ' selected' : ''}>${l}</option>`).join('')}</select>
          </div>
          <div class="view-toggle" role="group" aria-label="תצוגה">
            <button type="button" data-view="grid" aria-pressed="${st.view === 'grid'}" aria-label="תצוגת גריד">${icon('grid')}</button>
            <button type="button" data-view="list" aria-pressed="${st.view === 'list'}" aria-label="תצוגת רשימה">${icon('menu')}</button>
          </div>
        </div>
        <div class="f-active" data-active hidden></div>
        <div class="p-grid p-grid-3 p-grid-wrap" data-grid-a></div>
        ${ctx.banner ? `<div class="mid-banner" data-banner hidden>${ctx.banner}</div>` : ''}
        <div class="p-grid p-grid-3 p-grid-wrap" data-grid-b></div>
        <div class="load-more" data-more hidden>
          <p class="note" data-more-note></p>
          <div class="meter" aria-hidden="true"><span data-more-bar></span></div>
          <button class="btn btn-ghost" type="button" data-more-btn>טען עוד מוצרים</button>
        </div>
        <div class="empty-state" data-empty hidden>
          <span class="empty-ico">${icon('search')}</span>
          <p class="h3">אין מוצרים שמתאימים לסינון</p>
          <p>נסו להסיר חלק מהמסננים, או התקשרו ונמצא לכם את המוצר המתאים.</p>
          <div class="cta-row"><button class="btn btn-primary" type="button" data-f-clear>ניקוי כל המסננים</button><a class="btn btn-ghost" href="tel:${STORE.tel}">${icon('phone')} <bdi>${STORE.phone}</bdi></a></div>
        </div>
      </div>
    </div>`;

  const form = $('.f-form', mount), panel = $('.f-panel', mount), scrim = $('[data-f-scrim]', mount);
  const gridA = $('[data-grid-a]', mount), gridB = $('[data-grid-b]', mount);
  let firstRender = true;

  const syncUrl = () => {
    const p = new URLSearchParams();
    (ctx.keepParams || []).forEach(k => { const v = qp.get(k); if (v) p.set(k, v); });
    defs.forEach(f => { if (st.sel[f.id].size) p.set(f.id, [...st.sel[f.id]].join(',')); });
    if (st.min != null) p.set('min', st.min);
    if (st.max != null) p.set('max', st.max);
    if (st.cut) p.set('cut', '1');
    if (st.stock) p.set('stock', '1');
    if (st.sort !== 'popular') p.set('sort', st.sort);
    const s = p.toString();
    history.replaceState(null, '', location.pathname + (s ? `?${s}` : ''));
  };

  const activeList = () => {
    const a = [];
    defs.forEach(f => st.sel[f.id].forEach(v => a.push({ label: `${f.label}: ${f.name ? f.name(v) : v}`, rm: () => st.sel[f.id].delete(v) })));
    if (st.min != null || st.max != null) a.push({ label: `מחיר: ${st.min ?? pMin}–${st.max ?? pMax} ₪`, rm: () => { st.min = st.max = null; } });
    if (st.cut) a.push({ label: 'ניתן לחיתוך', rm: () => { st.cut = false; } });
    if (st.stock) a.push({ label: 'במלאי', rm: () => { st.stock = false; } });
    return a;
  };

  function render() {
    const list = base.filter(p => matches(p)).sort(sorts.find(s => s[0] === st.sort)[2]);
    const n = list.length;
    // counts per option
    defs.forEach(f => {
      const pool = base.filter(p => matches(p, f.id));
      f.opts.forEach(v => {
        const c = pool.filter(p => f.get(p).includes(v)).length;
        const el = $(`[data-count-for="${CSS.escape(`${f.id}::${v}`)}"]`, form);
        if (!el) return;
        el.textContent = `(${c})`;
        const inp = el.closest('label').querySelector('input');
        inp.disabled = c === 0 && !inp.checked;
        el.closest('label').classList.toggle('is-off', inp.disabled);
      });
    });
    [['cut', p => p.cuttable], ['stock', p => p.inStock]].forEach(([k, fn]) => {
      const c = base.filter(p => matches(p, k) && fn(p)).length;
      $(`[data-count-for="${k}"]`, form).textContent = `(${c})`;
    });

    $('[data-count]', mount).innerHTML = `<strong><bdi>${n}</bdi></strong> ${n === 1 ? 'מוצר' : 'מוצרים'}`;
    $('[data-f-apply]', mount).textContent = n ? `הצגת ${n} מוצרים` : 'אין תוצאות';
    const act = activeList();
    const badge = $('[data-f-badge]', mount);
    badge.textContent = act.length; badge.hidden = !act.length;
    const actEl = $('[data-active]', mount);
    actEl.hidden = !act.length;
    actEl.innerHTML = act.map((a, i) => `<button class="f-tag" type="button" data-rm="${i}" aria-label="הסרת סינון — ${esc(a.label)}">${esc(a.label)} ${icon('close')}</button>`).join('')
      + (act.length ? '<button class="f-clear-link" type="button" data-f-clear>נקה הכל</button>' : '');
    $$('[data-rm]', actEl).forEach(b => b.addEventListener('click', () => { act[b.dataset.rm].rm(); refreshForm(); update(); }));

    const shown = list.slice(0, st.shown);
    const card = (p, i) => { const h = productCard(p, i); return firstRender ? h : h.replace(' data-anim', ''); };
    gridA.innerHTML = shown.slice(0, 12).map(card).join('');
    gridB.innerHTML = shown.slice(12).map((p, i) => card(p, i)).join('');
    gridB.hidden = shown.length <= 12;
    const banner = $('[data-banner]', mount);
    if (banner) banner.hidden = n <= 12;
    [gridA, gridB].forEach(g => g.classList.toggle('is-list', st.view === 'list'));
    const more = $('[data-more]', mount);
    more.hidden = n <= st.shown;
    if (!more.hidden) {
      $('[data-more-note]', mount).textContent = `מציגים ${shown.length} מתוך ${n} מוצרים`;
      $('[data-more-bar]', mount).style.width = `${(shown.length / n) * 100}%`;
      $('[data-more-btn]', mount).textContent = `טען עוד ${Math.min(PAGE, n - shown.length)} מוצרים`;
    }
    $('[data-empty]', mount).hidden = n > 0;
    gridA.hidden = n === 0;
    firstRender = false;
  }

  function refreshForm() {
    $$('input[type="checkbox"]', form).forEach(i => {
      if (i.name === 'cut') i.checked = st.cut;
      else if (i.name === 'stock') i.checked = st.stock;
      else if (st.sel[i.name]) i.checked = st.sel[i.name].has(i.value);
    });
    form.elements.min.value = st.min ?? '';
    form.elements.max.value = st.max ?? '';
  }

  const update = () => { st.shown = PAGE; render(); syncUrl(); mount.dispatchEvent(new CustomEvent('listing:change', { detail: st })); };

  form.addEventListener('change', e => {
    const i = e.target;
    if (i.type === 'checkbox') {
      if (i.name === 'cut') st.cut = i.checked;
      else if (i.name === 'stock') st.stock = i.checked;
      else st.sel[i.name][i.checked ? 'add' : 'delete'](i.value);
    } else if (i.name === 'min' || i.name === 'max') {
      const v = i.value === '' ? null : Math.max(0, Number(i.value));
      st[i.name] = Number.isFinite(v) ? v : null;
    }
    update();
  });
  let tmr;
  form.addEventListener('input', e => { if (e.target.type === 'number') { clearTimeout(tmr); tmr = setTimeout(() => e.target.dispatchEvent(new Event('change', { bubbles: true })), 500); } });

  mount.addEventListener('click', e => {
    if (e.target.closest('[data-f-clear]')) {
      defs.forEach(f => st.sel[f.id].clear()); st.min = st.max = null; st.cut = st.stock = false;
      refreshForm(); update();
    }
    if (e.target.closest('[data-more-btn]')) {
      const before = st.shown; st.shown += PAGE; render();
      const target = [...$$('.p-card', mount)][before];
      target?.querySelector('.p-name a')?.focus({ preventScroll: true });
    }
    const v = e.target.closest('[data-view]');
    if (v) { st.view = v.dataset.view; write('etz_shop_view', st.view); $$('[data-view]', mount).forEach(b => b.setAttribute('aria-pressed', b === v)); render(); }
  });
  $('[data-sort]', mount).addEventListener('change', e => { st.sort = e.target.value; update(); });

  // ---- mobile drawer ----
  const openBtn = $('[data-f-open]', mount);
  const isDrawer = () => matchMedia('(max-width: 1000px)').matches;
  const open = () => {
    scrim.hidden = false; panel.setAttribute('role', 'dialog'); panel.setAttribute('aria-modal', 'true');
    requestAnimationFrame(() => { panel.classList.add('is-open'); scrim.classList.add('is-open'); });
    openBtn.setAttribute('aria-expanded', 'true'); document.body.style.overflow = 'hidden';
    setTimeout(() => $('.f-close', panel).focus(), 60);
  };
  const close = () => {
    if (!panel.classList.contains('is-open')) return;
    panel.classList.remove('is-open'); scrim.classList.remove('is-open');
    panel.removeAttribute('role'); panel.removeAttribute('aria-modal');
    openBtn.setAttribute('aria-expanded', 'false'); document.body.style.overflow = '';
    setTimeout(() => { scrim.hidden = true; }, 300);
    openBtn.focus();
  };
  openBtn.addEventListener('click', open);
  $$('[data-f-close]', mount).forEach(b => b.addEventListener('click', close));
  scrim.addEventListener('click', close);
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && panel.classList.contains('is-open')) close(); });
  panel.addEventListener('keydown', e => {
    if (e.key !== 'Tab' || !isDrawer() || !panel.classList.contains('is-open')) return;
    const f = $$('button, input:not([disabled]), select', panel).filter(el => el.offsetParent !== null);
    if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f.at(-1).focus(); }
    else if (!e.shiftKey && document.activeElement === f.at(-1)) { e.preventDefault(); f[0].focus(); }
  });
  matchMedia('(max-width: 1000px)').addEventListener('change', e => { if (!e.matches) close(); });

  render();
  return {
    st, render, update, refreshForm, defs,
    setFacet(id, values) { if (!st.sel[id]) return; st.sel[id] = new Set(values); refreshForm(); update(); },
  };
}

/* ---------- רכיבים קטנים ---------- */
const MID_BANNER = `
  <div class="mid-banner-in">
    <span class="mb-ico">${icon('headset')}</span>
    <div><p class="h3">לא בטוחים מה צריך? נגר שלנו ייעץ — חינם</p><p class="note">ספרו לנו על הפרויקט ונגיד לכם בדיוק מה ובכמה. א׳–ה׳ 7:00–17:00, ו׳ 7:00–12:00.</p></div>
    <div class="cta-row">
      <a class="btn btn-primary" href="tel:${STORE.tel}">${icon('phone')}<bdi>${STORE.phone}</bdi></a>
      <a class="btn btn-ghost" href="${STORE.wa}" target="_blank" rel="noopener">${icon('wa')} WhatsApp</a>
    </div>
  </div>`;

const faqHtml = list => `<div class="faq-list">${list.map(([q, a]) => `<div class="faq-item"><h3 class="faq-q">${q}</h3><div class="faq-a"><p>${a}</p></div></div>`).join('')}</div>`;

function readMore(text, id) {
  return `
    <div class="seo-text">
      <div class="seo-body" id="${id}" data-collapsed="true"><p>${text}</p></div>
      <button class="seo-more" type="button" aria-expanded="false" aria-controls="${id}">קרא עוד</button>
    </div>`;
}
document.addEventListener('click', e => {
  const b = e.target.closest('.seo-more');
  if (!b) return;
  const body = document.getElementById(b.getAttribute('aria-controls'));
  const open = b.getAttribute('aria-expanded') !== 'true';
  b.setAttribute('aria-expanded', open); body.dataset.collapsed = !open;
  b.textContent = open ? 'הצג פחות' : 'קרא עוד';
});

function addMany(ids, fromEl, label) {
  const list = ids.map(getProduct).filter(Boolean);
  list.forEach(p => cart.add(p.id, 1));
  if (fromEl) flyToCart(fromEl);
  toast(`${label || `${list.length} מוצרים נוספו לסל`}`, { label: 'לצפייה בסל', fn: openCart });
}

/* ==========================================================================
   3. חנות — כל המוצרים
   ========================================================================== */
function renderShop() {
  root.innerHTML = `
    <section class="page-head" aria-labelledby="page-title">
      <div class="container page-head-in">
        <div class="page-head-text">
          ${crumbs([{ label: 'חנות' }])}
          <h1 class="page-title" id="page-title">כל מוצרי העץ</h1>
          <p class="page-intro">${TOTAL_LABEL} מוצרים, חיתוך לפי מידה ומשלוח לכל הארץ.</p>
        </div>
      </div>
    </section>
    <section class="section-sm" aria-label="קטגוריות">
      <div class="container">
        <div class="chips-scroll shop-cats" role="group" aria-label="סינון מהיר לפי קטגוריה">
          <button class="chip-link" type="button" data-cat="" aria-pressed="true">הכל</button>
          ${CATEGORIES.map(c => `<button class="chip-link" type="button" data-cat="${c.id}" aria-pressed="false">${c.short}</button>`).join('')}
        </div>
      </div>
    </section>
    <section class="section-sm" aria-label="מוצרים">
      <div class="container" data-listing></div>
    </section>`;
  const lst = listing($('[data-listing]'), { base: CATALOG, banner: MID_BANNER });
  const chips = $$('[data-cat]');
  const syncChips = () => {
    const s = lst.st.sel.cat;
    const saleOn = new URLSearchParams(location.search).get('sale') === '1';
    chips.forEach(c => c.setAttribute('aria-pressed', c.dataset.cat === '' ? (!s?.size) : s?.size === 1 && s.has(c.dataset.cat)));
    return saleOn;
  };
  chips.forEach(c => c.addEventListener('click', () => {
    if (c.dataset.cat === 'sale') { location.href = url.category('sale'); return; }
    lst.setFacet('cat', c.dataset.cat ? [c.dataset.cat] : []);
  }));
  $('[data-listing]').addEventListener('listing:change', syncChips);
  syncChips();
}

/* ==========================================================================
   4. קטגוריה / תת-קטגוריה
   ========================================================================== */
function catArea(c) {
  const id = c.id;
  if (id === 'construction') return `
    <section class="section-sm" aria-labelledby="area-title">
      <div class="container">
        <div class="panel panel-dark area-site">
          <span class="area-ico">${icon('crane')}</span>
          <div class="stack">
            <h2 class="sec-title" id="area-title">מזמינים לאתר בנייה?</h2>
            <p class="lead">משלוח עם מנוף ישירות לאתר העבודה — עד 72 שעות, בכל הארץ.</p>
            <ul class="ticks">
              <li>${icon('check')}<span>פריקה במנוף על המשטח או על הגג, לפי תיאום מראש</span></li>
              <li>${icon('check')}<span>נציג מתאם עם מנהל העבודה יום לפני האספקה</span></li>
              <li>${icon('check')}<span>חשבונית על שם חברה והצעת מחיר להזמנות גדולות</span></li>
            </ul>
            <div class="cta-row"><a class="btn btn-primary" href="${url.delivery()}">על המשלוחים עם מנוף ${arrow}</a><a class="btn btn-ghost-light btn" href="tel:${STORE.tel}">${icon('phone')}<bdi>${STORE.phone}</bdi></a></div>
          </div>
        </div>
      </div>
    </section>`;
  if (id === 'decking') return `
    <section class="section-sm" aria-labelledby="dcalc-title">
      <div class="container">
        <div class="panel panel-tint dcalc">
          <div class="dcalc-text">
            <p class="eyebrow">מחשבון דק</p>
            <h2 class="sec-title" id="dcalc-title">כמה דק צריך להזמין?</h2>
            <form class="dcalc-form" id="cat-deck-calc" novalidate onsubmit="return false">
              <fieldset class="fieldset"><legend class="field-lbl">סוג הדק</legend>
                <div class="chip-row">${DECK_TYPES.map((t, i) => `<label class="chip"><input type="radio" name="dtype" value="${t.id}"${i === 0 ? ' checked' : ''}><span>${t.name} <small><bdi>${t.price}&nbsp;₪</bdi>/מ"ר</small></span></label>`).join('')}</div>
              </fieldset>
              <div class="form-grid dcalc-fields">
                <div class="fld"><label class="field-lbl" for="dc-l">אורך הדק (מ׳)</label><input class="input" id="dc-l" name="l" type="number" inputmode="decimal" min="0.5" max="50" step="0.1" value="5"></div>
                <div class="fld"><label class="field-lbl" for="dc-w">רוחב הדק (מ׳)</label><input class="input" id="dc-w" name="w" type="number" inputmode="decimal" min="0.5" max="50" step="0.1" value="4"></div>
              </div>
            </form>
          </div>
          <div class="dcalc-res" aria-live="polite">
            <dl class="dcalc-dl">
              <div><dt>שטח הדק</dt><dd data-dc="area"></dd></div>
              <div><dt>להזמנה (כולל 10% פחת)</dt><dd data-dc="order"></dd></div>
              <div><dt>ברגי נירוסטה</dt><dd data-dc="screws"></dd></div>
              <div class="dc-total"><dt>הערכת מחיר לעץ</dt><dd data-dc="price"></dd></div>
            </dl>
            <div class="cta-row">
              <button class="btn btn-primary" type="button" data-dc-add>הוספת הדק לסל</button>
              <a class="btn btn-ghost" data-dc-full href="${url.deckCalculator()}">למחשבון המלא ${arrow}</a>
            </div>
            <p class="note">מחיר לדוגמה, לפני משלוח. נציג יאשר איתכם את הכמויות לפני החיתוך.</p>
          </div>
        </div>
      </div>
    </section>
    <section class="section-sm" aria-labelledby="gal-title">
      <div class="container">
        <h2 class="sec-title" id="gal-title">דקים של לקוחות</h2>
        <ul class="cust-gal">
          ${[['proj-deck', 'דק איפאה על גג', 'חיפה'], ['hero-deck', 'דק סביב פינת ישיבה', 'זכרון יעקב'], ['pergola-yard', 'דק ופרגולה בחצר', 'רמת ישי'], ['cat-decking', 'דק במרפסת', 'כרמיאל']].map(([img, t, city]) => `
            <li data-anim><figure><div class="ph" data-tone="ipe"><img class="ph-img" src="assets/img/${img}.webp" alt="${t}, ${city}" loading="lazy"></div><figcaption><strong>${t}</strong> · ${city} <span class="tag-sample">דוגמה</span></figcaption></figure></li>`).join('')}
        </ul>
      </div>
    </section>`;
  if (id === 'pergolas') {
    const kits = ['pergola-kit-3x3', 'pergola-kit-3x4', 'pergola-kit-4x5'].map(getProduct).filter(Boolean);
    return `
    <section class="section-sm" aria-labelledby="kits-title">
      <div class="container">
        <h2 class="sec-title" id="kits-title">ערכות מוכנות — מחיר כולל</h2>
        <p class="lead kits-lead">כל החלקים חתוכים, ממוספרים ומגיעים עם פרזול וברגים. רוצים שנרכיב? מסמנים "כולל הרכבה".</p>
        <ul class="kits">${kits.map(p => {
          const asm = p.variants.find(v => v.name === 'הרכבה')?.options.find(o => o.delta > 0);
          return `
          <li class="kit panel" data-kit="${p.id}" data-base="${p.price}" data-asm="${asm ? asm.delta : 0}">
            <div class="ph kit-media" data-tone="${p.tone}"><img class="ph-img" src="${productImage(p)}" alt="" loading="lazy"></div>
            <h3 class="h3"><a href="${url.product(p.id)}">${p.name}</a></h3>
            <p class="note">${p.dims}</p>
            <p class="kit-price"><bdi data-kit-price>${fmt(p.price)}</bdi>${p.was ? ` <s><span class="sr-only">במקום </span><bdi>${fmt(p.was)}</bdi></s>` : ''}</p>
            ${asm ? `<label class="check"><input type="checkbox" data-kit-asm><span>כולל הרכבה (+<bdi>${fmt(asm.delta)}</bdi>)</span></label>` : ''}
            <button class="btn btn-primary btn-block" type="button" data-kit-add>הוספת הערכה לסל</button>
          </li>`; }).join('')}
        </ul>
      </div>
    </section>`;
  }
  if (id === 'boards') return `
    <section class="section-sm" aria-labelledby="cut-title">
      <div class="container">
        <div class="area-split panel panel-tint">
          <div class="ph area-media" data-tone="board"><img class="ph-img" src="assets/img/saw.webp" alt="מסור פאנלים חותך לוח דיקט במחסן" loading="lazy"></div>
          <div class="stack">
            <p class="eyebrow">שירות</p>
            <h2 class="sec-title" id="cut-title">חיתוך לוחות לפי מידה</h2>
            <p>שולחים לנו רשימת חלקים — ומקבלים הביתה לוחות חתוכים ומוכנים להרכבה. המסור שלנו מדויק עד מילימטר.</p>
            <ul class="ticks">
              <li>${icon('check')}<span>${CUT_PRICES[1].item}: <strong>${CUT_PRICES[1].price}</strong></span></li>
              <li>${icon('check')}<span>חיתוך חינם בהזמנה מעל <bdi>${fmt(SHOP_RULES.freeCuttingOver)}</bdi></span></li>
              <li>${icon('check')}<span>נציג מאשר איתכם את המידות לפני שהמסור מתחיל</span></li>
            </ul>
            <div class="cta-row"><a class="btn btn-primary" href="${url.cutting()}">איך מזמינים חיתוך ${arrow}</a></div>
          </div>
        </div>
      </div>
    </section>`;
  if (id === 'hardwood') {
    const rows = [['oak-board-27', 'קשה', 'חום-דבש בהיר', 'שולחנות, רהיטים, רצפות'], ['walnut-board-27', 'בינוני-קשה', 'חום שוקולד כהה', 'רהיטי יוקרה, מדפים'], ['beech-board-27', 'קשה', 'בהיר ורדרד', 'כיסאות, משטחי עבודה'], ['teak-board-25', 'בינוני-קשה', 'חום-זהוב', 'רהיטי חוץ, חדרי רחצה'], ['maple-board-27', 'קשה מאוד', 'בהיר מאוד', 'קרשי חיתוך, משטחים']];
    return `
    <section class="section-sm" aria-labelledby="species-title">
      <div class="container">
        <h2 class="sec-title" id="species-title">מדריך זני עץ — השוואה מהירה</h2>
        <div class="table-wrap">
          <table class="table table-stack">
            <caption class="sr-only">השוואת זני עץ מלא לפי קושי, גוון ומחיר</caption>
            <thead><tr><th scope="col">זן</th><th scope="col">קושי</th><th scope="col">גוון</th><th scope="col">מתאים ל</th><th scope="col">מחיר למטר רץ</th></tr></thead>
            <tbody>${rows.map(([pid, hard, tone, fit]) => { const p = getProduct(pid); return p ? `
              <tr><th scope="row"><a class="tbl-link" href="${url.product(p.id)}">${p.sub}</a></th><td data-label="קושי">${hard}</td><td data-label="גוון">${tone}</td><td data-label="מתאים ל">${fit}</td><td data-label="מחיר למטר רץ" class="num-cell">החל מ-<bdi>${fmt(p.price)}</bdi></td></tr>` : ''; }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </section>`;
  }
  if (id === 'firewood') {
    const p = getProduct('firewood-pallet'), h = getProduct('firewood-half');
    return `
    <section class="section-sm" aria-labelledby="winter-title">
      <div class="container">
        <div class="panel panel-dark winter">
          <div class="ph winter-media" data-tone="char"><img class="ph-img" src="${productImage(p)}" alt="" loading="lazy"></div>
          <div class="stack">
            <p class="eyebrow eyebrow-light">הזמנה עונתית</p>
            <h2 class="sec-title" id="winter-title">מזמינים לחורף — כבר עכשיו</h2>
            <p class="lead">לקראת החורף המלאי נגמר מהר והזמני האספקה מתארכים. משטח מיובש, עד הבית עם מנוף.</p>
            <p class="winter-price"><span>משטח שלם</span> <bdi>${fmt(p.price)}</bdi>${h ? ` <span class="muted-light">· חצי משטח <bdi>${fmt(h.price)}</bdi></span>` : ''}</p>
            <div class="cta-row"><button class="btn btn-primary" type="button" data-add="${p.id}">הוספת משטח לסל</button><a class="btn btn-ghost-light btn" href="${url.product(p.id)}">פרטים על העצים</a></div>
          </div>
        </div>
      </div>
    </section>`;
  }
  if (id === 'accessories') {
    const kits = [
      ['ערכה לדק', 'ל-10 מ"ר דק', ['deck-screws-ss', 'hidden-clips', 'deck-oil-4l']],
      ['ערכה לפרגולה', 'לפרגולה 3×4 מ׳', ['pergola-brackets', 'deck-screws-ss', 'deck-oil-4l', 'shade-net']],
      ['ערכה לרהיט', 'לשולחן או מדף מעץ מלא', ['sanding-kit', 'oil-teak-1l', 'varnish-water']],
    ];
    return `
    <section class="section-sm" aria-labelledby="pk-title">
      <div class="container">
        <h2 class="sec-title" id="pk-title">ערכות משלימות לפרויקט</h2>
        <ul class="kits">${kits.map(([t, sub, ids]) => {
          const ps = ids.map(getProduct).filter(Boolean);
          const total = ps.reduce((s, p) => s + p.price, 0);
          return `
          <li class="kit panel">
            <h3 class="h3">${t}</h3><p class="note">${sub}</p>
            <ul class="kit-items">${ps.map(p => `<li><a href="${url.product(p.id)}">${p.name}</a><bdi>${fmt(p.price)}</bdi></li>`).join('')}</ul>
            <p class="kit-price"><span class="note">סה״כ</span> <bdi>${fmt(total)}</bdi></p>
            <button class="btn btn-primary btn-block" type="button" data-pack="${ids.join(',')}" data-pack-name="${t}">הוספת הערכה לסל</button>
          </li>`; }).join('')}
        </ul>
      </div>
    </section>`;
  }
  if (id === 'sale') {
    if (!SALE_ENDS || new Date(SALE_ENDS) < new Date()) return `
      <section class="section-sm" aria-label="תנאי המבצע">
        <div class="container"><p class="notice">${icon('tag')}<span>המחירים בעמוד בתוקף עד גמר המלאי. אין כאן שעון עצר — כשמבצע מסתיים, פשוט נעדכן את העמוד.</span></p></div>
      </section>`;
    return `
      <section class="section-sm" aria-labelledby="timer-title">
        <div class="container"><div class="panel panel-dark sale-timer">
          <h2 class="h3" id="timer-title">המבצע העונתי מסתיים בעוד</h2>
          <p class="timer" data-timer="${SALE_ENDS}" role="timer" aria-live="off"></p>
          <p class="note">עד <bdi>${new Date(SALE_ENDS).toLocaleDateString('he-IL')}</bdi> או עד גמר המלאי.</p>
        </div></div>
      </section>`;
  }
  return '';
}

function initCatArea() {
  // deck calculator
  const f = $('#cat-deck-calc');
  if (f) {
    const calc = () => {
      const l = Math.max(0, Number(f.l.value) || 0), w = Math.max(0, Number(f.w.value) || 0);
      const t = DECK_TYPES.find(x => x.id === f.dtype.value);
      const area = l * w, order = Math.ceil(area * 1.1);
      $('[data-dc="area"]').innerHTML = `<bdi>${area.toFixed(1)}</bdi> מ"ר`;
      $('[data-dc="order"]').innerHTML = `<bdi>${order}</bdi> מ"ר`;
      $('[data-dc="screws"]').innerHTML = `<bdi>${Math.max(1, Math.ceil(area / 20))}</bdi> קופסאות`;
      $('[data-dc="price"]').innerHTML = `<bdi>${fmt(order * t.price)}</bdi>`;
      $('[data-dc-full]').href = url.deckCalculator({ type: t.id, l, w });
      const btn = $('[data-dc-add]');
      btn.dataset.pid = t.product; btn.dataset.qty = order; btn.disabled = order < 1;
    };
    f.addEventListener('input', calc); f.addEventListener('change', calc); calc();
    $('[data-dc-add]').addEventListener('click', e => {
      const b = e.currentTarget, p = getProduct(b.dataset.pid);
      cart.add(p.id, Number(b.dataset.qty));
      flyToCart(b);
      toast(`<bdi>${b.dataset.qty}</bdi> מ"ר <strong>${p.name}</strong> נוספו לסל`, { label: 'לצפייה בסל', fn: openCart });
    });
  }
  // pergola kits
  $$('[data-kit]').forEach(k => {
    const box = $('[data-kit-asm]', k), p = getProduct(k.dataset.kit);
    const price = () => p.price + (box?.checked ? Number(k.dataset.asm) : 0);
    box?.addEventListener('change', () => { $('[data-kit-price]', k).textContent = fmt(price()); const s = $('.kit-price s', k); if (s) s.hidden = box.checked; });
    $('[data-kit-add]', k).addEventListener('click', e => {
      const asm = box?.checked;
      cart.add(p.id, 1, asm ? { variant: 'הרכבה: כולל הרכבה', price: price() } : (p.variants.length ? { variant: 'הרכבה: ללא הרכבה', price: p.price } : {}));
      flyToCart(e.currentTarget);
      toast(`<strong>${p.name}</strong> נוספה לסל${asm ? ' (כולל הרכבה)' : ''}`, { label: 'לצפייה בסל', fn: openCart });
    });
  });
  // accessory packs
  $$('.kit [data-pack]').forEach(b => b.addEventListener('click', () => addMany(b.dataset.pack.split(','), b, `<strong>${b.dataset.packName}</strong> נוספה לסל`)));
  // real countdown (only if SALE_ENDS)
  const t = $('[data-timer]');
  if (t) {
    const end = new Date(t.dataset.timer).getTime();
    const tick = () => {
      const s = Math.max(0, Math.floor((end - Date.now()) / 1000));
      const d = Math.floor(s / 86400), h = Math.floor(s % 86400 / 3600), m = Math.floor(s % 3600 / 60);
      t.innerHTML = `<span><bdi>${d}</bdi> ימים</span><span><bdi>${h}</bdi> שעות</span><span><bdi>${m}</bdi> דקות</span>`;
    };
    tick(); setInterval(tick, 30000);
  }
}

function renderCategory() {
  const c = categoryById(param('c'));
  if (!c) return notFound('הקטגוריה לא נמצאה', 'ייתכן שהקישור ישן. כל הקטגוריות כאן למטה.');
  let sub = param('sub');
  if (sub && !c.subs.includes(sub)) sub = null;
  const isSale = c.id === 'sale';
  const base = productsByCategory(c.id, sub || undefined);
  document.title = `${sub || c.name} | עץ מרקט`;

  const subCards = c.subs.map(s => {
    const ps = productsByCategory(c.id, s);
    const img = ps.find(p => p.img) ? productImage(ps.find(p => p.img)) : `assets/img/cat-${c.id}.webp`;
    return `<li><a class="sub-card" href="${url.category(c.id, s)}"${s === sub ? ' aria-current="page"' : ''}>
      <span class="ph" data-tone="${ps[0]?.tone || c.tone}"><img class="ph-img" src="${img}" alt="" loading="lazy"></span>
      <span class="sub-name">${s}<small>${ps.length} מוצרים</small></span></a></li>`;
  }).join('');

  // complementary products for a sub page
  let compl = [];
  if (sub) {
    const inSub = new Set(base.map(p => p.id));
    const seen = new Set();
    base.forEach(p => (p.related || []).forEach(id => { if (!inSub.has(id) && !seen.has(id) && getProduct(id)) { seen.add(id); compl.push(getProduct(id)); } }));
    compl = compl.slice(0, 4);
  }

  root.innerHTML = `
    <section class="page-head page-head--media cat-head" aria-labelledby="page-title">
      <div class="container page-head-in">
        <div class="page-head-text">
          ${crumbs(sub ? [{ label: 'חנות', href: url.shop() }, { label: c.name, href: url.category(c.id) }, { label: sub }] : [{ label: 'חנות', href: url.shop() }, { label: c.name }])}
          ${sub ? `<p class="eyebrow">${c.short}</p>` : ''}
          <h1 class="page-title" id="page-title">${sub || c.name}</h1>
          <p class="page-intro">${sub ? (SUB_INFO[sub] || c.intro) : c.intro}</p>
          ${isSale ? '' : `<p class="cat-facts"><span>${icon('saw')} חיתוך לפי מידה</span><span>${icon('crane')} משלוח עם מנוף עד 72 שעות</span></p>`}
        </div>
        <div class="page-head-media">
          <div class="ph" data-tone="${c.tone}"><img class="ph-img" src="assets/img/cat-${c.id}.webp" alt="" fetchpriority="high"></div>
        </div>
      </div>
    </section>

    ${sub ? '' : `
    <section class="section-sm" aria-labelledby="subs-title">
      <div class="container">
        <h2 class="sr-only" id="subs-title">תתי-קטגוריות</h2>
        <ul class="sub-cards">${subCards}</ul>
      </div>
    </section>`}
    ${sub ? `
    <section class="section-sm" aria-label="תתי-קטגוריות נוספות">
      <div class="container"><div class="chips-scroll">
        <a class="chip-link" href="${url.category(c.id)}">כל ה${c.short}</a>
        ${c.subs.map(s => `<a class="chip-link" href="${url.category(c.id, s)}"${s === sub ? ' aria-current="page"' : ''}>${s}</a>`).join('')}
      </div></div>
    </section>` : ''}

    <section class="section-sm" aria-label="מוצרים">
      <div class="container" data-listing></div>
    </section>

    ${sub ? '' : catArea(c)}

    ${compl.length ? `
    <section class="section-sm" aria-labelledby="compl-title">
      <div class="container">
        <div class="sec-head-row"><h2 class="sec-title" id="compl-title">מוצרים משלימים</h2>
          <button class="btn btn-ghost" type="button" data-pack="${compl.map(p => p.id).join(',')}" data-pack-name="המוצרים המשלימים">הוספת הכל לסל</button></div>
        <div class="p-grid p-grid-wrap">${compl.map(productCard).join('')}</div>
      </div>
    </section>` : ''}

    <section class="section-sm" aria-labelledby="cfaq-title">
      <div class="container narrow">
        <h2 class="sec-title" id="cfaq-title">שאלות נפוצות על ${sub || c.short}</h2>
        ${faqHtml(CAT_FAQ[c.id] || [])}
        <p class="note faq-more">יש לכם שאלה אחרת? <a href="${url.faq()}">לכל השאלות הנפוצות</a> או <a href="${STORE.wa}" target="_blank" rel="noopener">כתבו לנו ב-WhatsApp</a>.</p>
      </div>
    </section>

    ${sub ? '' : `
    <section class="section-sm seo-sec" aria-labelledby="seo-title">
      <div class="container narrow">
        <h2 class="h3" id="seo-title">על ${c.name}</h2>
        ${readMore(CAT_SEO[c.id] || c.intro, 'seo-body')}
      </div>
    </section>`}`;

  listing($('[data-listing]'), { base, catId: c.id, sub, isSale, keepParams: ['c', 'sub'], banner: base.length > 12 ? MID_BANNER : '' });
  initCatArea();
  $$('[data-pack]').forEach(b => { if (!b.closest('.kit')) b.addEventListener('click', () => addMany(b.dataset.pack.split(','), b, `${b.dataset.packName} נוספו לסל`)); });
}

function notFound(title, text) {
  root.innerHTML = `
    <section class="section-sm"><div class="container">
      ${crumbs([{ label: 'חנות', href: url.shop() }, { label: title }])}
      <div class="empty-state">
        <span class="empty-ico">${icon('search')}</span>
        <h1 class="h3">${title}</h1>
        <p>${text}</p>
        <div class="cta-row"><a class="btn btn-primary" href="${url.shop()}">לכל המוצרים</a><a class="btn btn-ghost" href="tel:${STORE.tel}">${icon('phone')}<bdi>${STORE.phone}</bdi></a></div>
      </div>
    </div></section>
    <section class="section-sm"><div class="container"><ul class="cat-grid cat-grid-wrap">${CATEGORIES.map(catCard).join('')}</ul></div></section>`;
}

/* ==========================================================================
   5. עמוד מוצר
   ========================================================================== */
const RECENT_KEY = 'etz_recent_v1';
const PROJ_IMG = { decking: 'proj-deck', pergolas: 'proj-pergola', hardwood: 'proj-table', construction: 'hero-beams', boards: 'saw', firewood: 'cat-firewood', accessories: 'proj-deck' };

function galleryOf(p) {
  const front = productImage(p);
  const g = [{ src: front, label: 'חזית', alt: `${p.name} — חזית` }];
  const tex = productTexture(p);
  if (tex) g.push({ src: tex, label: 'תקריב מרקם', alt: `${p.name} — תקריב מרקם העץ` });
  g.push({ src: front, label: 'קנה מידה', alt: `${p.name} — עם קווי מידה: ${p.dims}`, scale: true });
  const proj = `assets/img/${PROJ_IMG[p.cat] || `cat-${p.cat}`}.webp`;
  if (proj !== front) g.push({ src: proj, label: 'בשימוש', alt: `${p.name} — בפרויקט של לקוח` });
  if (p.img && !g.some(x => x.src === `assets/img/cat-${p.cat}.webp`)) g.push({ src: `assets/img/cat-${p.cat}.webp`, label: 'מהמחסן', alt: `${catLabel(p)} — במחסן` });
  return g;
}

function revDist(r) {
  const p5 = Math.max(10, Math.min(92, Math.round((r - 4) * 90 + 10)));
  const p4 = Math.round((100 - p5) * .7), p3 = Math.round((100 - p5 - p4) * .6), p2 = Math.round((100 - p5 - p4 - p3) * .6);
  return [p5, p4, p3, p2, Math.max(0, 100 - p5 - p4 - p3 - p2)];
}

function renderProduct() {
  const p = getProduct(param('id'));
  if (!p) return notFound('המוצר לא נמצא', 'ייתכן שהמוצר אזל או שהקישור השתנה. אפשר לחפש אותו או לעבור לקטגוריות.');
  const c = categoryById(p.cat);
  document.title = `${p.name} | עץ מרקט`;
  const meta = document.querySelector('meta[name="description"]');
  if (meta) meta.content = p.shortDesc;
  const gal = galleryOf(p);
  const d = dimsOf(p);
  const maxLenCm = Math.round(((span(d.len)?.[1]) || (p.cat === 'boards' ? 2.44 : 6)) * 100);
  const isArea = p.unit === 'למ"ר';
  const isSheet = p.cat === 'boards' && /122×244/.test(p.dims);
  const upsell = p.upsell && getProduct(p.upsell);
  const related = (p.related || []).map(getProduct).filter(Boolean).slice(0, 4);
  const reviews = REVIEWS[p.cat] || REVIEWS.accessories;
  const dist = revDist(p.rating);
  const heads = ['למה החומר הזה', 'שימושים מומלצים והתקנה', 'תחזוקה וטיפים', 'עוד פרטים'];
  const specs = p.specs.filter(([, v]) => v && v !== '—');
  const durOf = x => x.specs.find(s => s[0] === 'עמידות')?.[1] || '—';
  const pfaq = [
    p.cuttable && ['אפשר לחתוך לי את המוצר לפי מידה?', `כן. מסמנים "חיתוך לפי מידה" ומזינים אורך וכמות חתיכות. נציג מאשר איתכם בטלפון לפני החיתוך. חיתוך חינם בהזמנה מעל ${fmt(SHOP_RULES.freeCuttingOver)}.`],
    ['תוך כמה זמן זה מגיע?', `עד ${SHOP_RULES.deliveryHours} שעות לרוב הארץ, במשאית עם מנוף. לאילת והערבה — 4–6 ימי עסקים.`],
    isArea && ['כמה מ"ר להזמין?', 'מודדים אורך × רוחב ומוסיפים 10% לפחת. המחשבון "כמה צריך?" בעמוד הזה מחשב בשבילכם.'],
    ['אפשר להחזיר?', 'כן, תוך 14 יום במצב חדש. מוצר שנחתך לפי מידה אינו ניתן להחזרה, חוץ ממקרה של פגם.'],
    ['יש חשבונית על שם חברה?', 'כן — מסמנים זאת בקופה ומזינים ח.פ.'],
  ].filter(Boolean);

  root.innerHTML = `
    <section class="section-sm pd-sec" aria-labelledby="pd-title">
      <div class="container">
        ${crumbs([{ label: 'חנות', href: url.shop() }, { label: c.name, href: url.category(c.id) }, ...(p.sub ? [{ label: p.sub, href: url.category(c.id, p.sub) }] : []), { label: p.name }])}
        <div class="pd">
          <div class="pd-gallery">
            <div class="pd-stage">
              ${gal.map((g, i) => `
                <figure class="pd-slide" data-slide="${i}"${i ? ' hidden' : ''}>
                  <button class="pd-zoom-btn" type="button" data-zoom="${i}" aria-label="הגדלת התמונה: ${esc(g.label)}">
                    <span class="ph" data-tone="${p.tone}"><img class="ph-img" src="${g.src}" alt="${esc(g.alt)}"${i ? ' loading="lazy"' : ' fetchpriority="high"'}></span>
                    ${g.scale ? `<span class="pd-scale" aria-hidden="true"><span class="dim dim-w pd-dim-w"><span>${esc(p.dims.split('·')[0].trim())}</span></span>${d.len.length ? `<span class="dim dim-h pd-dim-h"><span>${esc((p.dims.split('·')[1] || '').trim() || `${span(d.len)[1]} מ׳`)}</span></span>` : ''}</span>` : ''}
                  </button>
                </figure>`).join('')}
              ${p.badge ? `<span class="badge ${p.badge === 'sale' ? 'badge-sale' : p.badge === 'best' ? 'badge-best' : ''} pd-badge">${BADGES[p.badge]}${p.was ? ` −${discountPct(p)}%` : ''}</span>` : ''}
              <span class="pd-zoom-hint" aria-hidden="true">${icon('search')} לחצו להגדלה</span>
            </div>
            <div class="pd-thumbs" role="group" aria-label="תמונות המוצר">
              ${gal.map((g, i) => `<button type="button" class="pd-thumb" data-thumb="${i}" aria-pressed="${i === 0}" aria-label="תמונה ${i + 1}: ${esc(g.label)}"><span class="ph" data-tone="${p.tone}"><img class="ph-img" src="${g.src}" alt="" loading="lazy"></span><small>${g.label}</small></button>`).join('')}
            </div>
          </div>

          <div class="pd-info">
            <a class="pd-cat" href="${url.category(c.id, p.sub)}">${catLabel(p)}${p.sub ? ` · ${p.sub}` : ''}</a>
            <h1 class="pd-title" id="pd-title">${p.name}</h1>
            <div class="pd-meta">
              <a class="pd-rating" href="#reviews"><span class="stars" aria-hidden="true">${stars(p.rating)}</span><span><bdi>${p.rating}</bdi> · <bdi>${p.reviews}</bdi> ביקורות</span><span class="sr-only">דירוג ${p.rating} מתוך 5. מעבר לביקורות</span></a>
              <span class="pd-sku">מק"ט <bdi dir="ltr">${p.sku}</bdi></span>
            </div>
            <p class="pd-dims">${icon('ruler')} ${p.dims}</p>

            <div class="pd-price" aria-live="polite">
              <p><bdi class="now" data-unit-price>${fmt(p.price)}</bdi> <span class="unit">${p.unit}</span>${p.was ? ` <s data-was><span class="sr-only">במקום </span><bdi>${fmt(p.was)}</bdi></s>` : ''}</p>
              <p class="note" data-installments></p>
            </div>
            <p class="pd-short">${p.shortDesc}</p>

            <form class="pd-form" id="pd-form" novalidate onsubmit="return false">
              ${p.variants.map((v, vi) => {
                const def = Math.max(0, v.options.findIndex(o => o.delta === 0));
                return `
                <fieldset class="fieldset pd-var">
                  <legend>${v.name}: <span class="pd-var-val" data-var-val="${vi}">${v.options[def].label}</span></legend>
                  <div class="chip-row">${v.options.map((o, oi) => `
                    <label class="chip"><input type="radio" name="v${vi}" value="${oi}"${oi === def ? ' checked' : ''}><span>${o.label}${o.delta ? ` <small><bdi>${o.delta > 0 ? '+' : '−'}${fmt(Math.abs(o.delta))}</bdi></small>` : ''}</span></label>`).join('')}
                  </div>
                </fieldset>`; }).join('')}

              ${p.cuttable ? `
              <div class="pd-cut">
                <label class="check"><input type="checkbox" id="pd-cut" aria-controls="pd-cut-fields" aria-expanded="false"><span>${icon('saw')} חיתוך לפי מידה</span></label>
                <div class="form-grid pd-cut-fields" id="pd-cut-fields" hidden>
                  <div class="fld"><label class="field-lbl" for="pd-cut-len">אורך לחיתוך (ס"מ)</label>
                    <input class="input" id="pd-cut-len" type="number" inputmode="numeric" min="1" max="${maxLenCm}" step="1" placeholder="למשל 120" aria-describedby="pd-cut-len-hint pd-cut-len-err">
                    <p class="fld-hint" id="pd-cut-len-hint">עד ${maxLenCm} ס"מ</p><p class="fld-error" id="pd-cut-len-err"></p></div>
                  <div class="fld"><label class="field-lbl" for="pd-cut-pcs">כמות חתיכות</label>
                    <input class="input" id="pd-cut-pcs" type="number" inputmode="numeric" min="1" max="999" step="1" value="1" aria-describedby="pd-cut-pcs-err"><p class="fld-error" id="pd-cut-pcs-err"></p></div>
                  <p class="fld-full note">חינם בהזמנה מעל <bdi>${fmt(SHOP_RULES.freeCuttingOver)}</bdi> · נציג מאשר את המידות בטלפון לפני החיתוך.</p>
                </div>
              </div>` : ''}

              <div class="pd-buy" data-buy-anchor>
                <div class="pd-qty">
                  <label class="field-lbl" for="pd-qty">כמות${isArea ? ' (מ"ר)' : ''}</label>
                  <div class="num">
                    <button class="num-btn" type="button" data-step="1" aria-label="הוספת יחידה">${icon('plus')}</button>
                    <input id="pd-qty" type="number" inputmode="numeric" min="1" max="999" value="1">
                    <button class="num-btn" type="button" data-step="-1" aria-label="הפחתת יחידה">${icon('minus')}</button>
                  </div>
                </div>
                <div class="pd-total"><span class="note">סה״כ</span><bdi data-total>${fmt(p.price)}</bdi></div>
                <button class="btn btn-primary btn-lg pd-add" type="button" data-pd-add${p.inStock ? "" : " disabled"}>${icon('cart')} ${p.inStock ? "הוספה לסל" : "אזל מהמלאי"}</button>
                <button class="pd-wish" type="button" data-wish="${p.id}" aria-pressed="${wishlist.has(p.id)}" aria-label="הוספה למועדפים: ${esc(p.name)}">${icon('heart')}</button>
              </div>
            </form>

            <p class="pd-stock">${p.inStock ? `<span class="dot" aria-hidden="true"></span> במלאי · משלוח עד ${SHOP_RULES.deliveryHours} שעות` : 'אזל מהמלאי — התקשרו ונבדוק מתי יגיע'}</p>
            <ul class="pd-trust">
              <li>${icon('crane')}<span>משלוח עם מנוף לכל הארץ</span></li>
              <li>${icon('check')}<span>החזרה במקרה של פגם</span></li>
              <li><a href="${STORE.wa}" target="_blank" rel="noopener">${icon('wa')}<span>שאלה? כתבו ב-WhatsApp</span></a></li>
            </ul>
          </div>
        </div>
      </div>
    </section>

    ${isArea || isSheet ? `
    <section class="section-sm" aria-labelledby="qc-title">
      <div class="container narrow">
        <div class="panel panel-tint qcalc">
          <h2 class="h3" id="qc-title">כמה צריך?</h2>
          <form class="qcalc-form" novalidate onsubmit="return false">
            <div class="fld"><label class="field-lbl" for="qc-l">אורך (מ׳)</label><input class="input" id="qc-l" type="number" inputmode="decimal" min="0" step="0.1" value="${isArea ? 5 : 2.4}"></div>
            <span aria-hidden="true" class="qc-x">×</span>
            <div class="fld"><label class="field-lbl" for="qc-w">רוחב (מ׳)</label><input class="input" id="qc-w" type="number" inputmode="decimal" min="0" step="0.1" value="${isArea ? 4 : 1.2}"></div>
            <p class="qc-res" aria-live="polite" data-qc-res></p>
            <button class="btn btn-ghost" type="button" data-qc-apply>עדכון הכמות</button>
          </form>
          <p class="note">כולל 10% לפחת ולחיתוכים${isSheet ? ' · לוח 122×244 ס"מ = 2.98 מ"ר' : ''}.</p>
        </div>
      </div>
    </section>` : ''}

    <section class="section-sm" aria-labelledby="desc-title">
      <div class="container pd-cols">
        <div class="prose">
          <h2 class="sec-title" id="desc-title">על המוצר</h2>
          ${p.longDesc.map((t, i) => `<h3>${heads[i] || heads[3]}</h3><p>${t}</p>`).join('')}
        </div>
        <div>
          <h2 class="sec-title" id="spec-title">מפרט טכני</h2>
          <div class="table-wrap"><table class="table table-spec" aria-labelledby="spec-title"><tbody>
            ${specs.map(([k, v]) => `<tr><th scope="row">${k}</th><td>${k === 'מק"ט' ? `<bdi dir="ltr">${v}</bdi>` : v}</td></tr>`).join('')}
            <tr><th scope="row">יחידת מכירה</th><td>${p.unit.replace(/^ל/, '')}</td></tr>
            <tr><th scope="row">חיתוך לפי מידה</th><td>${p.cuttable ? 'כן' : 'לא'}</td></tr>
          </tbody></table></div>
        </div>
      </div>
    </section>

    <section class="section-sm" aria-labelledby="insp-title">
      <div class="container">
        <h2 class="sec-title" id="insp-title">השראה מפרויקטים של לקוחות</h2>
        <ul class="cust-gal">
          ${[[PROJ_IMG[p.cat] || 'proj-deck', 'חיפה'], ['pergola-yard', 'זכרון יעקב'], ['proj-table', 'ירכא']].map(([img, city], i) => `
          <li data-anim style="--d:${i * .07}s"><figure><div class="ph" data-tone="${p.tone}"><img class="ph-img" src="assets/img/${img}.webp" alt="פרויקט של לקוח, ${city}" loading="lazy"></div><figcaption>פרויקט של לקוח · ${city} <span class="tag-sample">דוגמה</span></figcaption></figure></li>`).join('')}
        </ul>
      </div>
    </section>

    <section class="section-sm" id="reviews" aria-labelledby="rev-title">
      <div class="container">
        <h2 class="sec-title" id="rev-title">ביקורות <span class="tag-sample">דוגמה</span></h2>
        <div class="rv">
          <div class="rv-sum panel">
            <p class="rv-score"><bdi>${p.rating}</bdi><small>מתוך 5</small></p>
            <span class="stars" aria-hidden="true">${stars(p.rating)}</span>
            <p class="note"><bdi>${p.reviews}</bdi> ביקורות</p>
            <ul class="rv-bars">${dist.map((v, i) => `<li><span>${5 - i} ★</span><span class="meter" aria-hidden="true"><span style="width:${v}%"></span></span><span class="sr-only">${5 - i} כוכבים: </span><bdi>${v}%</bdi></li>`).join('')}</ul>
            <button class="btn btn-ghost btn-block" type="button" data-rv-open aria-expanded="false" aria-controls="rv-form">כתבו ביקורת</button>
          </div>
          <div class="stack">
            <form class="panel rv-form form-grid" id="rv-form" hidden novalidate>
              <fieldset class="fieldset fld-full"><legend class="field-lbl">הדירוג שלכם</legend>
                <div class="chip-row">${[5, 4, 3, 2, 1].map(n => `<label class="chip"><input type="radio" name="stars" value="${n}"${n === 5 ? ' checked' : ''}><span>${n} ★</span></label>`).join('')}</div></fieldset>
              <div class="fld"><label class="field-lbl" for="rv-name">שם</label><input class="input" id="rv-name" name="name" autocomplete="given-name" required aria-describedby="rv-name-err"><p class="fld-error" id="rv-name-err"></p></div>
              <div class="fld"><label class="field-lbl" for="rv-city">עיר <span class="opt">(לא חובה)</span></label><input class="input" id="rv-city" name="city" autocomplete="address-level2"></div>
              <div class="fld fld-full"><label class="field-lbl" for="rv-text">הביקורת</label><textarea class="input" id="rv-text" name="text" required minlength="10" aria-describedby="rv-text-err"></textarea><p class="fld-error" id="rv-text-err"></p></div>
              <p class="form-alert fld-full" data-rv-msg role="status"></p>
              <button class="btn btn-primary fld-full" type="submit">שליחת הביקורת</button>
            </form>
            <ul class="rv-list">${reviews.map(([n, city, s, t, img]) => `
              <li class="rv-item panel">
                <div class="rv-top"><span class="stars" aria-hidden="true">${stars(s)}</span><span class="sr-only">${s} מתוך 5</span><strong>${n}</strong><span class="note">· ${city} · רכישה מאומתת</span></div>
                <p>${t}</p>
                ${img ? `<div class="ph rv-img" data-tone="${p.tone}"><img class="ph-img" src="${img}" alt="תמונה מהלקוח" loading="lazy"></div>` : ''}
              </li>`).join('')}
            </ul>
          </div>
        </div>
      </div>
    </section>

    ${related.length ? `
    <section class="section-sm" aria-labelledby="xs-title">
      <div class="container">
        <div class="sec-head-row">
          <h2 class="sec-title" id="xs-title">מה עוד צריך לפרויקט?</h2>
          <button class="btn btn-primary" type="button" data-add-all="${related.map(x => x.id).join(',')}">הוספת הכל לסל · <bdi>${fmt(related.reduce((s, x) => s + x.price, 0))}</bdi></button>
        </div>
        <div class="p-grid p-grid-wrap">${related.map(productCard).join('')}</div>
      </div>
    </section>` : ''}

    ${upsell ? `
    <section class="section-sm" aria-labelledby="up-title">
      <div class="container narrow">
        <h2 class="sec-title" id="up-title">שווה לשדרג?</h2>
        <div class="table-wrap"><table class="table up-table">
          <caption class="sr-only">השוואה בין ${esc(p.name)} ל${esc(upsell.name)}</caption>
          <thead><tr><th scope="col"><span class="sr-only">מאפיין</span></th><th scope="col">המוצר הזה</th><th scope="col" class="up-col">שדרוג מומלץ</th></tr></thead>
          <tbody>
            <tr><th scope="row">מוצר</th><td>${p.name}</td><td class="up-col"><a href="${url.product(upsell.id)}">${upsell.name}</a></td></tr>
            <tr><th scope="row">מחיר</th><td class="num-cell"><bdi>${fmt(p.price)}</bdi> ${p.unit}</td><td class="num-cell up-col"><bdi>${fmt(upsell.price)}</bdi> ${upsell.unit}</td></tr>
            <tr><th scope="row">עמידות</th><td>${durOf(p)}</td><td class="up-col">${durOf(upsell)}</td></tr>
            <tr><th scope="row">מידות</th><td>${p.dims}</td><td class="up-col">${upsell.dims}</td></tr>
            <tr><th scope="row">דירוג</th><td><bdi>${p.rating}</bdi> (${p.reviews})</td><td class="up-col"><bdi>${upsell.rating}</bdi> (${upsell.reviews})</td></tr>
          </tbody>
        </table></div>
        <div class="cta-row up-cta"><a class="btn btn-ghost" href="${url.product(upsell.id)}">לעמוד השדרוג ${arrow}</a><button class="btn btn-primary" type="button" data-add="${upsell.id}">הוספת השדרוג לסל</button></div>
      </div>
    </section>` : ''}

    <section class="section-sm" aria-labelledby="pfaq-title">
      <div class="container narrow">
        <h2 class="sec-title" id="pfaq-title">שאלות על המוצר</h2>
        ${faqHtml(pfaq)}
      </div>
    </section>

    <section class="section-sm" aria-labelledby="recent-title" data-recent hidden>
      <div class="container">
        <h2 class="sec-title" id="recent-title">צפיתם לאחרונה</h2>
        <div class="p-grid p-grid-wrap" data-recent-grid></div>
      </div>
    </section>

    <div class="buybar" data-buybar aria-hidden="true" inert>
      <div class="container buybar-in">
        <span class="ph buybar-img" data-tone="${p.tone}"><img class="ph-img" src="${productImage(p)}" alt=""></span>
        <div class="buybar-txt"><p class="buybar-name">${p.name}</p><p class="buybar-meta"><bdi data-bar-price>${fmt(p.price)}</bdi> <span class="note">${p.unit} · כמות <bdi data-bar-qty>1</bdi></span></p></div>
        <button class="btn btn-primary buybar-add" type="button" data-pd-add${p.inStock ? "" : " disabled"}>${p.inStock ? "הוספה לסל" : "אזל מהמלאי"}</button>
      </div>
    </div>

    <dialog class="pd-lightbox" aria-label="תמונות המוצר בהגדלה">
      <div class="lb-top">
        <p class="lb-cap" data-lb-cap></p>
        <button class="icon-btn lb-btn" type="button" data-lb-close aria-label="סגירה">${icon('close')}</button>
      </div>
      <div class="lb-stage" data-lb-stage><img data-lb-img alt=""></div>
      <div class="lb-nav">
        <button class="icon-btn lb-btn" type="button" data-lb-step="-1" aria-label="התמונה הקודמת">${icon('chev')}</button>
        <button class="btn btn-ghost-light lb-zoom" type="button" data-lb-zoom aria-pressed="false">הגדלה ×2</button>
        <button class="icon-btn lb-btn lb-next" type="button" data-lb-step="1" aria-label="התמונה הבאה">${icon('chev')}</button>
      </div>
    </dialog>`;

  initProduct(p, gal, { maxLenCm, isArea, isSheet });
}

function initProduct(p, gal, o) {
  const form = $('#pd-form');
  const qty = $('#pd-qty');
  let cur = 0;

  // ---- gallery ----
  const show = i => {
    cur = (i + gal.length) % gal.length;
    $$('[data-slide]').forEach(s => { s.hidden = Number(s.dataset.slide) !== cur; });
    $$('[data-thumb]').forEach(t => t.setAttribute('aria-pressed', Number(t.dataset.thumb) === cur));
  };
  $$('[data-thumb]').forEach(t => t.addEventListener('click', () => show(Number(t.dataset.thumb))));
  // swipe on touch (no pointer-follow effect — only a swipe gesture)
  let x0 = null;
  const stage = $('.pd-stage');
  stage.addEventListener('touchstart', e => { x0 = e.touches[0].clientX; }, { passive: true });
  stage.addEventListener('touchend', e => { if (x0 == null) return; const dx = e.changedTouches[0].clientX - x0; if (Math.abs(dx) > 40) show(cur + (dx > 0 ? 1 : -1)); x0 = null; });

  // ---- lightbox zoom ----
  const lb = $('.pd-lightbox');
  const lbImg = $('[data-lb-img]'), lbStage = $('[data-lb-stage]'), lbZoom = $('[data-lb-zoom]');
  const lbShow = i => {
    cur = (i + gal.length) % gal.length; show(cur);
    lbImg.src = gal[cur].src; lbImg.alt = gal[cur].alt;
    $('[data-lb-cap]').textContent = `${gal[cur].label} · ${cur + 1}/${gal.length}`;
    lbStage.classList.remove('is-zoomed'); lbZoom.setAttribute('aria-pressed', 'false');
  };
  $$('[data-zoom]').forEach(b => b.addEventListener('click', () => { lbShow(Number(b.dataset.zoom)); lb.showModal(); }));
  $('[data-lb-close]').addEventListener('click', () => lb.close());
  $$('[data-lb-step]').forEach(b => b.addEventListener('click', () => lbShow(cur + Number(b.dataset.lbStep))));
  const toggleZoom = () => { const on = lbStage.classList.toggle('is-zoomed'); lbZoom.setAttribute('aria-pressed', on); };
  lbZoom.addEventListener('click', toggleZoom);
  lbImg.addEventListener('click', toggleZoom);
  lb.addEventListener('click', e => { if (e.target === lb) lb.close(); });
  lb.addEventListener('keydown', e => { if (e.key === 'ArrowLeft') lbShow(cur + 1); if (e.key === 'ArrowRight') lbShow(cur - 1); });

  // ---- price ----
  const state = () => {
    const sel = p.variants.map((v, vi) => v.options[Number(form.querySelector(`input[name="v${vi}"]:checked`)?.value || 0)]);
    const unit = p.price + sel.reduce((s, x) => s + x.delta, 0);
    const n = Math.min(999, Math.max(1, Math.round(Number(qty.value) || 1)));
    const variant = p.variants.map((v, vi) => `${v.name}: ${sel[vi].label}`).join(' · ');
    return { unit, n, variant, sel };
  };
  const paint = () => {
    const s = state();
    $('[data-unit-price]').textContent = fmt(s.unit);
    const was = $('[data-was]');
    if (was) was.hidden = s.unit !== p.price;
    $('[data-total]').textContent = fmt(s.unit * s.n);
    $('[data-bar-price]').textContent = fmt(s.unit * s.n);
    $('[data-bar-qty]').textContent = s.n;
    const total = s.unit * s.n;
    $('[data-installments]').innerHTML = total >= 300 ? `או עד ${SHOP_RULES.maxInstallments} תשלומים של <bdi>${fmt(total / SHOP_RULES.maxInstallments)}</bdi>` : '';
    s.sel.forEach((x, vi) => { const el = $(`[data-var-val="${vi}"]`); if (el) el.textContent = x.label; });
  };
  form.addEventListener('change', paint);
  qty.addEventListener('input', paint);
  qty.addEventListener('blur', () => { qty.value = state().n; paint(); });
  $$('[data-step]', form).forEach(b => b.addEventListener('click', () => { qty.value = Math.min(999, Math.max(1, state().n + Number(b.dataset.step))); paint(); }));
  paint();

  // ---- cut to size ----
  const cutBox = $('#pd-cut');
  if (cutBox) cutBox.addEventListener('change', () => {
    $('#pd-cut-fields').hidden = !cutBox.checked;
    cutBox.setAttribute('aria-expanded', cutBox.checked);
    if (cutBox.checked) $('#pd-cut-len').focus();
  });
  const fieldErr = (inp, msg) => {
    const fld = inp.closest('.fld');
    fld.classList.toggle('is-error', !!msg);
    inp.setAttribute('aria-invalid', msg ? 'true' : 'false');
    $(`#${inp.id}-err`).textContent = msg || '';
  };
  const readCut = () => {
    if (!cutBox?.checked) return { ok: true };
    const len = $('#pd-cut-len'), pcs = $('#pd-cut-pcs');
    const L = Number(len.value), P = Number(pcs.value);
    const e1 = !len.value ? 'נא להזין אורך לחיתוך בס"מ' : !(L >= 1 && L <= o.maxLenCm) ? `האורך צריך להיות בין 1 ל-${o.maxLenCm} ס"מ` : '';
    const e2 = !(Number.isInteger(P) && P >= 1 && P <= 999) ? 'נא להזין כמות חתיכות (לפחות 1)' : '';
    fieldErr(len, e1); fieldErr(pcs, e2);
    if (e1 || e2) {
      if (!cutBox.closest('.pd-form').contains(document.activeElement) || matchMedia('(max-width: 900px)').matches) (e1 ? len : pcs).scrollIntoView({ block: 'center', behavior: reduceMotion() ? 'auto' : 'smooth' });
      (e1 ? len : pcs).focus({ preventScroll: true });
      return { ok: false };
    }
    return { ok: true, cut: { len: Math.round(L), pcs: P } };
  };

  // ---- add to cart ----
  $$('[data-pd-add]').forEach(btn => btn.addEventListener('click', () => {
    const c = readCut();
    if (!c.ok) return;
    const s = state();
    cart.add(p.id, s.n, { ...(p.variants.length ? { variant: s.variant, price: s.unit } : {}), ...(c.cut ? { cut: c.cut } : {}) });
    flyToCart(btn);
    const label = btn.innerHTML;
    btn.classList.add('is-added'); btn.textContent = 'נוסף לסל ✓';
    setTimeout(() => { btn.classList.remove('is-added'); btn.innerHTML = label; }, 1800);
    toast(`<bdi>${s.n}</bdi> × <strong>${p.name}</strong> נוסף לסל`, { label: 'לצפייה בסל', fn: openCart });
  }));

  // ---- sticky buy bar ----
  const bar = $('[data-buybar]'), anchor = $('[data-buy-anchor]');
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([en]) => {
      const on = !en.isIntersecting && en.boundingClientRect.top < 0;
      bar.classList.toggle('is-on', on);
      bar.setAttribute('aria-hidden', !on);
      bar.inert = !on;
      document.documentElement.classList.toggle('buybar-on', on);
    }).observe(anchor);
  }

  // ---- quantity calculator ----
  const qc = $('.qcalc-form');
  if (qc) {
    const calc = () => {
      const area = Math.max(0, Number($('#qc-l').value) || 0) * Math.max(0, Number($('#qc-w').value) || 0);
      const n = o.isArea ? Math.ceil(area * 1.1) : Math.ceil((area * 1.1) / 2.977);
      $('[data-qc-res]').innerHTML = area ? `שטח <bdi>${area.toFixed(1)}</bdi> מ"ר → להזמנה: <strong><bdi>${n}</bdi> ${o.isArea ? 'מ"ר' : 'לוחות'}</strong>` : 'הזינו אורך ורוחב';
      return n;
    };
    qc.addEventListener('input', calc); calc();
    $('[data-qc-apply]').addEventListener('click', () => {
      const n = calc(); if (!n) return;
      qty.value = Math.min(999, n); paint();
      toast(`הכמות עודכנה ל-<bdi>${qty.value}</bdi>`);
      qty.focus({ preventScroll: true });
      $('#pd-form').scrollIntoView({ block: 'center', behavior: reduceMotion() ? 'auto' : 'smooth' });
    });
  }

  // ---- add all (cross-sell) ----
  $('[data-add-all]')?.addEventListener('click', e => addMany(e.currentTarget.dataset.addAll.split(','), e.currentTarget, 'כל המוצרים המשלימים נוספו לסל'));

  // ---- reviews form ----
  const rvOpen = $('[data-rv-open]'), rvForm = $('#rv-form');
  rvOpen.addEventListener('click', () => {
    const on = rvForm.hidden; rvForm.hidden = !on; rvOpen.setAttribute('aria-expanded', on);
    if (on) $('#rv-name').focus();
  });
  rvForm.addEventListener('submit', e => {
    e.preventDefault();
    const n = $('#rv-name'), t = $('#rv-text');
    fieldErr(n, n.value.trim() ? '' : 'נא להזין שם');
    fieldErr(t, t.value.trim().length >= 10 ? '' : 'כתבו לפחות כמה מילים (10 תווים ומעלה)');
    if (!n.value.trim()) return n.focus();
    if (t.value.trim().length < 10) return t.focus();
    const msg = $('[data-rv-msg]');
    msg.className = 'form-alert fld-full is-ok';
    msg.textContent = 'תודה! הביקורת תתפרסם אחרי בדיקה קצרה (בדמו היא לא נשמרת).';
    rvForm.querySelector('button[type="submit"]').disabled = true;
  });

  // ---- recently viewed ----
  const prev = read(RECENT_KEY, []).filter(id => id !== p.id && getProduct(id));
  if (prev.length) {
    $('[data-recent-grid]').innerHTML = prev.slice(0, 4).map(id => productCard(getProduct(id))).join('');
    $('[data-recent]').hidden = false;
  }
  write(RECENT_KEY, [p.id, ...prev].slice(0, 12));
}

/* ==========================================================================
   6. חיפוש
   ========================================================================== */
const POPULAR = ['דק איפאה', 'קורת אורן', 'דיקט', 'פרגולה', 'שמן לדק', 'עצי הסקה'];

function smartSearch(q) {
  let r = searchAll(q);
  const toks = q.trim().split(/\s+/).filter(t => t.length > 1);
  if (!r.products.length && toks.length > 1) {
    const hit = p => toks.every(t => [p.name, p.sub, p.woodType, p.shortDesc, p.dims, catLabel(p)].some(v => (v || '').includes(t)));
    r = { ...r, products: CATALOG.filter(hit) };
    if (!r.products.length) r.products = CATALOG.filter(p => toks.some(t => [p.name, p.sub, p.woodType].some(v => (v || '').includes(t))));
  }
  return r;
}

function renderSearch() {
  const q = (param('q') || '').trim();
  const r = q ? smartSearch(q) : { products: [], guides: [], categories: [] };
  const n = r.products.length;
  if (q) document.title = `"${q}" — תוצאות חיפוש | עץ מרקט`;
  root.innerHTML = `
    <section class="page-head" aria-labelledby="page-title">
      <div class="container page-head-in">
        <div class="page-head-text">
          ${crumbs([{ label: 'חיפוש' }])}
          <h1 class="page-title" id="page-title">${q ? (n || r.guides.length ? `<bdi>${n}</bdi> תוצאות עבור "${esc(q)}"` : `לא מצאנו תוצאות עבור "${esc(q)}"`) : 'מה מחפשים?'}</h1>
          <form class="sp-form" action="${url.search()}" method="get" role="search">
            <label class="sr-only" for="sp-q">חיפוש מוצרים, קטגוריות ומדריכים</label>
            <div class="sp-field">
              <input class="input" id="sp-q" name="q" type="search" value="${esc(q)}" placeholder="למשל: דק איפאה, קורת אורן, דיקט" autocomplete="off" role="combobox" aria-autocomplete="list" aria-expanded="false" aria-controls="sp-suggest">
              <div class="suggest" id="sp-suggest" role="listbox" aria-label="הצעות חיפוש" hidden></div>
            </div>
            <button class="btn btn-primary" type="submit">${icon('search')} חיפוש</button>
          </form>
          ${r.categories.length ? `<div class="cluster sp-cats"><span class="note">קטגוריות:</span>${r.categories.map(c => `<a class="chip-link" href="${url.category(c.id)}">${c.name}</a>`).join('')}</div>` : ''}
        </div>
      </div>
    </section>
    ${n ? `
    <section class="section-sm" aria-labelledby="sp-prod-title">
      <div class="container">
        <h2 class="sr-only" id="sp-prod-title">מוצרים</h2>
        <div data-listing></div>
      </div>
    </section>` : ''}
    ${r.guides.length ? `
    <section class="section-sm" aria-labelledby="sp-g-title">
      <div class="container">
        <h2 class="sec-title" id="sp-g-title">מדריכים תואמים</h2>
        <ul class="guide-grid guide-grid-wrap">${r.guides.slice(0, 3).map((g, i) => guideCard(g, i, true)).join('')}</ul>
      </div>
    </section>` : ''}
    ${!n ? `
    <section class="section-sm" aria-labelledby="sp-pop-title">
      <div class="container stack-lg">
        <div>
          <h2 class="sec-title" id="sp-pop-title">${q ? 'אולי חיפשתם' : 'חיפושים פופולריים'}</h2>
          <div class="cluster">${POPULAR.map(s => `<a class="chip-link" href="${url.search(s)}">${s}</a>`).join('')}</div>
        </div>
        <div>
          <h2 class="sec-title">הנמכרים ביותר</h2>
          <div class="p-grid p-grid-wrap">${PRODUCTS.slice(0, 4).map(productCard).join('')}</div>
        </div>
        <div>
          <h2 class="sec-title">או עברו לפי קטגוריה</h2>
          <ul class="cat-grid cat-grid-wrap">${CATEGORIES.map(catCard).join('')}</ul>
        </div>
        ${q ? `<div class="mid-banner">${MID_BANNER.replace('לא בטוחים מה צריך? נגר שלנו ייעץ — חינם', 'לא מצאתם? דברו איתנו — נמצא לכם')}</div>` : ''}
      </div>
    </section>` : ''}`;

  if (n) listing($('[data-listing]'), { base: r.products, keepParams: ['q'] });
  initSearchBox();
}

function initSearchBox() {
  const input = $('#sp-q'), box = $('#sp-suggest');
  let idx = -1;
  const hl = (label, q) => esc(label).replace(esc(q), m => `<mark>${m}</mark>`);
  const render = () => {
    const q = input.value.trim(); idx = -1;
    input.removeAttribute('aria-activedescendant');
    if (q.length < 2) { box.hidden = true; input.setAttribute('aria-expanded', 'false'); return; }
    const hits = searchLocal(q);
    box.innerHTML = hits.length
      ? hits.map((h, i) => `<a role="option" id="sps-${i}" href="${h.href}" aria-selected="false"><span>${hl(h.label, q)}</span><small>${h.type}</small></a>`).join('')
      : `<p class="sg-empty">אין הצעות ל"${esc(q)}" — לחצו "חיפוש" לחיפוש מלא.</p>`;
    box.hidden = false; input.setAttribute('aria-expanded', 'true');
  };
  input.addEventListener('input', render);
  input.addEventListener('keydown', e => {
    const opts = $$('a', box);
    if (e.key === 'Escape') { box.hidden = true; input.setAttribute('aria-expanded', 'false'); return; }
    if (box.hidden || !opts.length) return;
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      idx = (idx + (e.key === 'ArrowDown' ? 1 : -1) + opts.length) % opts.length;
      opts.forEach((o, i) => o.setAttribute('aria-selected', i === idx));
      input.setAttribute('aria-activedescendant', opts[idx].id);
    } else if (e.key === 'Enter' && idx >= 0) { e.preventDefault(); location.href = opts[idx].href; }
  });
  document.addEventListener('click', e => { if (!e.target.closest('.sp-field')) { box.hidden = true; input.setAttribute('aria-expanded', 'false'); } });
  if (!param('q')) input.focus();
}

/* ==========================================================================
   7. מועדפים
   ========================================================================== */
function renderWishlist() {
  const shared = (param('ids') || '').split(',').filter(id => getProduct(id));
  const draw = () => {
    const ids = wishlist.ids().filter(id => getProduct(id));
    const list = ids.map(getProduct);
    const total = list.reduce((s, p) => s + p.price, 0);
    const sharedNew = shared.filter(id => !wishlist.has(id));
    root.innerHTML = `
      <section class="page-head" aria-labelledby="page-title">
        <div class="container page-head-in">
          <div class="page-head-text">
            ${crumbs([{ label: 'המועדפים שלי' }])}
            <h1 class="page-title" id="page-title">המועדפים שלי</h1>
            <p class="page-intro">${list.length ? `${plural(list.length, 'מוצר אחד שמור', 'מוצרים שמורים')} — מוכנים להזמנה כשתרצו.` : 'שומרים מוצרים בלחיצה על הלב, וחוזרים אליהם מתי שנוח.'}</p>
          </div>
        </div>
      </section>
      ${shared.length ? `
      <section class="section-sm" aria-labelledby="sh-title">
        <div class="container">
          <div class="panel panel-tint stack">
            <h2 class="h3" id="sh-title">רשימה ששיתפו איתכם (${shared.length})</h2>
            <div class="p-grid p-grid-wrap">${shared.map(id => productCard(getProduct(id))).join('')}</div>
            <div class="cta-row">${sharedNew.length ? `<button class="btn btn-primary" type="button" data-save-shared>שמירת ${sharedNew.length} המוצרים במועדפים שלי</button>` : '<p class="note">כל המוצרים מהרשימה כבר שמורים אצלכם.</p>'}<button class="btn btn-ghost" type="button" data-add-shared>הוספת הכל לסל</button></div>
          </div>
        </div>
      </section>` : ''}
      <section class="section-sm" aria-label="מוצרים שמורים">
        <div class="container">
          ${list.length ? `
          <div class="w-bar">
            <p class="sort-count"><strong><bdi>${list.length}</bdi></strong> מוצרים · סה״כ <bdi>${fmt(total)}</bdi></p>
            <div class="cta-row">
              <button class="btn btn-ghost" type="button" data-share>${icon('arrow')} שיתוף הרשימה</button>
              <button class="btn btn-primary" type="button" data-add-all-wish>הוספת הכל לסל</button>
            </div>
          </div>
          <div class="p-grid p-grid-3 p-grid-wrap w-grid">${list.map((p, i) => productCard(p, i)).join('')}</div>` : `
          <div class="empty-state">
            <span class="empty-ico">${icon('heart')}</span>
            <p class="h3">עוד לא שמרתם מוצרים</p>
            <p>לחצו על הלב בכל מוצר כדי לשמור אותו כאן — למשל כשמשווים בין סוגי דק או אוספים רשימה לפרויקט.</p>
            <div class="cta-row"><a class="btn btn-primary" href="${url.shop()}">לכל המוצרים</a><a class="btn btn-ghost" href="${url.category('sale')}">למבצעים</a></div>
          </div>`}
        </div>
      </section>`;
    // remove buttons inside each card
    $$('.w-grid .p-card').forEach(card => {
      const id = $('[data-wish]', card).dataset.wish;
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'w-remove'; b.dataset.wRemove = id;
      b.innerHTML = `${icon('trash')} הסרה מהרשימה`;
      b.setAttribute('aria-label', `הסרת ${getProduct(id).name} מהמועדפים`);
      $('.p-body', card).append(b);
    });
  };
  draw();
  wishlist.onChange(() => { const f = document.activeElement?.dataset?.wRemove; draw(); if (f) $('.w-grid .p-name a, h1')?.focus(); });
  root.addEventListener('click', async e => {
    const rm = e.target.closest('[data-w-remove]');
    if (rm) {
      const p = getProduct(rm.dataset.wRemove);
      wishlist.remove(p.id);
      toast(`<strong>${p.name}</strong> הוסר מהמועדפים`, { label: 'ביטול', fn: () => wishlist.toggle(p.id) });
    }
    if (e.target.closest('[data-add-all-wish]')) addMany(wishlist.ids(), e.target.closest('button'), 'כל המועדפים נוספו לסל');
    if (e.target.closest('[data-add-shared]')) addMany(shared, e.target.closest('button'), 'המוצרים מהרשימה נוספו לסל');
    if (e.target.closest('[data-save-shared]')) { shared.forEach(id => { if (!wishlist.has(id)) wishlist.toggle(id); }); toast('המוצרים נשמרו במועדפים שלכם'); }
    if (e.target.closest('[data-share]')) {
      const link = `${location.origin}${location.pathname}?ids=${wishlist.ids().join(',')}`;
      try {
        if (navigator.share) { await navigator.share({ title: 'רשימת המועדפים שלי — עץ מרקט', url: link }); return; }
        await navigator.clipboard.writeText(link);
        toast('הקישור לרשימה הועתק — אפשר להדביק ב-WhatsApp או במייל');
      } catch (err) {
        if (err?.name !== 'AbortError') window.prompt('העתיקו את הקישור לרשימה:', link);
      }
    }
  });
}

/* ---------- dispatch ---------- */
const RENDER = { shop: renderShop, category: renderCategory, product: renderProduct, search: renderSearch, wishlist: renderWishlist };
try {
  RENDER[page]?.();
} finally {
  root.removeAttribute('aria-busy');
}
