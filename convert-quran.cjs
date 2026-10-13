const fs = require('fs');

// ---------- قراءة نص الآيات ----------
const rawText = fs.readFileSync('quran-raw.txt', 'utf8');
const ayahLines = rawText
  .split('\n')
  .filter((l) => /^[0-9]+\|[0-9]+\|/.test(l));

if (ayahLines.length !== 6236) {
  throw new Error('عدد أسطر النص غير صحيح: ' + ayahLines.length + ' (المتوقع 6236)');
}

const ayahsBySurah = {};
for (const line of ayahLines) {
  const firstBar = line.indexOf('|');
  const secondBar = line.indexOf('|', firstBar + 1);
  const surahNum = parseInt(line.slice(0, firstBar), 10);
  const ayahNum = parseInt(line.slice(firstBar + 1, secondBar), 10);
  const text = line.slice(secondBar + 1);
  if (!ayahsBySurah[surahNum]) ayahsBySurah[surahNum] = [];
  ayahsBySurah[surahNum].push({ ayah_number: ayahNum, text });
}

// ---------- قراءة البيانات الوصفية ----------
const xml = fs.readFileSync('quran-data.xml', 'utf8');

function extractTags(section, tagName) {
  const regex = new RegExp('<' + tagName + '\\b[^>]*/>', 'g');
  return (section.match(regex) || []).map((tag) => {
    const attrs = {};
    const attrRegex = /(\w+)="([^"]*)"/g;
    let m;
    while ((m = attrRegex.exec(tag))) attrs[m[1]] = m[2];
    return attrs;
  });
}

function extractSection(tagName) {
  const startMatch = xml.match(new RegExp('<' + tagName + '(\\s[^>]*)?>'));
  if (!startMatch) throw new Error('لم يُعثر على قسم <' + tagName + '>');
  const start = startMatch.index;
  const end = xml.indexOf('</' + tagName + '>', start);
  return xml.slice(start, end);
}

const suraTags = extractTags(extractSection('suras'), 'sura');
const juzTags = extractTags(extractSection('juzs'), 'juz');
const quarterTags = extractTags(extractSection('hizbs'), 'quarter');
const pageTags = extractTags(extractSection('pages'), 'page');
const sajdaTags = extractTags(extractSection('sajdas'), 'sajda');

if (suraTags.length !== 114) throw new Error('عدد السور من XML غير صحيح: ' + suraTags.length);
if (juzTags.length !== 30) throw new Error('عدد الأجزاء غير صحيح: ' + juzTags.length);
if (quarterTags.length !== 240) throw new Error('عدد أرباع الحزب غير صحيح: ' + quarterTags.length);
if (pageTags.length !== 604) throw new Error('عدد الصفحات غير صحيح: ' + pageTags.length);
if (sajdaTags.length !== 15) throw new Error('عدد السجدات غير صحيح: ' + sajdaTags.length);

const sajdaSet = new Set(sajdaTags.map((s) => s.sura + ':' + s.aya));

function buildLookup(tags) {
  return tags.map((t, i) => ({
    index: i + 1,
    sura: parseInt(t.sura, 10),
    aya: parseInt(t.aya, 10)
  }));
}

const juzStarts = buildLookup(juzTags);
const quarterStarts = buildLookup(quarterTags);
const pageStarts = buildLookup(pageTags);

function findRangeIndex(starts, surah, ayah) {
  let result = starts[0].index;
  for (const s of starts) {
    if (s.sura < surah || (s.sura === surah && s.aya <= ayah)) {
      result = s.index;
    } else {
      break;
    }
  }
  return result;
}

const surahs = suraTags.map((s) => ({
  number: parseInt(s.index, 10),
  name_ar: s.name,
  name_en: s.tname,
  ayah_count: parseInt(s.ayas, 10),
  revelation_type: s.type === 'Meccan' ? 'meccan' : 'medinan'
}));

for (const s of surahs) {
  const count = (ayahsBySurah[s.number] || []).length;
  if (count !== s.ayah_count) {
    throw new Error('سورة ' + s.number + ': النص فيه ' + count + ' آية لكن البيانات الوصفية تقول ' + s.ayah_count);
  }
}

const ayahs = [];
for (const s of surahs) {
  for (const a of ayahsBySurah[s.number]) {
    const juz = findRangeIndex(juzStarts, s.number, a.ayah_number);
    const quarterIndex = findRangeIndex(quarterStarts, s.number, a.ayah_number);
    const hizb = Math.floor((quarterIndex - 1) / 4) + 1;
    const rub = ((quarterIndex - 1) % 4) + 1;
    const page = findRangeIndex(pageStarts, s.number, a.ayah_number);
    const sajdah = sajdaSet.has(s.number + ':' + a.ayah_number) ? 1 : 0;

    ayahs.push({
      surah_number: s.number,
      ayah_number: a.ayah_number,
      text: a.text,
      page,
      juz,
      hizb,
      rub,
      sajdah
    });
  }
}

if (ayahs.length !== 6236) throw new Error('خطأ نهائي: عدد الآيات ' + ayahs.length);
const sajdaCount = ayahs.filter((a) => a.sajdah === 1).length;
if (sajdaCount !== 15) throw new Error('عدد آيات السجدة بعد الدمج غير صحيح: ' + sajdaCount);

fs.writeFileSync('src/data/quran-source.json', JSON.stringify({ surahs, ayahs }, null, 0));

console.log('✅ تم إنشاء src/data/quran-source.json بنجاح');
console.log('السور:', surahs.length, '— الآيات:', ayahs.length, '— السجدات:', sajdaCount);
console.log('عيّنة سورة 1 آية 1:', JSON.stringify(ayahs[0]));
console.log('عيّنة سورة 2 آية 1 (يجب page=2, juz=1):', JSON.stringify(ayahs.find(a => a.surah_number === 2 && a.ayah_number === 1)));
console.log('عيّنة آية سجدة (سورة 32 آية 15):', JSON.stringify(ayahs.find(a => a.surah_number === 32 && a.ayah_number === 15)));
