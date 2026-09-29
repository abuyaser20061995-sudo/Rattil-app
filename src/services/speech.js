// الملف الوحيد الذي يعرف كيف نلتقط الصوت.
// الآن: Web Speech API (Chrome). للـ APK نضيف ملحق Capacitor هنا لاحقًا.

function getEngine() {
  if (typeof window === 'undefined') return null;
  return window.SpeechRecognition || window.webkitSpeechRecognition || null;
}

export function isSpeechSupported() {
  return getEngine() !== null;
}

export function speechErrorMessage(code) {
  switch (code) {
    case 'not-allowed':
    case 'service-not-allowed':
      return 'اسمح للمتصفح باستخدام الميكروفون ثم أعد المحاولة.';
    case 'network':
      return 'التتبع الصوتي يحتاج إنترنت، وقد لا يعمل في Brave. جرّب Chrome.';
    case 'audio-capture':
      return 'لم يُعثر على ميكروفون.';
    case 'language-not-supported':
      return 'اللغة العربية غير مدعومة للتعرف الصوتي على هذا الجهاز.';
    default:
      return 'تعذّر التتبع الصوتي (' + code + ').';
  }
}

export function createRecognizer({ onTranscript, onError, onEnd }) {
  const Engine = getEngine();
  const rec = new Engine();
  rec.lang = 'ar-SA';
  rec.continuous = true;
  rec.interimResults = true;

  let base = '';
  let current = '';
  let wantListening = false;

  rec.onresult = (e) => {
    current = Array.from(e.results).map((r) => r[0].transcript).join(' ');
    onTranscript((base + ' ' + current).trim());
  };

  rec.onerror = (e) => {
    if (e.error === 'no-speech' || e.error === 'aborted') return;
    wantListening = false;
    onError(e.error);
  };

  rec.onend = () => {
    base = (base + ' ' + current).trim();
    current = '';
    if (wantListening) {
      try {
        rec.start();
      } catch {
        wantListening = false;
        onEnd();
      }
    } else {
      onEnd();
    }
  };

  return {
    start() {
      base = '';
      current = '';
      wantListening = true;
      rec.start();
    },
    stop() {
      wantListening = false;
      try {
        rec.stop();
      } catch {
        /* ignore */
      }
    }
  };
}
