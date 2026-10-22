import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { OILS, SOURCES, isVerified, statusLabel, createCustomOil } from '../src/oils.js';

const STATUSES = new Set(['cross-checked', 'disputed', 'single-source', 'manual']);

describe('سلامة قاعدة بيانات الزيوت', () => {
  test('المعرّفات فريدة', () => {
    const ids = OILS.map((o) => o.id);
    assert.equal(new Set(ids).size, ids.length);
  });

  test('كل مكوّن له اسم عربي وتصنيف', () => {
    for (const o of OILS) {
      assert.ok(o.ar && o.ar.trim().length > 1, `${o.id}: missing Arabic name`);
      assert.ok(o.category, `${o.id}: missing category`);
    }
  });

  test('قيم التصبن ضمن نطاق معقول للدهون والزيوت والشموع', () => {
    for (const o of OILS) {
      assert.ok(o.sapNaOH >= 0.03 && o.sapNaOH <= 0.3, `${o.id}: sapNaOH ${o.sapNaOH} out of range`);
    }
  });

  test('كل حالة من الحالات المعروفة', () => {
    for (const o of OILS) assert.ok(STATUSES.has(o.status), `${o.id}: unknown status ${o.status}`);
  });

  test('"موثّق" يعني مصدرين متفقين بفرق ≤ 0.002 فقط', () => {
    for (const o of OILS.filter((x) => x.status === 'cross-checked')) {
      assert.equal(o.sources.length, 2, `${o.id}: cross-checked needs two sources`);
      const [a, b] = o.sources.map((s) => s.naoh);
      assert.ok(Math.abs(a - b) <= 0.002 + 1e-9, `${o.id}: spread ${Math.abs(a - b)} > 0.002`);
    }
  });

  test('"خلاف بين المصدرين" يعني فرقًا أكبر من 0.002', () => {
    for (const o of OILS.filter((x) => x.status === 'disputed')) {
      assert.equal(o.sources.length, 2, `${o.id}: disputed needs two sources`);
      const [a, b] = o.sources.map((s) => s.naoh);
      assert.ok(Math.abs(a - b) > 0.002, `${o.id}: spread too small to be disputed`);
    }
  });

  test('القيمة المعتمدة هي متوسط مصادرها', () => {
    for (const o of OILS.filter((x) => x.sources.length)) {
      const avg = o.sources.reduce((s, x) => s + x.naoh, 0) / o.sources.length;
      assert.ok(Math.abs(o.sapNaOH - avg) <= 0.00005 + 1e-9, `${o.id}: canonical ${o.sapNaOH} vs average ${avg}`);
    }
  });

  test('كل مصدر مُعرَّف في SOURCES وله رابط', () => {
    for (const o of OILS) {
      for (const s of o.sources) {
        assert.ok(SOURCES[s.source], `${o.id}: unknown source ${s.source}`);
        assert.match(SOURCES[s.source].url, /^https:\/\//, `${o.id}: source url must be https`);
      }
    }
  });

  test('مصادر الاستخدام التي يُعرض رابطها لها تاريخ مراجعة', () => {
    for (const [key, src] of Object.entries(SOURCES)) {
      assert.ok(src.retrieved && /^\d{4}-\d{2}-\d{2}$/.test(src.retrieved), `${key}: retrieved date`);
    }
  });

  test('زيت الزيتون موثّق والقيمة داخل النطاق القانوني الكندي للمادة', () => {
    const olive = OILS.find((o) => o.id === 'olive');
    assert.equal(isVerified(olive), true);
    const koh = olive.sources.map((s) => s.koh);
    for (const k of koh) assert.ok(k >= 0.184 && k <= 0.196 + 0.005, `KOH ${k} outside legal range`);
  });

  test('التسميات العربية للحالات', () => {
    assert.equal(statusLabel('cross-checked'), 'متفق عليه بين مصدرين');
    assert.equal(statusLabel('disputed'), 'خلاف بين المصدرين');
    assert.equal(statusLabel('unknown-x'), 'غير موثق');
  });
});

describe('المكوّنات اليدوية', () => {
  test('قبول مكوّن صالح، ولا يُعدّ موثقًا', () => {
    const r = createCustomOil({ ar: 'زيت تجريبي', sapNaOH: 0.135, source: 'شهادة المورّد' }, 'c1');
    assert.equal(r.ok, true);
    assert.equal(r.oil.status, 'manual');
    assert.equal(isVerified(r.oil), false);
  });

  test('رفض اسم فارغ', () => {
    const r = createCustomOil({ ar: '  ', sapNaOH: 0.13, source: 's' }, 'c');
    assert.equal(r.ok, false);
  });

  test('رفض قيمة خارج النطاق أو غير رقمية', () => {
    assert.equal(createCustomOil({ ar: 'x', sapNaOH: 0.5, source: 's' }, 'c').ok, false);
    assert.equal(createCustomOil({ ar: 'x', sapNaOH: 0.01, source: 's' }, 'c').ok, false);
    assert.equal(createCustomOil({ ar: 'x', sapNaOH: NaN, source: 's' }, 'c').ok, false);
    assert.equal(createCustomOil({ ar: 'x', sapNaOH: '0.13', source: 's' }, 'c').ok, false);
  });

  test('يشترط ذكر مصدر لتتبع القيمة', () => {
    const r = createCustomOil({ ar: 'x', sapNaOH: 0.13, source: '' }, 'c');
    assert.equal(r.ok, false);
    assert.ok(r.errors.some((e) => e.includes('مصدر')));
  });
});
