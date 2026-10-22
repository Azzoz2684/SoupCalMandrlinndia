import { MW, KOH_PER_NAOH } from './constants.js';
import { OILS, findOil, sapKOHFromNaOH, isVerified, statusLabel } from './oils.js';

/*
 * محرك حسابات التصبن. لا يعتمد على الواجهة، ولا يقرأ من DOM أو التخزين.
 *
 * المدخلات (النسب بالمئة 0–100، والأوزان بالغرام):
 * {
 *   oils: [{ id: string, weight: number }],
 *   alkali: {
 *     type: 'NaOH' | 'KOH' | 'MIX',
 *     purity: { NaOH: number, KOH: number },   // نقاوة كل قلوي، بالمئة
 *     mixNaOHShare: number,                     // في خليط NaOH+KOH: نسبة مكافئ NaOH، بالمئة
 *     liquidNaOH: { enabled: boolean, concentration: number }, // محلول NaOH جاهز، تركيزه بالمئة
 *   },
 *   superfat: number,          // الدهون الزائدة، بالمئة من القلوي المحسوب
 *   concentration: number,     // تركيز المحلول: المادة الصلبة النقية / (المادة + الماء)، بالمئة
 *   waterMode: 'concentration' | 'ratio',
 *   waterRatio: number,        // نسبة الماء إلى القلوي الصلب (كتلة:كتلة)، تُستخدم عند waterMode = 'ratio'
 * }
 *
 * الصيغ المعتمدة:
 *   E        = Σ (وزن الزيت × SAP_NaOH) × (1 − الدهون الزائدة/100)     [مكافئ NaOH النقي]
 *   NaOH_pure = f × E                          f = نسبة NaOH في الخليط (1 للـNaOH، 0 للـKOH)
 *   KOH_pure  = (1 − f) × E × (MW_KOH / MW_NaOH)
 *   NaOH_actual = NaOH_pure / (نقاوة NaOH)     مستقلة عن قيمة التصبن
 *   KOH_actual  = KOH_pure  / (نقاوة KOH)
 *   المادة النقية الكلية S = NaOH_pure + KOH_pure
 *   الماء (بالتركيز)  W = S × (1 − c) / c      حيث c = التركيز كنسبة عشرية
 *   الماء (بالنسبة)   W = النسبة × NaOH_actual + KOH_actual (تُطبَّق على القلوي الصلب الفعلي)
 *   المحلول الجاهز: كتلته = NaOH_pure / k، والماء الموجود فيه = كتلته − NaOH_pure، والماء المضاف = max(0, W − الماء الموجود)
 */

const KOH_RATIO = KOH_PER_NAOH;

function isFiniteNumber(v) {
  return typeof v === 'number' && Number.isFinite(v);
}

function err(code, message, field) {
  return { code, message, field: field || null };
}

function warn(code, message, field) {
  return { code, message, field: field || null };
}

/** يتحقق من المدخلات ويعيد الأخطاء والتحذيرات، دون أي حساب. */
export function validateInput(input, oilsDb = OILS) {
  const errors = [];
  const warnings = [];
  const r = input || {};

  // الزيوت
  const oils = Array.isArray(r.oils) ? r.oils : [];
  if (oils.length === 0) {
    errors.push(err('no_oils', 'أضف زيتًا أو دهنًا واحدًا على الأقل.', 'oils'));
  }
  const seen = new Map();
  oils.forEach((row, i) => {
    const db = row ? findOil(row.id, oilsDb) : null;
    if (!db) {
      errors.push(err('unknown_oil', `المكوّن رقم ${i + 1} غير موجود في قاعدة البيانات.`, 'oils'));
    }
    if (!isFiniteNumber(row?.weight)) {
      errors.push(err('weight_not_number', `وزن المكوّن رقم ${i + 1} ليس رقمًا صالحًا.`, 'oils'));
    } else if (row.weight <= 0) {
      errors.push(err('weight_not_positive', `وزن المكوّن رقم ${i + 1} يجب أن يكون أكبر من صفر.`, 'oils'));
    }
    if (row?.id) seen.set(row.id, (seen.get(row.id) || 0) + 1);
  });
  for (const [id, count] of seen) {
    if (count > 1) {
      const name = findOil(id, oilsDb)?.ar || id;
      warnings.push(warn('duplicate_oil', `المكوّن "${name}" مضاف أكثر من مرة. هذا مسموح عند الحاجة، تأكد أنه مقصود.`, 'oils'));
    }
  }

  // الدهون الزائدة
  const sf = r.superfat;
  if (!isFiniteNumber(sf) || sf < 0 || sf >= 100) {
    errors.push(err('superfat_range', 'نسبة الدهون الزائدة يجب أن تكون رقمًا بين 0 و 100 (دون 100).', 'superfat'));
  } else if (sf > 10) {
    warnings.push(warn('superfat_high', 'نسبة الدهون الزائدة مرتفعة (أكثر من 10%)، وقد تؤدي إلى صابون لين أو زيتي.', 'superfat'));
  }

  // التركيز
  const c = r.concentration;
  if (!isFiniteNumber(c) || c <= 0 || c >= 100) {
    errors.push(err('concentration_range', 'تركيز المحلول يجب أن يكون رقمًا أكبر من 0 وأقل من 100.', 'concentration'));
  }

  // وضع الماء
  if (r.waterMode !== 'concentration' && r.waterMode !== 'ratio') {
    errors.push(err('water_mode', 'طريقة حساب الماء غير معروفة.', 'waterMode'));
  }
  if (r.waterMode === 'ratio') {
    if (!isFiniteNumber(r.waterRatio) || r.waterRatio < 0) {
      errors.push(err('water_ratio', 'نسبة الماء إلى القلوي يجب أن تكون رقمًا صفرًا أو أكبر.', 'waterRatio'));
    }
  }

  // القلوي
  const a = r.alkali || {};
  const type = a.type;
  if (type !== 'NaOH' && type !== 'KOH' && type !== 'MIX') {
    errors.push(err('alkali_type', 'نوع المادة القلوية غير معروف.', 'alkali'));
  }
  const pur = a.purity || {};
  for (const key of ['NaOH', 'KOH']) {
    const p = pur[key];
    const needed = type === 'MIX' || type === key;
    if (needed && (!isFiniteNumber(p) || p <= 0 || p > 100)) {
      errors.push(err('purity_range', `نقاوة ${key} يجب أن تكون رقمًا أكبر من 0 وحتى 100.`, 'purity'));
    }
  }
  if (type === 'MIX') {
    const s = a.mixNaOHShare;
    if (!isFiniteNumber(s) || s < 0 || s > 100) {
      errors.push(err('mix_share', 'نسبة NaOH في الخليط يجب أن تكون بين 0 و 100.', 'alkali'));
    }
  }

  const liquid = a.liquidNaOH;
  if (liquid?.enabled) {
    if (type !== 'NaOH') {
      errors.push(err('liquid_only_naoh', 'المحلول الجاهز متاح لـ NaOH فقط.', 'alkali'));
    }
    if (!isFiniteNumber(liquid.concentration) || liquid.concentration <= 0 || liquid.concentration >= 100) {
      errors.push(err('liquid_concentration', 'تركيز المحلول الجاهز يجب أن يكون أكبر من 0 وأقل من 100.', 'alkali'));
    }
    if (r.waterMode === 'ratio') {
      errors.push(err('liquid_ratio_unsupported', 'نسبة الماء إلى القلوي غير مدعومة مع المحلول الجاهز. استخدم طريقة التركيز.', 'waterMode'));
    }
  }

  return { errors, warnings };
}

/** يحسب الوصفة. يُرجع دائمًا كائنًا بالشكل { ok, errors, warnings, reliable, result }. */
export function calculate(input, oilsDb = OILS) {
  const { errors, warnings: inputWarnings } = validateInput(input, oilsDb);
  const warnings = [...inputWarnings];
  if (errors.length > 0) {
    return { ok: false, errors, warnings, reliable: false, result: null };
  }

  const r = input;
  const a = r.alkali;
  const sfFrac = r.superfat / 100;
  const cFrac = r.concentration / 100;
  const f = a.type === 'NaOH' ? 1 : a.type === 'KOH' ? 0 : r.alkali.mixNaOHShare / 100;
  const pNaOH = (a.purity?.NaOH ?? 100) / 100;
  const pKOH = (a.purity?.KOH ?? 100) / 100;
  const useLiquid = Boolean(a.liquidNaOH?.enabled);

  // الزيوت وقيم التصبن
  const oilRows = r.oils.map((row) => {
    const db = findOil(row.id, oilsDb);
    return {
      id: db.id,
      ar: db.ar,
      en: db.en,
      weight: row.weight,
      sapNaOH: db.sapNaOH,
      sapKOH: sapKOHFromNaOH(db.sapNaOH),
      verified: isVerified(db),
      status: db.status,
      statusLabel: statusLabel(db.status),
    };
  });
  const oilsTotal = oilRows.reduce((s, o) => s + o.weight, 0);
  oilRows.forEach((o) => {
    o.percent = (o.weight / oilsTotal) * 100;
  });

  const unverified = oilRows.filter((o) => !o.verified);
  if (unverified.length > 0) {
    const names = [...new Set(unverified.map((o) => `${o.ar} (${o.statusLabel})`))].join('، ');
    warnings.push(warn('unverified_sap', `قيم التصبن التالية غير متفق عليها بين مصدرين: ${names}. النتيجة تقريبية، ولا تُعتمد للإنتاج قبل التحقق من شهادة التحليل.`, 'oils'));
  }

  // مكافئ NaOH النقي
  const E = oilRows.reduce((s, o) => s + o.weight * o.sapNaOH, 0) * (1 - sfFrac);

  // القلوي النقي
  const naohPure = f * E;
  const kohPure = (1 - f) * E * KOH_RATIO;

  // القلوي الفعلي
  let naohActual = naohPure / pNaOH;
  let kohActual = kohPure / pKOH;

  let lyeSolute = naohPure + kohPure; // المادة النقية الكلية
  let lyeActualSolid = naohActual + kohActual;
  let waterFromLye = 0;
  let waterTarget;
  let waterAdded;
  let liquidMass = null;
  let liquidWaterIncluded = 0;

  if (useLiquid) {
    const k = a.liquidNaOH.concentration / 100;
    liquidMass = naohPure / k;
    liquidWaterIncluded = liquidMass - naohPure;
    naohActual = liquidMass; // الكتلة الفعلية للمحلول المستخدم
    kohActual = 0;
    lyeActualSolid = 0; // لا توجد مادة صلبة في وضع المحلول
  }

  if (r.waterMode === 'ratio') {
    waterTarget = r.waterRatio * lyeActualSolid;
    waterFromLye = 0;
    waterAdded = waterTarget;
  } else {
    waterTarget = lyeSolute * (1 - cFrac) / cFrac;
    if (useLiquid) {
      waterFromLye = liquidWaterIncluded;
      waterAdded = waterTarget - liquidWaterIncluded;
      if (waterAdded < -1e-9) {
        return {
          ok: false,
          errors: [err('liquid_too_weak', 'تركيز المحلول الجاهز أضعف من التركيز المطلوب، لا يمكن الوصول إليه بإضافة ماء فقط. ارفع تركيز المحلول أو اخفض تركيز الوصفة.', 'alkali')],
          warnings,
          reliable: false,
          result: null,
        };
      }
      waterAdded = Math.max(0, waterAdded);
    } else {
      waterAdded = waterTarget;
    }
  }

  const waterTotal = waterFromLye + waterAdded;
  const lyeBatchMass = useLiquid ? liquidMass : (naohActual + kohActual);
  const batchTotal = oilsTotal + lyeBatchMass + waterAdded;
  const actualConcentration = lyeSolute / (lyeSolute + waterTotal) * 100;
  const waterToLyeRatio = lyeActualSolid > 0 ? waterTotal / lyeActualSolid : null;

  return {
    ok: true,
    errors: [],
    warnings,
    reliable: unverified.length === 0,
    result: {
      oilsTotal,
      oils: oilRows,
      alkali: {
        type: a.type,
        naohPure,
        kohPure,
        naohActual: useLiquid ? 0 : naohActual,
        kohActual: useLiquid ? 0 : kohActual,
        solidTotal: lyeActualSolid,
        liquid: useLiquid ? { mass: liquidMass, concentration: a.liquidNaOH.concentration, waterIncluded: liquidWaterIncluded } : null,
      },
      superfat: r.superfat,
      concentration: r.concentration,
      waterMode: r.waterMode,
      waterTotal,
      waterAdded,
      waterFromLye,
      lyeSolute,
      actualConcentration,
      waterToLyeRatio,
      batchTotal,
      saponificationEquivalentNaOH: E,
    },
  };
}
