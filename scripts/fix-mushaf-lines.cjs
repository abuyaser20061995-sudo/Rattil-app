const fs = require('fs');
const file = 'public/data/mushaf-lines.json';
const d = JSON.parse(fs.readFileSync(file, 'utf8'));
const P = d.pages;

function isStart(p, j) {
  const cur = P[p][j][1];
  let pp = p;
  let jj = j - 1;
  while (pp >= 1) {
    if (jj < 0) {
      pp--;
      jj = pp >= 1 ? P[pp].length - 1 : -1;
      continue;
    }
    const l = P[pp][jj];
    if (l && l[0] === 't') {
      const last = l[l.length - 1];
      return !(last[0] === cur[0] && last[1] === 1 && !last[3]);
    }
    jj--;
  }
  return true;
}

let fixed = 0;
const split = [];
const warn = [];
for (let p = 1; p <= 604; p++) {
  const pg = P[p];
  for (let j = 0; j < pg.length; j++) {
    const l = pg[j];
    if (!l || l[0] !== 't') continue;
    const s = l[1][0];
    if (l[1][1] !== 1 || s === 1) continue;
    if (!isStart(p, j)) continue;
    if (j > 0 && pg[j - 1]) {
      if (pg[j - 1][0] === 't') warn.push('surah ' + s + ' p' + p + ': text right above start');
      continue;
    }
    if (j === 0) {
      warn.push('surah ' + s + ' p' + p + ': starts at line 1');
      continue;
    }
    const need = s === 9 ? 1 : 2;
    if (need === 1) {
      pg[j - 1] = ['h', s];
      fixed++;
    } else if (j >= 2 && !pg[j - 2]) {
      pg[j - 2] = ['h', s];
      pg[j - 1] = ['b'];
      fixed++;
    } else {
      const prev = P[p - 1];
      const last = prev ? prev.length - 1 : -1;
      if (prev && !prev[last]) {
        prev[last] = ['h', s];
        pg[j - 1] = ['b'];
        fixed++;
        split.push(s + '@' + (p - 1) + '>' + p);
      } else {
        warn.push('surah ' + s + ' p' + p + ': no place for header');
      }
    }
  }
}

const empty = [];
P.forEach((pg, i) => {
  if (!pg) return;
  const m = [];
  pg.forEach((l, j) => { if (!l) m.push(j + 1); });
  if (m.length) empty.push(i + ':' + m.join('/'));
});
fs.writeFileSync(file, JSON.stringify(d));
console.log('FIXED', fixed);
console.log('SPLIT (header at page bottom, basmala next page):', split.join(' '));
console.log('STILL EMPTY:', empty.join(' ') || 'none');
console.log('WARN:', warn.join(' | ') || 'none');
