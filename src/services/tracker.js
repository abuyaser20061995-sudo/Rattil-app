const LOOKAHEAD = 3;
const THRESHOLD = 0.7;

function editDistance(a, b) {
  const m = a.length;
  const n = b.length;
  const dp = Array.from({ length: m + 1 }, (_, i) => [i]);
  for (let j = 1; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
      );
    }
  }
  return dp[m][n];
}

export function similarity(a, b) {
  if (a === b) return 1;
  if (a.length <= 2 || b.length <= 2) return 0;
  return 1 - editDistance(a, b) / Math.max(a.length, b.length);
}

// expected: [{ word }]، spoken: كلمات منطوقة بعد التطبيع
// status: pending | correct | missed (كلمة تخطاها التعرف الصوتي أو القارئ)
export function trackWords(expected, spoken) {
  const status = expected.map(() => 'pending');
  let pos = 0;
  for (const w of spoken) {
    if (pos >= expected.length) break;
    let hit = -1;
    for (let k = 0; k <= LOOKAHEAD && pos + k < expected.length; k++) {
      if (similarity(w, expected[pos + k].word) >= THRESHOLD) {
        hit = k;
        break;
      }
    }
    if (hit === -1) continue;
    for (let j = 0; j < hit; j++) status[pos + j] = 'missed';
    status[pos + hit] = 'correct';
    pos += hit + 1;
  }
  return { status, position: pos };
}
