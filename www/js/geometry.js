/* Котик Штрих — геометрия рисунков (viewBox 300×300) */

/* ================= geometry (viewBox 300×300) ================= */
const f=n=>Math.round(n*10)/10;
const P=p=>f(p[0])+' '+f(p[1]);
const L=(...p)=>'M'+p.map(P).join('L');
const tri=p=>L(...p)+'Z';
const C=(cx,cy,r)=>`M${f(cx)} ${f(cy-r)}A${f(r)} ${f(r)} 0 1 0 ${f(cx)} ${f(cy+r)}A${f(r)} ${f(r)} 0 1 0 ${f(cx)} ${f(cy-r)}`;
const E=(cx,cy,rx,ry)=>`M${f(cx)} ${f(cy-ry)}A${f(rx)} ${f(ry)} 0 1 0 ${f(cx)} ${f(cy+ry)}A${f(rx)} ${f(ry)} 0 1 0 ${f(cx)} ${f(cy-ry)}`;
const Qc=(a,c,b)=>`M${P(a)}Q${P(c)} ${P(b)}`;
const G=d=>({d,k:'g'});           // helper line, drawn lightly, dashed
const S=d=>({d,k:'s'});           // shading strokes, thin
function ellPts(cx,cy,rx,ry,n=120,rot=0){const p=[],a0=rot*Math.PI/180,cr=Math.cos(a0),sr=Math.sin(a0);for(let i=0;i<n;i++){const a=-Math.PI/2-i*2*Math.PI/n,x=rx*Math.cos(a),y=ry*Math.sin(a);p.push([cx+x*cr-y*sr,cy+x*sr+y*cr]);}return p;}
const ePts=e=>ellPts(e[0],e[1],e[2],e[3],120,e[4]||0);
function inE(p,e){let x=p[0]-e[0],y=p[1]-e[1];if(e[4]){const a=-e[4]*Math.PI/180,c=Math.cos(a),s=Math.sin(a);[x,y]=[x*c-y*s,x*s+y*c];}return (x/e[2])**2+(y/e[3])**2<1;}
function inTri(p,t){const s=(a,b,c)=>(a[0]-c[0])*(b[1]-c[1])-(b[0]-c[0])*(a[1]-c[1]);const d1=s(p,t[0],t[1]),d2=s(p,t[1],t[2]),d3=s(p,t[2],t[0]);return !((d1<0||d2<0||d3<0)&&(d1>0||d2>0||d3>0));}
function inPoly(p,poly){let c=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){const[xi,yi]=poly[i],[xj,yj]=poly[j];if((yi>p[1])!==(yj>p[1])&&p[0]<(xj-xi)*(p[1]-yi)/(yj-yi)+xi)c=!c;}return c;}
function densify(pts,step=2){const o=[pts[0]];for(let i=1;i<pts.length;i++){const a=pts[i-1],b=pts[i],n=Math.max(1,Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1])/step));for(let k=1;k<=n;k++)o.push([a[0]+(b[0]-a[0])*k/n,a[1]+(b[1]-a[1])*k/n]);}return o;}
/* only the parts of an outline that are not hidden behind something in front */
function vis(pts,hidden,closed=true){
  const n=pts.length,v=pts.map(p=>!hidden(p));
  if(v.every(Boolean))return closed?L(...pts,pts[0]):L(...pts);
  let start=0;
  if(closed){const i=v.findIndex((x,j)=>!x&&v[(j+1)%n]);start=i<0?0:(i+1)%n;}
  let out='',run=[];
  const flush=()=>{if(run.length>1)out+=L(...run);run=[];};
  for(let k=0;k<n;k++){const i=(start+k)%n;if(v[i])run.push(pts[i]);else flush();}
  flush();return out;
}
const visE=(e,hidden)=>vis(ePts(e),hidden);
const visLine=(pts,hidden)=>vis(densify(pts),hidden,false);
function zigCircle(cx,cy,r,n,amp){const p=[];for(let i=0;i<=n;i++){const a=-Math.PI/2-i*2*Math.PI/n,rr=r+(i%2?-amp:amp);p.push([cx+rr*Math.cos(a),cy+rr*Math.sin(a)]);}return L(...p);}
function spiral(cx,cy,r0,r1,a0,turns,dir){const N=Math.round(turns*48),p=[];for(let i=0;i<=N;i++){const t=i/N,a=a0+dir*t*turns*2*Math.PI,r=r0+(r1-r0)*t;p.push([cx+r*Math.cos(a),cy+r*Math.sin(a)]);}return L(...p);}
const wave=y=>`M30 ${y}q25 -25 50 0t50 0t50 0t50 0t50 0`;
function zig(y){const p=[];for(let i=0,x=30;x<=270;i++,x+=24)p.push([x,y+(i%2?14:-14)]);return L(...p);}
function circlePoly(cx,cy,r,n=60){const p=[];for(let i=0;i<n;i++){const a=i*2*Math.PI/n;p.push([cx+r*Math.cos(a),cy+r*Math.sin(a)]);}return p;}
/* parallel hatching inside a polygon; returns one multi-stroke path */
function hatch(poly,step,deg,hidden){
  const a=deg*Math.PI/180,c=Math.cos(a),s=Math.sin(a);
  const rot=p=>[p[0]*c+p[1]*s,-p[0]*s+p[1]*c],back=p=>[p[0]*c-p[1]*s,p[0]*s+p[1]*c];
  const Pp=poly.map(rot),ys=Pp.map(p=>p[1]),y0=Math.min(...ys),y1=Math.max(...ys);let out='';
  for(let y=y0+step/2;y<y1;y+=step){
    const xs=[];
    for(let i=0;i<Pp.length;i++){const p=Pp[i],q=Pp[(i+1)%Pp.length];if((p[1]<=y&&q[1]>y)||(q[1]<=y&&p[1]>y))xs.push(p[0]+(y-p[1])/(q[1]-p[1])*(q[0]-p[0]));}
    xs.sort((m,n)=>m-n);
    for(let k=0;k+1<xs.length;k+=2){
      const A=back([xs[k]+2,y]),B=back([xs[k+1]-2,y]);
      if(Math.hypot(B[0]-A[0],B[1]-A[1])<3)continue;
      if(!hidden){out+=L(A,B);continue;}
      let run=[];
      for(const p of densify([A,B],1.5)){if(!hidden(p))run.push(p);else{if(run.length>2)out+=L(run[0],run[run.length-1]);run=[];}}
      if(run.length>2)out+=L(run[0],run[run.length-1]);
    }
  }
  return out;
}
/* the dark side of a round form: the part not lit when the light comes from (dx,dy) */
function runOf(Pp,pred){const n=Pp.length,v=Pp.map(pred);const s=v.findIndex((x,i)=>!x&&v[(i+1)%n]);if(s<0)return v[0]?Pp.slice():[];const r=[];for(let k=1;k<=n;k++){const i=(s+k)%n;if(!v[i])break;r.push(Pp[i]);}return r;}
function crescent(e,dx,dy){
  const sh=[e[0]+dx,e[1]+dy,e[2],e[3]];
  const outer=runOf(ePts(e),p=>!inE(p,sh));let inner=runOf(ePts(sh),p=>inE(p,e));
  const end=outer[outer.length-1],d=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1]);
  if(d(end,inner[0])>d(end,inner[inner.length-1]))inner.reverse();
  return outer.concat(inner);
}
const rays=(cx,cy,r1,r2,n,a0,a1)=>Array.from({length:n},(_,i)=>{const a=(a0+(a1-a0)*i/(n-1))*Math.PI/180;return L([cx+r1*Math.cos(a),cy+r1*Math.sin(a)],[cx+r2*Math.cos(a),cy+r2*Math.sin(a)]);});
const sun=(cx,cy,r)=>[C(cx,cy,r),...rays(cx,cy,r+6,r+15,8,0,315)];
const cloud=(x,y,w)=>`M${f(x)} ${f(y)}a${f(w*.2)} ${f(w*.2)} 0 0 1 ${f(w*.28)} ${f(-w*.18)}a${f(w*.26)} ${f(w*.26)} 0 0 1 ${f(w*.44)} 0a${f(w*.2)} ${f(w*.2)} 0 0 1 ${f(w*.28)} ${f(w*.18)}Z`;
const tuft=(x,y,h,w)=>L([x,y],[x+w*.2,y-h],[x+w*.4,y],[x+w*.6,y-h*1.2],[x+w*.8,y],[x+w,y-h*.9],[x+w*1.15,y]);
const bird=(x,y,s)=>`M${f(x-s)} ${f(y)}Q${f(x-s/2)} ${f(y-s*.6)} ${f(x)} ${f(y)}Q${f(x+s/2)} ${f(y-s*.6)} ${f(x+s)} ${f(y)}`;
const tree=(x,y,h)=>({trunk:L([x,y],[x,y-h*.55]),crown:C(x,y-h*.55-h*.27,h*.27)});
const firTree=(x,y,h)=>tri([[x,y-h],[x-h*.35,y],[x+h*.35,y]]);

/* cat head of any size (standard: r70) */
function catHead(cx,cy,r){
  const k=r/70,m=(a,b)=>[cx+a*k,cy+b*k];
  const earL=[m(-55,-43),m(-62,-108),m(-15,-68)],earR=[m(55,-43),m(62,-108),m(15,-68)];
  return{m,k,earL,earR,head:C(cx,cy,r),ears:[L(...earL),L(...earR)],
    eyes:[C(...m(-25,-10),Math.max(1.5,9*k)),C(...m(25,-10),Math.max(1.5,9*k))],
    nose:tri([m(-9,10),m(9,10),m(0,21)]),
    mouth:[Qc(m(0,21),m(-7,32),m(-17,28)),Qc(m(0,21),m(7,32),m(17,28))],
    whiskers:[L(m(-32,18),m(-90,8)),L(m(-32,26),m(-90,34)),L(m(32,18),m(90,8)),L(m(32,26),m(90,34))]};
}
/* sitting cat, feet at (x,y), scale s, fl=-1 mirrors (tail to the left) */
function sitCat(x,y,s,fl=1,extra){
  const m=(a,b)=>[x+a*s*fl,y+b*s];
  const bodyE=[x,y-68*s,55*s,68*s],headE=[x,y-168*s,45*s,45*s];
  const r={bodyE,headE,m};
  r.body=visE(bodyE,p=>inE(p,headE)||(extra?extra(p):false));
  r.head=C(headE[0],headE[1],headE[2]);
  r.ears=[L(m(-35,-196),m(-42,-248),m(-10,-212)),L(m(35,-196),m(42,-248),m(10,-212))];
  const er=Math.max(1.5,6*s);
  r.face=s<.2?[]:[C(...m(-17,-173),er),C(...m(17,-173),er),tri([m(-6,-160),m(6,-160),m(0,-153)])];
  r.whiskers=s<.5?[]:[L(m(-14,-157),m(-64,-165)),L(m(-14,-152),m(-64,-144)),L(m(14,-157),m(64,-165)),L(m(14,-152),m(64,-144))];
  r.tail=`M${P(m(53,-45))}Q${P(m(108,-41))} ${P(m(102,-95))}Q${P(m(99,-121))} ${P(m(78,-113))}`;
  r.all=[r.body,r.head,...r.ears,...r.face,...r.whiskers,r.tail];
  return r;
}

/* level-1 standard face */
const EAR_L=[[95,127],[88,62],[135,102]],EAR_R=EAR_L.map(([x,y])=>[300-x,y]);
const head=()=>C(150,170,70);
const ears=()=>[L(...EAR_L),L(...EAR_R)];
const innerEars=()=>[L([103,118],[97,82],[124,103]),L([197,118],[203,82],[176,103])];
const eyesNose=()=>[C(125,160,9),C(175,160,9),tri([[141,180],[159,180],[150,191]])];
const mouthWhiskers=()=>['M150 191Q143 202 133 198','M150 191Q157 202 167 198',L([118,188],[60,178]),L([118,196],[60,204]),L([182,188],[240,178]),L([182,196],[240,204])];
const tailA=Math.atan2(-15.5,-30.5);


const dOf=it=>typeof it==='string'?it:it.d, kOf=it=>typeof it==='string'?'':it.k;
/* ================= more helpers ================= */
const R=(x,y,w,h)=>tri([[x,y],[x+w,y],[x+w,y+h],[x,y+h]]);
const Er=(cx,cy,rx,ry,rot=0)=>{const p=ellPts(cx,cy,rx,ry,96,rot);return L(...p,p[0]);};
function star(x,y,r){const p=[];for(let i=0;i<10;i++){const a=-Math.PI/2+i*Math.PI/5,rr=i%2?r*.45:r;p.push([x+rr*Math.cos(a),y+rr*Math.sin(a)]);}return L(...p,p[0]);}
const heart=(x,y,s)=>`M${f(x)} ${f(y+s*.9)}C${f(x-s*1.4)} ${f(y)} ${f(x-s*.6)} ${f(y-s)} ${f(x)} ${f(y-s*.3)}C${f(x+s*.6)} ${f(y-s)} ${f(x+s*1.4)} ${f(y)} ${f(x)} ${f(y+s*.9)}`;
const qPts=(a,c,b,n=24)=>Array.from({length:n+1},(_,i)=>{const t=i/n,u=1-t;return[u*u*a[0]+2*u*t*c[0]+t*t*b[0],u*u*a[1]+2*u*t*c[1]+t*t*b[1]];});
const cPts=(a,b,c,d,n=24)=>Array.from({length:n+1},(_,i)=>{const t=i/n,u=1-t;return[u*u*u*a[0]+3*u*u*t*b[0]+3*u*t*t*c[0]+t*t*t*d[0],u*u*u*a[1]+3*u*u*t*b[1]+3*u*t*t*c[1]+t*t*t*d[1]];});
const shade=(e,dx,dy,step=6,hid)=>S(hatch(crescent(e,dx,dy),step,45,hid));
const castSh=(e,hid,step=3.5)=>[visE(e,hid||(()=>false)),S(hatch(ePts(e),step,0,hid))];
const flake=(x,y,r)=>[0,60,120].map(a=>{const c=Math.cos(a*Math.PI/180)*r,s=Math.sin(a*Math.PI/180)*r;return L([x-c,y-s],[x+c,y+s]);});
const waveL=(x0,x1,y,h=8,w=30)=>{let d=`M${f(x0)} ${f(y)}q${f(w/4)} ${f(-h)} ${f(w/2)} 0`;for(let x=x0+w/2;x<x1-w/2+1;x+=w/2)d+=`t${f(w/2)} 0`;return d;};
const mir=(it,y0)=>({d:dOf(it),k:'s',m:[1,0,0,-1,0,2*y0]});          // reflection in water
function fishP(cx,cy,s,dir=1){const m=(a,b)=>[cx+a*s*dir,cy+b*s],be=[cx,cy,40*s,20*s];return[E(cx,cy,40*s,20*s),visLine([m(36,0),m(60,-16),m(60,16),m(36,0)],p=>inE(p,be)),C(...m(-22,-4),Math.max(1.5,3*s))];}
const housePoly=(x,y,w)=>[[x-w/2,y],[x-w/2,y-w*.8],[x-w*.62,y-w*.8],[x,y-w*1.3],[x+w*.62,y-w*.8],[x+w/2,y-w*.8],[x+w/2,y]];
const houseF=(x,y,w)=>[R(x-w/2,y-w*.8,w,w*.8),tri([[x,y-w*1.3],[x-w*.62,y-w*.8],[x+w*.62,y-w*.8]]),R(x-w*.12,y-w*.42,w*.24,w*.42)];
function backCat(x,y,s){const m=(a,b)=>[x+a*s,y+b*s],hE=[x,y-72*s,24*s,24*s],bE=[x,y-30*s,38*s,30*s],h=catHead(x,y-72*s,24*s);
  return{hE,bE,ears:h.ears,head:C(hE[0],hE[1],hE[2]),body:visE(bE,p=>inE(p,hE)),tail:`M${P(m(35,-16))}Q${P(m(72,-10))} ${P(m(70,-38))}Q${P(m(68,-51))} ${P(m(56,-48))}`,
    get all(){return[this.head,...this.ears,this.body,this.tail];}};}
function runCat(cx,cy,s){const m=(a,b)=>[cx+(a-145)*s,cy+(b-165)*s];
  const bE=[cx,cy,70*s,30*s,-8],hc=m(228,135),hE=[hc[0],hc[1],30*s,30*s];
  const legs=[[215,188,50],[195,195,70],[85,190,-50],[105,195,-70]].map(([a,b,r])=>{const c=m(a,b);return visE([c[0],c[1],26*s,7*s,r],p=>inE(p,bE));});
  return{bE,hE,body:visE(bE,p=>inE(p,hE)),head:C(hc[0],hc[1],30*s),ears:[L(m(211,115),m(207,88),m(226,106)),L(m(233,106),m(247,84),m(253,117))],
    face:[C(...m(241,130),4.5*s),tri([m(253,138),m(258,138),m(256,143)]),L(m(247,142),m(287,136)),L(m(247,146),m(287,152))],legs,tail:`M${P(m(77,168))}Q${P(m(45,150))} ${P(m(15,156))}`};}
const lineAt=(x0,y0,vp)=>x=>y0+(x-x0)*(vp[1]-y0)/(vp[0]-x0);
const moonD=(cx,cy,r)=>`M${f(cx)} ${f(cy-r)}A${f(r)} ${f(r)} 0 0 0 ${f(cx)} ${f(cy+r)}A${f(r*1.3)} ${f(r*1.3)} 0 0 1 ${f(cx)} ${f(cy-r)}`;
