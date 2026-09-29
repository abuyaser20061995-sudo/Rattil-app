// تقسيم آلي بحت للسور إلى مقاطع بأحجام مختلفة، بعدد الآيات فقط.
// لا يحمل أي حكم أو تصنيف موضوعي — هذا فقط تنظيم شكلي للقراءة.

const SIZES = { short: 3, medium: 8, long: 15 };

function windows(ayahCount, size) {
  const out = [];
  for (let start = 1; start <= ayahCount; start += size) {
    const end = Math.min(start + size - 1, ayahCount);
    out.push({ start, end });
    if (end === ayahCount) break;
  }
  return out;
}

function estimate(ayahCountInSeg) {
  return ayahCountInSeg <= 5 ? '≈ 1-2 دقيقة' : ayahCountInSeg <= 15 ? '≈ 3-5 دقائق' : '≈ 6-10 دقائق';
}

export function generateAutoSegments(surahs) {
  const out = [];
  for (const surah of surahs) {
    for (const [category, size] of Object.entries(SIZES)) {
      for (const w of windows(surah.ayah_count, Math.min(size, surah.ayah_count))) {
        out.push({
          id: 'auto-' + surah.number + '-' + w.start + '-' + w.end,
          surah_id: surah.number,
          start_ayah: w.start,
          end_ayah: w.end,
          ayah_count: w.end - w.start + 1,
          length_category: category,
          estimated_duration: estimate(w.end - w.start + 1),
          topics: null,
          coherence_score: 0.5,
          auto: true
        });
      }
    }
  }
  // إزالة التكرار (يحدث عند السور القصيرة جدًا حيث يتطابق القصير والمتوسط والطويل)
  const seen = new Set();
  return out.filter((s) => {
    const key = s.surah_id + ':' + s.start_ayah + '-' + s.end_ayah;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
