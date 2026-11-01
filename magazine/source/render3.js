const { chromium } = require('playwright');
const [,, html='mag3.html', pdf='mag3.pdf'] = process.argv;
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage();
  await p.goto('file:///tmp/mag/build/' + html, { waitUntil: 'networkidle' });
  await p.evaluate(() => document.fonts.ready);
  const flow = await p.evaluate(() => window.runFlow());
  const rep = await p.evaluate(() => {
    const mm = 96/25.4, out = [];
    document.querySelectorAll('.page').forEach(pg => {
      const n = pg.dataset.n;
      pg.querySelectorAll('.t').forEach(el => {
        if (el.scrollHeight > el.clientHeight + 2 && !el.classList.contains('bignum')) out.push(`P${n} OVERFLOW +${((el.scrollHeight-el.clientHeight)/mm).toFixed(1)}mm ${el.className} :: ${el.innerText.slice(0,40).replace(/\n/g,' ')}`);
      });
      pg.querySelectorAll('.flow').forEach(f => {
        // fill: bottom of last text line relative to frame
        const r = f.getBoundingClientRect(); let maxR = r.left, lastBottom = r.top;
        f.querySelectorAll('p,h4').forEach(e => [...e.getClientRects()].forEach(c => { if (c.right > maxR - 1) { if (c.left >= maxR - 1) { maxR = c.right; lastBottom = c.bottom; } else if (c.bottom > lastBottom && c.right >= maxR - 1) lastBottom = c.bottom; } }));
        out.push(`P${n} FLOW ${f.dataset.article}#${f.dataset.seq} lastcol-fill=${(((lastBottom-r.top)/r.height)*100).toFixed(0)}% empty=${f.children.length===0}`);
      });
    });
    return out;
  });
  require('fs').writeFileSync('/tmp/mag/build/report3.txt', flow.concat(rep).join('\n'));
  await p.pdf({ path: '/tmp/mag/build/' + pdf, width: '210mm', height: '297mm', printBackground: true, preferCSSPageSize: true });
  await b.close();
})();
