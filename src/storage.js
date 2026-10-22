import { normalizeRecipe, generateId } from './recipe-model.js';

/*
 * تخزين الوصفات والمسودة محليًا عبر localStorage.
 * الواجهة تمرر كائن التخزين، لتسهيل الاختبار. لا تُنسب للتطبيق أي مزامنة سحابية.
 */

const LIST_KEY = 'soapcalc:recipes:v1';
const DRAFT_KEY = 'soapcalc:draft:v1';
const CUSTOM_OILS_KEY = 'soapcalc:custom-oils:v1';
const SETTINGS_KEY = 'soapcalc:settings:v1';

function readJson(store, key, fallback) {
  try {
    const raw = store.getItem(key);
    if (raw === null || raw === undefined) return { value: fallback, corrupt: false };
    return { value: JSON.parse(raw), corrupt: false };
  } catch {
    return { value: fallback, corrupt: true };
  }
}

export function createRecipeStore(store = globalThis.localStorage) {
  const readAll = () => {
    const { value, corrupt } = readJson(store, LIST_KEY, []);
    const list = Array.isArray(value) ? value : [];
    return { list: list.map((r) => normalizeRecipe(r).recipe), corrupt: corrupt || !Array.isArray(value) };
  };
  const writeAll = (list) => {
    store.setItem(LIST_KEY, JSON.stringify(list));
  };

  return {
    list() {
      return readAll().list.sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
    },
    isCorrupt() {
      return readAll().corrupt;
    },
    get(id) {
      return readAll().list.find((r) => r.id === id) || null;
    },
    /** يحفظ الوصفة (إضافة أو تحديث). يعيد الوصفة المحفوظة مع الطابع الزمني. */
    save(recipe) {
      const { list } = readAll();
      const saved = { ...normalizeRecipe(recipe).recipe, id: recipe.id || generateId(), updatedAt: new Date().toISOString() };
      const idx = list.findIndex((r) => r.id === saved.id);
      if (idx >= 0) list[idx] = saved;
      else list.push(saved);
      writeAll(list);
      return saved;
    },
    remove(id) {
      const { list } = readAll();
      writeAll(list.filter((r) => r.id !== id));
    },
    saveDraft(recipe) {
      store.setItem(DRAFT_KEY, JSON.stringify(recipe));
    },
    loadDraft() {
      const { value } = readJson(store, DRAFT_KEY, null);
      return value ? normalizeRecipe(value).recipe : null;
    },
    clearDraft() {
      store.removeItem(DRAFT_KEY);
    },
    /** المكوّنات اليدوية: تُخزَّن كقائمة كائنات بسيطة، ويُتحقق من كل عنصر عند القراءة. */
    listCustomOils() {
      const { value } = readJson(store, CUSTOM_OILS_KEY, []);
      if (!Array.isArray(value)) return [];
      return value.filter((o) => o && typeof o.id === 'string' && Number.isFinite(o.sapNaOH) && o.status === 'manual');
    },
    saveCustomOil(oil) {
      const list = this.listCustomOils().filter((o) => o.id !== oil.id);
      list.push({ ...oil, sources: [] });
      store.setItem(CUSTOM_OILS_KEY, JSON.stringify(list));
      return oil;
    },
    removeCustomOil(id) {
      const list = this.listCustomOils().filter((o) => o.id !== id);
      store.setItem(CUSTOM_OILS_KEY, JSON.stringify(list));
    },
    getSettings() {
      const { value } = readJson(store, SETTINGS_KEY, {});
      return { unit: ['g', 'kg', 'oz', 'lb'].includes(value?.unit) ? value.unit : 'g' };
    },
    saveSettings(settings) {
      store.setItem(SETTINGS_KEY, JSON.stringify({ unit: settings.unit }));
    },
  };
}
