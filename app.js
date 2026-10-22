import { OILS, findOil, statusLabel, isVerified, createCustomOil } from './src/oils.js';
import { calculate } from './src/engine.js';
import {
  createEmptyRecipe, parseNumber, addOil, removeOil, setOilWeight, setOilId,
  cloneRecipe, duplicateOilIds, serializeRecipe, parseRecipeJson,
  WEIGHT_UNITS, toGrams, fromGrams,
} from './src/recipe-model.js';
import { createRecipeStore } from './src/storage.js';

/* ===== الحالة ===== */
const store = createRecipeStore();
let settings = store.getSettings();
let customOils = store.listCustomOils();
let recipe = store.loadDraft() || createEmptyRecipe();
let statusTimer = null;
let deferredInstallPrompt = null;

const $ = (sel) => document.querySelector(sel);
const allOils = () => [...OILS, ...customOils];

/* ===== أدوات العرض ===== */
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const inputVal = (v) => (Number.isFinite(v) ? v : '');
const unitLabel = () => WEIGHT_UNITS[settings.unit].short;

function fmt(n, digits = 2) {
  if (!Number.isFinite(n)) return '—';
  return n.toLocaleString('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits });
}
/** يعرض وزنًا مخزَّنًا بالغرام بالوحدة المختارة. */
/** الكيلوغرام يحتاج منزلتين عشريتين زيادة، لأن منزلتين تُخفيان 10 غرام. */
const weightDigits = () => (settings.unit === 'kg' ? 3 : 2);
const fmtWeight = (grams, digits = weightDigits()) => fmt(fromGrams(grams, settings.unit), digits);
/** قيمة مدخل الوزن بالوحدة المختارة، بلا أصفار زائدة. */
const weightInputValue = (grams) => (Number.isFinite(grams) ? Number(fromGrams(grams, settings.unit).toFixed(4)) : '');

function showStatus(text, isError = false) {
  const el = $('#status');
  el.textContent = text;
  el.classList.toggle('is-error', isError);
  clearTimeout(statusTimer);
  statusTimer = setTimeout(() => { el.textContent = ''; el.classList.remove('is-error'); }, 4500);
}

function persistDraft() { store.saveDraft(recipe); }

function oilOptionsHtml(selectedId) {
  const db = allOils();
  const groups = [...new Set(db.map((o) => o.category))];
  return groups.map((g) => `
    <optgroup label="${esc(g)}">
      ${db.filter((o) => o.category === g).sort((a, b) => a.ar.localeCompare(b.ar, 'ar')).map((o) => `
        <option value="${esc(o.id)}" ${o.id === selectedId ? 'selected' : ''}>${esc(o.ar)} (${esc(o.en)})</option>`).join('')}
    </optgroup>`).join('');
}

/* ===== بناء الواجهة (يُعاد عند تغيير البنية فقط) ===== */
function renderEditor() {
  const a = recipe.alkali;
  const isMix = a.type === 'MIX';
  const usesNaOH = a.type === 'NaOH' || isMix;
  const usesKOH = a.type === 'KOH' || isMix;
  const dupes = duplicateOilIds(recipe);
  const unit = unitLabel();

  $('#editor').innerHTML = `
    <section class="card-block" aria-label="معلومات الوصفة">
      <div class="grid-2">
        <label class="field">
          <span>اسم الوصفة</span>
          <input type="text" id="recipeName" value="${esc(recipe.name)}" maxlength="120">
        </label>
        <label class="field">
          <span>ملاحظات</span>
          <textarea id="recipeNotes" maxlength="2000">${esc(recipe.notes)}</textarea>
        </label>
      </div>
      <div class="grid-3" style="margin-top:1rem">
        <label class="field">
          <span>وحدة الوزن</span>
          <select id="unitSelect">
            ${Object.entries(WEIGHT_UNITS).map(([k, u]) => `<option value="${k}" ${settings.unit === k ? 'selected' : ''}>${esc(u.label)}</option>`).join('')}
          </select>
          <span class="field-hint">تُخزَّن الأوزان داخليًا بالغرام، والتحويل للعرض والإدخال فقط.</span>
        </label>
      </div>
    </section>

    <section class="card-block" aria-labelledby="oils-title">
      <h2 id="oils-title">الزيوت والدهون</h2>
      ${recipe.oils.length === 0 ? '<p class="muted-note">لم تُضَف أي زيوت بعد. اختر مكونًا من القائمة أدناه.</p>' : ''}
      ${dupes.length ? `<div class="msg msg-warn no-print">تكرر في هذه الوصفة: ${dupes.map((id) => esc(findOil(id, allOils())?.ar || id)).join('، ')}. هذا مسموح عند الحاجة.</div>` : ''}
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>المكوّن</th>
              <th>الوزن (${esc(unit)})</th>
              <th>النسبة من الزيوت</th>
              <th>قيمة التصبن (NaOH)</th>
              <th class="no-print">حذف</th>
            </tr>
          </thead>
          <tbody id="oilRows">
            ${recipe.oils.map((row, i) => {
              const db = findOil(row.id, allOils());
              return `
              <tr>
                <td>
                  <select data-oil-id="${i}" aria-label="اختيار المكوّن">${oilOptionsHtml(row.id)}</select>
                  ${db ? `<span class="tag ${isVerified(db) ? 'tag-verified' : 'tag-unverified'}">${esc(statusLabel(db.status))}</span>` : ''}
                </td>
                <td data-label="الوزن (${esc(unit)})"><input type="text" inputmode="decimal" class="num-input" data-oil-weight="${i}" value="${esc(weightInputValue(row.weight))}" aria-label="وزن المكوّن"></td>
                <td data-label="النسبة من الزيوت"><span data-oil-pct="${i}" class="num">—</span></td>
                <td data-label="قيمة التصبن (NaOH)"><span class="num">${db ? fmt(db.sapNaOH, 4) : '—'}</span></td>
                <td class="no-print"><button type="button" class="btn btn-small btn-danger" data-action="remove-oil" data-index="${i}">حذف</button></td>
              </tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>
      <div class="add-row no-print">
        <select id="newOil" aria-label="اختيار مكوّن جديد">${oilOptionsHtml(OILS[0].id)}</select>
        <button type="button" class="btn btn-primary" data-action="add-oil">إضافة مكوّن</button>
      </div>
      <p class="muted-note" style="margin-top:.6rem">يمكن كتابة الأرقام بالعربية أو الإنجليزية، والفاصلة العشرية تُقبل بالشكلين.</p>

      <details class="custom-oil no-print">
        <summary>إضافة مكوّن يدوي (بقيمة من مصدرك)</summary>
        <div class="grid-2" style="margin-top:.75rem">
          <label class="field"><span>الاسم بالعربية</span><input type="text" id="customAr" maxlength="80"></label>
          <label class="field"><span>الاسم الإنجليزي أو العلمي (اختياري)</span><input type="text" id="customEn" maxlength="80"></label>
          <label class="field"><span>قيمة التصبن NaOH (غ/غ)</span><input type="text" inputmode="decimal" class="num-input" id="customSap" placeholder="مثال: 0.135"></label>
          <label class="field"><span>المصدر أو ملاحظة</span><input type="text" id="customSource" maxlength="200" placeholder="مثال: شهادة تحليل المورّد، رقم الدفعة"></label>
        </div>
        <div class="add-row"><button type="button" class="btn" data-action="save-custom">حفظ المكوّن اليدوي</button></div>
        <p class="field-hint" style="margin-top:.5rem">المكوّن اليدوي لا يُعدّ موثقًا، ويُعرض بتحذير دائمًا.</p>
        ${customOils.length ? `<ul class="custom-list">${customOils.map((o) => `<li>${esc(o.ar)} — <span class="num">${fmt(o.sapNaOH, 4)}</span> <button type="button" class="btn btn-small btn-danger" data-action="remove-custom" data-id="${esc(o.id)}">حذف</button></li>`).join('')}</ul>` : ''}
      </details>
    </section>

    <section class="card-block" aria-labelledby="alkali-title">
      <h2 id="alkali-title">المادة القلوية</h2>
      <div class="radio-row" role="radiogroup" aria-label="نوع المادة القلوية">
        ${[['NaOH', 'هيدروكسيد الصوديوم (صودا كاوية NaOH)'], ['KOH', 'هيدروكسيد البوتاسيوم (بوتاس KOH)'], ['MIX', 'خليط NaOH + KOH']].map(([v, label]) => `
          <label><input type="radio" name="alkaliType" value="${v}" ${a.type === v ? 'checked' : ''}> ${esc(label)}</label>`).join('')}
      </div>

      <div class="grid-3" style="margin-top:1rem">
        ${usesNaOH ? `
        <label class="field">
          <span>نقاوة NaOH (%)</span>
          <input type="text" inputmode="decimal" class="num-input" data-purity="NaOH" value="${esc(inputVal(a.purity.NaOH))}">
          <span class="field-hint">تُطبَّق على الكمية الفعلية فقط، ولا تغيّر قيمة التصبن.</span>
        </label>` : ''}
        ${usesKOH ? `
        <label class="field">
          <span>نقاوة KOH (%)</span>
          <input type="text" inputmode="decimal" class="num-input" data-purity="KOH" value="${esc(inputVal(a.purity.KOH))}">
          <span class="field-hint">تُطبَّق على الكمية الفعلية فقط.</span>
        </label>` : ''}
        ${isMix ? `
        <label class="field">
          <span>نسبة NaOH في الخليط (%)</span>
          <input type="text" inputmode="decimal" class="num-input" data-mix-share value="${esc(inputVal(a.mixNaOHShare))}">
          <span class="field-hint">النسبة من المكافئ الكيميائي، لا من الوزن.</span>
        </label>` : ''}
      </div>

      ${a.type === 'NaOH' ? `
      <div class="card-block" style="margin-top:1rem;box-shadow:none">
        <label class="field" style="flex-direction:row;align-items:center;gap:.5rem">
          <input type="checkbox" id="liquidEnabled" ${a.liquidNaOH.enabled ? 'checked' : ''} style="width:20px;height:20px">
          <span>استخدام محلول NaOH جاهز</span>
        </label>
        ${a.liquidNaOH.enabled ? `
        <label class="field" style="margin-top:.6rem;max-width:280px">
          <span>تركيز المحلول الجاهز (%)</span>
          <select id="liquidConc">
            ${[50, 32, 25].map((c) => `<option value="${c}" ${Number(a.liquidNaOH.concentration) === c ? 'selected' : ''}>${c}%</option>`).join('')}
          </select>
        </label>` : ''}
      </div>` : ''}
    </section>

    <section class="card-block" aria-labelledby="settings-title">
      <h2 id="settings-title">إعدادات الوصفة</h2>
      <div class="grid-2">
        <label class="field">
          <span>الدهون الزائدة (Superfat %)</span>
          <input type="text" inputmode="decimal" class="num-input" data-superfat value="${esc(inputVal(recipe.superfat))}">
          <span class="field-hint">نسبة من القلوي النظري تبقى غير متفاعلة، وتُخصم من الحساب.</span>
        </label>
        <label class="field">
          <span>تركيز المحلول (%)</span>
          <input type="text" inputmode="decimal" class="num-input" data-concentration value="${esc(inputVal(recipe.concentration))}">
          <span class="field-hint">المادة النقية ÷ (المادة النقية + الماء).</span>
        </label>
      </div>

      <div style="margin-top:1rem">
        <span class="field-hint">طريقة حساب الماء</span>
        <div class="radio-row" role="radiogroup" aria-label="طريقة حساب الماء" style="margin-top:.4rem">
          <label><input type="radio" name="waterMode" value="concentration" ${recipe.waterMode === 'concentration' ? 'checked' : ''}> من تركيز المحلول</label>
          <label><input type="radio" name="waterMode" value="ratio" ${recipe.waterMode === 'ratio' ? 'checked' : ''} ${a.liquidNaOH.enabled ? 'disabled' : ''}> من نسبة الماء إلى القلوي</label>
        </div>
        ${recipe.waterMode === 'ratio' ? `
        <label class="field" style="margin-top:.6rem;max-width:280px">
          <span>نسبة الماء إلى القلوي الصلب</span>
          <input type="text" inputmode="decimal" class="num-input" data-water-ratio value="${esc(inputVal(recipe.waterRatio))}">
        </label>` : ''}
      </div>
    </section>

    <section class="card-block" aria-label="النتائج">
      <h2>النتائج</h2>
      <div id="results" aria-live="polite"></div>
    </section>
  `;
  renderResults();
}

/* ===== النتائج (تُحدَّث دون إعادة بناء الحقول) ===== */
function renderResults() {
  const r = calculate(recipe, allOils());
  const unit = unitLabel();

  document.querySelectorAll('[data-oil-pct]').forEach((el) => {
    const row = r.result?.oils?.[Number(el.dataset.oilPct)];
    el.textContent = row ? `${fmt(row.percent, 1)}%` : '—';
  });

  const msgs = [
    ...r.errors.map((e) => `<div class="msg msg-error">${esc(e.message)}</div>`),
    ...r.warnings.map((w) => `<div class="msg msg-warn">${esc(w.message)}</div>`),
  ].join('');

  if (!r.ok) {
    $('#results').innerHTML = `<div class="messages">${msgs}</div>`;
    return;
  }

  const res = r.result;
  const a = res.alkali;
  const reliability = r.reliable
    ? '<span class="reliability good">كل المكونات متفق عليها بين مصدرين</span>'
    : '<span class="reliability bad">النتيجة تقريبية: تحتوي على مكونات غير متفق عليها بين مصدرين</span>';

  const alkaliRows = [];
  if (a.liquid) alkaliRows.push([`محلول NaOH جاهز ${a.liquid.concentration}%`, fromGrams(a.liquid.mass, settings.unit)]);
  else if (a.type !== 'KOH') alkaliRows.push(['كمية NaOH الفعلية', fromGrams(a.naohActual, settings.unit)]);
  if (!a.liquid && (a.type === 'KOH' || a.type === 'MIX')) alkaliRows.push(['كمية KOH الفعلية', fromGrams(a.kohActual, settings.unit)]);

  $('#results').innerHTML = `
    <div class="messages" style="margin-bottom:.9rem">${msgs}</div>
    <div class="summary">
      <div class="stat"><div class="label">إجمالي الزيوت والدهون</div><div class="value"><span class="num">${fmtWeight(res.oilsTotal)}</span><span class="unit">${unit}</span></div></div>
      ${alkaliRows.map(([label, v]) => `
        <div class="stat key"><div class="label">${esc(label)}</div><div class="value"><span class="num">${fmt(v, weightDigits())}</span><span class="unit">${unit}</span></div></div>`).join('')}
      <div class="stat"><div class="label">كمية الماء</div><div class="value"><span class="num">${fmtWeight(res.waterTotal)}</span><span class="unit">${unit}</span></div></div>
      <div class="stat"><div class="label">الوزن الكلي المتوقع</div><div class="value"><span class="num">${fmtWeight(res.batchTotal)}</span><span class="unit">${unit}</span></div></div>
      <div class="stat"><div class="label">التركيز الفعلي</div><div class="value"><span class="num">${fmt(res.actualConcentration)}</span><span class="unit">%</span></div></div>
      ${res.waterToLyeRatio !== null ? `<div class="stat"><div class="label">نسبة الماء إلى القلوي</div><div class="value"><span class="num">${fmt(res.waterToLyeRatio)}</span></div></div>` : ''}
      <div class="stat"><div class="label">القلوي النقي (NaOH / KOH)</div><div class="value"><span class="num">${fmtWeight(a.naohPure)}</span> / <span class="num">${fmtWeight(a.kohPure)}</span><span class="unit">${unit}</span></div></div>
    </div>
    <p style="margin-top:.8rem">${reliability}</p>
    <div class="table-wrap" style="margin-top:.8rem">
      <table>
        <thead><tr><th>المكوّن</th><th>الوزن (${esc(unit)})</th><th>النسبة</th><th>NaOH لكل غ زيت</th><th>KOH لكل غ زيت</th></tr></thead>
        <tbody>
          ${res.oils.map((o) => `
            <tr>
              <td data-label="المكوّن">${esc(o.ar)} <span class="muted">${esc(o.en)}</span> <span class="tag ${o.verified ? 'tag-verified' : 'tag-unverified'}">${esc(o.statusLabel)}</span></td>
              <td data-label="الوزن (${esc(unit)})"><span class="num">${fmtWeight(o.weight)}</span></td>
              <td data-label="النسبة"><span class="num">${fmt(o.percent, 1)}%</span></td>
              <td data-label="NaOH لكل غ زيت"><span class="num">${fmt(o.sapNaOH, 4)}</span></td>
              <td data-label="KOH لكل غ زيت"><span class="num">${fmt(o.sapKOH, 4)}</span></td>
            </tr>`).join('')}
        </tbody>
      </table>
    </div>
    <p class="muted-note" style="margin-top:.6rem">قيم التصبن بالغرام لكل غرام زيت. قيمة KOH مشتقة من NaOH بالنسبة المولية. القيم نموذجية، وقد تختلف بحسب الزيت ونوعه ودفعته ومصدره، فتحقق من شهادة تحليل المورّد. المصادر مذكورة في ملف src/oils.js.</p>
  `;
}

/* ===== الحفظ والاستعادة ===== */
function renderSavedList() {
  const list = store.list();
  const container = $('#savedList');
  if (store.isCorrupt()) {
    container.innerHTML = '<div class="msg msg-error">تعذّر قراءة الوصفات المحفوظة، قد تكون بياناتها تالفة.</div>';
    return;
  }
  if (list.length === 0) {
    container.innerHTML = '<p class="muted-note">لا توجد وصفات محفوظة بعد.</p>';
    return;
  }
  container.innerHTML = list.map((r) => `
    <div class="saved-item ${r.id === recipe.id ? 'active' : ''}">
      <strong>${esc(r.name)}</strong>
      <span class="muted">${r.oils.length} مكوّن · ${esc(new Date(r.updatedAt).toLocaleString('ar'))}</span>
      <button type="button" class="btn btn-small" data-action="open" data-id="${esc(r.id)}">فتح</button>
    </div>`).join('');
}

function refreshAll() {
  renderSavedList();
  renderResults();
  persistDraft();
}

function openRecipe(id) {
  const r = store.get(id);
  if (!r) return showStatus('تعذّر العثور على الوصفة.', true);
  recipe = r;
  renderEditor(); renderSavedList(); persistDraft();
  showStatus(`تم فتح الوصفة: ${r.name}`);
}

/* ===== تثبيت التطبيق والعمل دون اتصال ===== */
function setupInstall() {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredInstallPrompt = e;
    $('#installBtn').hidden = false;
  });
  window.addEventListener('appinstalled', () => {
    deferredInstallPrompt = null;
    $('#installBtn').hidden = true;
    showStatus('تم تثبيت التطبيق على الجهاز.');
  });
  $('#installBtn').addEventListener('click', async () => {
    if (!deferredInstallPrompt) {
      showStatus('لم يعرض المتصفح نافذة التثبيت. من قائمة المتصفح اختر "إضافة إلى الشاشة الرئيسية".', true);
      return;
    }
    deferredInstallPrompt.prompt();
    await deferredInstallPrompt.userChoice;
    deferredInstallPrompt = null;
    $('#installBtn').hidden = true;
  });
}

async function registerServiceWorker() {
  const note = $('#offlineNote');
  if (!('serviceWorker' in navigator)) {
    note.textContent = 'هذا المتصفح لا يدعم العمل دون اتصال. الحاسبة تعمل على الإنترنت فقط.';
    return;
  }
  const secure = window.isSecureContext;
  if (!secure) {
    note.textContent = 'التثبيت والعمل دون اتصال يتطلبان HTTPS أو localhost. الصفحة الحالية غير آمنة.';
    return;
  }
  try {
    const reg = await navigator.serviceWorker.register('./service-worker.js', { scope: './' });
    reg.addEventListener('updatefound', () => {
      const w = reg.installing;
      w?.addEventListener('statechange', () => {
        if (w.state === 'installed' && navigator.serviceWorker.controller) {
          showStatus('تم تحميل نسخة جديدة من التطبيق، أعد فتحه لتطبيقها. بياناتك المحفوظة لم تتغير.');
        }
      });
    });
    await navigator.serviceWorker.ready;
    note.textContent = 'يعمل التطبيق دون اتصال بعد تحميله مرة واحدة.';
  } catch (err) {
    note.textContent = 'تعذّر تفعيل وضع العمل دون اتصال: ' + (err?.message || 'خطأ غير معروف') + '. الحاسبة تعمل على الإنترنت.';
  }
}

/* ===== معالجات الأحداث ===== */
document.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-action]');
  if (!btn) return;
  const action = btn.dataset.action;

  switch (action) {
    case 'add-oil':
      recipe = addOil(recipe, $('#newOil').value, 100, allOils());
      renderEditor(); renderSavedList(); persistDraft();
      break;
    case 'remove-oil':
      recipe = removeOil(recipe, Number(btn.dataset.index));
      renderEditor(); renderSavedList(); persistDraft();
      break;
    case 'new':
      if (recipe.oils.length > 0 && !window.confirm('هل تريد بدء وصفة جديدة؟ التعديلات غير المحفوظة ستُفقد.')) return;
      recipe = createEmptyRecipe();
      renderEditor(); renderSavedList(); persistDraft();
      showStatus('تم إنشاء وصفة جديدة.');
      break;
    case 'save': {
      const saved = store.save(recipe);
      recipe = saved;
      renderSavedList(); persistDraft();
      showStatus(`تم حفظ الوصفة: ${saved.name}`);
      break;
    }
    case 'copy': {
      const copy = store.save(cloneRecipe(recipe));
      recipe = copy;
      renderEditor(); renderSavedList(); persistDraft();
      showStatus(`تم إنشاء نسخة: ${copy.name}`);
      break;
    }
    case 'delete': {
      const saved = store.get(recipe.id);
      if (!saved) return showStatus('هذه الوصفة لم تُحفظ بعد، لا يوجد ما يُحذف.', true);
      if (!window.confirm(`هل تريد حذف الوصفة "${saved.name}" نهائيًا؟`)) return;
      store.remove(saved.id);
      recipe = createEmptyRecipe();
      renderEditor(); renderSavedList(); persistDraft();
      showStatus('تم حذف الوصفة المحفوظة.');
      break;
    }
    case 'open':
      openRecipe(btn.dataset.id);
      break;
    case 'export': {
      const blob = new Blob([serializeRecipe(recipe)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${recipe.name.replace(/[\\/:*?"<>|]+/g, '_') || 'recipe'}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      showStatus('تم تنزيل ملف الوصفة.');
      break;
    }
    case 'print':
      window.print();
      break;
    case 'save-custom': {
      const result = createCustomOil({
        ar: $('#customAr').value,
        en: $('#customEn').value,
        sapNaOH: parseNumber($('#customSap').value),
        source: $('#customSource').value,
      }, `custom_${Date.now().toString(36)}`);
      if (!result.ok) return showStatus(result.errors[0], true);
      customOils = [...customOils.filter((o) => o.id !== result.oil.id), result.oil];
      store.saveCustomOil(result.oil);
      renderEditor(); renderSavedList();
      showStatus(`تمت إضافة المكوّن اليدوي: ${result.oil.ar}`);
      break;
    }
    case 'remove-custom': {
      const id = btn.dataset.id;
      const inUse = recipe.oils.some((o) => o.id === id);
      if (inUse && !window.confirm('هذا المكوّن مستخدم في الوصفة الحالية. هل تريد حذفه؟ سيُزال من الوصفة أيضًا.')) return;
      store.removeCustomOil(id);
      customOils = customOils.filter((o) => o.id !== id);
      if (inUse) recipe = { ...recipe, oils: recipe.oils.filter((o) => o.id !== id) };
      renderEditor(); renderSavedList(); persistDraft();
      showStatus('تم حذف المكوّن اليدوي.');
      break;
    }
  }
});

document.addEventListener('input', (e) => {
  const t = e.target;
  if (t.id === 'recipeName') { recipe = { ...recipe, name: t.value.trim() || 'وصفة بدون اسم' }; return refreshAll(); }
  if (t.id === 'recipeNotes') { recipe = { ...recipe, notes: t.value }; return refreshAll(); }
  if (t.dataset.oilWeight !== undefined) {
    const grams = toGrams(parseNumber(t.value), settings.unit);
    recipe = setOilWeight(recipe, Number(t.dataset.oilWeight), grams);
    return refreshAll();
  }
  if (t.dataset.purity) {
    recipe = { ...recipe, alkali: { ...recipe.alkali, purity: { ...recipe.alkali.purity, [t.dataset.purity]: parseNumber(t.value) } } };
    return refreshAll();
  }
  if (t.dataset.mixShare !== undefined) { recipe = { ...recipe, alkali: { ...recipe.alkali, mixNaOHShare: parseNumber(t.value) } }; return refreshAll(); }
  if (t.dataset.superfat !== undefined) { recipe = { ...recipe, superfat: parseNumber(t.value) }; return refreshAll(); }
  if (t.dataset.concentration !== undefined) { recipe = { ...recipe, concentration: parseNumber(t.value) }; return refreshAll(); }
  if (t.dataset.waterRatio !== undefined) { recipe = { ...recipe, waterRatio: parseNumber(t.value) }; return refreshAll(); }
});

document.addEventListener('change', (e) => {
  const t = e.target;
  if (t.id === 'unitSelect') {
    settings = { ...settings, unit: t.value };
    store.saveSettings(settings);
    renderEditor(); persistDraft();
    return;
  }
  if (t.dataset.oilId !== undefined) {
    recipe = setOilId(recipe, Number(t.dataset.oilId), t.value);
    return refreshAll();
  }
  if (t.name === 'alkaliType') {
    recipe = { ...recipe, alkali: { ...recipe.alkali, type: t.value } };
    if (t.value !== 'NaOH') recipe.alkali.liquidNaOH = { ...recipe.alkali.liquidNaOH, enabled: false };
    renderEditor(); renderSavedList(); persistDraft();
    return;
  }
  if (t.name === 'waterMode') { recipe = { ...recipe, waterMode: t.value }; renderEditor(); persistDraft(); return; }
  if (t.id === 'liquidEnabled') {
    recipe = { ...recipe, alkali: { ...recipe.alkali, liquidNaOH: { ...recipe.alkali.liquidNaOH, enabled: t.checked } } };
    if (t.checked && recipe.waterMode === 'ratio') recipe = { ...recipe, waterMode: 'concentration' };
    renderEditor(); persistDraft();
    return;
  }
  if (t.id === 'liquidConc') {
    recipe = { ...recipe, alkali: { ...recipe.alkali, liquidNaOH: { ...recipe.alkali.liquidNaOH, concentration: Number(t.value) } } };
    return refreshAll();
  }
  if (t.id === 'importFile' && t.files?.[0]) {
    const file = t.files[0];
    file.text().then((text) => {
      const parsed = parseRecipeJson(text);
      if (!parsed.ok) return showStatus(parsed.errors[0], true);
      recipe = parsed.recipe;
      renderEditor(); renderSavedList(); persistDraft();
      showStatus(parsed.errors.length ? `تم الاستيراد مع تنبيهات: ${parsed.errors.join(' ')}` : `تم استيراد الوصفة: ${recipe.name}`);
    }).catch(() => showStatus('تعذّر قراءة الملف.', true));
    t.value = '';
  }
});

/* ===== التشغيل ===== */
renderEditor();
renderSavedList();
setupInstall();
registerServiceWorker();
