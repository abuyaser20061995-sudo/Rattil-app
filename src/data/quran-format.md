# صيغة ملف بيانات القرآن المطلوبة للاستيراد

لم يتم إدخال أي نص قرآني في هذا المشروع. عند توفر dataset موثوق، حوّله إلى ملف JSON بهذه الصيغة وضعه في:
src/data/quran-source.json

{
  "surahs": [
    { "number": 1, "name_ar": "الفاتحة", "name_en": "Al-Fatihah", "ayah_count": 7, "revelation_type": "meccan" }
  ],
  "ayahs": [
    { "surah_number": 1, "ayah_number": 1, "text": "...", "page": 1, "juz": 1, "hizb": 1, "rub": 1, "sajdah": 0 }
  ]
}

شروط الصحة: 114 سورة، 6236 آية إجمالاً، عدد آيات كل سورة يطابق ayah_count.
