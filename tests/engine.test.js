import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { calculate, validateInput } from '../src/engine.js';
import { sapKOHFromNaOH, findOil } from '../src/oils.js';

/*
 * القيم المتوقعة هنا محسوبة يدويًا من الصيغ المعتمدة (انظر رأس engine.js)،
 * وتستخدم قيم التصبن الثابتة كما هي (زيتون 0.135، جوز هند 0.183)، ولا تأتي من مخرجات المحرك.
 * ثابت KOH/NaOH = 56.1056 / 39.9971 = 1.4027417.
 */

const base = (over = {}) => ({
  oils: [{ id: 'olive', weight: 100 }],
  alkali: { type: 'NaOH', purity: { NaOH: 100, KOH: 100 }, mixNaOHShare: 50, liquidNaOH: { enabled: false, concentration: 50 } },
  superfat: 0,
  concentration: 30,
  waterMode: 'concentration',
  waterRatio: 2,
  ...over,
});

const close = (actual, expected, tol = 1e-3, msg = '') =>
  assert.ok(Math.abs(actual - expected) <= tol, `${msg} expected ${expected} got ${actual}`);

const ok = (input) => {
  const r = calculate(input);
  assert.equal(r.ok, true, `expected ok, errors: ${JSON.stringify(r.errors)}`);
  return r.result;
};
const fails = (input, code) => {
  const r = calculate(input);
  assert.equal(r.ok, false, 'expected failure');
  assert.ok(r.errors.some((e) => e.code === code), `expected ${code}, got ${r.errors.map((e) => e.code)}`);
};

describe('NaOH الأساسي', () => {
  test('زيت واحد، بلا دهون زائدة، نقاوة 100%، تركيز 30%', () => {
    const r = ok(base());
    close(r.alkali.naohActual, 13.5, 1e-9, 'NaOH');
    close(r.waterTotal, 31.5, 1e-9, 'water');          // 13.5 × (1/0.30 − 1)
    close(r.batchTotal, 145.0, 1e-9, 'batch');
  });

  test('الدهون الزائدة 5% تقلل القلوي إلى 95%', () => {
    const r = ok(base({ superfat: 5 }));
    close(r.alkali.naohActual, 12.825, 1e-9);
    close(r.waterTotal, 29.925, 1e-6);
    close(r.batchTotal, 142.75, 1e-6);
  });

  test('النقاوة 99% تقسم الكمية الفعلية، والماء يبقى مبنيًا على المادة النقية', () => {
    const r = ok(base({ superfat: 5, alkali: { ...base().alkali, purity: { NaOH: 99, KOH: 100 } } }));
    close(r.alkali.naohPure, 12.825, 1e-9, 'pure');
    close(r.alkali.naohActual, 12.825 / 0.99, 1e-6, 'actual');
    close(r.waterTotal, 29.925, 1e-6, 'water unchanged by purity');
    close(r.batchTotal, 100 + 12.825 / 0.99 + 29.925, 1e-6);
  });

  test('تغيير وزن الزيت يغيّر القلوي خطيًا', () => {
    const r1 = ok(base());
    const r2 = ok(base({ oils: [{ id: 'olive', weight: 200 }] }));
    close(r2.alkali.naohActual, 2 * r1.alkali.naohActual, 1e-9);
  });
});

describe('KOH والخليط', () => {
  test('KOH بنقاوة 100% مشتق بالنسبة المولية', () => {
    const r = ok(base({ alkali: { ...base().alkali, type: 'KOH' } }));
    close(r.alkali.kohActual, 18.93701, 1e-4, 'KOH');     // 13.5 × 1.4027417
    close(r.alkali.naohActual, 0, 1e-12);
    close(r.waterTotal, 44.18637, 1e-4, 'water');         // 18.93701 × 7/3
  });

  test('خليط 50/50 يقسم المكافئ ولا يعامل KOH كأنه NaOH', () => {
    const r = ok(base({ alkali: { ...base().alkali, type: 'MIX', mixNaOHShare: 50 } }));
    close(r.alkali.naohPure, 6.75, 1e-9);
    close(r.alkali.kohPure, 9.46851, 1e-4);
  });

  test('قيمة KOH المشتقة من زيت الزيتون داخل النطاق المنشور 184–196 ملغ/غ', () => {
    const koh = sapKOHFromNaOH(0.135) * 1000;
    assert.ok(koh >= 184 && koh <= 196, `KOH SAP ${koh} outside 184–196`);
    close(koh, 189.37, 0.01);
  });
});

describe('خليط عدة زيوت', () => {
  test('زيتون 60 غ وجوز هند 40 غ', () => {
    const r = ok(base({ oils: [{ id: 'olive', weight: 60 }, { id: 'coconut', weight: 40 }] }));
    close(r.alkali.naohPure, 15.42, 1e-9);     // 60×0.135 + 40×0.183
    close(r.waterTotal, 35.98, 1e-6);
    close(r.batchTotal, 151.40, 1e-6);
    close(r.oils[0].percent, 60, 1e-9);
    close(r.oils[1].percent, 40, 1e-9);
  });
});

describe('طريقة الماء: التركيز مقابل النسبة', () => {
  test('نسبة 2:1 تعطي ماءً = 2 × القلوي الصلب، ولا تتأثر بالتركيز', () => {
    const r = ok(base({ waterMode: 'ratio', waterRatio: 2 }));
    close(r.waterTotal, 27, 1e-9);
    close(r.batchTotal, 140.5, 1e-9);
    close(r.waterToLyeRatio, 2, 1e-9);
  });

  test('التركيز الفعلي يساوي التركيز المطلوب في طريقة التركيز', () => {
    const r = ok(base({ superfat: 7, alkali: { ...base().alkali, type: 'MIX', mixNaOHShare: 30 } }));
    close(r.actualConcentration, 30, 1e-9);
  });
});

describe('المحلول الجاهز لـ NaOH', () => {
  test('محلول 50% يعطي الكتلة والماء الموجود فيه، ويُكمَّل الناقص', () => {
    const r = ok(base({ alkali: { ...base().alkali, liquidNaOH: { enabled: true, concentration: 50 } } }));
    close(r.alkali.liquid.mass, 27, 1e-9);
    close(r.alkali.liquid.waterIncluded, 13.5, 1e-9);
    close(r.waterAdded, 18, 1e-9);
  });

  test('المحلول الجاهز بالتركيز المطلوب يعطي نفس الوزن الكلي للمادة الصلبة', () => {
    const solid = ok(base());
    const liquid = ok(base({ alkali: { ...base().alkali, liquidNaOH: { enabled: true, concentration: 50 } } }));
    close(liquid.batchTotal, solid.batchTotal, 1e-9);
  });

  test('محلول أضعف من التركيز المطلوب يُرفض بخطأ واضح', () => {
    fails(base({ alkali: { ...base().alkali, liquidNaOH: { enabled: true, concentration: 25 } } }), 'liquid_too_weak');
  });
});

describe('التحقق من المدخلات', () => {
  test('لا توجد زيوت', () => fails(base({ oils: [] }), 'no_oils'));
  test('وزن سالب', () => fails(base({ oils: [{ id: 'olive', weight: -5 }] }), 'weight_not_positive'));
  test('وزن صفر', () => fails(base({ oils: [{ id: 'olive', weight: 0 }] }), 'weight_not_positive'));
  test('وزن غير رقمي', () => fails(base({ oils: [{ id: 'olive', weight: NaN }] }), 'weight_not_number'));
  test('وزن نصي بدل الرقم', () => fails(base({ oils: [{ id: 'olive', weight: '100' }] }), 'weight_not_number'));
  test('مكوّن غير موجود', () => fails(base({ oils: [{ id: 'unknown', weight: 10 }] }), 'unknown_oil'));
  test('دهون زائدة 100% أو أكثر', () => fails(base({ superfat: 100 }), 'superfat_range'));
  test('دهون زائدة سالبة', () => fails(base({ superfat: -1 }), 'superfat_range'));
  test('تركيز صفر', () => fails(base({ concentration: 0 }), 'concentration_range'));
  test('تركيز 100% أو أكثر', () => fails(base({ concentration: 100 }), 'concentration_range'));
  test('نقاوة صفر', () => fails(base({ alkali: { ...base().alkali, purity: { NaOH: 0, KOH: 100 } } }), 'purity_range'));
  test('نقاوة أكبر من 100', () => fails(base({ alkali: { ...base().alkali, purity: { NaOH: 150, KOH: 100 } } }), 'purity_range'));
  test('نسبة خليط خارج النطاق', () => fails(base({ alkali: { ...base().alkali, type: 'MIX', mixNaOHShare: 120 } }), 'mix_share'));
  test('نوع قلوي غير معروف', () => fails(base({ alkali: { ...base().alkali, type: 'LiOH' } }), 'alkali_type'));
  test('المحلول الجاهز مع KOH مرفوض', () => fails(base({ alkali: { ...base().alkali, type: 'KOH', liquidNaOH: { enabled: true, concentration: 50 } } }), 'liquid_only_naoh'));
  test('المحلول الجاهز مع نسبة الماء مرفوض', () => fails(base({ waterMode: 'ratio', alkali: { ...base().alkali, liquidNaOH: { enabled: true, concentration: 50 } } }), 'liquid_ratio_unsupported'));
  test('نسبة ماء سالبة مرفوضة', () => fails(base({ waterMode: 'ratio', waterRatio: -1 }), 'water_ratio'));
  test('المدخلات الفارغة (null) لا تُسقط المحرك', () => {
    const r = calculate(null);
    assert.equal(r.ok, false);
    assert.equal(r.result, null);
  });
  test('validateInput لا يحسب شيئًا ويعيد الأخطاء فقط', () => {
    const v = validateInput(base({ superfat: 200 }));
    assert.ok(v.errors.length >= 1);
    assert.equal('result' in v, false);
  });
});

describe('الوسوم والتحذيرات', () => {
  test('زيتون (موثّق بمصدرين) يعطي نتيجة موثوقة دون تحذير', () => {
    const r = calculate(base());
    assert.equal(r.reliable, true);
    assert.equal(r.warnings.some((w) => w.code === 'unverified_sap'), false);
    assert.equal(r.result.oils[0].verified, true);
    assert.equal(r.result.oils[0].statusLabel, 'متفق عليه بين مصدرين');
  });

  test('زيت مختلف عليه بين المصادر يجعل النتيجة تقريبية مع تحذير', () => {
    const r = calculate(base({ oils: [{ id: 'grapeseed', weight: 100 }] }));
    assert.equal(r.ok, true);
    assert.equal(r.reliable, false);
    assert.ok(r.warnings.some((w) => w.code === 'unverified_sap'));
    assert.equal(r.result.oils[0].verified, false);
  });

  test('مكوّن يدوي (manual) لا يُعد موثقًا', () => {
    const db = [{ id: 'm', ar: 'يدوي', en: 'Manual', category: 'x', sapNaOH: 0.13, status: 'manual', sources: [] }];
    const r = calculate({ ...base(), oils: [{ id: 'm', weight: 100 }] }, db);
    assert.equal(r.reliable, false);
  });

  test('زيت موثّق في قاعدة بديلة يعطي نتيجة موثوقة', () => {
    const db = [{ id: 'x', ar: 'اختبار', en: 'Test', category: 'زيوت', sapNaOH: 0.1, status: 'cross-checked', sources: [] }];
    const r = calculate({ ...base(), oils: [{ id: 'x', weight: 100 }] }, db);
    assert.equal(r.reliable, true);
    assert.equal(r.warnings.length, 0);
  });

  test('الدهون الزائدة المرتفعة تُحذَّر ولا تُرفض', () => {
    const r = calculate(base({ superfat: 15 }));
    assert.equal(r.ok, true);
    assert.ok(r.warnings.some((w) => w.code === 'superfat_high'));
  });

  test('تكرار المكوّن نفسه تحذير لا خطأ', () => {
    const r = calculate(base({ oils: [{ id: 'olive', weight: 50 }, { id: 'olive', weight: 50 }] }));
    assert.equal(r.ok, true);
    assert.ok(r.warnings.some((w) => w.code === 'duplicate_oil'));
  });
});

describe('سلامة المخرجات', () => {
  test('لا تظهر قيم NaN أو Infinity لأي مدخل صالح', () => {
    const cases = [
      base(),
      base({ superfat: 0, concentration: 99 }),
      base({ superfat: 12, waterMode: 'ratio', waterRatio: 0 }),
      base({ alkali: { ...base().alkali, type: 'KOH', purity: { NaOH: 100, KOH: 1 } } }),
      base({ alkali: { ...base().alkali, type: 'MIX', mixNaOHShare: 0 } }),
      base({ alkali: { ...base().alkali, type: 'MIX', mixNaOHShare: 100 } }),
    ];
    for (const c of cases) {
      const r = calculate(c);
      assert.equal(r.ok, true, JSON.stringify(r.errors));
      assert.ok(!/NaN|Infinity/.test(JSON.stringify(r.result)));
    }
  });

  test('الحساب حتمي', () => {
    assert.deepEqual(calculate(base({ superfat: 3 })), calculate(base({ superfat: 3 })));
  });

  test('الحساب لا يعدّل المدخل', () => {
    const input = base();
    const snapshot = JSON.stringify(input);
    calculate(input);
    assert.equal(JSON.stringify(input), snapshot);
  });

  test('المكوّن الموجود في القاعدة يُسترجع', () => {
    assert.ok(findOil('olive'));
    assert.equal(findOil('nope'), null);
  });
});
