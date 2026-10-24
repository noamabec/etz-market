/* ==========================================================================
   עץ מרקט — נתוני דוגמה (SAMPLE DATA)
   כל השמות, המחירים, הכמויות, הטקסטים והביקורות כאן הם דוגמה בלבד, לבניית העיצוב.
   בפלטפורמה (Shopify / WooCommerce) הנתונים יגיעו מה-API — ראו js/commerce.js.

   מבנה (לבונים):
     CATEGORIES ............ 8 הקטגוריות (id, name, short, count, tone, subs, intro)
     CATALOG ............... כל המוצרים (~60). שדות: ראו mk() למטה
     PRODUCTS .............. 8 הנמכרים ביותר (תת-קבוצה של CATALOG, לדף הבית)
     getProduct(id) · productsByCategory(id, sub?) · productImage(p) · productTexture(p)
     categoryById(id) · catLabel(p) · WOOD_TYPES · USES
     GUIDES · GUIDE_CATS · guideById(id) · guideImage(g)
     FAQ (6 קטגוריות) · SHIPPING_ZONES · WEIGHT_TIERS · CUT_PRICES · SHOP_RULES
     STORE (טלפון, וואטסאפ...) · BRANCHES · DECK_TYPES · BADGES · TONES · PAGES (מפתחות ישנים)
   ========================================================================== */

/** גווני עץ ל-placeholders (לא צבעי ממשק) */
export const TONES = {
  pine: '#D9B98C',
  oak: '#B88A5A',
  ipe: '#7A4A2E',
  teak: '#9C6B3F',
  board: '#C9C2B4',
  walnut: '#5E4030',
  ash: '#E2D3B8',
  char: '#4A3B30',
};

export const CATEGORIES = [
  { id: 'construction', name: 'עץ בנייה וקונסטרוקציה', short: 'עץ בנייה', count: 46, tone: 'pine',
    subs: ['קורות אורן', 'עץ מוקצע', 'פלנקות', 'עץ לגגות', 'עץ לטפסנות'],
    intro: 'קורות, פלנקות ועץ מוקצע לבנייה, לגגות ולטפסנות — מיובשים, ישרים ובמחירי מחסן. משלוח עם מנוף ישירות לאתר העבודה.' },
  { id: 'decking', name: 'עצי דק וחוץ', short: 'דקים וחוץ', count: 38, tone: 'ipe',
    subs: ['דק איפאה', 'דק במבוק', 'דק סינטטי', 'אורן מוקצה לחץ', 'תת-מבנה'],
    intro: 'איפאה, במבוק, סינטטי ואורן מוקצה לחץ — כל מה שצריך לדק שמחזיק שנים, כולל תת-מבנה, ברגים ושמן.' },
  { id: 'pergolas', name: 'פרגולות וגדרות', short: 'פרגולות וגדרות', count: 31, tone: 'teak',
    subs: ['ערכות פרגולה', 'עמודים', 'מרישים', 'לוחות גדר', 'הצללה'],
    intro: 'ערכות פרגולה מוכנות להרכבה, עמודים, מרישים ולוחות גדר מעץ מוקצה לחץ. אפשר גם עם הרכבה של הצוות שלנו.' },
  { id: 'boards', name: 'לוחות', short: 'לוחות', count: 42, tone: 'board',
    subs: ['דיקט', 'MDF', 'OSB', "סנדוויץ'", 'לבידים'],
    intro: "דיקט, MDF, OSB, סנדוויץ' ולבידים בכל העוביים — וחיתוך לוחות לפי מידה במסור פאנלים מדויק." },
  { id: 'hardwood', name: 'עץ מלא לנגרות', short: 'עץ מלא', count: 27, tone: 'walnut',
    subs: ['אלון', 'אגוז', 'בוק', 'טיק', 'מייפל'],
    intro: 'עץ מלא מיובש בתנור לנגרות ולרהיטים: אלון, אגוז, בוק, טיק ומייפל. נבחר לוח-לוח, נמכר למטר רץ.' },
  { id: 'firewood', name: 'עצי הסקה ולגריל', short: 'הסקה וגריל', count: 14, tone: 'char',
    subs: ['עצי הסקה מיובשים', 'עצים לגריל ולעישון', 'פחם'],
    intro: 'עצי הסקה מיובשים שבוערים נקי, עצים לעישון ולגריל ופחם איכותי — בשק או במשטח, עם משלוח עד הבית.' },
  { id: 'accessories', name: 'אביזרים, שמנים וכלים', short: 'אביזרים ושמנים', count: 39, tone: 'oak',
    subs: ['ברגים ומחברים', 'שמנים ולכות', 'צבעים לעץ', 'כלים'],
    intro: 'ברגים ומחברים, שמנים ולכות, צבעים וכלים — כל מה שמשלים את העץ לפרויקט גמור.' },
  { id: 'sale', name: 'מבצעים', short: 'מבצעים', count: 13, tone: 'ash',
    subs: ['מבצעי פרגולות', 'מבצעי דקים', 'סוף סדרה'],
    intro: 'מבצעי העונה וסופי סדרה — אותו עץ, במחיר נמוך יותר, עד גמר המלאי.' },
];

export const BADGES = {
  sale: 'מבצע',
  new: 'חדש',
  best: 'נמכר ביותר',
  cut: 'ניתן לחיתוך',
};

/** ערכי סינון (עמוד החנות) */
export const WOOD_TYPES = ['אורן', 'איפאה', 'אלון', 'אגוז', 'בוק', 'טיק', 'במבוק', 'סינטטי'];
export const USES = ['פנים', 'חוץ', 'בנייה'];

/* ---------- ברירות מחדל לכל קטגוריה (טקסט ומפרט), דוגמה ---------- */
const CAT_DEFAULTS = {
  construction: {
    durability: 'בינונית — לשימוש פנים או מתחת לגג; לחוץ: מוקצה לחץ',
    care: 'אחסון יבש ומוגבה מהקרקע; ספיגה בחומר נגד מזיקים',
    density: 'כ-500 ק"ג/מ"ק',
    related: ['deck-screws-ss', 'pergola-brackets', 'hand-saw', 'deck-oil-4l'],
    long: p => [
      `${p.name} נחתך ממנסרות שעובדות איתנו שנים, מיובש בתנור לרטיבות של 15%–18% ומגיע ישר ונקי. זה העץ שקבלנים ובונים פרטיים לוקחים כשצריך קונסטרוקציה שמחזיקה.`,
      'מתאים לשלד של גגות רעפים, קירות עץ, מחיצות, תת-מבנה ופרויקטים בחצר. בשימוש בחוץ — בחרו בגרסה המוקצה בלחץ או ספגו בחומר מגן אחרי החיתוך.',
      'אפשר להזמין חתוך לפי מידה: מסמנים "חיתוך לפי מידה", מזינים אורך וכמות, ונציג מאשר איתכם בטלפון לפני שהמסור מתחיל לעבוד.',
    ],
  },
  decking: {
    durability: 'גבוהה — לשימוש חוץ, חשיפה מלאה לשמש ולגשם',
    care: 'שמן לדק פעם בשנה (באביב); ניקוי במים וסבון עדין',
    density: 'משתנה לפי הזן',
    related: ['deck-screws-ss', 'hidden-clips', 'deck-oil-4l', 'deck-joist-alu'],
    long: p => [
      `${p.name} מיועד לדקים בחצר, במרפסת ועל הגג. הלוחות מגיעים ממוינים לפי אורך, עם פאזה בקצוות ומשטח נגד החלקה.`,
      'לדק יציב צריך תת-מבנה במרווח של 40–50 ס"מ, מרווח של 5 מ"מ בין הלוחות לניקוז, וברגי נירוסטה או קליפסים נסתרים. במחשבון הדק שלנו תקבלו את כל הכמויות.',
      'תחזוקה: שמן ייעודי לדק פעם בשנה שומר על הגוון ועל העץ. בלי שמן — העץ יאפיר עם הזמן, וזה טבעי לגמרי.',
    ],
  },
  pergolas: {
    durability: 'גבוהה — אורן מוקצה לחץ בדרגת חוץ (UC3–UC4)',
    care: 'שמן או צבע לחוץ אחרי ההרכבה, חידוש כל 1–2 שנים',
    density: 'כ-520 ק"ג/מ"ק',
    related: ['pergola-brackets', 'deck-screws-ss', 'deck-oil-4l', 'shade-net'],
    long: p => [
      `${p.name} עשוי מאורן מוקצה לחץ, עמיד לשמש, לגשם ולמזיקים. כל החלקים נחתכים במחסן ומגיעים מוכנים להרכבה.`,
      'מתאים לפרגולות צמודות קיר או עומדות בפני עצמן, לגדרות, למסתורים ולהצללה בחצר ובמרפסת. צריכים מידה אחרת? נחתוך לפי התוכנית שלכם.',
      'אפשר להוסיף הרכבה של הצוות שלנו (באזורים נבחרים). נציג יתקשר תוך 24 שעות לתאם מידות, מועד ומקום פריקה.',
    ],
  },
  boards: {
    durability: 'לשימוש פנים; גרסאות עמידות מים — גם לחדרים רטובים',
    care: 'אחסון שטוח ויבש; איטום קנטים אחרי חיתוך',
    density: 'משתנה לפי סוג הלוח',
    related: ['varnish-water', 'sanding-kit', 'hand-saw', 'wood-stain-walnut'],
    long: p => [
      `${p.name} מגיע בלוחות מלאים במידות סטנדרטיות, שטוחים וללא פגמים. מתאים לרהיטים, ארונות, מדפים, חיפויים ועבודות במה.`,
      'חותכים לכם לפי מידה במסור פאנלים, בדיוק של מילימטר, כך שמגיעים הביתה חלקים מוכנים להרכבה. חיתוך חינם בהזמנה מעל 1,500 ₪.',
      'טיפ: לפני צבע או לכה — שיוף קל בנייר 180 וניקוי אבק. בקנטים חשופים כדאי להדביק פס קנט או לאטום.',
    ],
  },
  hardwood: {
    durability: 'גבוהה לרהיטים ולשימוש פנים',
    care: 'שמן לרהיטים או לכה; להרחיק ממקור חום ישיר',
    density: 'משתנה לפי הזן',
    related: ['oil-teak-1l', 'sanding-kit', 'varnish-water', 'hand-saw'],
    long: p => [
      `${p.name} מיובש בתנור לרטיבות של 8%–10% — מוכן לנגרות בלי הפתעות. כל לוח נבחר ידנית במחסן, ישר ובלי סדקים.`,
      'מתאים לשולחנות, מדפים, משטחי עבודה, דלתות ורהיטים בהזמנה. נמכר למטר רץ — אפשר לבקש רוחב מסוים ונבחר בשבילכם.',
      'בגימור: שמן מעמיק את הגוון ומשאיר מגע של עץ; לכה מים שומרת על גוון בהיר ועמידה יותר לכתמים.',
    ],
  },
  firewood: {
    durability: '—',
    care: 'אחסון מקורה ומאוורר, מוגבה מהקרקע',
    density: 'עץ קשה — בעירה ארוכה',
    related: ['kindling', 'charcoal-10', 'smoking-chunks-oak', 'firewood-bag'],
    long: p => [
      `${p.name} מיובש לרטיבות של פחות מ-20%, כך שהוא נדלק מהר, בוער נקי ולא מעשן את הבית.`,
      'מתאים לקמין, לתנור עצים, לפויקה ולמנגל. משטח מגיע עטוף ונפרק עם מנוף ליד הבית.',
      'הזמנה עונתית לחורף: כדאי להזמין כבר בסתיו — לקראת החורף המלאי נגמר מהר והזמני האספקה מתארכים.',
    ],
  },
  accessories: {
    durability: '—',
    care: 'לפי הוראות היצרן על האריזה',
    density: '—',
    related: ['deck-oil-4l', 'deck-screws-ss', 'sanding-kit', 'hand-saw'],
    long: p => [
      `${p.name} — נבחר על ידי הנגרים שלנו כי הוא עובד טוב עם העץ שאנחנו מוכרים. אותו מוצר שאנחנו משתמשים בו במחסן.`,
      'לא בטוחים מה מתאים לפרויקט? התקשרו או כתבו ב-WhatsApp — נגר שלנו ימליץ על הכמות והסוג הנכונים.',
    ],
  },
};

/* ---------- עזרי וריאציות ---------- */
const lengths = (list, base, unitPrice) => ({
  name: 'אורך',
  options: list.map(m => ({ label: `${m} מ׳`, delta: Math.round(unitPrice * (m - base)) })),
});
const opts = (name, pairs) => ({ name, options: pairs.map(([label, delta = 0]) => ({ label, delta })) });

/** מפעל מוצר — ממלא שדות חסרים מברירת המחדל של הקטגוריה */
function mk(p) {
  const d = CAT_DEFAULTS[p.cat];
  const photo = PHOTO_IDS.includes(p.id);
  const full = {
    sku: `ETZ-${p.cat.slice(0, 3).toUpperCase()}-${(p.id.length * 37 + p.price) % 9000 + 1000}`,
    inStock: true,
    cuttable: false,
    variants: [],
    upsell: undefined,
    ...p,
  };
  full.img = photo ? `assets/img/p-${p.id}.webp` : undefined;
  full.imgAlt = photo ? `assets/img/t-${p.id}.webp` : undefined;
  full.longDesc = p.longDesc || d.long(full);
  full.related = (p.related || d.related).filter(id => id !== p.id);
  full.specs = p.specs || [
    ['זן / חומר', full.woodType],
    ['מקור', full.origin || 'ייבוא ישיר'],
    ['צפיפות', full.density || d.density],
    ['מידות זמינות', full.dims],
    ['שימוש', full.use],
    ['עמידות', full.durability || d.durability],
    ['טיפול מומלץ', full.care || d.care],
    ['משקל משוער', full.weight || '—'],
    ['מק"ט', full.sku],
  ];
  return full;
}

/** מוצרים שיש להם צילום אמיתי: assets/img/p-<id>.webp (+ מרקם t-<id>.webp) */
const PHOTO_IDS = ['ipe-deck-21', 'pine-beam-5x10', 'pergola-kit-3x4', 'plywood-18', 'bamboo-deck', 'oak-board-27', 'deck-oil-4l', 'firewood-pallet'];

/* ==========================================================================
   הקטלוג המלא (דוגמה)
   שדות: id, name, cat (id קטגוריה), sub, dims, price, unit, was?, badge?, rating, reviews,
   tone, cuttable, woodType, use, inStock, sku, shortDesc, longDesc[], specs[[label,value]],
   variants[{name, options[{label, delta}]}], related[ids], upsell(id), img?, imgAlt?
   catLabel — טקסט הקטגוריה שמוצג בקוביית המוצר (נשמר כמו בדף הבית ל-8 הנמכרים)
   ========================================================================== */
export const CATALOG = [
  /* ----- עץ בנייה וקונסטרוקציה ----- */
  mk({ id: 'pine-beam-5x10', name: 'קורת אורן מייבוא', cat: 'construction', catLabel: 'עץ בנייה', sub: 'קורות אורן',
    dims: '5×10 ס"מ · 4 מ׳', price: 42, unit: 'ליחידה', badge: 'best', rating: 4.8, reviews: 312, tone: 'pine', cuttable: true,
    woodType: 'אורן', use: 'בנייה', origin: 'פינלנד', weight: 'כ-9 ק"ג ליחידה',
    shortDesc: 'קורת אורן מיובשת בתנור, ישרה ונקייה — הבסיס של כמעט כל פרויקט בנייה. נמכרת ליחידה, ואפשר לחתוך לפי מידה.',
    variants: [lengths([3, 4, 5, 6], 4, 10.5)], upsell: 'pine-beam-7x15', related: ['pine-beam-5x15', 'deck-screws-ss', 'pergola-brackets', 'hand-saw'] }),
  mk({ id: 'pine-beam-5x15', name: 'קורת אורן 5×15', cat: 'construction', sub: 'קורות אורן',
    dims: '5×15 ס"מ · 4 מ׳', price: 63, unit: 'ליחידה', rating: 4.7, reviews: 141, tone: 'pine', cuttable: true,
    woodType: 'אורן', use: 'בנייה', origin: 'פינלנד', weight: 'כ-13 ק"ג ליחידה',
    shortDesc: 'קורה רחבה יותר לתקרות, לגגות ולמפתחים ארוכים. מיובשת וישרה, ניתנת לחיתוך.',
    variants: [lengths([3, 4, 5, 6], 4, 15.75)], upsell: 'glulam-beam' }),
  mk({ id: 'pine-beam-7x15', name: 'קורת אורן מוקצה לחץ 7×15', cat: 'construction', sub: 'קורות אורן',
    dims: '7×15 ס"מ · 4–6 מ׳', price: 118, unit: 'ליחידה', rating: 4.8, reviews: 76, tone: 'teak', cuttable: true,
    woodType: 'אורן', use: 'חוץ', origin: 'שוודיה', weight: 'כ-21 ק"ג ליחידה', durability: 'גבוהה — מוקצה לחץ לשימוש חוץ',
    shortDesc: 'קורה עבה מוקצה בלחץ — לקונסטרוקציה בחוץ, לפרגולות גדולות ולמבנים שחשופים לגשם.',
    variants: [lengths([4, 5, 6], 4, 29.5)] }),
  mk({ id: 'planed-pine-2x10', name: 'עץ אורן מוקצע 2×10', cat: 'construction', sub: 'עץ מוקצע',
    dims: '20×95 מ"מ · 3 מ׳', price: 24, unit: 'ליחידה', rating: 4.6, reviews: 98, tone: 'pine', cuttable: true,
    woodType: 'אורן', use: 'פנים', origin: 'רומניה', weight: 'כ-3 ק"ג ליחידה',
    shortDesc: 'אורן מוקצע מארבעה צדדים, חלק ומוכן לצבע — לחיפויים, למדפים ולעבודות גמר.',
    variants: [lengths([2.4, 3, 4], 3, 8)] }),
  mk({ id: 'plank-25x100', name: 'פלנקת אורן 2.5×10', cat: 'construction', sub: 'פלנקות',
    dims: '25×100 מ"מ · 4 מ׳', price: 19, unit: 'ליחידה', badge: 'best', rating: 4.7, reviews: 220, tone: 'pine', cuttable: true,
    woodType: 'אורן', use: 'בנייה', origin: 'אוקראינה', weight: 'כ-5 ק"ג ליחידה',
    shortDesc: 'פלנקה גולמית לשימוש כללי באתר — רצפות זמניות, משטחים, ארגזים ותמיכות.',
    variants: [lengths([3, 4, 5], 4, 4.75)] }),
  mk({ id: 'roof-batten-5x7', name: 'מרישי גג אורן 5×7', cat: 'construction', sub: 'עץ לגגות',
    dims: '5×7 ס"מ · 4 מ׳', price: 31, unit: 'ליחידה', rating: 4.6, reviews: 64, tone: 'oak', cuttable: true,
    woodType: 'אורן', use: 'בנייה', origin: 'פינלנד', weight: 'כ-6 ק"ג ליחידה',
    shortDesc: 'מרישים לגגות רעפים ולשלד גג — ספוגים נגד מזיקים, בחתך אחיד לאורך כל הקורה.',
    variants: [lengths([3, 4, 5], 4, 7.75)] }),
  mk({ id: 'formwork-board', name: 'לוח טפסנות 2.5×15', cat: 'construction', sub: 'עץ לטפסנות',
    dims: '25×150 מ"מ · 4 מ׳', price: 22, unit: 'ליחידה', badge: 'new', rating: 4.5, reviews: 39, tone: 'ash',
    woodType: 'אורן', use: 'בנייה', origin: 'אוקראינה', weight: 'כ-7 ק"ג ליחידה',
    shortDesc: 'לוח טפסנות זול ועמיד ליציקות בטון, לתבניות ולשימוש חוזר באתר.',
    variants: [opts('כמות', [['יחידה'], ['חבילה של 20', 380]])] }),
  mk({ id: 'glulam-beam', name: 'קורת למינציה (גלולם)', cat: 'construction', sub: 'קורות אורן',
    dims: '10×24 ס"מ · עד 8 מ׳', price: 690, unit: 'ליחידה', rating: 4.9, reviews: 22, tone: 'oak', cuttable: true,
    woodType: 'אשוח', use: 'בנייה', origin: 'אוסטריה', weight: 'כ-75 ק"ג ל-6 מ׳', durability: 'גבוהה מאוד — יציבות מבנית ללא עיוות',
    shortDesc: 'קורה מודבקת משכבות — חזקה ויציבה למפתחים גדולים, לתקרות חשופות ולפרגולות בלי עמוד אמצעי.',
    variants: [lengths([4, 6, 8], 6, 115)] }),

  /* ----- עצי דק וחוץ ----- */
  mk({ id: 'ipe-deck-21', name: 'דק איפאה פרימיום', cat: 'decking', catLabel: 'עצי דק וחוץ', sub: 'דק איפאה',
    dims: '21×145 מ"מ · אורכים 1.8–4.9 מ׳', price: 389, unit: 'למ"ר', was: 449, badge: 'sale', rating: 4.9, reviews: 128, tone: 'ipe', cuttable: true,
    woodType: 'איפאה', use: 'חוץ', origin: 'ברזיל (FSC)', density: 'כ-1,050 ק"ג/מ"ק', weight: 'כ-23 ק"ג למ"ר',
    durability: 'גבוהה מאוד — דרגת עמידות 1, 25+ שנה בחוץ',
    shortDesc: 'העץ הקשה והעמיד ביותר לדק: גוון חום-אגוז עמוק, כמעט בלי תחזוקה, ומחזיק עשרות שנים בשמש ובגשם.',
    longDesc: [
      'איפאה היא עץ טרופי קשה במיוחד — כמעט פי שניים מאלון. היא לא נרקבת, לא מושכת טרמיטים ועמידה באש. לכן היא הבחירה של מלונות, טיילות ומי שבונה דק פעם אחת.',
      'הלוחות שלנו בעובי 21 מ"מ ורוחב 145 מ"מ, מוקצעים עם פאזה ומשטח חלק. מתאימים לחצר, למרפסת, לגג ולסביב בריכה. מומלץ תת-מבנה כל 40 ס"מ וברגי נירוסטה A2 או קליפסים נסתרים.',
      'תחזוקה: שמן לדק פעם בשנה שומר על הגוון החם. בלי שמן — האיפאה תאפיר לגוון כסוף ואצילי, בלי לאבד מהחוזק.',
    ],
    variants: [opts('עובי', [['19 מ"מ', -40], ['21 מ"מ', 0], ['25 מ"מ', 70]]), opts('אורך', [['1.8–2.4 מ׳'], ['2.7–3.6 מ׳'], ['3.9–4.9 מ׳', 25]])],
    upsell: undefined, related: ['deck-screws-ss', 'hidden-clips', 'deck-oil-4l', 'deck-joist-alu'] }),
  mk({ id: 'bamboo-deck', name: 'דק במבוק מעובה', cat: 'decking', catLabel: 'עצי דק וחוץ', sub: 'דק במבוק',
    dims: '20×137 מ"מ · 1.85 מ׳', price: 329, unit: 'למ"ר', badge: 'new', rating: 4.6, reviews: 41, tone: 'oak', cuttable: true,
    woodType: 'במבוק', use: 'חוץ', origin: 'סין (FSC)', density: 'כ-1,150 ק"ג/מ"ק', weight: 'כ-24 ק"ג למ"ר',
    durability: 'גבוהה — דרגת עמידות 1 (במבוק מעובה בחום)',
    shortDesc: 'במבוק דחוס ומעובה בחום — קשה כמו עץ טרופי, יציב ואחיד בגוון, וגדל מחדש תוך 5 שנים.',
    variants: [opts('גוון', [['קפה'], ['טבעי'], ['אפור עשן', 15]])], upsell: 'ipe-deck-21' }),
  mk({ id: 'ipe-deck-19-narrow', name: 'דק איפאה צר 19×90', cat: 'decking', sub: 'דק איפאה',
    dims: '19×90 מ"מ · אורכים 1.5–3.9 מ׳', price: 349, unit: 'למ"ר', rating: 4.8, reviews: 57, tone: 'ipe', cuttable: true,
    woodType: 'איפאה', use: 'חוץ', origin: 'ברזיל (FSC)', density: 'כ-1,050 ק"ג/מ"ק', weight: 'כ-21 ק"ג למ"ר',
    shortDesc: 'איפאה ברוחב צר למראה עדין ומודרני — מתאים למרפסות ולמשטחים קטנים.',
    upsell: 'ipe-deck-21' }),
  mk({ id: 'composite-deck-grey', name: 'דק סינטטי WPC — אפור בזלת', cat: 'decking', sub: 'דק סינטטי',
    dims: '23×140 מ"מ · 2.9 מ׳', price: 279, unit: 'למ"ר', badge: 'new', rating: 4.5, reviews: 33, tone: 'board',
    woodType: 'סינטטי', use: 'חוץ', origin: 'גרמניה', density: '—', weight: 'כ-19 ק"ג למ"ר',
    durability: 'גבוהה — לא דורש שמן, עמיד ל-UV', care: 'שטיפה במים פעם בעונה',
    shortDesc: 'דק מחומר מרוכב (עץ ופולימר) — בלי שמן, בלי קיסמים, בגוון שלא דוהה.',
    variants: [opts('גוון', [['אפור בזלת'], ['חום שוקולד'], ['טיק', 20]])], upsell: 'composite-deck-teak' }),
  mk({ id: 'composite-deck-teak', name: 'דק סינטטי פרימיום — גוון טיק', cat: 'decking', sub: 'דק סינטטי',
    dims: '23×145 מ"מ · 3.6 מ׳ · שכבת הגנה', price: 299, unit: 'למ"ר', was: 339, badge: 'sale', rating: 4.7, reviews: 48, tone: 'teak',
    woodType: 'סינטטי', use: 'חוץ', origin: 'גרמניה', density: '—', weight: 'כ-20 ק"ג למ"ר',
    durability: 'גבוהה מאוד — מעטפת מגן נגד כתמים ודהייה', care: 'שטיפה במים פעם בעונה',
    shortDesc: 'דק מרוכב עם מעטפת מגן ומרקם עץ אמיתי — המראה של טיק בלי תחזוקה.' }),
  mk({ id: 'pine-deck-treated', name: 'דק אורן מוקצה לחץ', cat: 'decking', sub: 'אורן מוקצה לחץ',
    dims: '27×120 מ"מ · 3–4.8 מ׳', price: 149, unit: 'למ"ר', badge: 'best', rating: 4.5, reviews: 176, tone: 'pine', cuttable: true,
    woodType: 'אורן', use: 'חוץ', origin: 'שוודיה', density: 'כ-520 ק"ג/מ"ק', weight: 'כ-14 ק"ג למ"ר',
    durability: 'בינונית-גבוהה — 10–15 שנה עם שמן', care: 'שמן לדק פעם בשנה',
    shortDesc: 'הדק המשתלם ביותר: אורן נורדי מוקצה בלחץ נגד ריקבון ומזיקים, עם פסים נגד החלקה.',
    upsell: 'bamboo-deck' }),
  mk({ id: 'deck-joist-alu', name: 'קורת תת-מבנה אלומיניום', cat: 'decking', sub: 'תת-מבנה',
    dims: '40×60 מ"מ · 4 מ׳', price: 145, unit: 'ליחידה', rating: 4.8, reviews: 29, tone: 'board',
    woodType: 'אלומיניום', use: 'חוץ', origin: 'ישראל', density: '—', weight: 'כ-5 ק"ג ליחידה',
    durability: 'גבוהה מאוד — לא נרקב ולא מתעקם', care: 'ללא',
    shortDesc: 'תת-מבנה מאלומיניום לדקים על גגות ומרפסות — קל, ישר ולא נרקב לעולם.' }),
  mk({ id: 'deck-joist-pine', name: 'קורת תת-מבנה אורן 5×7', cat: 'decking', sub: 'תת-מבנה',
    dims: '5×7 ס"מ · 4 מ׳ · מוקצה לחץ', price: 39, unit: 'ליחידה', rating: 4.6, reviews: 88, tone: 'pine', cuttable: true,
    woodType: 'אורן', use: 'חוץ', origin: 'שוודיה', weight: 'כ-7 ק"ג ליחידה',
    shortDesc: 'קורת תת-מבנה מאורן מוקצה לחץ — לדקים על קרקע ועל משטח בטון.',
    upsell: 'deck-joist-alu' }),

  /* ----- פרגולות וגדרות ----- */
  mk({ id: 'pergola-kit-3x4', name: 'ערכת פרגולה אורן', cat: 'pergolas', catLabel: 'פרגולות וגדרות', sub: 'ערכות פרגולה',
    dims: '3×4 מ׳ · כולל ברגים', price: 4290, unit: 'לערכה', was: 4890, badge: 'sale', rating: 4.8, reviews: 64, tone: 'teak',
    woodType: 'אורן', use: 'חוץ', origin: 'שוודיה', weight: 'כ-320 ק"ג', durability: 'גבוהה — אורן מוקצה לחץ UC4',
    shortDesc: 'ערכה שלמה לפרגולה 3×4 מ׳: עמודים 12×12, מרישים וקורות הצללה — חתוכים, ממוספרים ומוכנים להרכבה.',
    longDesc: [
      'הערכה כוללת 4 עמודים 12×12 ס"מ, 2 קורות ראשיות 7×20, 9 קורות הצללה 5×15, פרזול מגולוון, ברגים ומדריך הרכבה מצולם. כל החלקים חתוכים במחסן וממוספרים.',
      'העץ הוא אורן נורדי מוקצה בלחץ בדרגת UC4 — מתאים למגע עם קרקע ולחשיפה מלאה למזג האוויר. מומלץ שמן או צבע לחוץ אחרי ההרכבה.',
      'אפשר להוסיף הרכבה של הצוות שלנו. הערכה מגיעה עם מנוף עד החצר, ונציג מתקשר לפני כן לתאם מידות ומקום פריקה.',
    ],
    variants: [opts('הרכבה', [['ללא הרכבה'], ['כולל הרכבה', 1200]]), opts('גוון', [['טבעי'], ['חום אגוז (צבוע)', 450]])],
    upsell: 'pergola-kit-4x5', related: ['pergola-brackets', 'deck-oil-4l', 'shade-net', 'deck-screws-ss'] }),
  mk({ id: 'pergola-kit-3x3', name: 'ערכת פרגולה אורן 3×3', cat: 'pergolas', sub: 'ערכות פרגולה',
    dims: '3×3 מ׳ · כולל ברגים ופרזול', price: 3690, unit: 'לערכה', was: 4190, badge: 'sale', rating: 4.7, reviews: 51, tone: 'teak',
    woodType: 'אורן', use: 'חוץ', origin: 'שוודיה', weight: 'כ-250 ק"ג',
    shortDesc: 'ערכת פרגולה ריבועית למרפסות ולחצרות קטנות — כל החלקים חתוכים ומוכנים.',
    variants: [opts('הרכבה', [['ללא הרכבה'], ['כולל הרכבה', 1000]])], upsell: 'pergola-kit-3x4' }),
  mk({ id: 'pergola-kit-4x5', name: 'ערכת פרגולה אורן 4×5', cat: 'pergolas', sub: 'ערכות פרגולה',
    dims: '4×5 מ׳ · 6 עמודים', price: 5890, unit: 'לערכה', rating: 4.9, reviews: 27, tone: 'teak',
    woodType: 'אורן', use: 'חוץ', origin: 'שוודיה', weight: 'כ-460 ק"ג',
    shortDesc: 'ערכה גדולה לפינת אוכל או חניה מוצלת — 6 עמודים וקורות עבות למפתח רחב.',
    variants: [opts('הרכבה', [['ללא הרכבה'], ['כולל הרכבה', 1600]])] }),
  mk({ id: 'post-12x12', name: 'עמוד אורן מוקצה 12×12', cat: 'pergolas', sub: 'עמודים',
    dims: '12×12 ס"מ · 3 מ׳', price: 189, unit: 'ליחידה', rating: 4.7, reviews: 93, tone: 'pine', cuttable: true,
    woodType: 'אורן', use: 'חוץ', origin: 'שוודיה', weight: 'כ-24 ק"ג ליחידה',
    shortDesc: 'עמוד מרובע עבה לפרגולות ולגדרות — מוקצה בלחץ, ישר ועם פינות מעוגלות.',
    variants: [lengths([2.4, 3, 3.6], 3, 63)] }),
  mk({ id: 'beam-7x20', name: 'מריש פרגולה 7×20', cat: 'pergolas', sub: 'מרישים',
    dims: '7×20 ס"מ · 5 מ׳', price: 239, unit: 'ליחידה', rating: 4.8, reviews: 45, tone: 'teak', cuttable: true,
    woodType: 'אורן', use: 'חוץ', origin: 'שוודיה', weight: 'כ-35 ק"ג ליחידה',
    shortDesc: 'קורה ראשית לפרגולה, מחזיקה מפתח של עד 4 מ׳ בלי עמוד ביניים.',
    variants: [lengths([4, 5, 6], 5, 48)] }),
  mk({ id: 'fence-board', name: 'לוח גדר אורן מוקצה', cat: 'pergolas', sub: 'לוחות גדר',
    dims: '18×90 מ"מ · 1.8 מ׳', price: 14, unit: 'ליחידה', badge: 'best', rating: 4.6, reviews: 154, tone: 'pine', cuttable: true,
    woodType: 'אורן', use: 'חוץ', origin: 'שוודיה', weight: 'כ-1.5 ק"ג ליחידה',
    shortDesc: 'לוח לגדר, למסתור ולחיפוי חוץ — מוקצה בלחץ, עם קצה ישר או מעוגל.',
    variants: [opts('קצה', [['ישר'], ['מעוגל', 2]]), opts('כמות', [['יחידה'], ['חבילה של 50', 630]])] }),
  mk({ id: 'shade-net', name: 'רשת הצללה 90%', cat: 'pergolas', sub: 'הצללה',
    dims: 'גליל 4×10 מ׳', price: 420, unit: 'לגליל', rating: 4.4, reviews: 37, tone: 'ash',
    woodType: 'פוליאתילן', use: 'חוץ', origin: 'ישראל', weight: 'כ-12 ק"ג',
    durability: 'עמידה ל-UV, 8+ שנים', care: 'שטיפה במים',
    shortDesc: 'רשת הצללה צפופה לפרגולות — מורידה עד 90% מהקרינה ומשאירה אוורור.',
    variants: [opts('גוון', [['חול'], ['אפור'], ['שחור']])] }),
  mk({ id: 'teak-slats', name: 'רפפות טיק להצללה', cat: 'pergolas', sub: 'הצללה',
    dims: '20×45 מ"מ · 3 מ׳', price: 89, unit: 'ליחידה', rating: 4.8, reviews: 18, tone: 'teak', cuttable: true,
    woodType: 'טיק', use: 'חוץ', origin: 'אינדונזיה (מטעים)', weight: 'כ-2 ק"ג ליחידה',
    shortDesc: 'שלבי טיק מלא לתקרת פרגולה — הצללה חלקית אלגנטית שמחזיקה שנים.' }),

  /* ----- לוחות ----- */
  mk({ id: 'plywood-18', name: 'דיקט ליבנה', cat: 'boards', catLabel: 'לוחות', sub: 'דיקט',
    dims: '122×244 ס"מ · 18 מ"מ', price: 259, unit: 'ללוח', badge: 'cut', rating: 4.7, reviews: 97, tone: 'board', cuttable: true,
    woodType: 'ליבנה', use: 'פנים', origin: 'פינלנד', density: 'כ-680 ק"ג/מ"ק', weight: 'כ-36 ק"ג ללוח',
    shortDesc: 'דיקט ליבנה רב-שכבתי, חזק ויציב עם פנים נקיות — לרהיטים, ארונות ומדפים. חותכים לכם לפי מידה.',
    variants: [opts('עובי', [['12 מ"מ', -70], ['15 מ"מ', -35], ['18 מ"מ', 0], ['24 מ"מ', 90]])],
    upsell: 'plywood-marine-18', related: ['varnish-water', 'sanding-kit', 'oil-teak-1l', 'hand-saw'] }),
  mk({ id: 'plywood-9', name: 'דיקט ליבנה 9 מ"מ', cat: 'boards', sub: 'דיקט',
    dims: '122×244 ס"מ · 9 מ"מ', price: 149, unit: 'ללוח', was: 169, badge: 'sale', rating: 4.6, reviews: 44, tone: 'board', cuttable: true,
    woodType: 'ליבנה', use: 'פנים', origin: 'פינלנד', weight: 'כ-18 ק"ג ללוח',
    shortDesc: 'דיקט דק לגב ארונות, למגירות ולחיפויים — סוף סדרה במחיר מבצע.' }),
  mk({ id: 'plywood-marine-18', name: 'דיקט ימי עמיד מים', cat: 'boards', sub: 'דיקט',
    dims: '122×244 ס"מ · 18 מ"מ', price: 389, unit: 'ללוח', rating: 4.8, reviews: 31, tone: 'oak', cuttable: true,
    woodType: 'אוקומה', use: 'חוץ', origin: 'גבון', weight: 'כ-33 ק"ג ללוח', durability: 'גבוהה — דבק עמיד מים (WBP)',
    shortDesc: 'דיקט בדבק עמיד למים — לסירות, למטבחים חיצוניים, לחדרים רטובים ולריהוט גן.' }),
  mk({ id: 'mdf-18', name: 'לוח MDF 18 מ"מ', cat: 'boards', sub: 'MDF',
    dims: '122×244 ס"מ · 18 מ"מ', price: 139, unit: 'ללוח', rating: 4.5, reviews: 112, tone: 'ash', cuttable: true,
    woodType: 'MDF', use: 'פנים', origin: 'ספרד', weight: 'כ-40 ק"ג ללוח',
    shortDesc: 'לוח MDF חלק ואחיד — מושלם לצביעה, לארונות, לדלתות ולעבודות CNC.',
    variants: [opts('עובי', [['6 מ"מ', -80], ['12 מ"מ', -40], ['18 מ"מ', 0], ['25 מ"מ', 55]])], upsell: 'mdf-moisture' }),
  mk({ id: 'mdf-moisture', name: 'MDF ירוק עמיד לחות', cat: 'boards', sub: 'MDF',
    dims: '122×244 ס"מ · 18 מ"מ', price: 179, unit: 'ללוח', badge: 'new', rating: 4.6, reviews: 26, tone: 'board', cuttable: true,
    woodType: 'MDF', use: 'פנים', origin: 'ספרד', weight: 'כ-41 ק"ג ללוח', durability: 'עמיד לחות — מטבחים וחדרי רחצה',
    shortDesc: 'MDF בדרגת עמידות ללחות (ליבה ירוקה) — לארונות מטבח ולאמבטיה.' }),
  mk({ id: 'osb-11', name: 'לוח OSB-3', cat: 'boards', sub: 'OSB',
    dims: '122×244 ס"מ · 11 מ"מ', price: 89, unit: 'ללוח', badge: 'best', rating: 4.6, reviews: 187, tone: 'oak', cuttable: true,
    woodType: 'OSB', use: 'בנייה', origin: 'רומניה', weight: 'כ-20 ק"ג ללוח',
    shortDesc: 'לוח שבבים מכוונים חזק וזול — לתת-רצפה, לקירות, לגגות ולמחסנים.',
    variants: [opts('עובי', [['11 מ"מ', 0], ['15 מ"מ', 30], ['18 מ"מ', 52]])] }),
  mk({ id: 'sandwich-pine-18', name: "סנדוויץ' אורן 18 מ\"מ", cat: 'boards', sub: "סנדוויץ'",
    dims: '122×244 ס"מ · 18 מ"מ', price: 219, unit: 'ללוח', rating: 4.5, reviews: 52, tone: 'pine', cuttable: true,
    woodType: 'אורן', use: 'פנים', origin: 'צ׳ילה', weight: 'כ-30 ק"ג ללוח',
    shortDesc: "לוח סנדוויץ' עם ליבת אורן ופנים חלקות — יציב, קל יחסית וטוב לרהיטים." }),
  mk({ id: 'laminated-pine-panel', name: 'לביד אורן מודבק', cat: 'boards', sub: 'לבידים',
    dims: '60×240 ס"מ · 28 מ"מ', price: 329, unit: 'ללוח', rating: 4.8, reviews: 38, tone: 'pine', cuttable: true,
    woodType: 'אורן', use: 'פנים', origin: 'אוסטריה', weight: 'כ-20 ק"ג ללוח',
    shortDesc: 'לוח עץ מלא מודבק מסלסלים צרים — למשטחים, למדפים ולמדרגות.',
    variants: [opts('רוחב', [['40 ס"מ', -90], ['60 ס"מ', 0], ['80 ס"מ', 110]])], upsell: 'oak-worktop' }),

  /* ----- עץ מלא לנגרות ----- */
  mk({ id: 'oak-board-27', name: 'אלון אמריקאי מלא', cat: 'hardwood', catLabel: 'עץ מלא לנגרות', sub: 'אלון',
    dims: '27 מ"מ · רוחב משתנה', price: 189, unit: 'למטר רץ', badge: 'cut', rating: 4.9, reviews: 53, tone: 'walnut', cuttable: true,
    woodType: 'אלון', use: 'פנים', origin: 'ארה"ב', density: 'כ-750 ק"ג/מ"ק', weight: 'כ-4 ק"ג למטר רץ',
    shortDesc: 'אלון לבן אמריקאי מיובש בתנור, עם סיבים ישרים וגוון חם — הקלאסיקה לשולחנות ולרהיטים.',
    variants: [opts('עובי', [['27 מ"מ', 0], ['40 מ"מ', 85], ['52 מ"מ', 160]]), opts('רוחב', [['12–15 ס"מ', 0], ['16–20 ס"מ', 45]])],
    upsell: 'walnut-board-27', related: ['oil-teak-1l', 'sanding-kit', 'varnish-water', 'hand-saw'] }),
  mk({ id: 'oak-board-52', name: 'אלון אמריקאי עבה 52 מ"מ', cat: 'hardwood', sub: 'אלון',
    dims: '52 מ"מ · רוחב 15–20 ס"מ', price: 349, unit: 'למטר רץ', rating: 4.9, reviews: 19, tone: 'walnut', cuttable: true,
    woodType: 'אלון', use: 'פנים', origin: 'ארה"ב', weight: 'כ-7.5 ק"ג למטר רץ',
    shortDesc: 'אלון בעובי כפול — לרגלי שולחן, למשטחים עבים ולספסלים.' }),
  mk({ id: 'oak-worktop', name: 'משטח אלון מודבק', cat: 'hardwood', sub: 'אלון',
    dims: '60×200 ס"מ · 40 מ"מ', price: 1290, unit: 'ליחידה', was: 1490, badge: 'sale', rating: 4.8, reviews: 34, tone: 'oak', cuttable: true,
    woodType: 'אלון', use: 'פנים', origin: 'אוקראינה', weight: 'כ-34 ק"ג',
    shortDesc: 'משטח אלון מלא מודבק לרוחב — למטבח, לשולחן עבודה או לשולחן אוכל.',
    variants: [opts('אורך', [['200 ס"מ', 0], ['250 ס"מ', 320], ['300 ס"מ', 640]])] }),
  mk({ id: 'walnut-board-27', name: 'אגוז אמריקאי מלא', cat: 'hardwood', sub: 'אגוז',
    dims: '27 מ"מ · רוחב משתנה', price: 329, unit: 'למטר רץ', badge: 'new', rating: 4.9, reviews: 24, tone: 'walnut', cuttable: true,
    woodType: 'אגוז', use: 'פנים', origin: 'ארה"ב', density: 'כ-640 ק"ג/מ"ק', weight: 'כ-3.5 ק"ג למטר רץ',
    shortDesc: 'אגוז שחור אמריקאי בגוון שוקולד עמוק — לרהיטים יוקרתיים ולפריטי עיצוב.',
    variants: [opts('עובי', [['27 מ"מ', 0], ['40 מ"מ', 140]])] }),
  mk({ id: 'beech-board-27', name: 'בוק אירופאי מאודה', cat: 'hardwood', sub: 'בוק',
    dims: '27 מ"מ · רוחב 10–18 ס"מ', price: 129, unit: 'למטר רץ', rating: 4.6, reviews: 37, tone: 'oak', cuttable: true,
    woodType: 'בוק', use: 'פנים', origin: 'גרמניה', density: 'כ-720 ק"ג/מ"ק', weight: 'כ-3.8 ק"ג למטר רץ',
    shortDesc: 'בוק מאודה בגוון ורדרד אחיד — קשה, קל לעיבוד ומצוין לכיסאות ולצעצועים.',
    upsell: 'oak-board-27' }),
  mk({ id: 'teak-board-25', name: 'טיק בורמזי', cat: 'hardwood', sub: 'טיק',
    dims: '25 מ"מ · רוחב 10–20 ס"מ', price: 449, unit: 'למטר רץ', rating: 4.9, reviews: 12, tone: 'teak', cuttable: true, inStock: false,
    woodType: 'טיק', use: 'חוץ', origin: 'מיאנמר (מטעים מאושרים)', density: 'כ-650 ק"ג/מ"ק', weight: 'כ-3 ק"ג למטר רץ',
    durability: 'גבוהה מאוד — שמן טבעי בעץ, עמיד במים',
    shortDesc: 'טיק מלא עשיר בשמן טבעי — לריהוט גן, לחדרי רחצה ולסירות.' }),
  mk({ id: 'maple-board-27', name: 'מייפל קשה', cat: 'hardwood', sub: 'מייפל',
    dims: '27 מ"מ · רוחב 12–18 ס"מ', price: 199, unit: 'למטר רץ', rating: 4.7, reviews: 15, tone: 'ash', cuttable: true,
    woodType: 'מייפל', use: 'פנים', origin: 'קנדה', density: 'כ-700 ק"ג/מ"ק', weight: 'כ-3.8 ק"ג למטר רץ',
    shortDesc: 'מייפל קשה בהיר וצפוף — לקרשי חיתוך, למשטחי עבודה ולכלי נגינה.' }),

  /* ----- עצי הסקה ולגריל ----- */
  mk({ id: 'firewood-pallet', name: 'עצי הסקה מיובשים', cat: 'firewood', catLabel: 'הסקה וגריל', sub: 'עצי הסקה מיובשים',
    dims: 'משטח 1 קוב · אלון ואקליפטוס', price: 890, unit: 'למשטח', badge: 'best', rating: 4.8, reviews: 88, tone: 'char',
    woodType: 'אלון ואקליפטוס', use: 'פנים', origin: 'ישראל', weight: 'כ-450 ק"ג',
    shortDesc: 'משטח של קוב עצי הסקה מיובשים, חתוכים לאורך 30–35 ס"מ — נדלקים מהר ובוערים נקי לאורך זמן.',
    variants: [opts('תערובת', [['אלון ואקליפטוס'], ['אלון בלבד', 160]])], upsell: undefined,
    related: ['kindling', 'charcoal-10', 'smoking-chunks-oak', 'firewood-bag'] }),
  mk({ id: 'firewood-half', name: 'חצי משטח עצי הסקה', cat: 'firewood', sub: 'עצי הסקה מיובשים',
    dims: 'חצי קוב · אלון ואקליפטוס', price: 490, unit: 'למשטח', rating: 4.7, reviews: 46, tone: 'char',
    woodType: 'אלון ואקליפטוס', use: 'פנים', origin: 'ישראל', weight: 'כ-230 ק"ג',
    shortDesc: 'חצי משטח לחורף קטן או לדירה עם קמין — אותו עץ מיובש, בכמות קטנה יותר.', upsell: 'firewood-pallet' }),
  mk({ id: 'firewood-bag', name: 'עצי הסקה בשק', cat: 'firewood', sub: 'עצי הסקה מיובשים',
    dims: 'שק 20 ק"ג · אלון', price: 79, unit: 'לשק', rating: 4.6, reviews: 63, tone: 'char',
    woodType: 'אלון', use: 'פנים', origin: 'ישראל', weight: '20 ק"ג',
    shortDesc: 'שק עצי אלון מיובשים — לערב מול הקמין, למדורה או לפויקה.', upsell: 'firewood-half' }),
  mk({ id: 'smoking-chunks-oak', name: 'נתחי אלון לעישון', cat: 'firewood', sub: 'עצים לגריל ולעישון',
    dims: 'שק 5 ק"ג · נתחים 5–8 ס"מ', price: 59, unit: 'לשק', rating: 4.8, reviews: 41, tone: 'oak',
    woodType: 'אלון', use: 'חוץ', origin: 'ישראל', weight: '5 ק"ג',
    shortDesc: 'נתחי אלון יבשים למעשנה ולגריל — עשן עדין ויציב לבשר ולדגים.',
    variants: [opts('עץ', [['אלון'], ['דובדבן', 10], ['תפוח', 10]])] }),
  mk({ id: 'grill-wood-citrus', name: 'עצי הדרים לגריל', cat: 'firewood', sub: 'עצים לגריל ולעישון',
    dims: 'שק 10 ק"ג', price: 69, unit: 'לשק', badge: 'new', rating: 4.7, reviews: 22, tone: 'pine',
    woodType: 'הדרים', use: 'חוץ', origin: 'ישראל', weight: '10 ק"ג',
    shortDesc: 'עצי פרדס מיובשים עם ארומה קלה — הסוד של המנגל הישראלי.' }),
  mk({ id: 'charcoal-10', name: 'פחם עץ קשה', cat: 'firewood', sub: 'פחם',
    dims: 'שק 10 ק"ג', price: 89, unit: 'לשק', badge: 'best', rating: 4.7, reviews: 133, tone: 'char',
    woodType: 'עץ קשה', use: 'חוץ', origin: 'פרגוואי', weight: '10 ק"ג',
    shortDesc: 'פחם בגושים גדולים מעץ קשה — נדלק מהר, חם מאוד ומחזיק שעות.' }),
  mk({ id: 'kindling', name: 'עצי הדלקה יבשים', cat: 'firewood', sub: 'עצי הסקה מיובשים',
    dims: 'רשת 5 ק"ג', price: 29, unit: 'לרשת', rating: 4.5, reviews: 58, tone: 'ash',
    woodType: 'אורן', use: 'פנים', origin: 'ישראל', weight: '5 ק"ג',
    shortDesc: 'קיסמים דקים ויבשים להדלקה מהירה של קמין, מנגל או מדורה.' }),

  /* ----- אביזרים, שמנים וכלים ----- */
  mk({ id: 'deck-oil-4l', name: 'שמן לדק — גוון טבעי', cat: 'accessories', catLabel: 'אביזרים ושמנים', sub: 'שמנים ולכות',
    dims: '4 ליטר · כ-40 מ"ר', price: 179, unit: 'ליחידה', was: 219, badge: 'sale', rating: 4.7, reviews: 205, tone: 'ash',
    woodType: 'שמן', use: 'חוץ', origin: 'דנמרק', weight: 'כ-3.6 ק"ג',
    shortDesc: 'שמן חודר לדקים ולעץ חוץ — מזין, דוחה מים ומגן מ-UV. 4 ליטר מספיקים לכ-40 מ"ר בשכבה אחת.',
    variants: [opts('נפח', [['1 ליטר', -115], ['4 ליטר', 0], ['10 ליטר', 230]]), opts('גוון', [['טבעי'], ['טיק'], ['אגוז']])],
    related: ['ipe-deck-21', 'sanding-kit', 'deck-screws-ss', 'hidden-clips'] }),
  mk({ id: 'deck-screws-ss', name: 'ברגי נירוסטה לדק A2', cat: 'accessories', sub: 'ברגים ומחברים',
    dims: 'קופסה 500 יח׳ · 5×50 מ"מ', price: 149, unit: 'לקופסה', badge: 'best', rating: 4.8, reviews: 167, tone: 'board',
    woodType: 'נירוסטה', use: 'חוץ', origin: 'גרמניה', weight: 'כ-2 ק"ג',
    shortDesc: 'ברגי נירוסטה עם ראש חבוי וחוד קודח — לא מחלידים ולא מכתימים את הדק.',
    variants: [opts('מידה', [['5×50 מ"מ', 0], ['5×60 מ"מ', 20]])], upsell: 'hidden-clips' }),
  mk({ id: 'hidden-clips', name: 'קליפסים נסתרים לדק', cat: 'accessories', sub: 'ברגים ומחברים',
    dims: 'ערכה ל-10 מ"ר', price: 189, unit: 'לערכה', rating: 4.7, reviews: 58, tone: 'board',
    woodType: 'נירוסטה', use: 'חוץ', origin: 'גרמניה', weight: 'כ-1.5 ק"ג',
    shortDesc: 'מערכת קליפסים שמסתירה את הברגים — דק חלק בלי חורים, עם מרווח קבוע של 5 מ"מ.' }),
  mk({ id: 'pergola-brackets', name: 'ערכת פרזול לפרגולה', cat: 'accessories', sub: 'ברגים ומחברים',
    dims: 'ערכה ל-4 עמודים · מגולוון', price: 249, unit: 'לערכה', rating: 4.6, reviews: 49, tone: 'board',
    woodType: 'פלדה מגולוונת', use: 'חוץ', origin: 'ישראל', weight: 'כ-6 ק"ג',
    shortDesc: 'רגלי עמוד, זוויתנים וברגים מגולוונים — כל הפרזול לפרגולה בקופסה אחת.' }),
  mk({ id: 'oil-teak-1l', name: 'שמן טיק לרהיטים', cat: 'accessories', sub: 'שמנים ולכות',
    dims: '1 ליטר', price: 69, unit: 'ליחידה', rating: 4.7, reviews: 81, tone: 'teak',
    woodType: 'שמן', use: 'פנים', origin: 'הולנד', weight: 'כ-0.9 ק"ג',
    shortDesc: 'שמן מזין לרהיטי עץ מלא — מעמיק את הגוון ומשאיר מגע טבעי.' }),
  mk({ id: 'varnish-water', name: 'לכה על בסיס מים — שקוף מט', cat: 'accessories', sub: 'שמנים ולכות',
    dims: '2.5 ליטר · כ-30 מ"ר', price: 159, unit: 'ליחידה', rating: 4.6, reviews: 64, tone: 'ash',
    woodType: 'לכה', use: 'פנים', origin: 'איטליה', weight: 'כ-2.6 ק"ג',
    shortDesc: 'לכה שקופה ללא ריח חריף — מגינה על רהיטים ומשטחים בלי להצהיב.',
    variants: [opts('גימור', [['מט'], ['משי'], ['מבריק']])] }),
  mk({ id: 'wood-stain-walnut', name: 'בייץ לעץ — גוון אגוז', cat: 'accessories', sub: 'צבעים לעץ',
    dims: '0.75 ליטר', price: 59, unit: 'ליחידה', rating: 4.5, reviews: 33, tone: 'walnut',
    woodType: 'בייץ', use: 'פנים', origin: 'גרמניה', weight: 'כ-0.8 ק"ג',
    shortDesc: 'בייץ חודר שמשנה את גוון העץ ומשאיר את הסיבים גלויים.',
    variants: [opts('גוון', [['אגוז'], ['אלון בהיר'], ['מהגוני'], ['שחור']])] }),
  mk({ id: 'hand-saw', name: 'מסור יפני דו-צדדי', cat: 'accessories', sub: 'כלים',
    dims: 'להב 240 מ"מ', price: 119, unit: 'ליחידה', rating: 4.9, reviews: 72, tone: 'oak',
    woodType: 'פלדה', use: 'פנים', origin: 'יפן', weight: 'כ-0.3 ק"ג',
    shortDesc: 'מסור משיכה יפני חד במיוחד — צד אחד לחיתוך לאורך הסיבים וצד שני לרוחב.' }),
  mk({ id: 'sanding-kit', name: 'ערכת נייר שיוף', cat: 'accessories', sub: 'כלים',
    dims: '40 גיליונות · גרעין 80–240', price: 49, unit: 'לערכה', was: 65, badge: 'sale', rating: 4.6, reviews: 95, tone: 'ash',
    woodType: '—', use: 'פנים', origin: 'גרמניה', weight: 'כ-0.4 ק"ג',
    shortDesc: 'ערכת שיוף מלאה מגס לעדין — הכנה מושלמת לשמן, לכה או צבע.' }),
];

/** 8 הנמכרים ביותר (דוגמה) — לדף הבית. אותם אובייקטים כמו ב-CATALOG. */
export const BESTSELLER_IDS = ['ipe-deck-21', 'pine-beam-5x10', 'pergola-kit-3x4', 'plywood-18', 'bamboo-deck', 'oak-board-27', 'deck-oil-4l', 'firewood-pallet'];
export const PRODUCTS = BESTSELLER_IDS.map(id => CATALOG.find(p => p.id === id));

/* ---------- עזרים ---------- */
export const getProduct = id => CATALOG.find(p => p.id === id);
export const categoryById = id => CATEGORIES.find(c => c.id === id);
/** טקסט הקטגוריה לקוביית מוצר */
export const catLabel = p => p.catLabel || categoryById(p.cat)?.short || '';
/** תמונת המוצר: צילום אמיתי אם יש, אחרת תמונת הקטגוריה */
export const productImage = p => p.img || `assets/img/cat-${p.cat}.webp`;
/** תמונת מרקם לריחוף (רק למוצרים עם צילום) — undefined אם אין */
export const productTexture = p => p.imgAlt;
/** תת-קטגוריה של מוצר בתוך "מבצעים" (קטגוריה וירטואלית: כל מוצר עם was) */
export const saleSub = p => (p.cat === 'pergolas' ? 'מבצעי פרגולות' : p.cat === 'decking' ? 'מבצעי דקים' : 'סוף סדרה');
/** מוצרים לפי קטגוריה (ותת-קטגוריה אופציונלית). 'sale' = כל המוצרים במבצע. */
export function productsByCategory(catId, sub) {
  const list = catId === 'sale' ? CATALOG.filter(p => p.was) : CATALOG.filter(p => p.cat === catId);
  if (!sub) return list;
  return list.filter(p => (catId === 'sale' ? saleSub(p) : p.sub) === sub);
}
/** אחוז הנחה (0 אם אין) */
export const discountPct = p => (p.was ? Math.round((1 - p.price / p.was) * 100) : 0);

/* ---------- כללי חנות ---------- */
export const SHOP_RULES = {
  freeShippingOver: 3000,   // ₪ — משלוח חינם (לא כולל אילת)
  freeCuttingOver: 1500,    // ₪ — חיתוך חינם
  maxInstallments: 12,
  deliveryHours: 72,
};

/** מחירים לדוגמה למחשבון הדק (₪ למ"ר) */
export const DECK_TYPES = [
  { id: 'ipe', name: 'איפאה', price: 389, product: 'ipe-deck-21' },
  { id: 'bamboo', name: 'במבוק', price: 329, product: 'bamboo-deck' },
  { id: 'composite', name: 'סינטטי', price: 279, product: 'composite-deck-grey' },
  { id: 'pine', name: 'אורן', price: 149, product: 'pine-deck-treated' },
];

/* ---------- משלוחים (דוגמה) ---------- */
export const WEIGHT_TIERS = ['עד 500 ק"ג', '500–1,500 ק"ג', 'מעל 1,500 ק"ג'];
export const SHIPPING_ZONES = [
  { id: 'north', name: 'צפון', areas: 'חיפה והקריות, הגליל, העמקים, רמת הגולן', prices: [190, 290, 390], days: 'עד 48 שעות', free: true },
  { id: 'center', name: 'מרכז', areas: 'גוש דן, השרון, השפלה, המושבים', prices: [250, 350, 450], days: 'עד 72 שעות', free: true },
  { id: 'jerusalem', name: 'ירושלים והסביבה', areas: 'ירושלים, מבשרת, בית שמש, גוש עציון', prices: [290, 390, 490], days: 'עד 72 שעות', free: true },
  { id: 'south', name: 'דרום', areas: 'באר שבע, אשדוד, אשקלון, הנגב', prices: [320, 420, 520], days: 'עד 72 שעות', free: true },
  { id: 'eilat', name: 'אילת והערבה', areas: 'אילת, הערבה, מצפה רמון', prices: [690, 890, 1190], days: '4–6 ימי עסקים', free: false },
];
export const PICKUP = { name: 'איסוף עצמי מהמחסן בירכא', price: 0, note: 'מוכן לאיסוף תוך יום עסקים — נעדכן ב-SMS' };

/* ---------- מחירון חיתוך (דוגמה) ---------- */
export const CUT_PRICES = [
  { item: 'חיתוך ישר — קורה או לוח עץ מלא', price: '4 ₪ לחתך' },
  { item: 'חיתוך לוחות (דיקט / MDF / OSB) במסור פאנלים', price: '6 ₪ לחתך' },
  { item: 'חיתוך זווית (גרונג)', price: '8 ₪ לחתך' },
  { item: 'הקצעה לעובי מבוקש', price: '15 ₪ למטר רץ' },
  { item: 'מינימום להזמנת חיתוך', price: '40 ₪' },
  { item: 'בהזמנה מעל 1,500 ₪', price: 'חינם' },
];

/* ---------- פרטי העסק (דוגמה) ---------- */
export const STORE = {
  name: 'עץ מרקט',
  phone: '04-555-0000', tel: '+97245550000',
  wa: 'https://wa.me/97245550000',
  email: 'info@etz-market.co.il',
  address: 'אזור התעשייה, ירכא',
};

export const BRANCHES = [
  { id: 'yarka', name: 'המחסן בירכא', status: 'open', address: 'אזור התעשייה, ירכא', phone: '04-555-0000', tel: '+97245550000',
    hours: [['א׳–ה׳', '07:00–17:00'], ['ו׳ וערבי חג', '07:00–13:00'], ['שבת', 'סגור']],
    waze: 'https://waze.com/ul?q=Yarka%20industrial%20zone', maps: 'https://maps.google.com/?q=Yarka',
    img: 'assets/img/saw.webp', note: '4,000 מ"ר מחסן, חניה למשאיות ואיסוף עצמי' },
  { id: 'center', name: 'סניף המרכז', status: 'soon', address: 'בקרוב', note: 'אנחנו מחפשים מקום טוב במרכז. רוצים לשמוע ראשונים? הירשמו לניוזלטר.' },
  { id: 'south', name: 'סניף הדרום', status: 'soon', address: 'בקרוב', note: 'בתכנון — נקודת איסוף לבעלי מקצוע בדרום.' },
];

/* ---------- מדריכים (דוגמה) ---------- */
export const GUIDE_CATS = ['דקים', 'פרגולות', 'נגרות', 'תחזוקה ושימור', 'השראה'];

export const GUIDES = [
  { id: 'deck-oil', cat: 'תחזוקה ושימור', title: 'איך לשמן דק איפאה — ומתי בפעם הראשונה', mins: 6, tone: 'ipe', img: 'assets/img/g-deck-oil.webp',
    author: 'אמיר, נגר ראשי', date: '2026-04-12', featured: true,
    excerpt: 'שמן נכון בזמן הנכון מוסיף שנים לדק. כל השלבים, מהניקוי ועד השכבה השנייה — ומה לא לעשות.',
    body: [
      { h: 'מתי לשמן בפעם הראשונה', p: ['דק איפאה חדש צריך "לנשום" כמה שבועות לפני השמן הראשון — בדרך כלל 4–6 שבועות אחרי ההתקנה. ככה השמנים הטבעיים שעל פני העץ מתאדים, והשמן החדש נספג טוב יותר.'] },
      { h: 'מה צריך', list: ['שמן לדק (4 ליטר לכ-40 מ"ר)', 'מברשת רחבה או רולר קצר', 'סבון עדין ומברשת ניקוי', 'סמרטוטים נקיים'] },
      { h: 'שלב אחר שלב', p: ['מנקים את הדק במים וסבון ונותנים לו להתייבש יום שלם. מורחים שכבה דקה לאורך הלוחות, ואחרי 20 דקות מנגבים את העודפים. שכבה שנייה — אחרי 24 שעות.'], tip: 'לא משמנים בשמש ישירה של צהריים — השמן מתייבש מהר מדי ומשאיר כתמים.' },
      { h: 'כל כמה זמן', p: ['פעם בשנה, באביב, מספיקה לרוב הדקים. דק שחשוף לשמש מלאה כל היום ייהנה גם משכבה בסתיו.'] },
    ],
    products: ['deck-oil-4l', 'sanding-kit', 'ipe-deck-21'] },
  { id: 'pergola-size', cat: 'פרגולות', title: '3×3 או 3×4? המדריך לבחירת גודל פרגולה', mins: 8, tone: 'teak', img: 'assets/img/g-pergola-size.webp',
    author: 'רונית, יועצת פרויקטים', date: '2026-03-28',
    excerpt: 'כמה מקום צריך לשולחן של 6? מה עם הצל בצהריים? איך בוחרים גודל פרגולה שלא תצטערו עליו.',
    body: [
      { h: 'מתחילים מהשימוש', p: ['פינת ישיבה קטנה? 3×3 מספיק. שולחן אוכל ל-6–8 אנשים עם מקום לעבור מסביב? 3×4 לפחות. חניה מוצלת לרכב אחד — 3×5.'] },
      { h: 'הכלל של 90 ס"מ', p: ['סביב שולחן צריך לפחות 90 ס"מ פנויים לכיסא ולמעבר. מודדים את השולחן, מוסיפים 1.8 מ׳ לכל ממד — וזה הגודל המינימלי.'], tip: 'סמנו את הגודל על הרצפה עם חבל או גיר לפני שמזמינים. ככה רואים באמת.' },
      { h: 'צל ושמש', p: ['השמש זזה. פרגולה בצד מערב של הבית תצל אחר הצהריים, בצד מזרח — בבוקר. אם צריך צל מלא, הוסיפו רשת הצללה או רפפות צפופות.'] },
      { h: 'היתרים', list: ['פרגולה עד 50 מ"ר — בדרך כלל פטורה מהיתר (בכפוף לתקנות)', 'בבניין משותף — צריך הסכמת שכנים', 'מומלץ לבדוק עם הרשות המקומית'] },
    ],
    products: ['pergola-kit-3x3', 'pergola-kit-3x4', 'pergola-kit-4x5', 'shade-net'] },
  { id: 'plywood', cat: 'נגרות', title: 'דיקט, MDF או OSB — מה מתאים לפרויקט שלכם', mins: 5, tone: 'board', img: 'assets/img/g-plywood.webp',
    author: 'אמיר, נגר ראשי', date: '2026-02-15',
    excerpt: 'שלושה לוחות, שלושה אופיים. השוואה פשוטה: חוזק, מחיר, צביעה ועמידות למים.',
    body: [
      { h: 'דיקט', p: ['שכבות עץ דקות מודבקות בכיוונים מתחלפים. חזק, מחזיק ברגים מצוין ונראה טוב גם בלי צבע. הבחירה לרהיטים ולמדפים שנושאים משקל.'] },
      { h: 'MDF', p: ['סיבי עץ דחוסים — חלק לגמרי ואחיד. מושלם לצביעה, לדלתות ארון ולעבודות CNC, אבל לא אוהב מים ולא מחזיק ברגים בקצוות.'] },
      { h: 'OSB', p: ['שבבים גדולים מכוונים. זול וחזק — לתת-רצפה, לקירות ולמחסנים. פחות מתאים לרהיטים גלויים.'], tip: 'לא בטוחים? התקשרו — נגר שלנו יעזור לבחור לפי הפרויקט, בחינם.' },
    ],
    products: ['plywood-18', 'mdf-18', 'osb-11', 'sandwich-pine-18'] },
  { id: 'deck-measure', cat: 'דקים', title: 'איך מודדים דק נכון — ב-3 צעדים', mins: 4, tone: 'ipe',
    author: 'רונית, יועצת פרויקטים', date: '2026-05-02',
    excerpt: 'מודדים פעם אחת, מזמינים פעם אחת. ככה מחשבים שטח, כיוון לוחות ופחת — בלי לטעות.',
    body: [
      { h: 'מודדים את השטח', p: ['מודדים אורך ורוחב במטרים. בצורה לא מלבנית — מחלקים לכמה מלבנים, מודדים כל אחד ומחברים.'] },
      { h: 'בוחרים כיוון לוחות', p: ['לוחות לאורך הצד הארוך — פחות חיבורים ומראה רגוע. לוחות בניצב לבית — מאריכים חזותית את השטח.'] },
      { h: 'מוסיפים פחת', p: ['תמיד מוסיפים 10% לחיתוכים ולקצוות. בדק עם הרבה פינות — 15%.'], tip: 'המחשבון שלנו כבר מחשב פחת, תת-מבנה, ברגים ושמן.' },
    ],
    products: ['ipe-deck-21', 'deck-joist-alu', 'deck-screws-ss', 'hidden-clips'] },
  { id: 'firewood-dry', cat: 'תחזוקה ושימור', title: 'איך יודעים שעצי ההסקה באמת יבשים', mins: 4, tone: 'char',
    author: 'סאמר, מנהל המחסן', date: '2025-11-03',
    excerpt: 'עץ רטוב מעשן, מלכלך את הארובה ומחמם פחות. 4 סימנים פשוטים לזהות עץ יבש.',
    body: [
      { h: '4 סימנים לעץ יבש', list: ['סדקים בקצוות הבול', 'קליפה שמתקלפת בקלות', 'צליל חלול כששני בולים נוקשים זה בזה', 'משקל קל יחסית לגודל'] },
      { h: 'איך מאחסנים', p: ['מתחת לגג, מוגבה מהקרקע, עם אוויר מסביב. לא עוטפים בניילון — העץ צריך לנשום.'], tip: 'מד לחות זול חוסך ויכוחים: מתחת ל-20% — העץ מוכן.' },
    ],
    products: ['firewood-pallet', 'firewood-bag', 'kindling'] },
  { id: 'oak-table', cat: 'השראה', title: 'שולחן אוכל מאלון מלא — מהלוח ועד השמן', mins: 7, tone: 'walnut',
    author: 'נועם ש., לקוח', date: '2026-01-20',
    excerpt: 'לקוח שלנו בנה שולחן ל-8 סועדים בסוף שבוע אחד. התוכנית, הכמויות והטעויות שכדאי לחסוך.',
    body: [
      { h: 'התוכנית', p: ['משטח 90×200 ס"מ מחמישה לוחות אלון 27 מ"מ, רגליים מאלון 52 מ"מ, וגימור בשמן טיק.'] },
      { h: 'מה הזמנתי', list: ['11 מטר רץ אלון 27 מ"מ (כולל פחת)', '3 מטר רץ אלון 52 מ"מ לרגליים', 'שמן טיק 1 ליטר', 'ערכת נייר שיוף'] },
      { h: 'מה למדתי', p: ['להדביק בשלבים ולא את כל הלוחות בבת אחת. ולשייף לאט — 80, 120, 180, 240 — לפני השמן.'], tip: 'ביקשתי מהמחסן להקציע את הלוחות לעובי אחיד. חסך לי יום עבודה.' },
    ],
    products: ['oak-board-27', 'oak-board-52', 'oil-teak-1l', 'sanding-kit'] },
];
export const guideById = id => GUIDES.find(g => g.id === id);
/** תמונת מדריך: צילום אם יש, אחרת תמונת הקטגוריה הקרובה */
const GUIDE_FALLBACK = { 'דקים': 'decking', 'פרגולות': 'pergolas', 'נגרות': 'hardwood', 'תחזוקה ושימור': 'accessories', 'השראה': 'hardwood' };
export const guideImage = g => g.img || (g.id === 'firewood-dry' ? 'assets/img/cat-firewood.webp' : `assets/img/cat-${GUIDE_FALLBACK[g.cat] || 'decking'}.webp`);

/* ---------- שאלות נפוצות (דוגמה) ---------- */
export const FAQ = [
  { id: 'orders', name: 'הזמנות', items: [
    { q: 'איך מזמינים — באתר או בטלפון?', a: 'איך שנוח לכם. באתר מוסיפים לסל ומשלמים, ונציג מתקשר תוך 24 שעות לאשר מידות ומועד. בטלפון 04-555-0000 נגר שלנו יעזור להרכיב את ההזמנה.' },
    { q: 'אפשר לשנות הזמנה אחרי התשלום?', a: 'כן, עד שהנציג מאשר את ההזמנה בטלפון ולפני שהחיתוך מתחיל. התקשרו או כתבו ב-WhatsApp עם מספר ההזמנה.' },
    { q: 'איך יודעים שהמוצר במלאי?', a: 'בכל עמוד מוצר מופיע סטטוס מלאי. אם משהו נגמר אחרי שהזמנתם — נתקשר להציע חלופה או החזר מלא.' },
    { q: 'יש הנחה לבעלי מקצוע?', a: 'המחירים באתר הם כבר מחירי מחסן לכולם. בהזמנות גדולות במיוחד — דברו איתנו ונבנה הצעת מחיר.' },
    { q: 'אפשר לקבל הצעת מחיר לפרויקט?', a: 'בטח. שלחו תוכנית או רשימת כמויות במייל או ב-WhatsApp, ונחזור עם הצעה תוך יום עסקים.' },
  ] },
  { id: 'shipping', name: 'משלוחים', items: [
    { q: 'תוך כמה זמן מגיע המשלוח?', a: 'עד 72 שעות לרוב הארץ, ובצפון לרוב תוך 48 שעות. לאילת והערבה — 4–6 ימי עסקים. המועד המדויק מתואם איתכם בטלפון.' },
    { q: 'כמה עולה משלוח?', a: 'לפי אזור ומשקל, החל מ-190 ₪. מעל 3,000 ₪ המשלוח חינם (לא כולל אילת). המחיר המדויק מוצג בסל לפני התשלום.' },
    { q: 'המנוף יכול להעלות לקומה או לגג?', a: 'כן, המנוף פורק עד גובה של כ-3 קומות, בתנאי שיש גישה למשאית ומקום פריקה פנוי. אם לא בטוחים — סמנו "לא בטוח" בקופה ונבדוק איתכם.' },
    { q: 'צריך להיות בבית בזמן המשלוח?', a: 'כן, מישהו צריך להיות במקום כדי לאשר את מקום הפריקה ולחתום על קבלת הסחורה.' },
  ] },
  { id: 'cutting', name: 'חיתוך', items: [
    { q: 'איך מזמינים חיתוך לפי מידה?', a: 'בעמוד המוצר מסמנים "חיתוך לפי מידה", מזינים אורך וכמות חתיכות. נציג מאשר כל מידה בטלפון לפני החיתוך.' },
    { q: 'כמה עולה חיתוך?', a: 'בהזמנה מעל 1,500 ₪ החיתוך חינם. מתחת לזה — לפי מחירון החיתוך (החל מ-4 ₪ לחתך).' },
    { q: 'מה רמת הדיוק?', a: 'סבולת של מילימטר אחד, במסור פאנלים ובמסור גרונג מכוילים.' },
    { q: 'אפשר להחזיר מוצר שנחתך?', a: 'לא. מוצר שנחתך לפי מידה הוא מוצר בהזמנה אישית ולא ניתן להחזרה — לכן אנחנו מאשרים כל מידה בטלפון.' },
  ] },
  { id: 'payment', name: 'תשלום ותשלומים', items: [
    { q: 'אילו אמצעי תשלום יש?', a: 'כרטיסי אשראי (ויזה, מאסטרקארד, אמריקן אקספרס, ישראכרט), ביט, ובהזמנות גדולות גם העברה בנקאית.' },
    { q: 'אפשר לשלם בתשלומים?', a: 'כן, עד 12 תשלומים בכרטיס אשראי.' },
    { q: 'התשלום באתר מאובטח?', a: 'כן. הסליקה מתבצעת אצל ספק סליקה מאושר בתקן PCI, ואנחנו לא שומרים פרטי כרטיס.' },
    { q: 'מתי מחויב הכרטיס?', a: 'בסיום ההזמנה. אם משהו משתנה באישור הטלפוני — נעדכן את החיוב או נחזיר את ההפרש.' },
  ] },
  { id: 'returns', name: 'החזרות', items: [
    { q: 'אפשר לבטל הזמנה?', a: 'כן, לפי חוק הגנת הצרכן — תוך 14 יום מקבלת המוצר, בתנאי שלא נחתך ולא נעשה בו שימוש. דמי ביטול: 5% או 100 ₪, הנמוך מביניהם.' },
    { q: 'מה עושים אם הגיע מוצר פגום?', a: 'מצלמים ושולחים לנו תוך 48 שעות. נחליף או נזכה — בלי ויכוחים, כולל משלוח.' },
    { q: 'מי משלם על משלוח ההחזרה?', a: 'בפגם — אנחנו. בביטול רגיל — הלקוח, או שמביאים את המוצר בחזרה למחסן בירכא.' },
    { q: 'תוך כמה זמן מקבלים החזר?', a: 'עד 14 ימי עסקים מקבלת המוצר במחסן, לאותו אמצעי תשלום.' },
  ] },
  { id: 'invoices', name: 'חשבוניות', items: [
    { q: 'אפשר חשבונית על שם חברה?', a: 'כן. בקופה מסמנים "חשבונית על שם חברה" וממלאים שם חברה וח.פ.' },
    { q: 'איפה מוצאים את החשבונית?', a: 'החשבונית נשלחת במייל אחרי האספקה, ונשמרת גם באזור האישי תחת "הזמנות".' },
    { q: 'אפשר לתקן חשבונית שכבר הופקה?', a: 'כן, תוך 30 יום. שלחו מייל עם מספר ההזמנה והפרטים הנכונים.' },
    { q: 'המחירים באתר כוללים מע"מ?', a: 'כן, כל המחירים באתר כוללים מע"מ.' },
  ] },
];

/** מפתחות ישנים של page.html?p=... (נשמר לתאימות; המיפוי לקבצים ב-js/routes.js) */
export const PAGES = {
  shop: 'חנות — כל המוצרים',
  construction: 'עץ בנייה וקונסטרוקציה', decking: 'עצי דק וחוץ', pergolas: 'פרגולות וגדרות', boards: 'לוחות',
  hardwood: 'עץ מלא לנגרות', firewood: 'עצי הסקה ולגריל', accessories: 'אביזרים, שמנים וכלים', sale: 'מבצעים',
  product: 'עמוד מוצר', cart: 'סל קניות', checkout: 'קופה', login: 'התחברות / הרשמה', account: 'החשבון שלי',
  cutting: 'חיתוך לפי מידה', delivery: 'משלוחים והובלה עם מנוף', 'deck-calculator': 'מחשבון כמויות לדק',
  guides: 'מדריכים ורעיונות', guide: 'מאמר', about: 'אודות — הסיפור שלנו', contact: 'צור קשר וסניפים', faq: 'שאלות נפוצות',
  search: 'תוצאות חיפוש', wishlist: 'רשימת מועדפים', terms: 'תקנון', 'shipping-returns': 'משלוחים, החזרות וביטולים',
  privacy: 'מדיניות פרטיות', accessibility: 'הצהרת נגישות', sitemap: 'מפת אתר',
};
