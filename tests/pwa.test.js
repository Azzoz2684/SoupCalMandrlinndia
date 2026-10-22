import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(join(root, p), 'utf8');

describe('manifest.json', () => {
  const m = JSON.parse(read('manifest.json'));

  test('الحقول الإلزامية موجودة', () => {
    for (const k of ['name', 'short_name', 'start_url', 'display', 'icons']) assert.ok(m[k], `missing ${k}`);
  });

  test('اسم عربي ولغة واتجاه صحيحان', () => {
    assert.match(m.name, /[\u0600-\u06FF]/);
    assert.equal(m.lang, 'ar');
    assert.equal(m.dir, 'rtl');
  });

  test('display standalone وscope مناسب', () => {
    assert.equal(m.display, 'standalone');
    assert.equal(m.scope, './');
  });

  test('الألوان بصيغة hex صالحة', () => {
    assert.match(m.theme_color, /^#[0-9a-f]{6}$/i);
    assert.match(m.background_color, /^#[0-9a-f]{6}$/i);
  });

  test('كل أيقونة موجودة وبمقاس مطابق لما يُعلن', () => {
    const sizes = m.icons.map((i) => i.sizes);
    assert.ok(sizes.includes('192x192') && sizes.includes('512x512'));
    assert.ok(m.icons.some((i) => i.purpose === 'maskable'));
    for (const icon of m.icons) {
      const path = join(root, icon.src);
      assert.ok(existsSync(path), `missing icon ${icon.src}`);
      const buf = readFileSync(path);
      assert.equal(buf.readUInt32BE(0), 0x89504e47, `${icon.src} is not PNG`);
      const [w, h] = icon.sizes.split('x').map(Number);
      assert.equal(buf.readUInt32BE(16), w, `${icon.src} width`);
      assert.equal(buf.readUInt32BE(20), h, `${icon.src} height`);
    }
  });
});

describe('service-worker.js', () => {
  const sw = read('service-worker.js');
  const shell = JSON.parse(sw.match(/const APP_SHELL = (\[[\s\S]*?\]);/)[1]);

  test('يحدد نسخة واضحة للكاش', () => {
    assert.match(sw, /const CACHE_VERSION = 'soapcalc-v\d+\.\d+\.\d+'/);
  });

  test('كل ملف في قائمة التخزين الأولي موجود فعلًا', () => {
    for (const f of shell) {
      if (f === './') continue;
      assert.ok(existsSync(join(root, f)), `precache entry missing: ${f}`);
    }
  });

  test('الملفات التي تحمّلها الصفحة وملفات JavaScript كلها مخزَّنة مسبقًا', () => {
    const html = read('index.html');
    const refs = [...html.matchAll(/(?:href|src)="([^"]+)"/g)].map((m) => m[1])
      .filter((r) => !r.startsWith('http') && !r.startsWith('data:'));
    for (const r of refs) {
      assert.ok(shell.includes('./' + r), `index.html references ${r} which is not precached`);
    }
    const jsFiles = ['app.js', 'src/engine.js', 'src/oils.js', 'src/recipe-model.js', 'src/storage.js', 'src/constants.js'];
    for (const f of jsFiles) assert.ok(shell.includes('./' + f), `${f} not precached`);
  });

  test('صفحة الاتصال المقطوع موجودة ومخزنة', () => {
    assert.ok(shell.includes('./offline.html'));
    assert.ok(existsSync(join(root, 'offline.html')));
  });

  test('لا تعتمد الواجهة على CDN أو خطوط أو صور خارجية', () => {
    for (const f of ['index.html', 'styles.css', 'app.js', 'offline.html']) {
      const txt = read(f);
      assert.ok(!/https?:\/\/(?!www\.w3\.org)/.test(txt.replace(/https:\/\/laws-lois\.justice\.gc\.ca[^"'\s]*/g, '')), `${f} loads external resource`);
    }
  });

  test('الحذف يقتصر على كاشات هذا التطبيق', () => {
    assert.match(sw, /startsWith\(CACHE_PREFIX\)/);
  });

  test('لا تحفظ البيانات الشخصية في الكاش (localStorage غير مستخدم هنا)', () => {
    const code = sw.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
    assert.ok(!/localStorage/.test(code));
  });
});

describe('ملفات أخرى', () => {
  test('التطبيق لا يحتوي على أي استيراد من CDN أو مكتبة خارجية', () => {
    for (const f of ['app.js', 'src/engine.js', 'src/oils.js', 'src/recipe-model.js', 'src/storage.js', 'src/constants.js']) {
      assert.ok(!/from ['"]https?:/.test(read(f)), `${f} imports from network`);
    }
  });

  test('الملفات المطلوبة للنشر كلها موجودة', () => {
    for (const f of ['index.html', 'styles.css', 'app.js', 'manifest.json', 'service-worker.js', 'offline.html', 'README.md']) {
      assert.ok(existsSync(join(root, f)), `${f} missing`);
      assert.ok(statSync(join(root, f)).size > 0, `${f} empty`);
    }
  });
});
