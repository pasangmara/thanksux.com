const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage();
  await p.goto('file:///tmp/mag/build/mag2.html', { waitUntil: 'networkidle' });
  await p.evaluate(() => document.fonts.ready);
  // layout report: text blocks bottoms + elements escaping the inner box
  const rep = await p.evaluate(() => {
    const mm = 96/25.4, out = [];
    document.querySelectorAll('.page').forEach(pg => {
      const n = pg.dataset.n;
      const box = (pg.querySelector('.content')||pg.querySelector('.full')).getBoundingClientRect();
      pg.querySelectorAll('.t').forEach(el => {
        if (el.scrollHeight > el.clientHeight + 2) out.push(`P${n} OVERFLOW +${((el.scrollHeight-el.clientHeight)/mm).toFixed(1)}mm ${el.className} :: ${el.innerText.slice(0,40).replace(/\n/g,' ')}`);
      });
      pg.querySelectorAll('.t,.f,.badge,.logow').forEach(el => { const r = el.getBoundingClientRect();
        if (r.bottom > box.bottom+0.6 || r.right > box.right+0.6 || r.left < box.left-0.6 || r.top < box.top-0.6) out.push(`P${n} ESCAPE ${el.className}`); });
    });
    return out;
  });
  require('fs').writeFileSync('/tmp/mag/build/report.txt', rep.join('\n'));
  await p.pdf({ path: '/tmp/mag/build/mag2.pdf', width: '210mm', height: '297mm', printBackground: true, preferCSSPageSize: true });
  await b.close();
})();
