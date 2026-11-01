# -*- coding: utf-8 -*-
"""Editorial (article) building blocks on the 6x8 modular grid + flow templates."""
import json, html

PIECES = {p['id']: p for p in json.load(open('/tmp/mag/text/pieces.json', encoding='utf-8'))}
MARKS = set('্ািীুূৃেৈোৌংঃঁ়‍')

def g(c, r, cs=1, rs=1): return f'grid-column:{c}/span {cs};grid-row:{r}/span {rs};'

def first_cluster(s):
    i = 1
    while i < len(s) and (s[i] in MARKS or s[i-1] == '্'):
        i += 1
    return s[:i], s[i:]

def template(pid, skip_li_after=None):
    """Return <template> with the article body as flowable blocks."""
    p = PIECES[pid]
    out, first, skipping = [], True, False
    body = p['body']
    for idx, x in enumerate(body):
        if isinstance(x, str):
            t = html.escape(x, quote=False)
            if first:
                a, b = first_cluster(t)
                out.append(f'<p class="first"><span class="dc">{a}</span>{b}</p>'); first = False
            else:
                out.append(f'<p>{t}</p>')
            continue
        kind, t = x
        if kind == 'h':
            if skip_li_after and t.startswith(skip_li_after):
                skipping = True; continue
            skipping = False
            out.append(f'<h4>{html.escape(t, quote=False)}</h4>')
        elif kind == 'li':
            if skipping: continue
            if 'ঃ' in t[:60]:
                k, v = t.split('ঃ', 1)
                out.append(f'<p class="li"><b>{k}:</b>{v}</p>')
            else:
                out.append(f'<p class="li">{t}</p>')
        elif kind == 'verse':
            out.append(f'<p class="verse">{t}</p>')
        elif kind == 'moral':
            out.append(f'<p class="moral">{t}</p>')
    # end mark on last paragraph
    for i in range(len(out) - 1, -1, -1):
        if out[i].startswith('<p'):
            out[i] = out[i][:-4] + ' <span class="endmark"></span></p>'; break
    return f'<template data-flow="{pid}">' + ''.join(out) + '</template>'

def FL(pid, seq, c, r, cs, rs, cols=1, extra=''):
    return f'<div class="flow cols{cols}" data-article="{pid}" data-seq="{seq}" style="{g(c,r,cs,rs)}{extra}"></div>'

def byline(pid, label='লেখা'):
    p = PIECES[pid]
    if not p['author']: return ''
    return (f'<div class="byline"><span class="bl-l">{label}</span><b>{p["author"]}</b>'
            f'<span class="bl-r">{p["role"]}</span></div>')

def header(pid, c, r, cs, rs, size=28, deck=True, kicker=None, by=True, cls=''):
    p = PIECES[pid]
    k = kicker or p['cat']
    d = f'<div class="deck">{p["deck"]}</div>' if deck and p.get('deck') else ''
    b = byline(pid) if by else ''
    return (f'<div class="t arthead {cls}" style="{g(c,r,cs,rs)}"><div class="kicker">{k}</div>'
            f'<h1 class="serif" style="font-size:{size}pt">{p["title"]}</h1>{d}{b}</div>')

def pull(pid, c, r, cs, rs, text=None, size=13, cls=''):
    t = text or PIECES[pid]['quote']
    return f'<div class="t pullbox {cls}" style="{g(c,r,cs,rs)}"><div class="pq-mark">“</div><div class="pq-t" style="font-size:{size}pt">{t}</div></div>'

FLOW_JS = r'''
<script>
window.runFlow = function(){
  const report=[];
  const fits = f => f.scrollWidth <= f.clientWidth + 1 && f.scrollHeight <= f.clientHeight + 1;
  document.querySelectorAll('template[data-flow]').forEach(t => {
    const id = t.dataset.flow;
    const frames = [...document.querySelectorAll('.flow[data-article="'+id+'"]')].sort((a,b)=>a.dataset.seq-b.dataset.seq);
    let queue = [...t.content.children].map(n => n.cloneNode(true));
    frames.forEach((f, fi) => {
      while (queue.length) {
        const n = queue.shift(); f.appendChild(n);
        if (fits(f)) continue;
        f.removeChild(n);
        let placed = false;
        if (n.tagName === 'P' && !n.classList.contains('verse')) {
          const parts = n.innerHTML.split(/(?<=[।?!”])\s+/);
          let best = 0;
          for (let k = 1; k < parts.length; k++) {
            const m = n.cloneNode(false); m.innerHTML = parts.slice(0,k).join(' ');
            f.appendChild(m); const ok = fits(f); f.removeChild(m);
            if (ok) best = k; else break;
          }
          if (best > 0) {
            const m = n.cloneNode(false); m.innerHTML = parts.slice(0,best).join(' '); f.appendChild(m);
            const rest = n.cloneNode(false); rest.innerHTML = parts.slice(best).join(' ');
            rest.classList.remove('first'); rest.classList.add('cont'); queue.unshift(rest); placed = true;
          }
        }
        if (!placed) queue.unshift(n);
        const last = f.lastElementChild;
        if (last && last.tagName === 'H4') { f.removeChild(last); queue.unshift(last); }
        break;
      }
      // fill ratio (how much of the last column is used) for reporting
      f.dataset.used = '1';
    });
    if (frames.length) frames[frames.length-1].style.columnFill = 'balance';
    if (queue.length) report.push('OVERFLOW ' + id + ': ' + queue.length + ' blocks left');
    // report under-filled last frame
    const lf = frames[frames.length-1];
    if (lf) { const r = lf.getBoundingClientRect(); let maxB = r.top; [...lf.children].forEach(ch => { [...ch.getClientRects()].forEach(cr => { if (cr.bottom > maxB && cr.right <= r.right + 2) maxB = cr.bottom; }); });
      report.push('LAST ' + id + ' frame-height=' + (r.height*25.4/96).toFixed(0) + 'mm'); }
  });
  window.__flow = report; return report;
};
</script>
'''
