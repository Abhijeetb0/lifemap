// src/components/TreeView.jsx
const SC = { planned:'#94a3b8','in-progress':'#3b82f6', done:'#22c55e', overdue:'#ef4444' };

function sr(s,i){return Math.abs(Math.sin(s*127.1+i*311.7))*0.5+0.25;}

function blob(cx,cy,rx,ry,seed){
  const n=9,pts=[];
  for(let i=0;i<n;i++){const a=(i/n)*Math.PI*2-Math.PI/2,w=1+(sr(seed,i)-0.5)*0.28;pts.push([cx+Math.cos(a)*rx*w,cy+Math.sin(a)*ry*w]);}
  const mid=(p,q)=>[(p[0]+q[0])/2,(p[1]+q[1])/2];
  const d=[];
  for(let i=0;i<n;i++){const m1=mid(pts[(i-1+n)%n],pts[i]),m2=mid(pts[i],pts[(i+1)%n]);if(i===0)d.push(`M${m1[0].toFixed(1)},${m1[1].toFixed(1)}`);d.push(`Q${pts[i][0].toFixed(1)},${pts[i][1].toFixed(1)} ${m2[0].toFixed(1)},${m2[1].toFixed(1)}`);}
  return d.join(' ')+' Z';
}

function curve(x1,y1,x2,y2,seed){
  const dx=x2-x1,dy=y2-y1,len=Math.sqrt(dx*dx+dy*dy),j=Math.max(10,len*0.13);
  return `M${x1.toFixed(1)},${y1.toFixed(1)} C${(x1+dx*.32+(sr(seed,0)-.5)*j*1.5).toFixed(1)},${(y1+dy*.32+(sr(seed,1)-.5)*j*2).toFixed(1)} ${(x2-dx*.28+(sr(seed,2)-.5)*j*1.3).toFixed(1)},${(y2-dy*.28+(sr(seed,3)-.5)*j*1.3).toFixed(1)} ${x2.toFixed(1)},${y2.toFixed(1)}`;
}

export default function TreeView({ domains }) {
  if (!domains || domains.length === 0) {
    return (
      <div style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center',background:'#0e0e18',color:'#606070',fontSize:13,flexDirection:'column',gap:8}}>
        <div style={{fontSize:32}}>🌿</div>
        <div>List view mein domains aur goals add karo</div>
      </div>
    );
  }

  const LX=28,LW=70,LH=38,TY=250,HSPACE=185,VLEN=85,GVLEN=72,SVLEN=58,GHS=58,SHS=46;
  const lcx=LX+LW/2,tStart=LX+LW,tEnd=tStart+domains.length*HSPACE+40;
  const SVG_W=tEnd+55, SVG_H=TY+VLEN+GVLEN+SVLEN+70;

  const segs=14,tpts=[];
  for(let i=0;i<=segs;i++){tpts.push([tStart+(tEnd-tStart)*i/segs, TY+Math.sin(i*.75)*4+Math.sin(i*2.2+1)*1.8]);}
  let trD=`M${tpts[0][0].toFixed(1)},${tpts[0][1].toFixed(1)}`;
  for(let i=1;i<tpts.length;i++){const p=tpts[i-1],c=tpts[i],mx=(p[0]+c[0])/2,my=(p[1]+c[1])/2;trD+=` Q${p[0].toFixed(1)},${p[1].toFixed(1)} ${mx.toFixed(1)},${my.toFixed(1)}`;}
  trD+=` L${tpts[segs][0].toFixed(1)},${tpts[segs][1].toFixed(1)}`;

  const p=[];
  p.push(`<defs><radialGradient id="rg" cx="40%" cy="35%" r="58%"><stop offset="0%" stop-color="#5a8a40"/><stop offset="100%" stop-color="#1a2e10"/></radialGradient><filter id="gl"><feGaussianBlur stdDeviation="3.5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>`);
  p.push(`<rect width="${SVG_W}" height="${SVG_H}" fill="#0e0e18"/>`);
  p.push(`<path d="${trD}" fill="none" stroke="rgba(0,0,0,.3)" stroke-width="13" stroke-linecap="round"/>`);
  p.push(`<path d="${trD}" fill="none" stroke="#2a4a1a" stroke-width="11" stroke-linecap="round"/>`);
  p.push(`<path d="${trD}" fill="none" stroke="#3a6028" stroke-width="7" stroke-linecap="round" opacity=".75"/>`);
  for(let i=1;i<segs;i+=2){const[bx,by]=tpts[i],ang=Math.PI/2+(sr(i*3,8)-.5)*.5,bl=7+sr(i,9)*9;p.push(`<path d="M${(bx-bl*Math.cos(ang)).toFixed(1)},${(by-bl*Math.sin(ang)).toFixed(1)} Q${bx.toFixed(1)},${by.toFixed(1)} ${(bx+bl*Math.cos(ang)*.5).toFixed(1)},${(by+bl*Math.sin(ang)*.5).toFixed(1)}" fill="none" stroke="#1a3010" stroke-width=".9" opacity=".22"/>`);}
  p.push(`<path d="${curve(LX+LW,TY,tStart,TY,200)}" fill="none" stroke="#2a4a1a" stroke-width="9" stroke-linecap="round"/>`);
  p.push(`<path d="${blob(lcx,TY,LW/2+5,LH/2+5,1.1)}" fill="#111e08" opacity=".4" filter="url(#gl)"/>`);
  p.push(`<path d="${blob(lcx,TY,LW/2,LH/2,1)}" fill="url(#rg)" stroke="#5a9040" stroke-width="2"/>`);
  p.push(`<text x="${lcx}" y="${TY}" text-anchor="middle" dominant-baseline="middle" font-size="12" font-weight="700" fill="#b8f088" font-family="system-ui,sans-serif">🌿 LIFE</text>`);

  domains.forEach((d,di)=>{
    const jx=tStart+(di+.5)*HSPACE;
    const tidx=Math.min(Math.round((jx-tStart)/(tEnd-tStart)*segs),segs);
    const jy=tpts[tidx][1],dir=di%2===0?-1:1;
    const dcx=jx+(sr(di*3.7,5)-.5)*12,dcy=jy+dir*VLEN;
    const dw=Math.max(76,d.name.length*7.5+16),dh=27,ds=di*8.3+5;

    p.push(`<circle cx="${jx.toFixed(1)}" cy="${jy.toFixed(1)}" r="7" fill="${d.color}" opacity=".2"/>`);
    p.push(`<circle cx="${jx.toFixed(1)}" cy="${jy.toFixed(1)}" r="5" fill="${d.color}" opacity=".85"/>`);
    p.push(`<path d="${curve(jx,jy+dir*4,dcx,dcy-dir*(dh/2+2),ds)}" fill="none" stroke="rgba(0,0,0,.18)" stroke-width="6" stroke-linecap="round"/>`);
    p.push(`<path d="${curve(jx,jy+dir*4,dcx,dcy-dir*(dh/2+2),ds)}" fill="none" stroke="${d.color}" stroke-width="4.5" stroke-linecap="round" opacity=".72"/>`);
    p.push(`<path d="${blob(dcx,dcy,dw/2,dh/2,ds)}" fill="${d.color}" opacity=".84"/>`);
    p.push(`<text x="${dcx}" y="${dcy}" text-anchor="middle" dominant-baseline="middle" font-size="10.5" font-weight="700" fill="#fff" font-family="system-ui,sans-serif">${d.name.length>10?d.name.slice(0,9)+'…':d.name}</text>`);

    const roots=(d.items||[]).filter(i=>!i.parentId);
    roots.forEach((g,gi)=>{
      const offX=(gi-(roots.length-1)/2)*GHS;
      const gcx=dcx+offX,gcy=dcy+dir*GVLEN;
      const gn=g.name.length>13?g.name.slice(0,12)+'…':g.name;
      const gw=Math.max(60,gn.length*5.8+14),gh=21,gs=ds+gi*4+100;
      const gsc=SC[g.status]||'#94a3b8';
      p.push(`<path d="${curve(dcx,dcy+dir*(dh/2+1),gcx,gcy-dir*(gh/2+2),gs)}" fill="none" stroke="${d.color}" stroke-width="2.6" stroke-linecap="round" opacity=".6"/>`);
      p.push(`<path d="${blob(gcx,gcy,gw/2,gh/2,gs+.3)}" fill="#1e1e2c" stroke="${d.color}" stroke-width="1" stroke-opacity=".4"/>`);
      p.push(`<text x="${gcx}" y="${gcy}" text-anchor="middle" dominant-baseline="middle" font-size="9.5" fill="#c8c8e0" font-family="system-ui,sans-serif">${gn}</text>`);
      p.push(`<circle cx="${(gcx+gw/2-5).toFixed(1)}" cy="${(gcy-gh/2+5).toFixed(1)}" r="3" fill="${gsc}"/>`);
      if(g.imp)p.push(`<text x="${(gcx-gw/2+2).toFixed(1)}" y="${(gcy-gh/2).toFixed(1)}" dominant-baseline="hanging" font-size="8">⭐</text>`);

      const subs=(d.items||[]).filter(i=>i.parentId===g.id);
      subs.forEach((s,si)=>{
        const sx=gcx+(si-(subs.length-1)/2)*SHS,sy=gcy+dir*SVLEN;
        const sn=s.name.length>11?s.name.slice(0,10)+'…':s.name;
        const sw=Math.max(46,sn.length*5.4+10),sh=17,ssd=gs+si*2.7+200;
        p.push(`<path d="${curve(gcx,gcy+dir*(gh/2+1),sx,sy-dir*(sh/2+2),ssd)}" fill="none" stroke="${d.color}" stroke-width="1.5" stroke-linecap="round" opacity=".5"/>`);
        p.push(`<path d="${blob(sx,sy,sw/2,sh/2,ssd)}" fill="#19191f" stroke="${d.color}" stroke-width=".7" stroke-opacity=".3"/>`);
        p.push(`<text x="${sx}" y="${sy}" text-anchor="middle" dominant-baseline="middle" font-size="8.5" fill="#a8a8c0" font-family="system-ui,sans-serif">${sn}</text>`);
        p.push(`<circle cx="${(sx+sw/2-4).toFixed(1)}" cy="${(sy-sh/2+4).toFixed(1)}" r="2.5" fill="${SC[s.status]||'#94a3b8'}"/>`);
      });
    });
  });

  const leg=[['#94a3b8','Planned'],['#3b82f6','In Progress'],['#22c55e','Done'],['#ef4444','Overdue']];
  let lx=8;
  leg.forEach(([c,l])=>{p.push(`<circle cx="${lx+4}" cy="14" r="4" fill="${c}"/><text x="${lx+11}" y="15" dominant-baseline="middle" font-size="9" fill="#606070" font-family="system-ui,sans-serif">${l}</text>`);lx+=74;});

  const svg=`<svg width="${SVG_W}" height="${SVG_H}" xmlns="http://www.w3.org/2000/svg" style="display:block;min-width:${SVG_W}px">${p.join('')}</svg>`;

  return (
    <div style={{flex:1,overflow:'auto',padding:12,background:'#0e0e18'}}>
      <div style={{overflowX:'auto',borderRadius:8,border:'.5px solid #26262f'}} dangerouslySetInnerHTML={{__html:svg}}/>
      <div style={{fontSize:10,color:'#606070',marginTop:6}}>← scroll to explore → | Domains alternate upar-neeche</div>
    </div>
  );
}
