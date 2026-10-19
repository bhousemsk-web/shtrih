/* Инструменты для реалистичных рисунков уровня «Профи» */
const F=d=>({d,k:'f'});                       // тонкая линия детали
function rng(seed){let a=seed>>>0;return()=>{a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
/* путь из токенов: 'M',[x,y],'C',[..],[..],[..],'L',[..],'Q',[..],[..],'Z' с преобразованием точек */
function pb(tok,T=p=>p){let d='';for(const t of tok){if(typeof t==='string')d+=t;else d+=(/[MLCQ]$/.test(d)?'':' ')+P(T(t));}return d;}
function pbPts(tok,T=p=>p,n=14){const out=[];let cur=null,i=0;
  while(i<tok.length){const c=tok[i++];
    if(c==='M'||c==='L'){cur=T(tok[i++]);out.push(cur);}
    else if(c==='C'){const a=cur,b=T(tok[i++]),cc=T(tok[i++]),d=T(tok[i++]);cPts(a,b,cc,d,n).slice(1).forEach(p=>out.push(p));cur=d;}
    else if(c==='Q'){const a=cur,b=T(tok[i++]),d=T(tok[i++]);qPts(a,b,d,n).slice(1).forEach(p=>out.push(p));cur=d;}
  }return out;}
const bboxOf=pts=>[Math.min(...pts.map(p=>p[0])),Math.min(...pts.map(p=>p[1])),Math.max(...pts.map(p=>p[0])),Math.max(...pts.map(p=>p[1]))];
/* короткие штрихи шерсти внутри области по направлению dir(p) */
function strokesIn(inside,bb,dir,{step=9,len=10,seed=7,bend=.35,hidden}={}){
  const r=rng(seed);let d='';
  for(let y=bb[1];y<bb[3];y+=step)for(let x=bb[0];x<bb[2];x+=step){
    const p=[x+(r()-.5)*step*.9,y+(r()-.5)*step*.9];
    if(!inside(p)||(hidden&&hidden(p)))continue;
    const a=dir(p)+(r()-.5)*.4,l=len*(.65+r()*.7),e=[p[0]+Math.cos(a)*l,p[1]+Math.sin(a)*l];
    if(!inside(e)||(hidden&&hidden(e)))continue;
    const k=(r()-.5)*l*bend,c=[(p[0]+e[0])/2-Math.sin(a)*k,(p[1]+e[1])/2+Math.cos(a)*k];
    d+=`M${P(p)}Q${P(c)} ${P(e)}`;
  }return d;}
/* пушистый край: неровные пучки вдоль контура */
function fluffy(pts,amp,seed=3,every=7){
  const r=rng(seed),n=pts.length,cx=pts.reduce((s,p)=>s+p[0],0)/n,cy=pts.reduce((s,p)=>s+p[1],0)/n;
  const dense=densify([...pts,pts[0]],every),o=[];
  dense.forEach((p,i)=>{const q=dense[Math.min(i+1,dense.length-1)],w=dense[Math.max(i-1,0)];let nx=-(q[1]-w[1]),ny=q[0]-w[0];const ln=Math.hypot(nx,ny)||1;nx/=ln;ny/=ln;
    if((p[0]-cx)*nx+(p[1]-cy)*ny<0){nx=-nx;ny=-ny;}const k=i%2?-.25:1;o.push([p[0]+nx*amp*k*(.5+r()),p[1]+ny*amp*k*(.5+r())]);});
  return L(...o);}
/* тон: 1 — лёгкая штриховка, 2 — перекрёстная, 3 — самая тёмная */
function tone(poly,lv=1,hid,step=6){const o=[S(hatch(poly,step,45,hid))];if(lv>1)o.push(S(hatch(poly,step,-45,hid)));if(lv>2)o.push(S(hatch(poly,step*.7,0,hid)));return o;}
/* светотень на круглой форме: полутень, собственная тень с рефлексом у края */
function roundShade(e,lx=-1,ly=-1,hid,step=6){
  const rx=e[2],ry=e[3],rim=[e[0],e[1],rx*.9,ry*.9];
  return[S(hatch(crescent(e,lx*.32*rx,ly*.32*ry),step,45,hid)),
         S(hatch(crescent(e,lx*.6*rx,ly*.6*ry),step,-45,p=>(hid&&hid(p))||!inE(p,rim)))];}
/* падающая тень: темнее у предмета */
function castTone(e,hid,dark){const o=[visE(e,hid||(()=>false)),S(hatch(ePts(e),3.5,0,hid))];if(dark)o.push(S(hatch(ePts(dark),4,45,hid)));return o;}
/* древесные волокна в прямоугольнике */
function woodGrain(x,y,w,h,seed=5){const r=rng(seed),o=[];for(let i=1;i<4;i++){const yy=y+h*i/4+(r()-.5)*4;o.push(`M${f(x+3)} ${f(yy)}Q${f(x+w*.3)} ${f(yy-3+r()*6)} ${f(x+w*.55)} ${f(yy)}T${f(x+w-3)} ${f(yy)}`);}if(w>40)o.push(Er(x+w*(.3+r()*.4),y+h*.5,w*.08,h*.12));return o.map(F);}
/* кирпичная кладка в многоугольнике */
function bricks(poly,bw=28,bh=13,hid){const bb=bboxOf(poly);let d='';const inside=p=>inPoly(p,poly)&&!(hid&&hid(p));
  for(let y=bb[1],row=0;y<bb[3];y+=bh,row++){const seg=densify([[bb[0],y],[bb[2],y]],2);let run=[];for(const p of seg){if(inside(p))run.push(p);else{if(run.length>2)d+=L(run[0],run[run.length-1]);run=[];}}if(run.length>2)d+=L(run[0],run[run.length-1]);
    for(let x=bb[0]+(row%2?bw/2:0);x<bb[2];x+=bw){const a=[x,y],b=[x,y+bh];if(inside([x,y+bh/2]))d+=L(a,b);}}
  return S(d);}
/* листва: пухлые бугорки по кругу и петельки внутри */
function foliage(cx,cy,r,seed=2,n=11){const g=rng(seed),pts=[];for(let i=0;i<=n;i++){const a=-Math.PI/2-i*2*Math.PI/n;pts.push([cx+r*Math.cos(a),cy+r*Math.sin(a)]);}
  let d=`M${P(pts[0])}`;for(let i=1;i<=n;i++){const a=pts[i-1],b=pts[i],m=[(a[0]+b[0])/2,(a[1]+b[1])/2],k=1.45+g()*.25;d+=`Q${P([cx+(m[0]-cx)*k,cy+(m[1]-cy)*k])} ${P(b)}`;}
  return d;}

/* Реалистичный сидящий кот в три четверти. Ноги стоят в (tx,ty), s — масштаб, fl=-1 — зеркально */
function realCat(tx,ty,s=1,fl=1){
  const T=p=>[tx+(p[0]-160)*s*fl,ty+(p[1]-290)*s];
  const silT=['M',[84,38],'L',[88,82],'C',[80,105],[84,128],[98,138],'C',[90,165],[92,205],[102,232],'C',[106,255],[104,272],[100,284],'C',[100,292],[126,293],[128,284],'L',[131,276],'C',[134,293],[156,293],[156,284],'L',[190,290],'C',[225,292],[262,290],[268,268],'C',[272,252],[256,244],[250,256],'C',[248,266],[232,276],[214,278],'C',[232,250],[234,205],[218,172],'C',[204,140],[178,112],[158,90],'L',[164,36],'L',[140,62],'C',[130,56],[116,56],[106,64],'L',[84,38]];
  const sil=pbPts(silT,T),inSil=p=>inPoly(p,sil);
  const chestP=pbPts(['M',[99,140],'C',[118,150],[138,148],[150,140],'L',[150,236],'L',[106,236],'C',[92,205],[90,165],[99,140]],T);
  const bodyE=(()=>{const c=T([172,205]);return[c[0],c[1],78*s,95*s];})();
  const r=v=>v*s;
  const out={sil,inSil,bodyE,T,
    guides:[G(C(...T([122,98]),r(42))),G(Er(...T([128,190]),r(46),r(58))),G(Er(...T([185,240]),r(52),r(48)))],
    contour:pb(silT,T),
    ears:[F(L(T([90,50]),T([97,72]))),F(L(T([94,46]),T([101,66]))),F(L(T([158,48]),T([150,70]))),F(L(T([154,52]),T([146,68])))],
    eyes:[pb(['M',[100,98],'Q',[110,87],[121,96],'Q',[110,104],[100,98]],T),pb(['M',[133,95],'Q',[144,85],[153,93],'Q',[144,101],[133,95]],T)],
    pupils:[F(Er(...T([110.5,95.5]),r(2.2),r(6.5))),F(Er(...T([143,93.5]),r(2.2),r(6.5)))],
    nose:[tri([T([121,112]),T([131,111]),T([126,118])]),F(L(T([120,101]),T([122,110]))),F(L(T([133,100]),T([131,109])))],
    mouth:[F(pb(['M',[126,118],'Q',[124,126],[115,125]],T)),F(pb(['M',[126,118],'Q',[130,125],[138,123]],T)),F(pb(['M',[118,132],'Q',[126,136],[134,131]],T))],
    whiskers:[F(pb(['M',[113,121],'Q',[88,113],[56,118]],T)),F(pb(['M',[113,125],'Q',[86,124],[58,134]],T)),F(pb(['M',[139,120],'Q',[166,112],[198,115]],T)),F(pb(['M',[139,124],'Q',[166,123],[196,131]],T))],
    cheek:pb(['M',[152,86],'C',[162,106],[158,128],[140,138]],T),
    legs:[F(pb(['M',[128,284],'C',[129,262],[128,248],[126,236]],T)),F(pb(['M',[156,284],'C',[154,264],[152,250],[150,240]],T)),F(pb(['M',[160,288],'C',[172,256],[188,238],[212,230]],T))],
    tailLine:F(pb(['M',[192,284],'C',[226,284],[254,280],[262,266]],T)),
    furChest:S(strokesIn(p=>inPoly(p,chestP),bboxOf(chestP),()=>Math.PI/2+.15*fl,{step:r(9),len:r(11),seed:11})),
    furBody:S(strokesIn(inSil,bboxOf(sil),p=>{const c=T([172,150]);return Math.atan2(p[1]-c[1],p[0]-c[0]);},{step:r(13),len:r(9),seed:21,hidden:p=>inPoly(p,chestP)||p[1]<T([0,140])[1]})),
    shade:[S(hatch(crescent(bodyE,-34*s*fl,-28*s),6,45,p=>!inSil(p))),S(hatch(crescent(bodyE,-58*s*fl,-46*s),6,-45,p=>!inSil(p))),S(hatch(pbPts(['M',[98,138],'C',[110,146],[136,148],[150,140],'L',[148,152],'C',[130,158],[110,156],[99,150]],T),3.5,-45))],
  };
  out.all=[out.contour,out.cheek,...out.ears,...out.eyes,...out.pupils,...out.nose,...out.mouth,...out.whiskers,...out.legs,out.tailLine];
  return out;
}
