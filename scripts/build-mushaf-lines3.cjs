const fs = require('fs');
const os = require('os');
const API = 'https://api.quran.com/api/v4/verses/by_page/';
const Q = '?words=true&word_fields=line_number,text_uthmani&mushaf=2&per_page=50';
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

async function getVerses(p) {
  const verses = [];
  let next = 1;
  while (next) {
    const j = await getJson(API + p + Q + '&page=' + next);
    verses.push(...j.verses);
    next = j.pagination ? j.pagination.next_page : null;
  }
  return verses;
}

async function main() {
  const out = [null];
  const warns = [];
  const splits = [];
  let cursor = null;
  let ends = 0;

  for (let p = 1; p <= 604; p++) {
    const N = p <= 2 ? 8 : 15;
    const verses = await getVerses(p);
    const stream = [];
    for (const v of verses) {
      const [s, a] = v.verse_key.split(':').map(Number);
      for (const w of v.words) {
        stream.push({ s, a, pos: w.position, line: w.line_number, end: w.char_type_name === 'end', t: w.text_uthmani });
      }
    }

    let i0 = 0;
    if (cursor) {
      const k = stream.findIndex((w) => w.s === cursor.s && w.a === cursor.a && w.pos === cursor.pos);
      if (k >= 0) {
        i0 = k + 1;
      } else {
        const f = stream[0];
        const ok = f && f.pos === 1 &&
          ((f.s === cursor.s && f.a === cursor.a + 1) || (f.s === cursor.s + 1 && f.a === 1));
        if (!ok) {
          console.log('ERR page', p, 'after', cursor.s + ':' + cursor.a + ':' + cursor.pos,
            'first', f ? f.s + ':' + f.a + ':' + f.pos : 'none');
          process.exit(1);
        }
      }
    }

    const pw = [];
    let prev = 0;
    for (let i = i0; i < stream.length; i++) {
      const w = stream[i];
      if (!w.line) {
        console.log('ERR page', p, 'word without line', w.s + ':' + w.a + ':' + w.pos);
        process.exit(1);
      }
      if (w.line < prev) break;
      pw.push(w);
      prev = w.line;
    }
    if (!pw.length) {
      console.log('ERR page', p, 'no words');
      process.exit(1);
    }
    cursor = pw[pw.length - 1];

    const by = {};
    for (const w of pw) {
      if (w.end) ends++;
      (by[w.line] ??= []).push(w);
    }

    const lines = new Array(N).fill(null);
    const meta = new Array(N).fill(null);
    for (const k of Object.keys(by)) {
      const l = Number(k);
      if (l < 1 || l > N) {
        warns.push('page ' + p + ' line ' + l + ' out of range');
        continue;
      }
      const ws = by[k];
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
        const pp = out[p - 1];
        if (pp && !pp[pp.length - 1]) {
          pp[pp.length - 1] = ['h', m.s];
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
    await sleep(60);
  }

  const order = [];
  let last = null;
  for (let p = 1; p <= 604; p++) {
    for (const l of out[p]) {
      if (!l || l[0] !== 't') continue;
      for (const r of l.slice(1)) {
        if (last) {
          const ok =
            (r[0] === last[0] && (r[1] === last[1] || r[1] === last[1] + 1)) ||
            (r[0] === last[0] + 1 && r[1] === 1);
          if (!ok) order.push('p' + p + ' ' + last[0] + ':' + last[1] + '>' + r[0] + ':' + r[1]);
        }
        last = [r[0], r[1]];
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

  const good = ends === 6236 && order.length === 0;
  const target = good ? 'src/data/mushaf-lines.json' : os.homedir() + '/mushaf-lines-bad.json';
  fs.writeFileSync(target, JSON.stringify({ v: 3, pages: out }));
  console.log('DONE ends:', ends, '(expect 6236)');
  console.log('ORDER problems:', order.length, order.slice(0, 6).join(' | '));
  console.log('SPLIT:', splits.join(' ') || 'none');
  console.log('EMPTY:', empty.join(' ') || 'none');
  console.log('WARN:', warns.slice(0, 8).join(' | ') || 'none');
  console.log(good ? 'SAVED into the app' : 'NOT SAVED (see ' + target + ')');
}

main().catch((e) => {
  console.log('ERR', e.message);
  process.exit(1);
});
