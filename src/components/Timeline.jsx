// src/components/Timeline.jsx
const SC = { planned:'#94a3b8','in-progress':'#3b82f6', done:'#22c55e', overdue:'#ef4444' };

export default function Timeline({ domains }) {
  const items = [];
  domains.forEach(d => {
    (d.items||[]).forEach(i => {
      if(i.tl && i.deadline) items.push({...i, domainName:d.name, color:d.color});
    });
  });
  items.sort((a,b) => new Date(a.deadline) - new Date(b.deadline));

  if(items.length === 0) return (
    <div style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center',background:'#0d0d12',color:'#606070',flexDirection:'column',gap:8}}>
      <div style={{fontSize:28}}>📅</div>
      <div style={{fontSize:13}}>Koi timeline item nahi</div>
      <div style={{fontSize:11}}>List view mein goals pe click karo → Timeline toggle on karo</div>
    </div>
  );

  const now = new Date();
  const W=700, pad=50, TY=120;
  const mn = new Date(Math.min(now.getTime(), new Date(items[0].deadline+'T00:00:00').getTime()) - 864e5*20);
  const mx = new Date(new Date(items[items.length-1].deadline+'T00:00:00').getTime() + 864e5*20);
  const rng = mx - mn;
  const px = d => pad + (d - mn) / rng * (W - pad*2);

  const axC='#2c2c38', txC='#44445a';
  const nowX = px(now);
  const tks=[];
  const ms = new Date(mn.getFullYear(), mn.getMonth(), 1);
  for(let d=new Date(ms); d<=mx; d.setMonth(d.getMonth()+1)){
    const x=px(d); if(x<pad-5||x>W-pad+5) continue;
    const isY=d.getMonth()===0;
    tks.push(`<line x1="${x}" y1="${TY-16}" x2="${x}" y2="${TY+4}" stroke="${axC}" stroke-width="${isY?1.5:.6}" stroke-dasharray="${isY?'':'3,3'}"/>`);
    tks.push(`<text x="${x}" y="${TY+18}" text-anchor="middle" font-size="${isY?10:8}" fill="${txC}" font-weight="${isY?600:400}" font-family="system-ui">${isY?String(d.getFullYear()):d.toLocaleDateString('en-IN',{month:'short'})}</text>`);
  }
  const dots = items.map((item,i) => {
    const x=px(new Date(item.deadline+'T00:00:00')), isPast=new Date(item.deadline+'T00:00:00')<now;
    const ab=i%2===0, ly=ab?TY-15:TY+15, lbY=ab?TY-26:TY+31;
    const sn=item.name.length>10?item.name.slice(0,9)+'…':item.name;
    return `<g>
      <circle cx="${x}" cy="${TY}" r="14" fill="${item.color}" opacity=".07"/>
      <line x1="${x}" y1="${TY}" x2="${x}" y2="${ly}" stroke="${item.color}" stroke-width="1.3" opacity=".4"/>
      <circle cx="${x}" cy="${TY}" r="${isPast?5.5:7}" fill="${item.color}" opacity="${isPast?.3:.85}"/>
      <circle cx="${x}" cy="${TY}" r="${isPast?3:4}" fill="${SC[item.status]||item.color}"/>
      ${item.imp?`<text x="${x+8}" y="${TY-4}" font-size="8">⭐</text>`:''}
      <text x="${x}" y="${lbY}" text-anchor="middle" font-size="9" fill="#888" font-family="system-ui">${sn}</text>
    </g>`;
  }).join('');

  const svg = `<svg width="${W}" height="180" xmlns="http://www.w3.org/2000/svg" style="display:block;min-width:${W}px;overflow:visible">
    <line x1="${pad}" y1="${TY}" x2="${W-pad}" y2="${TY}" stroke="${axC}" stroke-width="2.5" stroke-linecap="round"/>
    ${tks.join('')}
    <line x1="${nowX}" y1="${TY-28}" x2="${nowX}" y2="${TY+8}" stroke="#ef4444" stroke-width="1.5" stroke-dasharray="3,2" opacity=".8"/>
    <polygon points="${nowX-5},${TY-28} ${nowX+5},${TY-28} ${nowX},${TY-20}" fill="#ef4444" opacity=".8"/>
    <text x="${nowX}" y="${TY+26}" text-anchor="middle" font-size="9" fill="#ef4444" font-weight="700" font-family="system-ui">TODAY</text>
    ${dots}
  </svg>`;

  return (
    <div style={{flex:1,overflowY:'auto',padding:16,background:'#0d0d12'}}>
      <div style={{fontSize:13,fontWeight:500,marginBottom:16,color:'#e2e2ee'}}>📅 Timeline</div>
      <div style={{overflowX:'auto',background:'#141419',borderRadius:10,border:'.5px solid #26262f',padding:'12px 8px'}}
        dangerouslySetInnerHTML={{__html:svg}}/>
      <div style={{marginTop:20,display:'flex',flexDirection:'column',gap:6}}>
        {items.map(item=>(
          <div key={item.id} style={{display:'flex',alignItems:'center',gap:10,padding:'8px 12px',background:'#141419',borderRadius:8,border:'.5px solid #26262f'}}>
            <div style={{width:8,height:8,borderRadius:'50%',background:item.color,flexShrink:0}}/>
            <span style={{fontSize:13,flex:1,color:'#e2e2ee'}}>{item.name}</span>
            <span style={{fontSize:11,color:'#606070'}}>{item.domainName}</span>
            <span style={{fontSize:11,color:new Date(item.deadline+'T00:00:00')<now?'#ef4444':'#606070'}}>
              {new Date(item.deadline+'T00:00:00').toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'2-digit'})}
            </span>
            <div style={{width:7,height:7,borderRadius:'50%',background:SC[item.status]||'#777',flexShrink:0}}/>
          </div>
        ))}
      </div>
    </div>
  );
}
