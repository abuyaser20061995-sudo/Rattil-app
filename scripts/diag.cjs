const d = require('../public/data/mushaf-lines.json');
const empty = [];
const starts = [];
const seen = new Set();
d.pages.forEach((p, i) => {
  if (!p) return;
  const m = [];
  p.forEach((l, j) => { if (!l) m.push(j + 1); });
  if (m.length) empty.push(i + ':' + m.join('/'));
  p.forEach((l, j) => {
    if (!l || l[0] !== 't') return;
    l.slice(1).forEach((r) => {
      if (r[1] === 1 && !seen.has(r[0])) {
        seen.add(r[0]);
        let g = 0;
        while (j - g - 1 >= 0 && (!p[j - g - 1] || p[j - g - 1][0] !== 't')) g++;
        starts.push(r[0] + '@' + i + '/' + (j + 1) + '/' + g);
      }
    });
  });
});
console.log('EMPTY', empty.join(' '));
console.log('STARTS', starts.join(' '));
