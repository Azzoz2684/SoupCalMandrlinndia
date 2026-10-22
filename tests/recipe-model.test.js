import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  parseNumber, createEmptyRecipe, normalizeRecipe, addOil, removeOil, setOilWeight,
  cloneRecipe, duplicateOilIds, serializeRecipe, parseRecipeJson, toGrams, fromGrams, WEIGHT_UNITS,
} from '../src/recipe-model.js';
import { createRecipeStore } from '../src/storage.js';
import { OILS } from '../src/oils.js';

function memoryStore(initial = {}) {
  const data = new Map(Object.entries(initial));
  return {
    getItem: (k) => (data.has(k) ? data.get(k) : null),
    setItem: (k, v) => data.set(k, String(v)),
    removeItem: (k) => data.delete(k),
  };
}

describe('تحويل الأرقام', () => {
  test('الأرقام العربية-الهندية', () => assert.equal(parseNumber('١٢٫٥'), 12.5));
  test('الفاصلة الإنجليزية كفاصلة عشرية', () => assert.equal(parseNumber('12,5'), 12.5));
  test('الفاصلة العربية', () => assert.equal(parseNumber('12،5'), 12.5));
  test('رقم سالب', () => assert.equal(parseNumber('-3'), -3));
  test('نص غير رقمي', () => assert.ok(Number.isNaN(parseNumber('abc'))));
  test('نص فارغ', () => assert.ok(Number.isNaN(parseNumber(''))));
  test('أرقام مختلطة بنص', () => assert.ok(Number.isNaN(parseNumber('100g'))));
});

describe('تحويل الوحدات', () => {
  test('1 كيلوغرام = 1000 غرام', () => assert.equal(toGrams(1, 'kg'), 1000));
  test('1 رطل = 453.59237 غرام', () => assert.ok(Math.abs(toGrams(1, 'lb') - 453.59237) < 1e-9));
  test('1 أونصة = 28.349523125 غرام', () => assert.ok(Math.abs(toGrams(1, 'oz') - 28.349523125) < 1e-9));
  test('التحويل ذهابًا وإيابًا لا يفقد الدقة', () => {
    for (const u of Object.keys(WEIGHT_UNITS)) {
      assert.ok(Math.abs(fromGrams(toGrams(123.456, u), u) - 123.456) < 1e-9, u);
    }
  });
  test('وحدة غير معروفة تعطي NaN لا رقمًا خاطئًا', () => {
    assert.ok(Number.isNaN(toGrams(1, 'stone')));
    assert.ok(Number.isNaN(fromGrams(10, 'stone')));
  });
});

describe('الوصفة', () => {
  test('الوصفة الجديدة لها قيم افتراضية صالحة', () => {
    const r = createEmptyRecipe();
    assert.equal(r.oils.length, 0);
    assert.equal(r.alkali.type, 'NaOH');
    assert.equal(r.superfat, 5);
    assert.equal(r.concentration, 30);
  });

  test('إضافة وتعديل وحذف مكوّن', () => {
    let r = createEmptyRecipe();
    r = addOil(r, 'olive', 100, OILS);
    r = addOil(r, 'coconut', 50, OILS);
    assert.equal(r.oils.length, 2);
    r = setOilWeight(r, 0, 200);
    assert.equal(r.oils[0].weight, 200);
    r = removeOil(r, 1);
    assert.equal(r.oils.length, 1);
  });

  test('لا تُضاف زيوت غير موجودة في القاعدة', () => {
    assert.equal(addOil(createEmptyRecipe(), 'ghost', 10, OILS).oils.length, 0);
  });

  test('إضافة مكوّن من قاعدة مخصصة (يدوي) تعمل حين تُمرَّر القاعدة', () => {
    const db = [...OILS, { id: 'c1', ar: 'يدوي', sapNaOH: 0.13, status: 'manual' }];
    assert.equal(addOil(createEmptyRecipe(), 'c1', 100, db).oils.length, 1);
  });

  test('إعادة استخدام المكوّن مسموحة وتُكتشف للتنبيه', () => {
    let r = createEmptyRecipe();
    r = addOil(r, 'olive', 100, OILS);
    r = addOil(r, 'olive', 50, OILS);
    assert.deepEqual(duplicateOilIds(r), ['olive']);
  });

  test('النسخ يعطي معرّفًا جديدًا ويحتفظ بالمحتوى ويكون مستقلًا', () => {
    const r = createEmptyRecipe({ name: 'أ', oils: [{ id: 'olive', weight: 100 }] });
    const c = cloneRecipe(r);
    assert.notEqual(c.id, r.id);
    assert.equal(c.name, 'أ (نسخة)');
    c.oils[0].weight = 999;
    assert.equal(r.oils[0].weight, 100);
  });

  test('قيمة رقمية تالفة تُستبدل بالافتراضي وتُسجَّل', () => {
    const { recipe, errors } = normalizeRecipe({ superfat: 'abc', concentration: 40 });
    assert.equal(recipe.superfat, 5);
    assert.equal(recipe.concentration, 40);
    assert.ok(errors.some((e) => e.includes('الدهون الزائدة')));
  });

  test('نوع قلوي غير معروف يُستبدل بـ NaOH', () => {
    assert.equal(normalizeRecipe({ alkali: { type: 'LiOH' } }).recipe.alkali.type, 'NaOH');
  });

  test('اسم فارغ يُستبدل باسم افتراضي', () => {
    assert.equal(normalizeRecipe({ name: '   ' }).recipe.name, 'وصفة بدون اسم');
  });
});

describe('التصدير والاستيراد', () => {
  test('تصدير ثم استيراد يحفظ كل البيانات', () => {
    const original = createEmptyRecipe({
      name: 'صابون الزيتون',
      notes: 'ملاحظات',
      oils: [{ id: 'olive', weight: 60 }, { id: 'coconut', weight: 40 }],
      alkali: { type: 'MIX', purity: { NaOH: 98, KOH: 90 }, mixNaOHShare: 40, liquidNaOH: { enabled: false, concentration: 50 } },
      superfat: 6, concentration: 33, waterMode: 'ratio', waterRatio: 2.5,
    });
    const parsed = parseRecipeJson(serializeRecipe(original));
    assert.equal(parsed.ok, true);
    assert.equal(parsed.errors.length, 0);
    const { id, updatedAt, ...a } = original;
    const { id: id2, updatedAt: u2, ...b } = parsed.recipe;
    assert.deepEqual(b, a);
    assert.notEqual(id2, id);
  });

  test('ملف JSON تالف يُرفض بوضوح', () => {
    const r = parseRecipeJson('{bad');
    assert.equal(r.ok, false);
    assert.ok(r.errors[0].includes('JSON'));
  });

  test('ملف JSON صالح لكنه ليس وصفة يُرفض', () => {
    assert.equal(parseRecipeJson('{"a":1}').ok, false);
  });
});

describe('التخزين المحلي', () => {
  test('حفظ ثم استعادة وصفة دون فقدان', () => {
    const store = createRecipeStore(memoryStore());
    const saved = store.save(createEmptyRecipe({ name: 'تجربة', oils: [{ id: 'olive', weight: 250 }], superfat: 4 }));
    const loaded = store.get(saved.id);
    assert.equal(loaded.name, 'تجربة');
    assert.deepEqual(loaded.oils, [{ id: 'olive', weight: 250 }]);
    assert.equal(loaded.superfat, 4);
  });

  test('الحفظ مرتين لنفس المعرّف يحدّث الوصفة ولا يكررها', () => {
    const store = createRecipeStore(memoryStore());
    const r = store.save(createEmptyRecipe({ name: 'أ' }));
    store.save({ ...r, name: 'ب' });
    assert.equal(store.list().length, 1);
    assert.equal(store.get(r.id).name, 'ب');
  });

  test('الحذف يزيل الوصفة الصحيحة فقط', () => {
    const store = createRecipeStore(memoryStore());
    const a = store.save(createEmptyRecipe({ name: 'أ' }));
    const b = store.save(createEmptyRecipe({ name: 'ب' }));
    store.remove(a.id);
    assert.equal(store.get(a.id), null);
    assert.equal(store.get(b.id).name, 'ب');
  });

  test('بيانات تالفة في التخزين لا تُسقط التطبيق وتُبلَّغ', () => {
    const store = createRecipeStore(memoryStore({ 'soapcalc:recipes:v1': '{not json' }));
    assert.deepEqual(store.list(), []);
    assert.equal(store.isCorrupt(), true);
  });

  test('المسودة تُحفظ وتُستعاد وتُمسح', () => {
    const store = createRecipeStore(memoryStore());
    store.saveDraft(createEmptyRecipe({ name: 'مسودة', oils: [{ id: 'palm', weight: 80 }] }));
    assert.equal(store.loadDraft().name, 'مسودة');
    store.clearDraft();
    assert.equal(store.loadDraft(), null);
  });

  test('المكوّنات اليدوية تُحفظ وتُحذف وتُقرأ بشكل صحيح', () => {
    const store = createRecipeStore(memoryStore());
    store.saveCustomOil({ id: 'c1', ar: 'يدوي', en: 'M', sapNaOH: 0.13, status: 'manual', category: 'x', spreadNaOH: 0, note: 'n' });
    assert.equal(store.listCustomOils().length, 1);
    assert.equal(store.listCustomOils()[0].status, 'manual');
    store.removeCustomOil('c1');
    assert.equal(store.listCustomOils().length, 0);
  });

  test('المكوّن اليدوي التالف أو غير الصالح يُتجاهل عند القراءة', () => {
    const store = createRecipeStore(memoryStore({
      'soapcalc:custom-oils:v1': JSON.stringify([{ id: 'x', sapNaOH: 'bad', status: 'manual' }, { id: 'y', sapNaOH: 0.13, status: 'cross-checked' }]),
    }));
    assert.deepEqual(store.listCustomOils(), []);
  });

  test('الإعدادات تُحفظ وتُعاد، ووحدة غير معروفة تعود إلى الغرام', () => {
    const mem = memoryStore();
    const store = createRecipeStore(mem);
    assert.equal(store.getSettings().unit, 'g');
    store.saveSettings({ unit: 'lb' });
    assert.equal(store.getSettings().unit, 'lb');
    mem.setItem('soapcalc:settings:v1', JSON.stringify({ unit: 'stone' }));
    assert.equal(store.getSettings().unit, 'g');
  });
});
