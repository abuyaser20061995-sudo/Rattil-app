// تطبيع النص العربي للمقارنة: إزالة التشكيل وتوحيد الحروف المتشابهة
export function normalizeArabic(text) {
  return String(text)
    .replace(/[\u064B-\u065F\u0670\u0640\u06D6-\u06ED]/g, '')
    .replace(/[\u0622\u0623\u0625\u0671]/g, '\u0627')
    .replace(/\u0649/g, '\u064A')
    .replace(/\u0629/g, '\u0647')
    .replace(/[^\u0621-\u064A\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// كلمات المقطع المتوقعة: word للمقارنة، shown للعرض (بتشكيلها الأصلي)
export function buildExpected(ayahs) {
  const out = [];
  for (const a of ayahs) {
    for (const token of a.text.split(/\s+/)) {
      const word = normalizeArabic(token);
      if (word) out.push({ word, shown: token, ayah: a.ayah_number });
    }
  }
  return out;
}
