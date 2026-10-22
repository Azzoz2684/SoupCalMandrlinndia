// ثوابت كيميائية: الأوزان الجزيئية (غ/مول).
export const MW = Object.freeze({
  NaOH: 39.9971,
  KOH: 56.1056,
});

// غرام KOH المكافئ لغرام واحد من NaOH في التصبن (على أساس مكافئ مولي).
export const KOH_PER_NAOH = MW.KOH / MW.NaOH;
