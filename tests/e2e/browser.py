# اختبار المتصفح الشامل (Playwright، بايثون). ليس جزءًا من التطبيق، ويُشغَّل على الجهاز المطوّر فقط.
# المتطلبات: pip install playwright && python -m playwright install chromium
# التشغيل: شغّل الخادم أولًا (npm start أو python3 -m http.server 8080) ثم: python3 tests/e2e/browser.py
import json, time
from playwright.sync_api import sync_playwright

import os
URL = os.environ.get("SOAPCALC_URL", "http://localhost:8080/index.html")
results = []
def check(name, cond, detail=""):
    results.append((name, bool(cond)))
    print(("PASS " if cond else "FAIL ") + name + ("" if cond or not detail else f"  [{detail}]"))

def stat(pg, label):
    cards = pg.locator(".stat")
    for i in range(cards.count()):
        c = cards.nth(i)
        if label in c.locator(".label").inner_text():
            return c.locator(".value .num").first.inner_text().replace(",", "")
    return None

def fill_weight(pg, idx, value):
    pg.fill(f"[data-oil-weight='{idx}']", value)
    pg.dispatch_event(f"[data-oil-weight='{idx}']", "input")

with sync_playwright() as p:
    b = p.chromium.launch()
    ctx = b.new_context(viewport={"width": 1280, "height": 900}, locale="ar")
    pg = ctx.new_page()
    js_errors, requests = [], []
    pg.on("pageerror", lambda e: js_errors.append(str(e)))
    pg.on("request", lambda r: requests.append(r.url))
    pg.goto(URL)
    pg.evaluate("localStorage.clear()"); pg.reload()

    # --- الحسابات الظاهرة (زيتون 0.135) ---
    pg.click("button[data-action=add-oil]")
    check("زيت الزيتون يظهر متفقًا عليه بين مصدرين", pg.locator("text=متفق عليه بين مصدرين").count() >= 1)
    check("NaOH = 12.83 عند الدهون 5% (100 × 0.135 × 0.95)", stat(pg, "كمية NaOH") == "12.83", stat(pg, "كمية NaOH"))
    check("الماء = 29.93 عند تركيز 30%", stat(pg, "كمية الماء") in ("29.92", "29.93"), stat(pg, "كمية الماء"))
    check("النتيجة موثوقة عند زيت متفق عليه", pg.locator("text=كل المكونات متفق عليها").count() == 1)

    # --- الأرقام العربية ---
    fill_weight(pg, 0, "٢٠٠")
    check("الأرقام العربية: NaOH يصبح 25.65", stat(pg, "كمية NaOH") == "25.65", stat(pg, "كمية NaOH"))

    # --- وحدة الوزن: كيلوغرام ---
    pg.select_option("#unitSelect", "kg")
    pg.wait_for_timeout(100)
    check("الوحدة كيلوغرام تظهر في عنوان العمود", pg.locator("th", has_text="الوزن (كغ)").count() >= 1)
    check("200 غ تظهر 0.2 كغ في الحقل", pg.input_value("[data-oil-weight='0']") == "0.2", pg.input_value("[data-oil-weight='0']"))
    fill_weight(pg, 0, "1")
    check("إدخال 1 كغ يُخزَّن 1000 غ: NaOH = 0.128 كغ (128.25 غ)", stat(pg, "كمية NaOH") == "0.128", stat(pg, "كمية NaOH"))
    pg.select_option("#unitSelect", "g")
    pg.wait_for_timeout(100)
    check("تبديل الوحدة إلى غرام يعيد القيمة 1000", pg.input_value("[data-oil-weight='0']") == "1000", pg.input_value("[data-oil-weight='0']"))
    fill_weight(pg, 0, "200")

    # --- زيت مختلف عليه يجعل النتيجة تقريبية ---
    pg.select_option("#newOil", "grapeseed")
    pg.click("button[data-action=add-oil]")
    check("زيت بذر العنب يظهر بوسم خلاف بين المصدرين", pg.locator("text=خلاف بين المصدرين").count() >= 1)
    check("وجود مكوّن مختلف عليه يجعل النتيجة تقريبية", pg.locator(".reliability.bad").count() == 1)
    pg.click("#oilRows tr:nth-child(2) button[data-action=remove-oil]")
    check("حذف المكوّن المختلف عليه يعيد النتيجة موثوقة", pg.locator(".reliability.good").count() == 1)

    # --- مكوّن يدوي ---
    pg.click("summary:has-text('إضافة مكوّن يدوي')")
    pg.fill("#customAr", "زيت تجريبي")
    pg.fill("#customSap", "0.5")
    pg.fill("#customSource", "مورد")
    pg.click("button[data-action=save-custom]")
    check("قيمة تصبن خارج النطاق يعرض رفضًا", pg.locator("#status").inner_text().find("بين 0.03 و 0.30") >= 0)
    pg.fill("#customSap", "0.13")
    pg.fill("#customSource", "")
    pg.click("button[data-action=save-custom]")
    check("مكوّن يدوي بلا مصدر يُرفض", "مصدر" in pg.locator("#status").inner_text())
    pg.fill("#customSource", "شهادة المورّد رقم 12")
    pg.click("button[data-action=save-custom]")
    pg.wait_for_timeout(100)
    check("المكوّن اليدوي يُضاف للقائمة", pg.locator("text=المكوّن اليدوي").count() >= 0 and "تمت إضافة" in pg.locator("#status").inner_text())
    check("المكوّن اليدوي يُوسم كمُدخل يدويًا في القائمة", pg.locator("select[aria-label='اختيار مكوّن جديد'] option", has_text="زيت تجريبي").count() == 1)

    # --- الحفظ وإعادة التحميل ---
    pg.fill("#recipeName", "وصفة اختبار زيتون")
    pg.dispatch_event("#recipeName", "input")
    pg.click("button[data-action=save]")
    check("الحفظ يظهر في القائمة", pg.locator(".saved-item").filter(has=pg.get_by_text("وصفة اختبار زيتون", exact=True)).count() == 1)
    pg.reload(); pg.wait_for_timeout(200)
    check("بعد إعادة التحميل تُستعاد المسودة", pg.input_value("#recipeName") == "وصفة اختبار زيتون")
    check("المكوّن اليدوي يبقى بعد إعادة التحميل", pg.locator("select[aria-label='اختيار مكوّن جديد'] option", has_text="زيت تجريبي").count() == 1)

    # --- نسخ وفتح وحذف مع التأكيد ---
    pg.click("button[data-action=copy]"); pg.wait_for_timeout(120)
    check("النسخ ينشئ وصفة باسم (نسخة)", pg.locator(".saved-item").filter(has=pg.get_by_text("وصفة اختبار زيتون (نسخة)", exact=True)).count() == 1)
    pg.locator(".saved-item").filter(has=pg.get_by_text("وصفة اختبار زيتون", exact=True)).locator("button[data-action=open]").click()
    pg.wait_for_timeout(120)
    check("فتح الوصفة يعيد اسمها", pg.input_value("#recipeName") == "وصفة اختبار زيتون")
    pg.once("dialog", lambda d: d.dismiss())
    pg.click("button[data-action=delete]"); pg.wait_for_timeout(100)
    check("رفض التأكيد لا يحذف", pg.locator(".saved-item").filter(has=pg.get_by_text("وصفة اختبار زيتون", exact=True)).count() == 1)
    pg.once("dialog", lambda d: d.accept())
    pg.click("button[data-action=delete]"); pg.wait_for_timeout(150)
    check("قبول التأكيد يحذف", pg.locator(".saved-item").filter(has=pg.get_by_text("وصفة اختبار زيتون", exact=True)).count() == 0)

    # --- تصدير واستيراد ---
    if pg.locator("#oilRows tr").count() == 0:
        pg.click("button[data-action=add-oil]")
    pg.click("button[data-action=save]")
    with pg.expect_download() as dl:
        pg.click("button[data-action=export]")
    dl.value.save_as("/tmp/_exp.json")
    data = json.load(open("/tmp/_exp.json", encoding="utf-8"))
    check("ملف التصدير يحتوي المكونات", data.get("format") == "soap-calc-ar" and len(data["oils"]) >= 1)
    pg.once("dialog", lambda d: d.accept())
    pg.click("button[data-action=new]"); pg.wait_for_timeout(100)
    pg.set_input_files("#importFile", "/tmp/_exp.json"); pg.wait_for_timeout(300)
    check("الاستيراد يستعيد عدد الزيوت", pg.locator("#oilRows tr").count() == len(data["oils"]))
    open("/tmp/_bad.json", "w").write('{"x":1}')
    pg.set_input_files("#importFile", "/tmp/_bad.json"); pg.wait_for_timeout(200)
    check("ملف غير صالح يعرض رسالة خطأ", "ليس وصفة صابون صالحة" in pg.inner_text("#status"))

    # --- PWA: manifest ومعالجة الخدمة ---
    check("رابط manifest موجود في الصفحة", pg.locator("link[rel=manifest]").count() == 1)
    check("زر التثبيت مخفي حتى يسمح المتصفح بالتثبيت", pg.locator("#installBtn").is_hidden())

    # --- لا طلبات لخدمات خارجية ---
    external = [u for u in requests if not u.startswith(URL.rsplit("/", 1)[0]) and not u.startswith("data:")]
    check("لا طلبات إلى أي نطاق خارجي", len(external) == 0, ", ".join(external[:3]))
    check("لا أخطاء JavaScript", len(js_errors) == 0, "; ".join(js_errors)[:200])

    # --- العمل دون اتصال بعد التحميل ---
    sw_state = pg.evaluate("""async () => {
        if (!('serviceWorker' in navigator)) return 'unsupported';
        const reg = await navigator.serviceWorker.ready;
        return reg.active ? 'active' : 'none';
    }""")
    check("Service Worker مفعّل", sw_state == "active", sw_state)
    pg.wait_for_timeout(500)
    pg.reload(); pg.wait_for_timeout(400)
    check("الصفحة تتحكم فيها Service Worker", pg.evaluate("!!navigator.serviceWorker.controller"))
    pg.fill("#recipeName", "وصفة بلا اتصال")
    pg.dispatch_event("#recipeName", "input")
    pg.click("button[data-action=save]")
    pg.click("button[data-action=new]") if False else None
    ctx.set_offline(True)
    pg.reload(); pg.wait_for_timeout(400)
    check("التطبيق يفتح بدون اتصال", pg.locator("#editor").count() == 1 and pg.locator("h1", has_text="حاسبة الصابون").count() == 1)
    check("الوصفة المحفوظة تظهر بدون اتصال", pg.locator(".saved-item").filter(has=pg.get_by_text("وصفة بلا اتصال", exact=True)).count() == 1)
    pg.click("button[data-action=add-oil]")
    check("الحساب يعمل بدون اتصال", stat(pg, "كمية NaOH") is not None)
    pg.fill("[data-superfat]", "0"); pg.dispatch_event("[data-superfat]", "input")
    check("تغيير الإعداد يحدّث النتيجة بدون اتصال: NaOH = 27.00 (200 × 0.135)", stat(pg, "كمية NaOH") == "27.00", stat(pg, "كمية NaOH"))
    pg.reload(); pg.wait_for_timeout(300)
    check("بيانات الوصفة بقيت بعد إعادة التحميل دون اتصال", pg.input_value("#recipeName") == "وصفة بلا اتصال")
    ctx.set_offline(False)

    # --- الهاتف: RTL بدون تمرير أفقي ---
    m = b.new_context(viewport={"width": 375, "height": 740}, locale="ar", is_mobile=True, has_touch=True)
    mp = m.new_page(); mp.goto(URL)
    mp.evaluate("localStorage.clear()"); mp.reload(); mp.wait_for_timeout(200)
    mp.click("button[data-action=add-oil]")
    mp.fill("[data-oil-weight='0']", "60"); mp.dispatch_event("[data-oil-weight='0']", "input")
    sw_w = mp.evaluate("document.documentElement.scrollWidth")
    check("الهاتف 375px: لا تمرير أفقي", sw_w <= 376, f"scrollWidth={sw_w}")
    check("الهاتف: الاتجاه RTL", mp.evaluate("getComputedStyle(document.body).direction") == "rtl")
    check("الهاتف: حقول الإدخال بارتفاع لمس 44px على الأقل",
          mp.evaluate("[...document.querySelectorAll('input[type=text]')].every(e=>e.getBoundingClientRect().height>=43)"))
    
    
    b.close()

passed = sum(1 for _, ok in results if ok)
print(f"\nE2E: {passed} passed, {len(results)-passed} failed of {len(results)}")
