const fs = require('fs');
const API = 'https://api.quran.com/api/v4/verses/by_chapter/';
const Q = '?words=true&word_fields=line_number,page_number,text_uthmani&mushaf=1&per_page=50';
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
  const pages = {};
  let ends = 0;
  for (let c = 1; c <= 114; c++) {
    let next = 1;
    while (next) {
      const j = await getJson(API + c + Q + '&page=' + next);
      for (const v of j.verses) {
        const a = v.verse_number;
        for (const w of v.words) {
          const p = w.page_number;
          const l = w.line_number;
          if (!p || !l) {
            console.log('MISSING FIELDS', c + ':' + a, Object.keys(w).join(','));
            process.exit(1);
          }
          const end = w.char_type_name === 'end';
          if (end) ends++;
          ((pages[p] ??= {})[l] ??= []).push({ s: c, a, pos: w.position, end, t: w.text_uthmani });
        }
      }
      next = j.pagination ? j.pagination.next_page : null;
      await sleep(120);
    }
    if (c % 10 === 0) console.log('chapter', c);
  }

  const out = [null];
  const warns = [];
  for (let p = 1; p <= 604; p++) {
    const N = p <= 2 ? 8 : 15;
    const by = pages[p] || {};
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
      if (j - need < 0 || lines[j - 1] || (need === 2 && lines[j - 2])) {
        warns.push('page ' + p + ': no room for header before line ' + (j + 1));
        continue;
      }
      if (need === 2) {
        lines[j - 2] = ['h', m.s];
        lines[j - 1] = ['b'];
      } else {
        lines[j - 1] = ['h', m.s];
      }
    }
    lines.forEach((x, i) => {
      if (!x) warns.push('page ' + p + ' line ' + (i + 1) + ' empty');
    });
    out.push(lines);
  }

  const file = 'public/data/mushaf-lines.json';
  fs.writeFileSync(file, JSON.stringify({ v: 1, pages: out }));
  console.log('DONE ends:', ends, '(expect 6236) size KB:', Math.round(fs.statSync(file).size / 1024), 'warnings:', warns.length);
  warns.slice(0, 15).forEach((w) => console.log(w));
}

main().catch((e) => {
  console.log('ERR', e.message);
  process.exit(1);
});
