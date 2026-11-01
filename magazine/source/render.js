const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage();
  await p.goto('file:///tmp/mag/build/mag.html', { waitUntil: 'networkidle' });
  await p.evaluate(() => document.fonts.ready);
  // layout report: text blocks bottoms + elements escaping the inner box
  const rep = await p.evaluate(() => {
    const mm = 96 / 25.4, out = [];
    document.querySelectorAll('.page').forEach(pg => {
      const n = pg.dataset.n, inner = pg.querySelector('.inner').getBoundingClientRect();
      const ct = pg.querySelector('.content'); const cr = ct ? ct.getBoundingClientRect() : inner;
      pg.querySelectorAll('.t,.f,.nlist,.stats,.chips,.mgrid,.tline,.ibox,.covlines').forEach(el => {
        const r = el.getBoundingClientRect();
        const bot = (r.bottom - cr.top) / mm, right = (r.right - cr.left) / mm;
        if (r.bottom > cr.bottom + 0.5 || r.right > cr.right + 0.5 || r.left < cr.left - 0.5)
          out.push(`P${n} ESCAPE ${el.className} bottom=${bot.toFixed(1)} right=${right.toFixed(1)} :: ${el.innerText.slice(0,40).replace(/\n/g,' ')}`);
        if (el.classList.contains('t')) out.push(`P${n} t top=${((r.top-cr.top)/mm).toFixed(1)} bot=${bot.toFixed(1)} :: ${el.innerText.slice(0,30).replace(/\n/g,' ')}`);
      });
      pg.querySelectorAll('.cols2').forEach(el=>{ if (el.scrollHeight>el.clientHeight+2) out.push(`P${n} COLS overflow`)});
    });
    return out;
  });
  require('fs').writeFileSync('/tmp/mag/build/report.txt', rep.join('\n'));
  await p.pdf({ path: '/tmp/mag/build/mag.pdf', width: '210mm', height: '297mm', printBackground: true, preferCSSPageSize: true });
  await b.close();
})();
