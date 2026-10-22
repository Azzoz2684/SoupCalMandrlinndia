import { KOH_PER_NAOH } from './constants.js';

// قاعدة بيانات الزيوت والدهون.
//
// لكل مكوّن: قيمة تصبن NaOH (غ NaOH / غ مادة)، وقيم كل مصدر كما نُشرت، وحالة التحقق.
// sapNaOH = متوسط قيم المصادر المتاحة، مقرّب إلى 4 منازل. القيمة نموذجية وليست قياسًا لدفعة محددة.
//
// الحالات:
//   cross-checked : مصدران متفقان (الفرق ≤ 0.002 غ/غ). يُعدّ "متفقًا عليه"، وليس بالضرورة مستقلًا تمامًا.
//   disputed      : مصدران يختلفان بأكثر من 0.002 غ/غ. لا يُعدّ موثّقًا، ويظهر تحذير.
//   single-source : مصدر واحد فقط. لا يُعدّ موثّقًا.
//   manual        : أُضيف يدويًا من المستخدم (يُخزَّن محليًا وليس هنا).
//
// ملاحظة مهمة: SB يذكر أن قيم SAP لديه مأخوذة من قائمة زيوت SoapCalc (مع تصحيحات)، بينما يذكر SL أنه لم ينسخ من حاسبات أخرى.
// لذلك فالاتفاق بينهما لا يعني استقلالًا تامًا للبيانات، وهو دليل أضعف من مرجع أولي أو شهادة تحليل.
// توصية: تحقّق من شهادة التحليل (CoA) من المورّد لأي زيت تستخدمه في إنتاج فعلي.

export const SOURCES = Object.freeze({
  SB: Object.freeze({ name: "SoapmakingToolbox — Oil properties chart", url: "https://soapmakingtoolbox.com/guides/oil-properties-chart", updated: "2026-10-10", retrieved: "2026-10-22" }),
  SL: Object.freeze({ name: "Soap Ledger — Oil SAP values and fatty acids", url: "https://soapledger.com/oils/", updated: "2026-10-13", retrieved: "2026-10-22" }),
  LEGAL_OLIVE: Object.freeze({ name: "Canada Food and Drug Regulations, B.09.003 (Olive Oil)", url: "https://laws-lois.justice.gc.ca/eng/regulations/C.R.C.,_c._870/section-B.09.003-20060322.html", updated: "2006-03-22", retrieved: "2026-10-22" }),
});

export const OILS = Object.freeze([
  {
    "id": "olive",
    "ar": "زيت الزيتون",
    "en": "Olive oil",
    "category": "زيوت نباتية",
    "sapNaOH": 0.135,
    "status": "cross-checked",
    "spreadNaOH": 0.0,
    "sources": [
      {
        "source": "SB",
        "naoh": 0.135,
        "koh": 0.19,
        "range": "184–196",
        "iodine": 85,
        "ins": 105
      },
      {
        "source": "SL",
        "naoh": 0.135,
        "koh": 0.19,
        "range": null,
        "iodine": 85,
        "ins": 106
      }
    ],
    "note": "نطاق القانون الكندي (Food and Drug Regulations, B.09.003) لزيت الزيتون: 184–196 ملغ KOH/غ."
  },
  {
    "id": "coconut",
    "ar": "زيت جوز الهند (76°)",
    "en": "Coconut oil (76°)",
    "category": "دهون نباتية",
    "sapNaOH": 0.183,
    "status": "cross-checked",
    "spreadNaOH": 0.0,
    "sources": [
      {
        "source": "SB",
        "naoh": 0.183,
        "koh": 0.257,
        "range": "250–264",
        "iodine": 10,
        "ins": 258
      },
      {
        "source": "SL",
        "naoh": 0.183,
        "koh": 0.257,
        "range": null,
        "iodine": 9,
        "ins": 248
      }
    ],
    "note": "قيمة INS في SB (258) لا تتسق مع SAP − اليود (257 − 10 = 247)؛ SL (248) أقرب."
  },
  {
    "id": "palm",
    "ar": "زيت النخيل",
    "en": "Palm oil",
    "category": "دهون نباتية",
    "sapNaOH": 0.142,
    "status": "cross-checked",
    "spreadNaOH": 0.0,
    "sources": [
      {
        "source": "SB",
        "naoh": 0.142,
        "koh": 0.199,
        "range": "190–209",
        "iodine": 53,
        "ins": 145
      },
      {
        "source": "SL",
        "naoh": 0.142,
        "koh": 0.2,
        "range": null,
        "iodine": 53,
        "ins": 147
      }
    ],
    "note": null
  },
  {
    "id": "lard",
    "ar": "شحم الخنزير (اللارد)",
    "en": "Lard (pork fat)",
    "category": "دهون حيوانية",
    "sapNaOH": 0.141,
    "status": "cross-checked",
    "spreadNaOH": 0.0,
    "sources": [
      {
        "source": "SB",
        "naoh": 0.141,
        "koh": 0.198,
        "range": "190–205",
        "iodine": 57,
        "ins": 139
      },
      {
        "source": "SL",
        "naoh": 0.141,
        "koh": 0.198,
        "range": null,
        "iodine": 60,
        "ins": 138
      }
    ],
    "note": null
  },
  {
    "id": "beef_tallow",
    "ar": "شحم البقر (التالو)",
    "en": "Beef tallow",
    "category": "دهون حيوانية",
    "sapNaOH": 0.1415,
    "status": "disputed",
    "spreadNaOH": 0.003,
    "sources": [
      {
        "source": "SB",
        "naoh": 0.143,
        "koh": 0.2,
        "range": "190–202",
        "iodine": 45,
        "ins": 147
      },
      {
        "source": "SL",
        "naoh": 0.14,
        "koh": 0.196,
        "range": null,
        "iodine": 47,
        "ins": 150
      }
    ],
    "note": null
  },
  {
    "id": "sheep_tallow",
    "ar": "شحم الضأن",
    "en": "Sheep tallow (mutton fat)",
    "category": "دهون حيوانية",
    "sapNaOH": 0.139,
    "status": "cross-checked",
    "spreadNaOH": 0.002,
    "sources": [
      {
        "source": "SB",
        "naoh": 0.138,
        "koh": 0.194,
        "range": null,
        "iodine": 54,
        "ins": 156
      },
      {
        "source": "SL",
        "naoh": 0.14,
        "koh": 0.196,
        "range": null,
        "iodine": 47,
        "ins": 150
      }
    ],
    "note": null
  },
  {
    "id": "goat_tallow",
    "ar": "شحم الماعز",
    "en": "Goat tallow",
    "category": "دهون حيوانية",
    "sapNaOH": 0.138,
    "status": "cross-checked",
    "spreadNaOH": 0.002,
    "sources": [
      {
        "source": "SB",
        "naoh": 0.137,
        "koh": 0.192,
        "range": null,
        "iodine": 40,
        "ins": 152
      },
      {
        "source": "SL",
        "naoh": 0.139,
        "koh": 0.194,
        "range": null,
        "iodine": null,
        "ins": null
      }
    ],
    "note": null
  },
  {
    "id": "goose_fat",
    "ar": "شحم الإوز",
    "en": "Goose fat",
    "category": "دهون حيوانية",
    "sapNaOH": 0.137,
    "status": "cross-checked",
    "spreadNaOH": 0.0,
    "sources": [
      {
        "source": "SB",
        "naoh": 0.137,
        "koh": 0.192,
        "range": null,
        "iodine": 65,
        "ins": 130
      },
      {
        "source": "SL",
        "naoh": 0.137,
        "koh": 0.192,
        "range": null,
        "iodine": 83,
        "ins": 110
      }
    ],
    "note": null
  },
  {
    "id": "chicken_fat",
    "ar": "شحم الدجاج",
    "en": "Chicken fat (schmaltz)",
    "category": "دهون حيوانية",
    "sapNaOH": 0.1375,
    "status": "disputed",
    "spreadNaOH": 0.003,
    "sources": [
      {
        "source": "SB",
        "naoh": 0.139,
        "koh": 0.195,
        "range": null,
        "iodine": 69,
        "ins": 130
      },
      {
        "source": "SL",
        "naoh": 0.136,
        "koh": 0.19,
        "range": null,
        "iodine": 81,
        "ins": 109
      }
    ],
    "note": null
  },
  {
    "id": "emu_oil",
    "ar": "دهن الإيمو",
    "en": "Emu oil",
    "category": "دهون حيوانية",
    "sapNaOH": 0.1365,
    "status": "disputed",
    "spreadNaOH": 0.003,
    "sources": [
      {
        "source": "SB",
        "naoh": 0.135,
        "koh": 0.19,
        "range": null,
        "iodine": 60,
        "ins": 128
      },
      {
        "source": "SL",
        "naoh": 0.138,
        "koh": 0.194,
        "range": null,
        "iodine": 60,
        "ins": 134
      }
    ],
    "note": null
  },
  {
    "id": "deer_tallow",
    "ar": "شحم الغزلان",
    "en": "Deer tallow",
    "category": "دهون حيوانية",
    "sapNaOH": 0.1385,
    "status": "cross-checked",
    "spreadNaOH": 0.001,
    "sources": [
      {
        "source": "SB",
        "naoh": 0.138,
        "koh": 0.193,
        "range": null,
        "iodine": 31,
        "ins": 166
      },
      {
        "source": "SL",
        "naoh": 0.139,
        "koh": 0.194,
        "range": null,
        "iodine": null,
        "ins": null
      }
    ],
    "note": null
  },
  {
    "id": "ghee",
    "ar": "السمن (زبدة مصفاة)",
    "en": "Ghee / butterfat",
    "category": "زبدات",
    "sapNaOH": 0.161,
    "status": "cross-checked",
    "spreadNaOH": 0.002,
    "sources": [
      {
        "source": "SB",
        "naoh": 0.162,
        "koh": 0.227,
        "range": "213–235",
        "iodine": 30,
        "ins": 191
      },
      {
        "source": "SL",
        "naoh": 0.16,
        "koh": 0.224,
        "range": null,
        "iodine": null,
        "ins": null
      }
    ],
    "note": null
  },
  {
    "id": "cocoa_butter",
    "ar": "زبدة الكاكاو",
    "en": "Cocoa butter",
    "category": "زبدات",
    "sapNaOH": 0.1375,
    "status": "cross-checked",
    "spreadNaOH": 0.001,
    "sources": [
      {
        "source": "SB",
        "naoh": 0.138,
        "koh": 0.194,
        "range": "188–198",
        "iodine": 37,
        "ins": 157
      },
      {
        "source": "SL",
        "naoh": 0.137,
        "koh": 0.192,
        "range": null,
        "iodine": 39,
        "ins": 153
      }
    ],
    "note": null
  },
  {
    "id": "shea_butter",
    "ar": "زبدة الشيا",
    "en": "Shea butter",
    "category": "زبدات",
    "sapNaOH": 0.129,
    "status": "cross-checked",
    "spreadNaOH": 0.002,
    "sources": [
      {
        "source": "SB",
        "naoh": 0.128,
        "koh": 0.179,
        "range": "170–190",
        "iodine": 59,
        "ins": 116
      },
      {
        "source": "SL",
        "naoh": 0.13,
        "koh": 0.182,
        "range": null,
        "iodine": 59,
        "ins": 123
      }
    ],
    "note": null
  },
  {
    "id": "mango_butter",
    "ar": "زبدة المانجو",
    "en": "Mango butter",
    "category": "زبدات",
    "sapNaOH": 0.1355,
    "status": "cross-checked",
    "spreadNaOH": 0.001,
    "sources": [
      {
        "source": "SB",
        "naoh": 0.136,
        "koh": 0.191,
        "range": "185–195",
        "iodine": 45,
        "ins": 146
      },
      {
        "source": "SL",
        "naoh": 0.135,
        "koh": 0.189,
        "range": null,
        "iodine": 45,
        "ins": 145
      }
    ],
    "note": "SL يسميها Mango seed butter؛ تم افتراض أنها المنتج نفسه."
  },
  {
    "id": "cupuacu_butter",
    "ar": "زبدة الكوبواسو",
    "en": "Cupuaçu butter",
    "category": "زبدات",
    "sapNaOH": 0.1355,
    "status": "disputed",
    "spreadNaOH": 0.003,
    "sources": [
      {
        "source": "SB",
        "naoh": 0.137,
        "koh": 0.192,
        "range": null,
        "iodine": 39,
        "ins": 153
      },
      {
        "source": "SL",
        "naoh": 0.134,
        "koh": 0.188,
        "range": null,
        "iodine": null,
        "ins": null
      }
    ],
    "note": null
  },
  {
    "id": "murumuru_butter",
    "ar": "زبدة الموروموتو",
    "en": "Murumuru butter",
    "category": "زبدات",
    "sapNaOH": 0.169,
    "status": "cross-checked",
    "spreadNaOH": 0.002,
    "sources": [
      {
        "source": "SB",
        "naoh": 0.17,
        "koh": 0.238,
        "range": "220–250",
        "iodine": 25,
        "ins": 250
      },
      {
        "source": "SL",
        "naoh": 0.168,
        "koh": 0.235,
        "range": null,
        "iodine": 10,
        "ins": 225
      }
    ],
    "note": "قيم اليود وINS تختلف بين المصدرين."
  },
  {
    "id": "tucuma_butter",
    "ar": "زبدة التوكوما",
    "en": "Tucumã butter",
    "category": "زبدات",
    "sapNaOH": 0.169,
    "status": "cross-checked",
    "spreadNaOH": 0.002,
    "sources": [
      {
        "source": "SB",
        "naoh": 0.17,
        "koh": 0.238,
        "range": null,
        "iodine": 13,
        "ins": 175
      },
      {
        "source": "SL",
        "naoh": 0.168,
        "koh": 0.236,
        "range": null,
        "iodine": null,
        "ins": null
      }
    ],
    "note": null
  },
  {
    "id": "illipe_butter",
    "ar": "زبدة الإيليبي",
    "en": "Illipe butter",
    "category": "زبدات",
    "sapNaOH": 0.1335,
    "status": "disputed",
    "spreadNaOH": 0.003,
    "sources": [
      {
        "source": "SB",
        "naoh": 0.132,
        "koh": 0.185,
        "range": null,
        "iodine": 33,
        "ins": 152
      },
      {
        "source": "SL",
        "naoh": 0.135,
        "koh": 0.19,
        "range": null,
        "iodine": 32,
        "ins": 159
      }
    ],
    "note": null
  },
  {
    "id": "kokum_butter",
    "ar": "زبدة الكوكوم",
    "en": "Kokum butter",
    "category": "زبدات",
    "sapNaOH": 0.135,
    "status": "cross-checked",
    "spreadNaOH": 0.0,
    "sources": [
      {
        "source": "SB",
        "naoh": 0.135,
        "koh": 0.19,
        "range": "185–195",
        "iodine": 35,
        "ins": 155
      },
      {
        "source": "SL",
        "naoh": 0.135,
        "koh": 0.189,
        "range": null,
        "iodine": 36,
        "ins": 153
      }
    ],
    "note": null
  },
  {
    "id": "sal_butter",
    "ar": "زبدة السال",
    "en": "Sal butter",
    "category": "زبدات",
    "sapNaOH": 0.1335,
    "status": "disputed",
    "spreadNaOH": 0.003,
    "sources": [
      {
        "source": "SB",
        "naoh": 0.132,
        "koh": 0.185,
        "range": null,
        "iodine": 39,
        "ins": 146
      },
      {
        "source": "SL",
        "naoh": 0.135,
        "koh": 0.19,
        "range": null,
        "iodine": null,
        "ins": null
      }
    ],
    "note": null
  },
  {
    "id": "lauric_acid",
    "ar": "حمض اللوريك",
    "en": "Lauric acid",
    "category": "أحماض دهنية",
    "sapNaOH": 0.2,
    "status": "cross-checked",
    "spreadNaOH": 0.0,
    "sources": [
      {
        "source": "SB",
        "naoh": 0.2,
        "koh": 0.28,
        "range": null,
        "iodine": 0,
        "ins": 280
      },
      {
        "source": "SL",
        "naoh": 0.2,
        "koh": 0.28,
        "range": null,
        "iodine": 0,
        "ins": 280
      }
    ],
    "note": "حمض دهني نقي، وليس زيتًا؛ يُستخدم للتحكم في الصلابة والرغوة."
  },
  {
    "id": "myristic_acid",
    "ar": "حمض الميريستيك",
    "en": "Myristic acid",
    "category": "أحماض دهنية",
    "sapNaOH": 0.1755,
    "status": "cross-checked",
    "spreadNaOH": 0.001,
    "sources": [
      {
        "source": "SB",
        "naoh": 0.176,
        "koh": 0.247,
        "range": null,
        "iodine": 1,
        "ins": 246
      },
      {
        "source": "SL",
        "naoh": 0.175,
        "koh": 0.245,
        "range": null,
        "iodine": 0,
        "ins": 245
      }
    ],
    "note": null
  },
  {
    "id": "palmitic_acid",
    "ar": "حمض البالمتيك",
    "en": "Palmitic acid",
    "category": "أحماض دهنية",
    "sapNaOH": 0.154,
    "status": "cross-checked",
    "spreadNaOH": 0.002,
    "sources": [
      {
        "source": "SB",
        "naoh": 0.153,
        "koh": 0.215,
        "range": null,
        "iodine": 2,
        "ins": 213
      },
      {
        "source": "SL",
        "naoh": 0.155,
        "koh": 0.217,
        "range": null,
        "iodine": 0,
        "ins": 217
      }
    ],
    "note": null
  },
  {
    "id": "stearic_acid",
    "ar": "حمض الستياريك",
    "en": "Stearic acid",
    "category": "أحماض دهنية",
    "sapNaOH": 0.143,
    "status": "disputed",
    "spreadNaOH": 0.004,
    "sources": [
      {
        "source": "SB",
        "naoh": 0.141,
        "koh": 0.198,
        "range": null,
        "iodine": 2,
        "ins": 196
      },
      {
        "source": "SL",
        "naoh": 0.145,
        "koh": 0.203,
        "range": null,
        "iodine": null,
        "ins": null
      }
    ],
    "note": null
  },
  {
    "id": "oleic_acid",
    "ar": "حمض الأوليك",
    "en": "Oleic acid",
    "category": "أحماض دهنية",
    "sapNaOH": 0.143,
    "status": "cross-checked",
    "spreadNaOH": 0.002,
    "sources": [
      {
        "source": "SB",
        "naoh": 0.144,
        "koh": 0.202,
        "range": null,
        "iodine": 92,
        "ins": 110
      },
      {
        "source": "SL",
        "naoh": 0.142,
        "koh": 0.2,
        "range": null,
        "iodine": null,
        "ins": null
      }
    ],
    "note": null
  },
  {
    "id": "avocado_oil",
    "ar": "زيت الأفوكادو",
    "en": "Avocado oil",
    "category": "زيوت نباتية",
    "sapNaOH": 0.134,
    "status": "cross-checked",
    "spreadNaOH": 0.002,
    "sources": [
      {
        "source": "SB",
        "naoh": 0.133,
        "koh": 0.186,
        "range": "177–198",
        "iodine": 86,
        "ins": 99
      },
      {
        "source": "SL",
        "naoh": 0.135,
        "koh": 0.189,
        "range": null,
        "iodine": 88,
        "ins": 102
      }
    ],
    "note": null
  },
  {
    "id": "sweet_almond",
    "ar": "زيت اللوز الحلو",
    "en": "Sweet almond oil",
    "category": "زيوت نباتية",
    "sapNaOH": 0.139,
    "status": "cross-checked",
    "spreadNaOH": 0.0,
    "sources": [
      {
        "source": "SB",
        "naoh": 0.139,
        "koh": 0.195,
        "range": "190–200",
        "iodine": 99,
        "ins": 97
      },
      {
        "source": "SL",
        "naoh": 0.139,
        "koh": 0.195,
        "range": null,
        "iodine": 99,
        "ins": 96
      }
    ],
    "note": null
  },
  {
    "id": "apricot_kernel",
    "ar": "زيت نواة المشمش",
    "en": "Apricot kernel oil",
    "category": "زيوت نباتية",
    "sapNaOH": 0.137,
    "status": "disputed",
    "spreadNaOH": 0.004,
    "sources": [
      {
        "source": "SB",
        "naoh": 0.139,
        "koh": 0.195,
        "range": "185–199",
        "iodine": 100,
        "ins": 91
      },
      {
        "source": "SL",
        "naoh": 0.135,
        "koh": 0.19,
        "range": null,
        "iodine": 102,
        "ins": 88
      }
    ],
    "note": null
  },
  {
    "id": "argan",
    "ar": "زيت الأرغان",
    "en": "Argan oil",
    "category": "زيوت نباتية",
    "sapNaOH": 0.137,
    "status": "cross-checked",
    "spreadNaOH": 0.002,
    "sources": [
      {
        "source": "SB",
        "naoh": 0.136,
        "koh": 0.191,
        "range": "185–195",
        "iodine": 95,
        "ins": 95
      },
      {
        "source": "SL",
        "naoh": 0.138,
        "koh": 0.194,
        "range": null,
        "iodine": 101,
        "ins": 94
      }
    ],
    "note": null
  },
  {
    "id": "babassu",
    "ar": "زيت بابسو",
    "en": "Babassu oil",
    "category": "دهون نباتية",
    "sapNaOH": 0.177,
    "status": "disputed",
    "spreadNaOH": 0.004,
    "sources": [
      {
        "source": "SB",
        "naoh": 0.175,
        "koh": 0.245,
        "range": "245–256",
        "iodine": 15,
        "ins": 230
      },
      {
        "source": "SL",
        "naoh": 0.179,
        "koh": 0.251,
        "range": null,
        "iodine": 14,
        "ins": 237
      }
    ],
    "note": null
  },
  {
    "id": "baobab",
    "ar": "زيت الباوباب",
    "en": "Baobab seed oil",
    "category": "زيوت نباتية",
    "sapNaOH": 0.139,
    "status": "disputed",
    "spreadNaOH": 0.008,
    "sources": [
      {
        "source": "SB",
        "naoh": 0.143,
        "koh": 0.2,
        "range": null,
        "iodine": 75,
        "ins": 125
      },
      {
        "source": "SL",
        "naoh": 0.135,
        "koh": 0.19,
        "range": null,
        "iodine": null,
        "ins": null
      }
    ],
    "note": null
  },
  {
    "id": "black_cumin",
    "ar": "زيت الحبة السوداء",
    "en": "Black cumin seed oil",
    "category": "زيوت نباتية",
    "sapNaOH": 0.139,
    "status": "cross-checked",
    "spreadNaOH": 0.0,
    "sources": [
      {
        "source": "SB",
        "naoh": 0.139,
        "koh": 0.195,
        "range": null,
        "iodine": 133,
        "ins": 62
      },
      {
        "source": "SL",
        "naoh": 0.139,
        "koh": 0.195,
        "range": null,
        "iodine": null,
        "ins": null
      }
    ],
    "note": null
  },
  {
    "id": "borage",
    "ar": "زيت البوراج",
    "en": "Borage seed oil",
    "category": "زيوت نباتية",
    "sapNaOH": 0.1345,
    "status": "cross-checked",
    "spreadNaOH": 0.001,
    "sources": [
      {
        "source": "SB",
        "naoh": 0.135,
        "koh": 0.19,
        "range": null,
        "iodine": 135,
        "ins": 55
      },
      {
        "source": "SL",
        "naoh": 0.134,
        "koh": 0.188,
        "range": null,
        "iodine": null,
        "ins": null
      }
    ],
    "note": null
  },
  {
    "id": "camellia",
    "ar": "زيت الكاميليا (بذر الشاي)",
    "en": "Camellia (tea seed) oil",
    "category": "زيوت نباتية",
    "sapNaOH": 0.137,
    "status": "cross-checked",
    "spreadNaOH": 0.002,
    "sources": [
      {
        "source": "SB",
        "naoh": 0.138,
        "koh": 0.193,
        "range": null,
        "iodine": 78,
        "ins": 115
      },
      {
        "source": "SL",
        "naoh": 0.136,
        "koh": 0.191,
        "range": null,
        "iodine": 85,
        "ins": 106
      }
    ],
    "note": null
  },
  {
    "id": "canola",
    "ar": "زيت الكانولا",
    "en": "Canola oil (low-erucic rapeseed)",
    "category": "زيوت نباتية",
    "sapNaOH": 0.1335,
    "status": "cross-checked",
    "spreadNaOH": 0.001,
    "sources": [
      {
        "source": "SB",
        "naoh": 0.133,
        "koh": 0.186,
        "range": "182–193",
        "iodine": 110,
        "ins": 56
      },
      {
        "source": "SL",
        "naoh": 0.134,
        "koh": 0.188,
        "range": null,
        "iodine": 116,
        "ins": 72
      }
    ],
    "note": "اليود وINS يختلفان بين المصدرين؛ النطاق من SB."
  },
  {
    "id": "castor",
    "ar": "زيت الخروع",
    "en": "Castor oil",
    "category": "زيوت نباتية",
    "sapNaOH": 0.1285,
    "status": "cross-checked",
    "spreadNaOH": 0.001,
    "sources": [
      {
        "source": "SB",
        "naoh": 0.128,
        "koh": 0.18,
        "range": "176–187",
        "iodine": 86,
        "ins": 95
      },
      {
        "source": "SL",
        "naoh": 0.129,
        "koh": 0.182,
        "range": null,
        "iodine": 85,
        "ins": 97
      }
    ],
    "note": null
  },
  {
    "id": "corn",
    "ar": "زيت الذرة",
    "en": "Corn (maize) oil",
    "category": "زيوت نباتية",
    "sapNaOH": 0.1365,
    "status": "cross-checked",
    "spreadNaOH": 0.001,
    "sources": [
      {
        "source": "SB",
        "naoh": 0.137,
        "koh": 0.192,
        "range": "187–193",
        "iodine": 117,
        "ins": 69
      },
      {
        "source": "SL",
        "naoh": 0.136,
        "koh": 0.191,
        "range": null,
        "iodine": 119,
        "ins": 72
      }
    ],
    "note": null
  },
  {
    "id": "cottonseed",
    "ar": "زيت بذرة القطن",
    "en": "Cottonseed oil",
    "category": "زيوت نباتية",
    "sapNaOH": 0.138,
    "status": "cross-checked",
    "spreadNaOH": 0.0,
    "sources": [
      {
        "source": "SB",
        "naoh": 0.138,
        "koh": 0.194,
        "range": null,
        "iodine": 108,
        "ins": 89
      },
      {
        "source": "SL",
        "naoh": 0.138,
        "koh": 0.194,
        "range": null,
        "iodine": 112,
        "ins": 82
      }
    ],
    "note": null
  },
  {
    "id": "cranberry_seed",
    "ar": "زيت بذرة التوت البري",
    "en": "Cranberry seed oil",
    "category": "زيوت نباتية",
    "sapNaOH": 0.135,
    "status": "cross-checked",
    "spreadNaOH": 0.0,
    "sources": [
      {
        "source": "SB",
        "naoh": 0.135,
        "koh": 0.19,
        "range": null,
        "iodine": 150,
        "ins": 40
      },
      {
        "source": "SL",
        "naoh": 0.135,
        "koh": 0.19,
        "range": null,
        "iodine": null,
        "ins": null
      }
    ],
    "note": null
  },
  {
    "id": "evening_primrose",
    "ar": "زيت زهرة الربيع المسائية",
    "en": "Evening primrose oil",
    "category": "زيوت نباتية",
    "sapNaOH": 0.135,
    "status": "cross-checked",
    "spreadNaOH": 0.0,
    "sources": [
      {
        "source": "SB",
        "naoh": 0.135,
        "koh": 0.19,
        "range": null,
        "iodine": 160,
        "ins": 30
      },
      {
        "source": "SL",
        "naoh": 0.135,
        "koh": 0.189,
        "range": null,
        "iodine": 155,
        "ins": 34
      }
    ],
    "note": null
  },
  {
    "id": "flaxseed",
    "ar": "زيت بذر الكتان",
    "en": "Flaxseed (linseed) oil",
    "category": "زيوت نباتية",
    "sapNaOH": 0.1355,
    "status": "cross-checked",
    "spreadNaOH": 0.001,
    "sources": [
      {
        "source": "SB",
        "naoh": 0.135,
        "koh": 0.19,
        "range": "188–196",
        "iodine": 180,
        "ins": -6
      },
      {
        "source": "SL",
        "naoh": 0.136,
        "koh": 0.191,
        "range": null,
        "iodine": null,
        "ins": null
      }
    ],
    "note": "يود مرتفع جدًا: خطر التزنخ؛ يُستخدم بكميات محدودة."
  },
  {
    "id": "grapeseed",
    "ar": "زيت بذرة العنب",
    "en": "Grapeseed oil",
    "category": "زيوت نباتية",
    "sapNaOH": 0.1325,
    "status": "disputed",
    "spreadNaOH": 0.007,
    "sources": [
      {
        "source": "SB",
        "naoh": 0.129,
        "koh": 0.181,
        "range": "176–194",
        "iodine": 131,
        "ins": 66
      },
      {
        "source": "SL",
        "naoh": 0.136,
        "koh": 0.191,
        "range": null,
        "iodine": 139,
        "ins": 52
      }
    ],
    "note": "خلاف واضح بين المصدرين في SAP."
  },
  {
    "id": "hazelnut",
    "ar": "زيت البندق",
    "en": "Hazelnut oil",
    "category": "زيوت نباتية",
    "sapNaOH": 0.1375,
    "status": "disputed",
    "spreadNaOH": 0.003,
    "sources": [
      {
        "source": "SB",
        "naoh": 0.139,
        "koh": 0.195,
        "range": "188–197",
        "iodine": 97,
        "ins": 94
      },
      {
        "source": "SL",
        "naoh": 0.136,
        "koh": 0.191,
        "range": null,
        "iodine": 85,
        "ins": 106
      }
    ],
    "note": null
  },
  {
    "id": "hemp_seed",
    "ar": "زيت بذر القنب",
    "en": "Hemp seed oil",
    "category": "زيوت نباتية",
    "sapNaOH": 0.137,
    "status": "cross-checked",
    "spreadNaOH": 0.002,
    "sources": [
      {
        "source": "SB",
        "naoh": 0.138,
        "koh": 0.193,
        "range": "190–195",
        "iodine": 165,
        "ins": 39
      },
      {
        "source": "SL",
        "naoh": 0.136,
        "koh": 0.191,
        "range": null,
        "iodine": null,
        "ins": null
      }
    ],
    "note": null
  },
  {
    "id": "kukui_nut",
    "ar": "زيت الكوكوي",
    "en": "Kukui nut oil",
    "category": "زيوت نباتية",
    "sapNaOH": 0.135,
    "status": "cross-checked",
    "spreadNaOH": 0.0,
    "sources": [
      {
        "source": "SB",
        "naoh": 0.135,
        "koh": 0.189,
        "range": null,
        "iodine": 168,
        "ins": 24
      },
      {
        "source": "SL",
        "naoh": 0.135,
        "koh": 0.19,
        "range": null,
        "iodine": 168,
        "ins": 23
      }
    ],
    "note": null
  },
  {
    "id": "macadamia",
    "ar": "زيت المكاداميا",
    "en": "Macadamia nut oil",
    "category": "زيوت نباتية",
    "sapNaOH": 0.139,
    "status": "cross-checked",
    "spreadNaOH": 0.0,
    "sources": [
      {
        "source": "SB",
        "naoh": 0.139,
        "koh": 0.195,
        "range": "190–197",
        "iodine": 76,
        "ins": 119
      },
      {
        "source": "SL",
        "naoh": 0.139,
        "koh": 0.195,
        "range": null,
        "iodine": 75,
        "ins": 120
      }
    ],
    "note": null
  },
  {
    "id": "marula",
    "ar": "زيت المارولا",
    "en": "Marula oil",
    "category": "زيوت نباتية",
    "sapNaOH": 0.137,
    "status": "cross-checked",
    "spreadNaOH": 0.0,
    "sources": [
      {
        "source": "SB",
        "naoh": 0.137,
        "koh": 0.192,
        "range": null,
        "iodine": 73,
        "ins": 119
      },
      {
        "source": "SL",
        "naoh": 0.137,
        "koh": 0.192,
        "range": null,
        "iodine": 73,
        "ins": 119
      }
    ],
    "note": null
  },
  {
    "id": "meadowfoam",
    "ar": "زيت الميدوفوم",
    "en": "Meadowfoam seed oil",
    "category": "زيوت نباتية",
    "sapNaOH": 0.1195,
    "status": "cross-checked",
    "spreadNaOH": 0.001,
    "sources": [
      {
        "source": "SB",
        "naoh": 0.12,
        "koh": 0.169,
        "range": null,
        "iodine": 92,
        "ins": 77
      },
      {
        "source": "SL",
        "naoh": 0.119,
        "koh": 0.168,
        "range": null,
        "iodine": null,
        "ins": null
      }
    ],
    "note": null
  },
  {
    "id": "moringa",
    "ar": "زيت المورينجا",
    "en": "Moringa seed oil",
    "category": "زيوت نباتية",
    "sapNaOH": 0.1325,
    "status": "disputed",
    "spreadNaOH": 0.009,
    "sources": [
      {
        "source": "SB",
        "naoh": 0.137,
        "koh": 0.192,
        "range": null,
        "iodine": 68,
        "ins": 124
      },
      {
        "source": "SL",
        "naoh": 0.128,
        "koh": 0.18,
        "range": null,
        "iodine": 68,
        "ins": 112
      }
    ],
    "note": "خلاف كبير بين المصدرين في SAP."
  },
  {
    "id": "mustard",
    "ar": "زيت الخردل",
    "en": "Mustard seed oil",
    "category": "زيوت نباتية",
    "sapNaOH": 0.124,
    "status": "cross-checked",
    "spreadNaOH": 0.002,
    "sources": [
      {
        "source": "SB",
        "naoh": 0.123,
        "koh": 0.173,
        "range": null,
        "iodine": 101,
        "ins": 72
      },
      {
        "source": "SL",
        "naoh": 0.125,
        "koh": 0.176,
        "range": null,
        "iodine": 109,
        "ins": 68
      }
    ],
    "note": null
  },
  {
    "id": "neem",
    "ar": "زيت النيم",
    "en": "Neem seed oil",
    "category": "زيوت نباتية",
    "sapNaOH": 0.1385,
    "status": "cross-checked",
    "spreadNaOH": 0.001,
    "sources": [
      {
        "source": "SB",
        "naoh": 0.138,
        "koh": 0.193,
        "range": null,
        "iodine": 72,
        "ins": 121
      },
      {
        "source": "SL",
        "naoh": 0.139,
        "koh": 0.196,
        "range": null,
        "iodine": 74,
        "ins": 122
      }
    ],
    "note": null
  },
  {
    "id": "palm_kernel",
    "ar": "زيت نواة النخيل",
    "en": "Palm kernel oil",
    "category": "دهون نباتية",
    "sapNaOH": 0.1745,
    "status": "disputed",
    "spreadNaOH": 0.003,
    "sources": [
      {
        "source": "SB",
        "naoh": 0.176,
        "koh": 0.247,
        "range": "230–254",
        "iodine": 20,
        "ins": 227
      },
      {
        "source": "SL",
        "naoh": 0.173,
        "koh": 0.242,
        "range": null,
        "iodine": 18,
        "ins": 224
      }
    ],
    "note": null
  },
  {
    "id": "peanut",
    "ar": "زيت الفول السوداني",
    "en": "Peanut (groundnut) oil",
    "category": "زيوت نباتية",
    "sapNaOH": 0.137,
    "status": "cross-checked",
    "spreadNaOH": 0.0,
    "sources": [
      {
        "source": "SB",
        "naoh": 0.137,
        "koh": 0.192,
        "range": "187–196",
        "iodine": 92,
        "ins": 99
      },
      {
        "source": "SL",
        "naoh": 0.137,
        "koh": 0.192,
        "range": null,
        "iodine": 97,
        "ins": 95
      }
    ],
    "note": null
  },
  {
    "id": "pumpkin_seed",
    "ar": "زيت بذرة اليقطين",
    "en": "Pumpkin seed oil",
    "category": "زيوت نباتية",
    "sapNaOH": 0.1385,
    "status": "cross-checked",
    "spreadNaOH": 0.001,
    "sources": [
      {
        "source": "SB",
        "naoh": 0.139,
        "koh": 0.195,
        "range": null,
        "iodine": 128,
        "ins": 67
      },
      {
        "source": "SL",
        "naoh": 0.138,
        "koh": 0.193,
        "range": null,
        "iodine": 117,
        "ins": 76
      }
    ],
    "note": null
  },
  {
    "id": "rice_bran",
    "ar": "زيت نخالة الأرز",
    "en": "Rice bran oil",
    "category": "زيوت نباتية",
    "sapNaOH": 0.134,
    "status": "cross-checked",
    "spreadNaOH": 0.002,
    "sources": [
      {
        "source": "SB",
        "naoh": 0.133,
        "koh": 0.187,
        "range": "180–195",
        "iodine": 100,
        "ins": 87
      },
      {
        "source": "SL",
        "naoh": 0.135,
        "koh": 0.19,
        "range": null,
        "iodine": 103,
        "ins": 87
      }
    ],
    "note": null
  },
  {
    "id": "rosehip",
    "ar": "زيت ورد البر (بذر الورد)",
    "en": "Rosehip seed oil",
    "category": "زيوت نباتية",
    "sapNaOH": 0.134,
    "status": "cross-checked",
    "spreadNaOH": 0.002,
    "sources": [
      {
        "source": "SB",
        "naoh": 0.133,
        "koh": 0.187,
        "range": null,
        "iodine": 188,
        "ins": 10
      },
      {
        "source": "SL",
        "naoh": 0.135,
        "koh": 0.189,
        "range": null,
        "iodine": 170,
        "ins": 19
      }
    ],
    "note": null
  },
  {
    "id": "safflower",
    "ar": "زيت القرطم",
    "en": "Safflower oil",
    "category": "زيوت نباتية",
    "sapNaOH": 0.137,
    "status": "cross-checked",
    "spreadNaOH": 0.0,
    "sources": [
      {
        "source": "SB",
        "naoh": 0.137,
        "koh": 0.192,
        "range": "186–194",
        "iodine": 145,
        "ins": 47
      },
      {
        "source": "SL",
        "naoh": 0.137,
        "koh": 0.192,
        "range": null,
        "iodine": 142,
        "ins": 50
      }
    ],
    "note": null
  },
  {
    "id": "safflower_ho",
    "ar": "زيت القرطم عالي الأوليك",
    "en": "Safflower oil, high oleic",
    "category": "زيوت نباتية",
    "sapNaOH": 0.135,
    "status": "cross-checked",
    "spreadNaOH": 0.0,
    "sources": [
      {
        "source": "SB",
        "naoh": 0.135,
        "koh": 0.19,
        "range": "186–194",
        "iodine": 93,
        "ins": 97
      },
      {
        "source": "SL",
        "naoh": 0.135,
        "koh": 0.19,
        "range": null,
        "iodine": 90,
        "ins": 100
      }
    ],
    "note": null
  },
  {
    "id": "sesame",
    "ar": "زيت السمسم",
    "en": "Sesame oil",
    "category": "زيوت نباتية",
    "sapNaOH": 0.135,
    "status": "cross-checked",
    "spreadNaOH": 0.002,
    "sources": [
      {
        "source": "SB",
        "naoh": 0.134,
        "koh": 0.188,
        "range": "187–195",
        "iodine": 110,
        "ins": 81
      },
      {
        "source": "SL",
        "naoh": 0.136,
        "koh": 0.191,
        "range": null,
        "iodine": 112,
        "ins": 79
      }
    ],
    "note": null
  },
  {
    "id": "soybean",
    "ar": "زيت فول الصويا",
    "en": "Soybean oil",
    "category": "زيوت نباتية",
    "sapNaOH": 0.1365,
    "status": "cross-checked",
    "spreadNaOH": 0.001,
    "sources": [
      {
        "source": "SB",
        "naoh": 0.136,
        "koh": 0.191,
        "range": "189–195",
        "iodine": 131,
        "ins": 61
      },
      {
        "source": "SL",
        "naoh": 0.137,
        "koh": 0.192,
        "range": null,
        "iodine": 132,
        "ins": 61
      }
    ],
    "note": null
  },
  {
    "id": "sunflower",
    "ar": "زيت عباد الشمس",
    "en": "Sunflower oil",
    "category": "زيوت نباتية",
    "sapNaOH": 0.1355,
    "status": "cross-checked",
    "spreadNaOH": 0.001,
    "sources": [
      {
        "source": "SB",
        "naoh": 0.135,
        "koh": 0.189,
        "range": "188–194",
        "iodine": 133,
        "ins": 63
      },
      {
        "source": "SL",
        "naoh": 0.136,
        "koh": 0.191,
        "range": null,
        "iodine": 130,
        "ins": 62
      }
    ],
    "note": null
  },
  {
    "id": "sunflower_ho",
    "ar": "زيت عباد الشمس عالي الأوليك",
    "en": "Sunflower oil, high oleic",
    "category": "زيوت نباتية",
    "sapNaOH": 0.1345,
    "status": "cross-checked",
    "spreadNaOH": 0.001,
    "sources": [
      {
        "source": "SB",
        "naoh": 0.135,
        "koh": 0.189,
        "range": "188–194",
        "iodine": 83,
        "ins": 106
      },
      {
        "source": "SL",
        "naoh": 0.134,
        "koh": 0.188,
        "range": null,
        "iodine": 84,
        "ins": 104
      }
    ],
    "note": null
  },
  {
    "id": "walnut",
    "ar": "زيت الجوز",
    "en": "Walnut oil",
    "category": "زيوت نباتية",
    "sapNaOH": 0.1365,
    "status": "disputed",
    "spreadNaOH": 0.003,
    "sources": [
      {
        "source": "SB",
        "naoh": 0.135,
        "koh": 0.189,
        "range": "189–197",
        "iodine": 145,
        "ins": 45
      },
      {
        "source": "SL",
        "naoh": 0.138,
        "koh": 0.193,
        "range": null,
        "iodine": 143,
        "ins": 50
      }
    ],
    "note": null
  },
  {
    "id": "wheat_germ",
    "ar": "زيت جنين القمح",
    "en": "Wheat germ oil",
    "category": "زيوت نباتية",
    "sapNaOH": 0.132,
    "status": "disputed",
    "spreadNaOH": 0.004,
    "sources": [
      {
        "source": "SB",
        "naoh": 0.13,
        "koh": 0.183,
        "range": null,
        "iodine": 128,
        "ins": 58
      },
      {
        "source": "SL",
        "naoh": 0.134,
        "koh": 0.189,
        "range": null,
        "iodine": 123,
        "ins": 66
      }
    ],
    "note": null
  },
  {
    "id": "olive_pomace",
    "ar": "زيت الزيتون (البوماس)",
    "en": "Olive pomace oil",
    "category": "زيوت نباتية",
    "sapNaOH": 0.134,
    "status": "cross-checked",
    "spreadNaOH": 0.0,
    "sources": [
      {
        "source": "SB",
        "naoh": 0.134,
        "koh": 0.188,
        "range": "182–194",
        "iodine": 84,
        "ins": 104
      },
      {
        "source": "SL",
        "naoh": 0.134,
        "koh": 0.188,
        "range": null,
        "iodine": 84,
        "ins": 104
      }
    ],
    "note": null
  },
  {
    "id": "tamanu",
    "ar": "زيت التامانو",
    "en": "Tamanu oil (kamani)",
    "category": "زيوت نباتية",
    "sapNaOH": 0.1435,
    "status": "disputed",
    "spreadNaOH": 0.009,
    "sources": [
      {
        "source": "SB",
        "naoh": 0.148,
        "koh": 0.208,
        "range": null,
        "iodine": 111,
        "ins": 82
      },
      {
        "source": "SL",
        "naoh": 0.139,
        "koh": 0.195,
        "range": null,
        "iodine": null,
        "ins": null
      }
    ],
    "note": "خلاف كبير بين المصدرين في SAP."
  },
  {
    "id": "ucuuba_butter",
    "ar": "زبدة الأوكوبا",
    "en": "Ucuuba butter",
    "category": "زبدات",
    "sapNaOH": 0.155,
    "status": "disputed",
    "spreadNaOH": 0.018,
    "sources": [
      {
        "source": "SB",
        "naoh": 0.146,
        "koh": 0.205,
        "range": null,
        "iodine": 38,
        "ins": 167
      },
      {
        "source": "SL",
        "naoh": 0.164,
        "koh": 0.231,
        "range": null,
        "iodine": null,
        "ins": null
      }
    ],
    "note": "خلاف كبير بين المصدرين في SAP."
  },
  {
    "id": "mct_coconut",
    "ar": "زيت جوز الهند المجزأ (MCT)",
    "en": "Fractionated coconut oil (MCT)",
    "category": "دهون نباتية",
    "sapNaOH": 0.2355,
    "status": "disputed",
    "spreadNaOH": 0.007,
    "sources": [
      {
        "source": "SB",
        "naoh": 0.232,
        "koh": 0.325,
        "range": null,
        "iodine": 1,
        "ins": 324
      },
      {
        "source": "SL",
        "naoh": 0.239,
        "koh": 0.335,
        "range": null,
        "iodine": null,
        "ins": null
      }
    ],
    "note": "زيت MCT ليس زيتًا صابونيًا بكميات كبيرة؛ خلاف بين المصدرين."
  },
  {
    "id": "beeswax",
    "ar": "شمع العسل",
    "en": "Beeswax",
    "category": "شموع",
    "sapNaOH": 0.0655,
    "status": "disputed",
    "spreadNaOH": 0.003,
    "sources": [
      {
        "source": "SB",
        "naoh": 0.067,
        "koh": 0.094,
        "range": "87–104",
        "iodine": 10,
        "ins": 84
      },
      {
        "source": "SL",
        "naoh": 0.064,
        "koh": 0.09,
        "range": null,
        "iodine": null,
        "ins": null
      }
    ],
    "note": null
  },
  {
    "id": "candelilla_wax",
    "ar": "شمع الكانديلا",
    "en": "Candelilla wax",
    "category": "شموع",
    "sapNaOH": 0.0345,
    "status": "disputed",
    "spreadNaOH": 0.007,
    "sources": [
      {
        "source": "SB",
        "naoh": 0.031,
        "koh": 0.044,
        "range": null,
        "iodine": 32,
        "ins": 12
      },
      {
        "source": "SL",
        "naoh": 0.038,
        "koh": 0.054,
        "range": null,
        "iodine": null,
        "ins": null
      }
    ],
    "note": null
  }
].map((o) => Object.freeze(o)));

export function findOil(id, oils = OILS) {
  return oils.find((o) => o.id === id) || null;
}

export function isVerified(oil) {
  return oil?.status === "cross-checked";
}

/** قيمة KOH المشتقة من NaOH بالنسبة المولية (غ KOH / غ زيت). */
export function sapKOHFromNaOH(sapNaOH) {
  return sapNaOH * KOH_PER_NAOH;
}

const STATUS_LABELS = Object.freeze({
  'cross-checked': 'متفق عليه بين مصدرين',
  disputed: 'خلاف بين المصدرين',
  'single-source': 'مصدر واحد',
  manual: 'مُدخل يدويًا',
});
export function statusLabel(status) {
  return STATUS_LABELS[status] || 'غير موثق';
}

/**
 * يتحقق من مكوّن يدوي جديد ويُنشئ سجلّه. لا يُعدّ المكوّن اليدوي موثقًا.
 * يقبل قيمة تصبن NaOH بين 0.03 و 0.30 غ/غ (نطاق معقول للدهون والزيوت والشموع الصابونية)،
 * ويشترط ذكر مصدر أو ملاحظة لتتبع القيمة.
 */
export function createCustomOil(input, id) {
  const errors = [];
  const ar = typeof input?.ar === 'string' ? input.ar.trim() : '';
  const en = typeof input?.en === 'string' ? input.en.trim() : '';
  const source = typeof input?.source === 'string' ? input.source.trim() : '';
  const sap = input?.sapNaOH;
  if (!ar) errors.push('اكتب اسم المكوّن بالعربية.');
  if (!Number.isFinite(sap) || sap < 0.03 || sap > 0.3) {
    errors.push('قيمة التصبن (NaOH) يجب أن تكون رقمًا بين 0.03 و 0.30 غرام لكل غرام.');
  }
  if (!source) errors.push('اكتب مصدر القيمة أو ملاحظة عنها، فالمكوّن اليدوي يحتاج إلى مرجع لتتبعه.');
  if (errors.length) return { ok: false, errors, oil: null };
  return {
    ok: true,
    errors: [],
    oil: Object.freeze({
      id,
      ar,
      en: en || ar,
      category: 'مُدخل يدويًا',
      sapNaOH: Math.round(sap * 10000) / 10000,
      status: 'manual',
      spreadNaOH: 0,
      sources: Object.freeze([]),
      note: `المصدر الذي أدخله المستخدم: ${source}`,
    }),
  };
}
