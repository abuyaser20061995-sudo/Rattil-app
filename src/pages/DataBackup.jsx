import { useRef, useState } from 'react';
import { Download, Upload } from 'lucide-react';
import { exportBackup, importBackup } from '../database/backup.js';
import styles from './DataBackup.module.css';

function todayStr() {
  const d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

export default function DataBackup() {
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const fileRef = useRef(null);

  async function handleExport() {
    setMessage('');
    setIsError(false);
    try {
      const data = await exportBackup();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'رتل-نسخة-احتياطية-' + todayStr() + '.json';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      setMessage('تم إنشاء ملف النسخة الاحتياطية. تحقّق من مجلد التنزيلات.');
    } catch (e) {
      setIsError(true);
      setMessage(e?.message || String(e));
    }
  }

  function pickFile() {
    setConfirming(false);
    fileRef.current?.click();
  }

  async function handleFile(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setMessage('');
    setIsError(false);
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      const result = await importBackup(data);
      setMessage('تم الاستيراد بنجاح (' + result.tablesRestored + ' جدولًا). أعد فتح التطبيق لرؤية البيانات.');
    } catch (e) {
      setIsError(true);
      setMessage('فشل الاستيراد: ' + (e?.message || String(e)));
    }
  }

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>النسخ الاحتياطي</h1>
      <p className="text-muted">
        يشمل التصدير: إعداداتك، مجموعات آياتي، مقاطع الحفظ ومستوياتها، سجل المراجعة، مقترحات «ماذا أقرأ؟»
        وسجل قراءات الصلاة. لا يشمل نص القرآن نفسه لأنه ثابت.
      </p>

      <button className="btn-primary" style={{ width: '100%' }} onClick={handleExport}>
        <Download size={16} /> تصدير نسخة احتياطية
      </button>

      {!confirming ? (
        <button className="btn-secondary" onClick={() => setConfirming(true)}>
          <Upload size={16} /> استيراد نسخة احتياطية
        </button>
      ) : (
        <div className={`card ${styles.confirmBox}`}>
          <p className={styles.warning}>
            ⚠️ سيستبدل الاستيراد كل بياناتك الحالية في التطبيق بما في الملف المختار. هذا الإجراء لا يمكن التراجع عنه.
          </p>
          <div className={styles.row}>
            <button className="btn-primary" style={{ flex: 1 }} onClick={pickFile}>
              متابعة واختيار الملف
            </button>
            <button className="btn-secondary" onClick={() => setConfirming(false)}>
              إلغاء
            </button>
          </div>
        </div>
      )}

      <input
        ref={fileRef}
        type="file"
        accept="application/json"
        style={{ display: 'none' }}
        onChange={handleFile}
      />

      {message && <p className={isError ? styles.error : styles.ok}>{message}</p>}
    </div>
  );
}
