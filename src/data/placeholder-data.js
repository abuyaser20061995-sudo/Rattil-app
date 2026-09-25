// بيانات تجريبية غير قرآنية — فقط لاختبار الواجهة والتنقل والتصفح بالصفحات.
// استبدلها ببيانات حقيقية عبر src/database/importer.js عند توفرها.

export const PLACEHOLDER_SURAHS = [
  { number: 1, name_ar: 'سورة تجريبية أولى', ayah_count: 3 },
  { number: 2, name_ar: 'سورة تجريبية ثانية', ayah_count: 2 }
];

export const PLACEHOLDER_AYAHS = [
  { surah_number: 1, ayah_number: 1, text: '[نص تجريبي — آية رقم واحد]', page: 1 },
  { surah_number: 1, ayah_number: 2, text: '[نص تجريبي — آية رقم اثنين]', page: 1 },
  { surah_number: 1, ayah_number: 3, text: '[نص تجريبي — آية رقم ثلاثة]', page: 1 },
  { surah_number: 2, ayah_number: 1, text: '[نص تجريبي — سورة ثانية آية واحد]', page: 2 },
  { surah_number: 2, ayah_number: 2, text: '[نص تجريبي — سورة ثانية آية اثنين]', page: 2 }
];

export const PLACEHOLDER_TOTAL_PAGES = 2;
