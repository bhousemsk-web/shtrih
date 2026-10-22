/* Котик Штрих — интерфейс */
const CFG=Object.assign({flavor:'web',author:'',donate:null,audioBase:'audio/',privacyUrl:'privacy.html'},window.SHTRIH_CONFIG||{});
const TG=(window.Telegram&&window.Telegram.WebApp&&window.Telegram.WebApp.initData)?window.Telegram.WebApp:null;
if(TG){if(CFG.flavor!=='store')CFG.flavor='telegram';try{TG.ready();TG.expand();TG.setHeaderColor&&TG.setHeaderColor('#D9E9F4');TG.setBackgroundColor&&TG.setBackgroundColor('#D9E9F4');}catch(e){}}
const D=CFG.donate||{};
const CAN_DONATE=CFG.flavor!=='store'&&!!(D.cardLink||(D.crypto||[]).some(c=>c.address));

/* ================= языки ================= */
const LANGS=[['ru','Русский'],['en','English'],['es','Español'],['pt','Português'],['fr','Français'],['de','Deutsch'],['zh','中文'],['ja','日本語'],['hi','हिन्दी'],['ar','العربية']];
const SPEECH={ru:'ru-RU',en:'en-US',es:'es-ES',pt:'pt-BR',fr:'fr-FR',de:'de-DE',zh:'zh-CN',ja:'ja-JP',hi:'hi-IN',ar:'ar-SA'};
window.I18N=window.I18N||{};

/* ================= state ================= */
const KEY='shtrih-v1';
const state={done:[],unlockAll:false,voice:true,slow:false,lang:null,voices:{},seenLove:false};
try{Object.assign(state,JSON.parse(localStorage.getItem(KEY)||'{}'));}catch(e){}
const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(state));}catch(e){}};
function detectLang(){
  const cands=[];
  try{if(TG&&TG.initDataUnsafe&&TG.initDataUnsafe.user)cands.push(TG.initDataUnsafe.user.language_code);}catch(e){}
  (navigator.languages||[navigator.language||'']).forEach(l=>cands.push(l));
  for(const c of cands){const s=String(c||'').toLowerCase().slice(0,2);if(LANGS.some(([k])=>k===s))return s;if(['uk','be','kk','ky','uz','tg','hy','az','ka'].includes(s))return'ru';}
  return'en';
}
if(!state.lang)state.lang=detectLang();
function t(s,...a){const d=state.lang!=='ru'&&I18N[state.lang];let r=(d&&d[s])||s;a.forEach((v,i)=>r=r.split('{'+i+'}').join(v));return r;}
function loadLang(l){return new Promise(res=>{if(l==='ru'||I18N[l])return res(true);const sc=document.createElement('script');sc.src='i18n/'+l+'.js';sc.onload=()=>res(!!I18N[l]);sc.onerror=()=>res(false);document.head.appendChild(sc);});}

const vDone=v=>state.done.includes(v.id);
const tDoneN=i=>TECHS[i].variants.filter(vDone).length;
const tDone=i=>tDoneN(i)>0;
const isOpen=i=>state.unlockAll||i===0||tDone(i-1);
const currentIdx=()=>{for(let i=0;i<TECHS.length;i++)if(isOpen(i)&&!tDone(i))return i;return -1;};
const doneCount=()=>VARS.filter(vDone).length;
const levelStart=l=>LEVELS.slice(0,l).reduce((s,x)=>s+x.lessons.length,0);
const $=id=>document.getElementById(id);
const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
const mOf=it=>typeof it==='string'?null:it.m||null;

/* ================= голос =================
   1) готовые файлы нейро-озвучки (audio/<язык>/), если есть;
   2) нативный синтез в приложении (Capacitor TextToSpeech);
   3) голос браузера: выбираем самый естественный и даём родителю выбрать. */
const CAP=window.Capacitor,IS_NATIVE=!!(CAP&&CAP.isNativePlatform&&CAP.isNativePlatform());
const NATIVE_TTS=IS_NATIVE?((CAP.Plugins&&CAP.Plugins.TextToSpeech)||(CAP.registerPlugin&&CAP.registerPlugin('TextToSpeech'))||null):null;
const WEB_TTS='speechSynthesis' in window;
let allVoices=[];
function loadVoices(){if(WEB_TTS)try{allVoices=speechSynthesis.getVoices()||[];}catch(e){}}
if(WEB_TTS){loadVoices();speechSynthesis.onvoiceschanged=()=>{loadVoices();if(!$('parentOv').hidden)renderVoices();};}
function voiceScore(v){const n=v.name||'';let s=0;
  if(/natural|neural|online|premium|enhanced|wavenet|studio|journey|siri/i.test(n))s+=6;
  if(/google/i.test(n))s+=3;if(v.localService===false)s+=2;
  if((v.lang||'').replace('_','-').toLowerCase()===SPEECH[state.lang].toLowerCase())s+=2;
  if(/compact|espeak|e-speak|eloquence|robot/i.test(n))s-=6;return s;}
function voicesFor(l){return allVoices.filter(v=>(v.lang||'').toLowerCase().replace('_','-').startsWith(l)).sort((a,b)=>voiceScore(b)-voiceScore(a));}
function currentVoice(){const list=voicesFor(state.lang),saved=state.voices[state.lang];return list.find(v=>v.name===saved)||list[0]||null;}
const packs={};
/* сначала озвучка внутри приложения, потом (если есть интернет) с сайта: в APK кладём не все языки */
const packBase={};
async function loadPack(l){if(packs[l]!==undefined)return packs[l];packs[l]=null;
  for(const base of [CFG.audioBase,CFG.audioRemote].filter(Boolean)){try{const r=await fetch(base+l+'/index.json');if(r.ok){const j=await r.json();packs[l]=new Set(j.files||[]);packBase[l]=base;break;}}catch(e){}}
  return packs[l];}
let sayTok=0,curAudio=null;
function playFile(url,tk){return new Promise(res=>{if(tk!==sayTok)return res();const a=new Audio(url);curAudio=a;a.playbackRate=state.slow?.88:1;a.onended=a.onerror=()=>res();a.play().catch(()=>res());});}
function hush(){sayTok++;if(curAudio){try{curAudio.pause();}catch(e){}curAudio=null;}if(WEB_TTS)try{speechSynthesis.cancel();}catch(e){}if(NATIVE_TTS)try{NATIVE_TTS.stop();}catch(e){}}
async function say(text,force){
  if(!state.voice&&!force)return;hush();const tk=sayTok;
  const parts=splitSentences(forSpeech(text));if(!parts.length)return;
  const pack=packs[state.lang];
  if(pack&&parts.every(p=>pack.has(phraseHash(p)))){for(const p of parts){if(tk!==sayTok)return;await playFile(packBase[state.lang]+state.lang+'/'+phraseHash(p)+'.mp3',tk);}return;}
  if(NATIVE_TTS){for(const p of parts){if(tk!==sayTok)return;try{await NATIVE_TTS.speak({text:p,lang:SPEECH[state.lang],rate:state.slow?.8:.95,pitch:1.05,category:'playback'});}catch(e){break;}}return;}
  if(WEB_TTS){const v=currentVoice();parts.forEach(p=>{const u=new SpeechSynthesisUtterance(p);u.lang=SPEECH[state.lang];if(v)u.voice=v;u.rate=state.slow?.8:.95;u.pitch=1.05;try{speechSynthesis.speak(u);}catch(e){}});}
}

/* ================= wake lock ================= */
let wl=null;
async function awake(on){try{if(on&&!wl&&'wakeLock' in navigator){wl=await navigator.wakeLock.request('screen');wl.addEventListener('release',()=>{wl=null;});}else if(!on&&wl){await wl.release();wl=null;}}catch(e){}}
document.addEventListener('visibilitychange',()=>{if(!document.hidden&&!$('lesson').hidden)awake(true);if(document.hidden)hush();});

/* ================= рендеры ================= */
const ICON={
 check:'<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7"/></svg>',
 lock:'<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round"><rect x="5" y="11" width="14" height="10" rx="2" fill="#fff"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>',
 arrow:'<svg class="flipx" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12h15"/><path d="M13 5l7 7-7 7"/></svg>',
 play:'<svg viewBox="0 0 24 24" width="18" height="18"><path d="M8 5v14l11-7z" fill="var(--ink)"/></svg>',
 card:'<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#fff" stroke-width="2"><rect x="3" y="6" width="18" height="12" rx="2"/><path d="M3 10h18"/></svg>'
};
const allPaths=v=>v.steps.flatMap(s=>s.paths).filter(it=>dOf(it));
const thumbCache=new Map();
function thumb(v,col){
  const key=v.id+col;if(thumbCache.has(key))return thumbCache.get(key);
  const body=allPaths(v).map(it=>{const k=kOf(it),m=mOf(it);return`<path d="${dOf(it)}"${m?` transform="matrix(${m.join(' ')})"`:''}${k==='g'?' stroke-width="4" stroke-dasharray="10 14" opacity=".45"':k==='s'?' stroke-width="3"':k==='f'?' stroke-width="5"':''}/>`;}).join('');
  const s=`<svg class="th" viewBox="0 0 300 300" aria-hidden="true"><g fill="none" stroke="${col}" stroke-width="9" stroke-linecap="round" stroke-linejoin="round">${body}</g></svg>`;
  thumbCache.set(key,s);return s;
}
function show(id){['home','lesson','album'].forEach(s=>$(s).hidden=s!==id);}
function applyTexts(){
  document.documentElement.lang=state.lang;document.documentElement.dir=state.lang==='ar'?'rtl':'ltr';
  document.querySelectorAll('[data-t]').forEach(el=>el.textContent=t(el.dataset.t));
  document.querySelectorAll('[data-aria]').forEach(el=>el.setAttribute('aria-label',t(el.dataset.aria)));
  $('chip').textContent=t('Разминка');
  $('supportLabel').textContent=CAN_DONATE?t('Поддержать разработчика'):t('О приложении');
  $('supportBtn').classList.toggle('soft',!CAN_DONATE);
  $('loveSupport').hidden=!CAN_DONATE;$('loveDonate').hidden=!CAN_DONATE;
  $('loveSign').textContent=CFG.author?t('С любовью, {0}',CFG.author):'';
  document.title=t('Котик Штрих');
}

/* ================= HOME ================= */
function defaultBubble(){
  const c=currentIdx();
  if(c===-1)return t('Ты прошёл все уровни! Ты настоящий художник. Нарисуй другие рисунки в любой технике.');
  if(c===0&&!state.done.length)return t('Привет! Я Штрих. Нажми на котика, будем рисовать!');
  return t('Сегодня учимся: «{0}». Нажми и выбери рисунок!',t(TECHS[c].tech));
}
function setBubble(s,speak){$('bubble').textContent=s;if(speak)say(s);}
function renderHome(){
  const tr=$('trail'),offs=[0,-1,0,1],c=currentIdx();let h='';
  LEVELS.forEach((lv,li)=>{
    const first=levelStart(li),locked=!isOpen(first);
    h+=`<button class="lvl${locked?' locked':''}" data-l="${li}"><span class="ln">${li+1}</span><span class="lt"><b>${t(lv.name)}</b><span>${t(lv.sub)}</span></span></button>`;
    lv.lessons.forEach((_,k)=>{
      const i=first+k,tc=TECHS[i],o=offs[k%4],n=tDoneN(i),tot=tc.variants.length;
      const st=n?'is-done':i===c?'is-now':isOpen(i)?'is-open':'is-locked';
      const badge=n?(n===tot?ICON.check:`${n}/${tot}`):isOpen(i)?tc.num:ICON.lock;
      const shown=tc.variants.find(vDone)||tc.variants[0];
      h+=`<button class="node ${st}" data-i="${i}" style="--o:${o}" aria-label="${t(tc.tech)}"><span class="disc" style="--tint:${shown.tint}">${thumb(shown,'var(--ink)')}<span class="badge">${badge}</span></span><span class="nlabel">${t(tc.tech)}</span><span class="nsub">${t('Рисунков: {0}',tot)}</span></button>`;
      if(k<lv.lessons.length-1)h+=`<div class="hop" style="--o:${(o+offs[(k+1)%4])/2}"><i></i><i></i><i></i></div>`;
    });
  });
  tr.innerHTML=h;
  $('albumCount').textContent=`${doneCount()}/${VARS.length}`;
  setBubble(defaultBubble(),false);
  const now=tr.querySelector('.is-now');
  if(now)requestAnimationFrame(()=>now.scrollIntoView({block:'center'}));
}
$('trail').addEventListener('click',e=>{
  const lv=e.target.closest('.lvl');
  if(lv){const l=+lv.dataset.l;setBubble(isOpen(levelStart(l))?t(LEVELS[l].intro):t('Уровень {0} откроется, когда ты пройдёшь уровень {1}.',l+1,l),true);return;}
  const b=e.target.closest('.node');if(!b)return;
  const i=+b.dataset.i;
  if(!isOpen(i)){setBubble(t('Сначала нарисуй любой рисунок в технике «{0}»!',t(TECHS[i-1].tech)),true);return;}
  openPicker(i);
});

/* ================= выбор рисунка ================= */
let PI=0;
function openPicker(i){
  PI=i;const tc=TECHS[i];
  $('pkTitle').textContent=t(tc.tech);
  $('pkList').innerHTML=tc.variants.map((v,j)=>`<button class="pk${vDone(v)?' got':''}" data-j="${j}" style="--tint:${v.tint}"><span class="pkface">${thumb(v,'var(--ink)')}${vDone(v)?`<span class="badge">${ICON.check}</span>`:''}</span><span class="pkname">${t(v.name)}</span></button>`).join('');
  $('pickerOv').hidden=false;
  const left=tc.variants.filter(v=>!vDone(v)).length;
  say(t('{0}. Выбери, что будем рисовать.',t(tc.tech))+(left&&left<tc.variants.length?' '+t('Осталось: {0}.',left):''));
}
$('pkList').addEventListener('click',e=>{const b=e.target.closest('.pk');if(!b)return;$('pickerOv').hidden=true;openLesson(TECHS[PI].variants[+b.dataset.j]);});
$('pkClose').addEventListener('click',()=>{$('pickerOv').hidden=true;hush();});

/* Штрих: нажать — скажет, удерживать 1,8 с — меню для взрослых */
let holdT=null,held=false;
const sh=$('shtrih');
sh.addEventListener('pointerdown',()=>{held=false;sh.classList.add('holding');holdT=setTimeout(()=>{held=true;sh.classList.remove('holding');openParent();},1800);});
['pointerup','pointerleave','pointercancel'].forEach(ev=>sh.addEventListener(ev,()=>{clearTimeout(holdT);sh.classList.remove('holding');}));
sh.addEventListener('contextmenu',e=>e.preventDefault());
sh.addEventListener('click',()=>{if(held){held=false;return;}say($('bubble').textContent);});

/* ================= урок ================= */
let V=null,SI=0,tok=0;
const NS='http://www.w3.org/2000/svg';
const gFin=$('gFin'),gOld=$('gOld'),gCur=$('gCur'),pencil=$('pencil'),dot=$('startDot');
const stepsOf=v=>[{...v.warm,warm:true},...v.steps];
function addPath(g,it){const d=dOf(it);if(!d)return null;const p=document.createElementNS(NS,'path');p.setAttribute('d',d);const k=kOf(it),m=mOf(it);if(k)p.setAttribute('class',k);if(m)p.setAttribute('transform',`matrix(${m.join(' ')})`);g.appendChild(p);return p;}
const wait=ms=>new Promise(r=>setTimeout(r,ms));
const tp=(pt,m)=>m?{x:m[0]*pt.x+m[2]*pt.y+m[4],y:m[1]*pt.x+m[3]*pt.y+m[5]}:pt;
function movePencil(pt){pencil.setAttribute('transform',`translate(${pt.x} ${pt.y})`);}
function openLesson(v){V=v;SI=0;show('lesson');awake(true);renderStep(true);}
function renderStep(intro){
  const st=stepsOf(V);tok++;
  [gFin,gOld,gCur].forEach(g=>g.replaceChildren());
  pencil.setAttribute('opacity','0');dot.setAttribute('cx','-50');
  $('dots').innerHTML=st.map((_,k)=>`<i class="${k<SI?'past':k===SI?'now':''}"></i>`).join('')+`<i class="${SI>=st.length?'now':''}"></i>`;
  const nb=$('nextBtn');
  if(SI>=st.length){
    allPaths(V).forEach(it=>addPath(gFin,it));
    $('chip').hidden=true;
    const p=t(PRAISE[Math.floor(Math.random()*PRAISE.length)]);
    $('caption').textContent=p;
    nb.className='go finish';nb.innerHTML=ICON.check+t('Готово!');nb.setAttribute('aria-label',t('Готово!'));
    say(p);return;
  }
  nb.className='go';nb.innerHTML=ICON.arrow;nb.setAttribute('aria-label',t('Дальше'));
  const s=st[SI];
  if(!s.warm)for(let k=1;k<SI;k++)st[k].paths.forEach(it=>addPath(gOld,it));
  $('chip').hidden=!s.warm;
  $('caption').textContent=t(s.say);
  let text=t(s.say);
  if(intro)text=`${t(V.tech)}. ${t(V.name)}. `+(V.t.ti===0&&!state.done.length?t('Возьми листок и карандаш.')+' ':'')+text;
  say(text);
  play(s.paths,tok);
}
async function play(paths,tk){
  const fast=paths.length>6?2.2:1;
  await wait(250);
  for(const it of paths){
    if(tk!==tok)return;
    const p=addPath(gCur,it);if(!p)continue;
    if(reduce)continue;
    const k=kOf(it),m=mOf(it),len=p.getTotalLength();
    p.style.strokeDasharray=len;p.style.strokeDashoffset=len;
    const s=tp(p.getPointAtLength(0),m);
    dot.setAttribute('cx',s.x);dot.setAttribute('cy',s.y);dot.classList.remove('on');void dot.getBBox();dot.classList.add('on');
    movePencil(s);pencil.setAttribute('opacity','1');
    await wait(fast>1||k==='s'?160:450);
    if(tk!==tok)return;
    const speed=k==='s'?360:k==='g'?200:k==='f'?140:110;
    const dur=Math.min(k==='s'?5000:3800,Math.max(450,len/speed*1000))/fast;
    await new Promise(res=>{
      const t0=performance.now();
      const fr=now=>{
        if(tk!==tok)return res();
        const q=Math.min(1,(now-t0)/dur),e=k==='s'?q:0.5-Math.cos(q*Math.PI)/2;
        p.style.strokeDashoffset=len*(1-e);movePencil(tp(p.getPointAtLength(len*e),m));
        q<1?requestAnimationFrame(fr):res();
      };
      requestAnimationFrame(fr);
    });
    p.style.strokeDasharray='';p.style.strokeDashoffset='';
    dot.setAttribute('cx','-50');
  }
  if(tk===tok)pencil.setAttribute('opacity','0');
}
$('replayBtn').addEventListener('click',()=>renderStep(false));
$('sayBtn').addEventListener('click',()=>say($('caption').textContent));
$('homeBtn').addEventListener('click',goHome);
$('nextBtn').addEventListener('click',()=>{const st=stepsOf(V);if(SI<st.length){SI++;renderStep(false);}else finishLesson();});
function goHome(){tok++;hush();awake(false);show('home');renderHome();if(TG)try{TG.BackButton.hide();}catch(e){}}

/* ================= наклейка ================= */
function finishLesson(){
  const v=V,again=vDone(v),firstInTech=!tDone(v.t.ti);
  const lastOfLevel=v.num===LEVELS[v.level].lessons.length;
  if(!again){state.done.push(v.id);save();}
  const b=$('bigStk');b.style.setProperty('--tint',v.tint);b.innerHTML=thumb(v,'var(--ink)');
  b.style.animation='none';void b.offsetWidth;b.style.animation='';
  let title=again?t('Ещё раз «{0}»!',t(v.name)):t('Наклейка «{0}» твоя!',t(v.name));
  let spoken=again?t('Ещё одна наклейка! Отлично получилось!'):t('Наклейка твоя! Она уже в альбоме.');
  if(!again&&firstInTech&&lastOfLevel&&v.level<LEVELS.length-1){spoken+=' '+t('Ура! Открыт новый уровень: {0}!',t(LEVELS[v.level+1].name));title+=' '+t('Открыт уровень {0}!',v.level+2);}
  else if(!again&&firstInTech&&v.t.ti<TECHS.length-1)spoken+=' '+t('Открыт следующий урок.');
  $('stkTitle').textContent=title;$('stickerOv').hidden=false;
  say(spoken);
}
$('stkOk').addEventListener('click',()=>{$('stickerOv').hidden=true;goHome();});

/* ================= альбом ================= */
function renderAlbum(){
  let h='';
  LEVELS.forEach((lv,li)=>{
    const vs=VARS.filter(v=>v.level===li),n=vs.filter(vDone).length;
    h+=`<h2>${li+1}. ${t(lv.name)} <small>${t('{0} из {1}',n,vs.length)}</small></h2>`;
    vs.forEach((v,k)=>{h+=vDone(v)
      ?`<div class="stk got" style="--tint:${v.tint};--r:${[-6,4,-3,7][k%4]}deg"><div class="face">${thumb(v,'var(--ink)')}</div><div class="nm">${t(v.name)}</div></div>`
      :`<div class="stk"><div class="face"><span class="q">?</span></div><div class="nm" style="color:var(--ink-soft)">${t(v.tech)}</div></div>`;});
  });
  $('grid').innerHTML=h;
}
$('albumBtn').addEventListener('click',()=>{renderAlbum();show('album');say(doneCount()?t('Вот твои наклейки!'):t('Тут будут твои наклейки. Нарисуй первого котика!'));if(TG)try{TG.BackButton.show();}catch(e){}});
$('albumBack').addEventListener('click',()=>{hush();show('home');if(TG)try{TG.BackButton.hide();}catch(e){}});
if(TG)try{TG.BackButton.onClick(()=>{if(!$('lesson').hidden)goHome();else{show('home');TG.BackButton.hide();}});}catch(e){}

/* ================= «сделано с любовью» и поддержка ================= */
function openLove(){$('loveOv').hidden=false;}
$('loveClose').addEventListener('click',()=>{$('loveOv').hidden=true;if(!state.seenLove){state.seenLove=true;save();}});
$('loveSupport').addEventListener('click',()=>{$('loveOv').hidden=true;state.seenLove=true;save();openGate(openDonate);});
$('supportBtn').addEventListener('click',()=>{hush();if(CAN_DONATE)openGate(openDonate);else openLove();});
$('pAbout').addEventListener('click',()=>{$('parentOv').hidden=true;openLove();});
/* родительский замок: дети не попадут к реквизитам и внешним ссылкам */
let gateNext=null,gateAns=0;
function openGate(next){
  gateNext=next;const a=3+Math.floor(Math.random()*7),b=4+Math.floor(Math.random()*6);gateAns=a+b;
  $('gateQ').textContent=t('Сколько будет {0} + {1}?',a,b);$('gateMsg').textContent='';
  const opts=new Set([gateAns]);while(opts.size<6)opts.add(gateAns+Math.floor(Math.random()*9)-4);
  $('gateBtns').innerHTML=[...opts].sort(()=>Math.random()-.5).map(n=>`<button data-n="${n}">${n}</button>`).join('');
  $('gateOv').hidden=false;
}
$('gateBtns').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;if(+b.dataset.n===gateAns){$('gateOv').hidden=true;gateNext&&gateNext();}else $('gateMsg').textContent=t('Неверно, попробуйте ещё раз');});
$('gateClose').addEventListener('click',()=>{$('gateOv').hidden=true;});
function openLink(url){if(TG&&TG.openLink){try{TG.openLink(url);return;}catch(e){}}const a=document.createElement('a');a.href=url;a.target='_blank';a.rel='noopener';document.body.appendChild(a);a.click();a.remove();}
function openDonate(){
  let h='';
  if(D.cardLink)h+=`<a class="cardlink" href="${D.cardLink}" target="_blank" rel="noopener" data-link="${D.cardLink}">${ICON.card}<span>${t(D.cardLabel||'Перевод с российской карты')}</span></a>`;
  (D.crypto||[]).filter(c=>c.address).forEach((c,i)=>{h+=`<div class="addr"><b>${c.name}</b><code id="ca${i}">${c.address}</code><button data-copy="${i}">${t('Скопировать')}</button></div>`;});
  $('donList').innerHTML=h;$('donateOv').hidden=false;
}
$('donList').addEventListener('click',e=>{
  const l=e.target.closest('[data-link]');if(l&&TG){e.preventDefault();openLink(l.dataset.link);return;}
  const b=e.target.closest('[data-copy]');if(!b)return;const txt=D.crypto[+b.dataset.copy].address;
  const ok=()=>{b.textContent=t('Скопировано!');setTimeout(()=>b.textContent=t('Скопировать'),1800);};
  const fallback=()=>{const r=document.createRange();r.selectNodeContents($('ca'+b.dataset.copy));const s=getSelection();s.removeAllRanges();s.addRange(r);};
  try{navigator.clipboard.writeText(txt).then(ok,fallback);}catch(err){fallback();}
});
$('donClose').addEventListener('click',()=>{$('donateOv').hidden=true;});

/* ================= меню для взрослых ================= */
let armed=false;
function renderVoices(){
  const box=$('pVoices'),list=voicesFor(state.lang).slice(0,8),cur=currentVoice();
  if(packs[state.lang]&&packs[state.lang].size){box.innerHTML='';$('pVoiceInfo').textContent=t('Включена нейро-озвучка из файлов приложения.');return;}
  if(NATIVE_TTS){box.innerHTML='';$('pVoiceInfo').textContent=t('Используется голос телефона. Лучший голос можно выбрать в настройках телефона: Android — «Синтез речи», iPhone — «Универсальный доступ» → «Устная речь» → «Голоса».');return;}
  if(!WEB_TTS){box.innerHTML='';$('pVoiceInfo').textContent=t('Этот браузер не умеет говорить. Откройте страницу в Chrome или Safari.');return;}
  box.innerHTML=list.map((v,i)=>`<label><input type="radio" name="vc" value="${i}"${cur&&v.name===cur.name?' checked':''}><span>${v.name}</span><button class="play" data-play="${i}" aria-label="${t('Послушать')}">${ICON.play}</button></label>`).join('');
  box._list=list;
  $('pVoiceInfo').textContent=list.length?t('Голоса с пометкой Natural, Neural, Enhanced или Google обычно звучат живее всего.'):t('Голос для этого языка не найден. Установите голосовые данные в настройках телефона: Android — «Синтез речи» → Google, iPhone — «Универсальный доступ» → «Устная речь» → «Голоса».');
}
$('pVoices').addEventListener('change',e=>{const l=$('pVoices')._list;if(!l)return;state.voices[state.lang]=l[+e.target.value].name;save();say(t('Привет! Я Штрих. Давай рисовать!'),true);});
$('pVoices').addEventListener('click',e=>{const b=e.target.closest('[data-play]');if(!b)return;e.preventDefault();const l=$('pVoices')._list,v=l[+b.dataset.play];hush();const u=new SpeechSynthesisUtterance(forSpeech(t('Привет! Я Штрих. Давай рисовать!')));u.lang=SPEECH[state.lang];u.voice=v;u.rate=.95;u.pitch=1.05;speechSynthesis.speak(u);});
function syncParent(){
  [['pVoice','voice'],['pSlow','slow'],['pAll','unlockAll']].forEach(([id,k])=>{const b=$(id);b.setAttribute('aria-pressed',state[k]);b.textContent=state[k]?t('Вкл'):t('Выкл');});
  $('pLangs').innerHTML=LANGS.map(([k,n])=>`<button data-lang="${k}" aria-pressed="${k===state.lang}">${n}</button>`).join('');
  renderVoices();
  armed=false;$('pReset').classList.remove('arm');$('pReset').textContent=t('Сбросить прогресс и наклейки');
}
function openParent(){hush();loadVoices();syncParent();$('parentOv').hidden=false;}
$('pLangs').addEventListener('click',async e=>{const b=e.target.closest('[data-lang]');if(!b)return;await setLang(b.dataset.lang);syncParent();say(t('Привет! Я Штрих. Давай рисовать!'),true);});
[['pVoice','voice'],['pSlow','slow'],['pAll','unlockAll']].forEach(([id,k])=>$(id).addEventListener('click',()=>{state[k]=!state[k];save();syncParent();}));
$('pReset').addEventListener('click',()=>{
  if(!armed){armed=true;$('pReset').classList.add('arm');$('pReset').textContent=t('Точно сбросить? Нажмите ещё раз');return;}
  state.done=[];save();syncParent();$('pReset').textContent=t('Прогресс сброшен');
});
$('pClose').addEventListener('click',()=>{$('parentOv').hidden=true;renderHome();});

/* ================= запуск ================= */
async function setLang(l){
  const ok=await loadLang(l);state.lang=ok?l:'ru';save();
  applyTexts();renderHome();loadPack(state.lang).then(()=>{if(!$('parentOv').hidden)renderVoices();});
}
setLang(state.lang).then(()=>{if(!state.seenLove)openLove();});
if('serviceWorker' in navigator&&location.protocol==='https:'&&!TG&&!IS_NATIVE)navigator.serviceWorker.register('sw.js').catch(()=>{});
