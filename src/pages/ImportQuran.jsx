import { useState } from 'react';
import { importQuranData } from '../database/importer.js';
import { isQuranDataLoaded } from '../database/db.js';
import styles from './ImportQuran.module.css';

export default function ImportQuran() {
  const [status, setStatus] = useState('idle');
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);

  async function checkLoaded() {
    const loaded = await isQuranDataLoaded();
    setMessage(loaded ? 'بيانات القرآن مُحمَّلة بالفعل في هذا الجهاز.' : 'لم يتم تحميل بيانات القرآن بعد.');
    setIsError(false);
  }

  async function startImport() {
    setStatus('loading');
    setMessage('');
    setIsError(false);
    try {
      const res = await fetch('/data/quran-source.json');
      if (!res.ok) throw new Error('تعذّر تحميل ملف البيانات (' + res.status + ')');
      const data = await res.json();
      const result = await importQuranData(data);
      setMessage('تم الاستيراد بنجاح: ' + result.surahsImported + ' سورة، ' + result.ayahsImported + ' آية.');
      setStatus('done');
    } catch (e) {
      setIsError(true);
      setMessage(e?.message || String(e));
      setStatus('error');
    }
  }

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>استيراد بيانات القرآن</h1>
      <p className="text-muted">
        يستورد هذا نص القرآن الكامل (114 سورة، 6236 آية) من مصدر Tanzil الموثوق، مع أرقام الصفحة
        والجزء والحزب والسجدة. لا يُستخدم أي نص مولَّد أو غير موثوق.
      </p>

      <button className="btn-secondary" onClick={checkLoaded}>
        تحقق من الحالة الحالية
      </button>

      <button className="btn-primary" style={{ width: '100%' }} onClick={startImport} disabled={status === 'loading'}>
        {status === 'loading' ? 'جارٍ الاستيراد…' : 'استيراد القرآن الآن'}
      </button>

      {message && <p className={isError ? styles.error : styles.ok}>{message}</p>}

      {status === 'done' && (
        <p className="text-muted">أعد تحميل الصفحة لرؤية القرآن الكامل في المصحف والبحث والحفظ.</p>
      )}
    </div>
  );
}
