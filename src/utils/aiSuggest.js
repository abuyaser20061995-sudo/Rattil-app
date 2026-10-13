const KEY_STORE = 'rattil_ai_key';
const MODEL_STORE = 'rattil_ai_model';
const DEFAULT_MODEL = 'claude-sonnet-5-5';

export const AI_LENGTHS = {
  short: 'قصير (حتى 10 آيات تقريباً)',
  medium: 'متوسط (من 11 إلى 25 آية)',
  long: 'طويل (من 26 إلى 60 آية)',
  any: 'غير محدد (اختر ما يناسب المعنى)',
};

const SYSTEM = `أنت مساعد لإمام مسجد يبحث عن مقاطع من القرآن الكريم يقرؤها في الصلاة أو للتلاوة. مهمتك اقتراح مقاطع متصلة من المصحف تناسب طلبه.
قواعد صارمة:
- أعد JSON فقط، بلا أي نص آخر ولا علامات markdown.
- لا تكتب نص أي آية أبداً. أعد أرقاماً فقط.
- كل مقطع يحتوي: surah (رقم السورة من 1 إلى 114)، from (رقم آية البداية)، to (رقم آية النهاية من نفس السورة)، reason (جملة عربية واحدة قصيرة تبيّن صلة المقطع بالطلب).
- المقاطع متصلة وتبدأ وتنتهي عند حدود المعنى، ولا تقطع قصة أو جملة في المنتصف.
- التزم بالمدة المطلوبة تقريباً، وراعِ الصلاة المذكورة إن وُجدت.
- لا تقترح أي مقطع يتقاطع مع قائمة المقاطع المستبعدة.
- قدّم 5 اقتراحات من الأنسب إلى الأقل مناسبة، وتنوّع في السور.
- لا تذكر في السبب إلا ما تعرفه يقيناً عن المقطع، ولا تنسب له تفسيراً أو فضلاً غير ثابت.
- إن كان الطلب لا علاقة له باختيار مقاطع للقراءة فأعد {"suggestions":[]}.
الصيغة: {"suggestions":[{"surah":1,"from":1,"to":1,"reason":"..."}]}`;

export function getAiKey() {
  try { return localStorage.getItem(KEY_STORE) || ''; } catch { return ''; }
}

export function setAiKey(k) {
  try {
    const v = String(k || '').trim();
    if (v) localStorage.setItem(KEY_STORE, v);
    else localStorage.removeItem(KEY_STORE);
  } catch { /* ignore */ }
}

function getModel() {
  try { return localStorage.getItem(MODEL_STORE) || DEFAULT_MODEL; } catch { return DEFAULT_MODEL; }
}

function extractJson(text) {
  const t = String(text || '').replace(/```json|```/g, '').trim();
  const a = t.indexOf('{');
  const b = t.lastIndexOf('}');
  if (a < 0 || b < a) return null;
  try { return JSON.parse(t.slice(a, b + 1)); } catch { return null; }
}

export async function askAI({ query, prayer, length = 'medium', exclude = [], key, model }) {
  const k = key || getAiKey();
  if (!k) throw new Error('لم يُدخل مفتاح الذكاء الاصطناعي بعد');
  const q = String(query || '').trim().slice(0, 300);
  if (!q) throw new Error('اكتب ما تريده أولاً');

  const msg =
    'الطلب: ' + q + '\n' +
    (prayer ? 'الصلاة: ' + prayer + '\n' : '') +
    'المدة: ' + (AI_LENGTHS[length] || AI_LENGTHS.medium) + '\n' +
    'المقاطع المستبعدة (سورة:من-إلى): ' + (exclude.slice(0, 40).join('، ') || 'لا شيء');

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 45000);
  let r;
  try {
    r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      signal: ctrl.signal,
      headers: {
        'content-type': 'application/json',
        'x-api-key': k,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: model || getModel(),
        max_tokens: 900,
        system: SYSTEM,
        messages: [{ role: 'user', content: msg }],
      }),
    });
  } catch (e) {
    throw new Error(e && e.name === 'AbortError' ? 'انتهت المهلة، حاول مرة أخرى' : 'تعذّر الاتصال بالإنترنت');
  } finally {
    clearTimeout(timer);
  }

  const raw = await r.text();
  if (!r.ok) {
    let detail = '';
    try { detail = JSON.parse(raw).error.message; } catch { detail = raw.slice(0, 200); }
    if (r.status === 401) throw new Error('المفتاح غير صالح');
    if (r.status === 429) throw new Error('تجاوزت حد الطلبات، انتظر قليلاً');
    throw new Error('خطأ ' + r.status + ': ' + detail);
  }

  let text = '';
  try {
    text = JSON.parse(raw).content.map((c) => c.text || '').join('');
  } catch {
    throw new Error('رد غير مفهوم من الخدمة');
  }
  const parsed = extractJson(text);
  const list = parsed && Array.isArray(parsed.suggestions) ? parsed.suggestions : [];
  return list
    .map((s) => ({
      surah: Number(s.surah),
      from: Number(s.from),
      to: Number(s.to),
      reason: String(s.reason || '').slice(0, 200),
    }))
    .filter((s) => Number.isInteger(s.surah) && Number.isInteger(s.from) && Number.isInteger(s.to) &&
      s.surah >= 1 && s.surah <= 114 && s.from >= 1 && s.to >= s.from)
    .slice(0, 8);
}
