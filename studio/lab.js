/* =========================================================
   LAB ENGINE — เครื่องมือของห้องปฏิบัติการ
   ทุกไฟล์ lab-*.html แค่ประกาศตัวแปร LAB แล้วเรียกไฟล์นี้
   ---------------------------------------------------------
   รูปแบบข้อมูล
   LAB = {
     no, title, lede, minutes, uses:[],
     steps:[ { t, why, into, html, css, rule:{t,d}, try:'' } ],
     notes:[ {sel, label, side} ]     // เส้นบอกระยะบนกระดาน
   }
   ========================================================= */

const BASE_CSS = `
*,*::before,*::after{box-sizing:border-box}
*{margin:0}
img,svg{display:block;max-width:100%}
button,input,select,textarea{font:inherit;color:inherit}
body{font-family:system-ui,-apple-system,"Segoe UI","Noto Sans Thai",sans-serif;line-height:1.6}
`;

/* ---------- ประกอบโค้ดจากชิ้นส่วน ---------- */
/* ชิ้นที่มี ghost:true = แสดงและอธิบาย แต่ไม่ถูกใส่ลงตัวอย่าง
   (ใช้กับบรรทัดโครง เช่น doctype/head ที่กระดานสร้างให้อยู่แล้ว) */
function partsCode(parts){
  return parts.filter(p => !p.ghost).map(p => p.c).join('\n');
}
function stepCss(s){
  if(s.parts && s.partsLang === 'css') return partsCode(s.parts);
  return s.css || '';
}
function stepHtml(s){
  if(s.parts && s.partsLang !== 'css') return partsCode(s.parts);
  return s.html || '';
}

/* ---------- สร้างเอกสารตัวอย่างถึงขั้นที่ n ---------- */
function buildDoc(upto, showNotes){
  const doc = new DOMParser().parseFromString(
    '<!doctype html><html><head></head><body></body></html>', 'text/html');

  let css = '';
  LAB.steps.slice(0, upto + 1).forEach(s => {
    const c = stepCss(s), h = stepHtml(s);
    if(c) css += '\n' + c;
    if(h){
      const target = s.into ? doc.querySelector(s.into) : doc.body;
      if(target) target.insertAdjacentHTML('beforeend', h);
    }
  });

  const notesJs = showNotes ? noteScript() : '';
  return `<!doctype html><html lang="th"><head><meta charset="utf-8">
<style>${BASE_CSS}${css}</style></head>
<body>${doc.body.innerHTML}${notesJs}</body></html>`;
}

/* ---------- เส้นบอกระยะ (เหมือนแบบแปลน) ---------- */
function noteScript(){
  const notes = JSON.stringify(LAB.notes || []);
  return `<style>
  .__nb{position:absolute;border:1px dashed #ff7043;pointer-events:none;z-index:9998;
    border-radius:3px;background:rgba(255,112,67,.06)}
  .__nl{position:absolute;background:#ff7043;color:#1a0800;font:600 10.5px/1.4
    ui-monospace,Consolas,monospace;padding:2px 6px;border-radius:4px;white-space:nowrap;
    z-index:9999;pointer-events:none;letter-spacing:.3px}
  </style>
  <script>
  (function(){
    var notes = ${notes};
    function draw(){
      document.querySelectorAll('.__nb,.__nl').forEach(function(e){e.remove()});
      notes.forEach(function(n){
        var el = document.querySelector(n.sel);
        if(!el) return;
        var r = el.getBoundingClientRect();
        var top = r.top + window.scrollY, left = r.left + window.scrollX;
        var box = document.createElement('div');
        box.className = '__nb';
        box.style.cssText = 'top:'+top+'px;left:'+left+'px;width:'+r.width+'px;height:'+r.height+'px';
        document.body.appendChild(box);
        var lab = document.createElement('div');
        lab.className = '__nl';
        lab.textContent = n.label;
        document.body.appendChild(lab);
        var lw = lab.offsetWidth, lh = lab.offsetHeight;
        var t, l;
        if(n.side === 'in'){ t = top + 4; l = left + 4; }
        else if(n.side === 'right'){ t = top + 4; l = left + r.width - lw - 4; }
        else if(n.side === 'bottom'){ t = top + r.height - lh - 4; l = left + 4; }
        else { t = top - lh - 3; l = left; }
        if(t < 2) t = top + 4;
        lab.style.cssText = 'top:'+t+'px;left:'+Math.max(2,l)+'px';
      });
    }
    document.body.style.position = 'relative';
    setTimeout(draw, 60);
    window.addEventListener('resize', draw);
    if(document.fonts && document.fonts.ready) document.fonts.ready.then(draw);
  })();
  <\/script>`;
}

/* ---------- ระบายสีโค้ด ---------- */
function paint(code, lang){
  let s = code.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  if(lang === 'css'){
    s = s.replace(/(\/\*[\s\S]*?\*\/)/g, '<i class="tok-com">$1</i>')
         .replace(/^([^\n{}]*?)(\{)/gm, '<i class="tok-sel">$1</i>$2')
         .replace(/([\w-]+)(\s*:\s*)([^;\n]+)/g,
                  '<i class="tok-prop">$1</i>$2<i class="tok-val">$3</i>');
  }else{
    s = s.replace(/(&lt;!--[\s\S]*?--&gt;)/g, '<i class="tok-com">$1</i>')
         .replace(/(&lt;\/?)([\w-]+)/g, '$1<i class="tok-tag">$2</i>')
         .replace(/([\w-]+)=(&quot;|")(.*?)\2/g,
                  '<i class="tok-atr">$1</i>=<i class="tok-str">"$3"</i>');
  }
  return s;
}

/* ---------- ตารางอธิบายทีละบรรทัด ---------- */
function annoTable(rows){
  if(!rows || !rows.length) return '';
  return `<div class="anno">
    <div class="anno-h">อ่านทีละบรรทัด</div>
    ${rows.map(r => `<div class="anno-r">
        <code>${r.c.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}</code>
        <p>${r.d}</p>
      </div>`).join('')}
  </div>`;
}

/* ---------- เดินโค้ดทีละชิ้น: โค้ดชิ้นเล็ก + คำอธิบายติดกับชิ้นนั้น ---------- */
function walkthrough(parts, lang, where){
  const id = 'w' + Math.random().toString(36).slice(2, 8);
  const full = partsCode(parts);
  const label = lang === 'css' ? 'CSS' : (lang === 'js' ? 'JAVASCRIPT' : 'HTML');

  const rows = parts.map((p, i) => {
    const painted = paint(p.c, lang);
    return `<div class="wk-p${p.d ? '' : ' bare'}">
      <div class="wk-code"><span class="wk-n">${i + 1}</span><pre><code>${painted}</code></pre></div>
      ${p.d ? `<div class="wk-say">${p.d}</div>` : ''}
    </div>`;
  }).join('');

  return `<div class="walk">
    <div class="wk-h"><span>${label} · ทีละชิ้น</span>
      ${where ? `<span class="where">${where}</span>` : ''}
      <button data-copy="${id}">คัดลอกทั้งก้อน</button></div>
    ${rows}
    <div class="wk-f" data-raw="${encodeURIComponent(full)}" id="${id}"></div>
  </div>`;
}

/* ---------- ขั้นที่เป็นคำสั่งให้ทำใน VS Code ---------- */
function doSteps(list){
  if(!list || !list.length) return '';
  return `<ol class="dolist">${list.map(x => `<li>${x}</li>`).join('')}</ol>`;
}

function codeBlock(label, where, code, lang){
  const id = 'c' + Math.random().toString(36).slice(2, 8);
  return `<div class="codewrap">
    <div class="codehead"><span>${label}</span>
      ${where ? `<span class="where">${where}</span>` : ''}
      <button data-copy="${id}">คัดลอก</button></div>
    <pre><code id="${id}" data-raw="${encodeURIComponent(code)}">${paint(code, lang)}</code></pre>
  </div>`;
}

/* ---------- สร้างหน้า ---------- */
let cur = 0, showNotes = false, mode = 'build';

function renderSheet(){
  document.querySelector('#labHead').innerHTML = `
    <div class="kicker">LAB ${String(LAB.no).padStart(2,'0')} · ห้องปฏิบัติการ</div>
    <h1 class="lab">${LAB.title}</h1>
    <p class="lede">${LAB.lede}</p>
    <div class="facts">
      <div><span>เวลา</span><b>${LAB.minutes} นาที</b></div>
      <div><span>ขั้นตอน</span><b>${LAB.steps.length} ขั้น</b></div>
      <div><span>ได้ทักษะ</span><b>${LAB.uses.join(' · ')}</b></div>
    </div>`;

  document.querySelector('#steps').innerHTML = LAB.steps.map((s, i) => `
    <div class="step" data-i="${i}">
      <div class="step-n">ขั้นที่ ${i+1} / ${LAB.steps.length}</div>
      <h2>${s.t}</h2>
      <p class="why">${s.why}</p>
      ${s.do   ? doSteps(s.do) : ''}
      ${s.rule ? `<div class="rule-box"><div class="rb-t">${s.rule.t}</div>${s.rule.d}</div>` : ''}
      ${s.parts ? walkthrough(s.parts, s.partsLang || 'html',
          s.partsWhere || (s.partsLang === 'css' ? 'วางในแท็ก &lt;style&gt;'
            : (s.into ? 'วางข้างใน ' + s.into : 'วางในแท็ก &lt;body&gt;'))) : ''}
      ${s.css  ? codeBlock('CSS', s.cssWhere || 'วางในแท็ก &lt;style&gt;', s.css, 'css') : ''}
      ${s.cssLines ? annoTable(s.cssLines) : ''}
      ${s.html ? codeBlock('HTML', s.into ? 'วางข้างใน ' + s.into : 'วางในแท็ก &lt;body&gt;', s.html, 'html') : ''}
      ${s.lines ? annoTable(s.lines) : ''}
      ${s.try  ? `<div class="rule-box try"><div class="rb-t">ลองเอง</div>${s.try}</div>` : ''}
    </div>`).join('');

  document.querySelectorAll('.step h2').forEach(h =>
    h.addEventListener('click', () => setStep(+h.closest('.step').dataset.i)));

  document.querySelectorAll('[data-copy]').forEach(b =>
    b.addEventListener('click', async () => {
      const el = document.querySelector('#'+b.dataset.copy);
      const raw = decodeURIComponent(el.dataset.raw);
      await navigator.clipboard.writeText(raw);
      b.textContent = 'คัดลอกแล้ว'; b.classList.add('ok');
      setTimeout(() => { b.textContent = 'คัดลอก'; b.classList.remove('ok'); }, 1400);
    }));
}

function paintFrame(){
  const upto = (mode === 'target') ? LAB.steps.length - 1 : cur;
  document.querySelector('#frame').srcdoc = buildDoc(upto, showNotes);
  document.querySelector('#pbar').style.width =
    ((cur + 1) / LAB.steps.length * 100) + '%';
  document.querySelector('#stepNow').textContent =
    mode === 'target' ? 'ผลลัพธ์สุดท้าย' : `ขั้นที่ ${cur+1} — ${LAB.steps[cur].t}`;
}

function setStep(i){
  cur = Math.max(0, Math.min(LAB.steps.length - 1, i));
  mode = 'build';
  document.querySelectorAll('.seg button').forEach(b =>
    b.classList.toggle('on', b.dataset.mode === 'build'));
  document.querySelectorAll('.step').forEach((el, n) => {
    el.classList.toggle('on', n === cur);
    el.classList.toggle('done', n < cur);
  });
  document.querySelector('#prev').disabled = cur === 0;
  document.querySelector('#next').disabled = cur === LAB.steps.length - 1;
  paintFrame();
  const el = document.querySelector(`.step[data-i="${cur}"]`);
  if(el) el.scrollIntoView({behavior:'smooth', block:'start'});
}

function boot(){
  renderSheet();

  document.querySelectorAll('.seg button').forEach(b =>
    b.addEventListener('click', () => {
      mode = b.dataset.mode;
      document.querySelectorAll('.seg button').forEach(x => x.classList.toggle('on', x === b));
      paintFrame();
    }));

  document.querySelector('#noteBtn').addEventListener('click', e => {
    showNotes = !showNotes;
    e.currentTarget.classList.toggle('on', showNotes);
    paintFrame();
  });

  document.querySelectorAll('.sizebtns button').forEach(b =>
    b.addEventListener('click', () => {
      document.querySelectorAll('.sizebtns button').forEach(x => x.classList.toggle('on', x === b));
      document.querySelector('#frame').style.maxWidth = b.dataset.w;
    }));

  document.querySelector('#prev').addEventListener('click', () => setStep(cur - 1));
  document.querySelector('#next').addEventListener('click', () => setStep(cur + 1));
  document.addEventListener('keydown', e => {
    if(e.target.tagName === 'INPUT') return;
    if(e.key === 'ArrowRight') setStep(cur + 1);
    if(e.key === 'ArrowLeft')  setStep(cur - 1);
  });

  setStep(0);
}
document.addEventListener('DOMContentLoaded', boot);
