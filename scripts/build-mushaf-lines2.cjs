const fs = require('fs');
const API = 'https://api.quran.com/api/v4/verses/by_page/';
const Q = '?words=true&word_fields=line_number,page_number,text_uthmani&mushaf=2&per_page=50';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function getJson(url) {
  let err;
  for (let i = 0; i < 6; i++) {
    try {
      const r = await fetch(url);
      if (r.ok) return await r.json();
      err = new Error('HTTP ' + r.status);
    } catch (e) {
      err = e;
    }
    await sleep(1500 * (i + 1));
  }
  throw err;
}

async function main() {
  const out = [null];
  const warns = [];
  const splits = [];
  let ends = 0;
  let mismatch = 0;

  for (let p = 1; p <= 604; p++) {
    const N = p <= 2 ? 8 : 15;
    const by = {};
    let next = 1;
    while (next) {
      const j = await getJson(API + p + Q + '&page=' + next);
      for (const v of j.verses) {
        const [s, a] = v.verse_key.split(':').map(Number);
        for (const w of v.words) {
          if (w.page_number && w.page_number !== p) {
            mismatch++;
            continue;
          }
          const l = w.line_number;
          if (!l) {
            console.log('MISSING line', v.verse_key);
            process.exit(1);
          }
          const end = w.char_type_name === 'end';
          if (end) ends++;
          (by[l] ??= []).push({ s, a, pos: w.position, end, t: w.text_uthmani });
        }
      }
      next = j.pagination ? j.pagination.next_page : null;
      await sleep(80);
    }

    const lines = new Array(N).fill(null);
    const meta = new Array(N).fill(null);
    for (const k of Object.keys(by)) {
      const l = Number(k);
      if (l < 1 || l > N) {
        warns.push('page ' + p + ' line ' + l + ' out of range');
        continue;
      }
      const ws = by[k].sort((x, y) => x.s - y.s || x.a - y.a || x.pos - y.pos);
      const runs = [];
      for (const w of ws) {
        let r = runs[runs.length - 1];
        if (!r || r[0] !== w.s || r[1] !== w.a) {
          r = [w.s, w.a, ''];
          runs.push(r);
        }
        if (w.end) r[3] = 1;
        else r[2] = r[2] ? r[2] + ' ' + w.t : w.t;
      }
      lines[l - 1] = ['t', ...runs];
      meta[l - 1] = ws[0];
    }

    for (let j = 0; j < N; j++) {
      const m = meta[j];
      if (!m || m.a !== 1 || m.pos !== 1) continue;
      const need = m.s === 1 || m.s === 9 ? 1 : 2;
      if (j >= need && !lines[j - 1] && (need === 1 || !lines[j - 2])) {
        if (need === 2) {
          lines[j - 2] = ['h', m.s];
          lines[j - 1] = ['b'];
        } else {
          lines[j - 1] = ['h', m.s];
        }
      } else if (need === 2 && j >= 1 && !lines[j - 1]) {
        lines[j - 1] = ['b'];
        const prev = out[p - 1];
        if (prev && !prev[prev.length - 1]) {
          prev[prev.length - 1] = ['h', m.s];
          splits.push(m.s + '@' + (p - 1) + '>' + p);
        } else {
          warns.push('page ' + p + ': no place for header of surah ' + m.s);
        }
      } else {
        warns.push('page ' + p + ': no room for header of surah ' + m.s);
      }
    }
    out.push(lines);
    if (p % 50 === 0) console.log('page', p);
  }

  const order = [];
  let prev = null;
  for (let p = 1; p <= 604; p++) {
    for (const l of out[p]) {
      if (!l || l[0] !== 't') continue;
      for (const r of l.slice(1)) {
        if (prev) {
          const ok =
            (r[0] === prev[0] && (r[1] === prev[1] || r[1] === prev[1] + 1)) ||
            (r[0] === prev[0] + 1 && r[1] === 1);
          if (!ok) order.push('p' + p + ' ' + prev[0] + ':' + prev[1] + '>' + r[0] + ':' + r[1]);
        }
        prev = [r[0], r[1]];
      }
    }
  }

  const empty = [];
  out.forEach((pg, i) => {
    if (!pg) return;
    const m = [];
    pg.forEach((l, j) => { if (!l) m.push(j + 1); });
    if (m.length) empty.push(i + ':' + m.join('/'));
  });

  fs.writeFileSync('src/data/mushaf-lines.json', JSON.stringify({ v: 2, pages: out }));
  console.log('DONE ends:', ends, '(expect 6236) mismatch:', mismatch);
  console.log('SPLIT:', splits.join(' ') || 'none');
  console.log('ORDER problems:', order.length, order.slice(0, 6).join(' | '));
  console.log('EMPTY:', empty.join(' ') || 'none');
  console.log('WARN:', warns.slice(0, 8).join(' | ') || 'none');
}

main().catch((e) => {
  console.log('ERR', e.message);
  process.exit(1);
});
