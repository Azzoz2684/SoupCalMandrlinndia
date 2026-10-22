import { OILS } from './oils.js';

/*
 * نموذج الوصفة: إنشاؤها، تعديلها، تنظيفها، وتحويلها من وإلى JSON.
 * دوال نقية بالكامل، بلا DOM ولا تخزين.
 */

export const RECIPE_VERSION = 1;

/** وحدات الوزن. التخزين الداخلي دائمًا بالغرام، والتحويل يتم عند الإدخال والعرض فقط. */
export const WEIGHT_UNITS = Object.freeze({
  g: Object.freeze({ label: 'غرام', short: 'غ', factor: 1 }),
  kg: Object.freeze({ label: 'كيلوغرام', short: 'كغ', factor: 1000 }),
  oz: Object.freeze({ label: 'أونصة', short: 'أونصة', factor: 28.349523125 }),
  lb: Object.freeze({ label: 'رطل', short: 'رطل', factor: 453.59237 }),
});

export function toGrams(value, unit) {
  const u = WEIGHT_UNITS[unit];
  if (!u || !Number.isFinite(value)) return NaN;
  return value * u.factor;
}

export function fromGrams(grams, unit) {
  const u = WEIGHT_UNITS[unit];
  if (!u || !Number.isFinite(grams)) return NaN;
  return grams / u.factor;
}

const AR_DIGITS = '٠١٢٣٤٥٦٧٨٩';

/**
 * يحوّل نص الرقم المدخل إلى رقم. يقبل الأرقام العربية-الهندية، والفاصلة العربية والإنجليزية كفاصلة عشرية.
 * يعيد NaN للمدخلات غير الصالحة.
 */
export function parseNumber(value) {
  if (typeof value === 'number') return value;
  if (typeof value !== 'string') return NaN;
  const s = value
    .trim()
    .replace(/[٠-٩]/g, (d) => String(AR_DIGITS.indexOf(d)))
    .replace(/[٫,،]/g, '.');
  if (!/^-?(\d+\.?\d*|\.\d+)$/.test(s)) return NaN;
  return Number(s);
}

export function generateId(prefix = 'r') {
  const rnd = Math.random().toString(36).slice(2, 8);
  return `${prefix}_${Date.now().toString(36)}_${rnd}`;
}

export function createEmptyRecipe(overrides = {}) {
  return normalizeRecipe({
    id: generateId(),
    name: 'وصفة جديدة',
    notes: '',
    oils: [],
    alkali: { type: 'NaOH', purity: { NaOH: 100, KOH: 100 }, mixNaOHShare: 50, liquidNaOH: { enabled: false, concentration: 50 } },
    superfat: 5,
    concentration: 30,
    waterMode: 'concentration',
    waterRatio: 2,
    ...overrides,
  }).recipe;
}

/**
 * يُنظّف الوصفة ويملأ القيم الافتراضية. يعيد { recipe, errors } ولا يرمي استثناءً.
 * أي حقل غير صالح يُنبَّه إليه في errors، ويُستبدل بالافتراضي عند الحاجة.
 */
export function normalizeRecipe(raw) {
  const errors = [];
  const src = raw && typeof raw === 'object' ? raw : {};
  const fallback = {
    alkali: { type: 'NaOH', purity: { NaOH: 100, KOH: 100 }, mixNaOHShare: 50, liquidNaOH: { enabled: false, concentration: 50 } },
  };

  const num = (v, d, label) => {
    const n = parseNumber(v);
    if (Number.isFinite(n)) return n;
    if (v !== undefined && v !== null && v !== '') errors.push(`قيمة "${label}" غير صالحة، تم استخدام الافتراضي.`);
    return d;
  };

  const oils = (Array.isArray(src.oils) ? src.oils : [])
    .filter((o) => o && typeof o.id === 'string')
    .map((o) => ({ id: o.id, weight: num(o.weight, 100, 'وزن المكوّن') }));

  const a = src.alkali && typeof src.alkali === 'object' ? src.alkali : {};
  const type = ['NaOH', 'KOH', 'MIX'].includes(a.type) ? a.type : fallback.alkali.type;
  if (a.type !== undefined && type !== a.type) errors.push('نوع المادة القلوية غير معروف، تم استخدام NaOH.');

  const purity = a.purity && typeof a.purity === 'object' ? a.purity : {};
  const liquid = a.liquidNaOH && typeof a.liquidNaOH === 'object' ? a.liquidNaOH : {};

  const recipe = {
    version: RECIPE_VERSION,
    id: typeof src.id === 'string' && src.id ? src.id : generateId(),
    name: typeof src.name === 'string' && src.name.trim() ? src.name.trim().slice(0, 120) : 'وصفة بدون اسم',
    notes: typeof src.notes === 'string' ? src.notes.slice(0, 2000) : '',
    oils,
    alkali: {
      type,
      purity: {
        NaOH: num(purity.NaOH, 100, 'نقاوة NaOH'),
        KOH: num(purity.KOH, 100, 'نقاوة KOH'),
      },
      mixNaOHShare: num(a.mixNaOHShare, 50, 'نسبة NaOH في الخليط'),
      liquidNaOH: {
        enabled: liquid.enabled === true,
        concentration: num(liquid.concentration, 50, 'تركيز المحلول الجاهز'),
      },
    },
    superfat: num(src.superfat, 5, 'الدهون الزائدة'),
    concentration: num(src.concentration, 30, 'تركيز المحلول'),
    waterMode: src.waterMode === 'ratio' ? 'ratio' : 'concentration',
    waterRatio: num(src.waterRatio, 2, 'نسبة الماء إلى القلوي'),
    updatedAt: typeof src.updatedAt === 'string' ? src.updatedAt : new Date().toISOString(),
  };
  return { recipe, errors };
}

export function addOil(recipe, oilId, weight = 100, oils = OILS) {
  if (!oils.some((o) => o.id === oilId)) return recipe;
  return { ...recipe, oils: [...recipe.oils, { id: oilId, weight }] };
}

export function removeOil(recipe, index) {
  return { ...recipe, oils: recipe.oils.filter((_, i) => i !== index) };
}

export function setOilWeight(recipe, index, weight) {
  return {
    ...recipe,
    oils: recipe.oils.map((o, i) => (i === index ? { ...o, weight } : o)),
  };
}

export function setOilId(recipe, index, oilId) {
  return {
    ...recipe,
    oils: recipe.oils.map((o, i) => (i === index ? { ...o, id: oilId } : o)),
  };
}

export function cloneRecipe(recipe) {
  return {
    ...structuredClone(recipe),
    id: generateId(),
    name: `${recipe.name} (نسخة)`,
    updatedAt: new Date().toISOString(),
  };
}

/** يعيد أسماء المكونات المكررة في الوصفة (إن وُجدت)، لعرض التنبيه في الواجهة. */
export function duplicateOilIds(recipe) {
  const count = new Map();
  for (const o of recipe.oils) count.set(o.id, (count.get(o.id) || 0) + 1);
  return [...count].filter(([, c]) => c > 1).map(([id]) => id);
}

/** تحويل إلى نص JSON للتصدير. */
export function serializeRecipe(recipe) {
  return JSON.stringify({ format: 'soap-calc-ar', ...normalizeRecipe(recipe).recipe }, null, 2);
}

/** استيراد من نص JSON. يعيد { ok, recipe, errors } ويتحقق من الشكل. */
export function parseRecipeJson(text) {
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    return { ok: false, recipe: null, errors: ['الملف ليس JSON صالحًا.'] };
  }
  if (!data || typeof data !== 'object' || data.format !== 'soap-calc-ar') {
    return { ok: false, recipe: null, errors: ['الملف ليس وصفة صابون صالحة لهذا التطبيق.'] };
  }
  if (!Array.isArray(data.oils)) {
    return { ok: false, recipe: null, errors: ['الوصفة لا تحتوي على قائمة مكونات.'] };
  }
  const { recipe, errors } = normalizeRecipe({ ...data, id: undefined });
  return { ok: true, recipe: { ...recipe, id: generateId() }, errors };
}
