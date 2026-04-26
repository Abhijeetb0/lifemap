import { useState } from 'react';
import { useDomains } from '../hooks/useDomains';
import { useAuth } from '../hooks/useAuth';
import TreeView from '../components/TreeView';
import Timeline from '../components/Timeline';

const COLORS = ['#22c55e','#3b82f6','#f59e0b','#a855f7','#f87171'];
const SC = { planned:'#94a3b8','in-progress':'#3b82f6', done:'#22c55e', overdue:'#ef4444' };
const SL = { planned:'Planned','in-progress':'In Progress', done:'Done', overdue:'Overdue' };

function GoalItem({ item, domId, allItems, depth=0, ops }) {
  const [open, setOpen] = useState(false);
  const children = (allItems||[]).filter(i => i.parentId === item.id);
  const statuses = ['planned','in-progress','done','overdue'];
  return (
    <div style={{ marginLeft: depth*14 }}>
      <div style={{ display:'flex',alignItems:'center',gap:6,padding:'6px 10px',marginBottom:2,background:'#19191f',borderRadius:8,border:'.5px solid #26262f',cursor:'pointer' }}
        onClick={() => setOpen(o=>!o)}>
        <span style={{ fontSize:10,color:'#606070',width:14,textAlign:'center',flexShrink:0 }}>
          {children.length>0?(open?'▾':'▸'):'·'}
        </span>
        <span style={{ flex:1,fontSize:13,color:'#e2e2ee' }}>{item.name}</span>
        {item.imp && <span style={{ fontSize:11 }}>⭐</span>}
        {item.tl && <span style={{ fontSize:10,color:'#6366f1' }}>📌</span>}
        {item.deadline && (
          <span style={{ fontSize:11,color:new Date(item.deadline+'T00:00:00')<new Date()?'#ef4444':'#606070' }}>
            {new Date(item.deadline+'T00:00:00').toLocaleDateString('en-IN',{day:'numeric',month:'short'})}
          </span>
        )}
        <button onClick={e=>{ e.stopPropagation(); const i=statuses.indexOf(item.status); ops.upd(item.id,'status',statuses[(i+1)%4]); }}
          style={{ fontSize:10,padding:'2px 7px',borderRadius:4,border:'none',cursor:'pointer',
            background:item.status==='done'?'#14532d':item.status==='in-progress'?'#1e3a5f':'#212128',
            color:SC[item.status]||'#777' }}>
          {SL[item.status]}
        </button>
        <button onClick={e=>{ e.stopPropagation(); ops.addSub(item.id); }}
          style={{ fontSize:13,background:'none',border:'none',color:'#606070',cursor:'pointer',padding:'0 4px' }}>+</button>
        <button onClick={e=>{ e.stopPropagation(); if(window.confirm('Delete?')) ops.del(item.id); }}
          style={{ fontSize:12,background:'none',border:'none',color:'#ef4444',cursor:'pointer',padding:'0 4px' }}>✕</button>
      </div>
      {open && (
        <div style={{ display:'flex',flexWrap:'wrap',gap:10,padding:'5px 10px 8px 40px',marginBottom:3,background:'#141419',borderRadius:6,alignItems:'center' }}>
          <div style={{ display:'flex',alignItems:'center',gap:6,fontSize:11,color:'#606070' }}>
            <span>📅</span>
            <input type="date" value={item.deadline||''} onChange={e=>ops.upd(item.id,'deadline',e.target.value)}
              style={{ background:'#212128',border:'.5px solid #26262f',borderRadius:5,color:'#e2e2ee',fontSize:11,padding:'2px 6px',fontFamily:'inherit' }}/>
          </div>
          {[['imp','#f59e0b','⭐ Important'],['tl','#6366f1','📌 Timeline'],['reminder','#3b82f6','🔔 Reminder']].map(([f,c,l])=>(
            <label key={f} style={{ display:'flex',alignItems:'center',gap:5,fontSize:11,color:'#606070',cursor:'pointer' }}
              onClick={()=>ops.upd(item.id,f,!item[f])}>
              <div style={{ width:26,height:14,borderRadius:7,background:item[f]?c:'#2a2a34',position:'relative',transition:'background .2s',flexShrink:0 }}>
                <div style={{ position:'absolute',top:2,left:item[f]?14:2,width:10,height:10,borderRadius:'50%',background:'#fff',transition:'left .2s' }}/>
              </div>
              {l}
            </label>
          ))}
        </div>
      )}
      {open && children.map(c=>(
        <GoalItem key={c.id} item={c} domId={domId} allItems={allItems} depth={depth+1} ops={ops}/>
      ))}
    </div>
  );
}

export default function App({ user }) {
  const { logout } = useAuth();
  const { domains, loading, addDomain, addItem, updateItem, deleteItem } = useDomains(user.uid);
  const [selectedDomId, setSelectedDomId] = useState(null);
  const [view, setView] = useState('list');

  if (loading) return (
    <div style={{ display:'flex',alignItems:'center',justifyContent:'center',height:'100vh',background:'#0d0d12',color:'#e2e2ee',flexDirection:'column',gap:12 }}>
      <div style={{ fontSize:32 }}>🌿</div>
      <div style={{ fontSize:14,color:'#606070' }}>Loading...</div>
    </div>
  );

  const selectedDomain = domains.find(d=>d.id===selectedDomId)||domains[0]||null;
  const rootItems = (selectedDomain?.items||[]).filter(i=>!i.parentId);

  const ops = {
    upd: (itemId,field,val) => updateItem(selectedDomain.id, itemId, {[field]:val}),
    del: (itemId) => deleteItem(selectedDomain.id, itemId),
    addSub: async (parentId) => {
      const name = prompt('Subtask name?');
      if (name) await addItem(selectedDomain.id, { name, status:'planned', parentId });
    },
  };

  return (
    <div style={{ fontFamily:'system-ui,sans-serif',height:'100vh',display:'flex',flexDirection:'column',background:'#0d0d12',color:'#e2e2ee' }}>
      <div style={{ display:'flex',alignItems:'center',padding:'8px 16px',background:'#141419',borderBottom:'.5px solid #26262f',gap:10,flexShrink:0 }}>
        <span style={{ fontSize:15,fontWeight:600 }}>🌿 Life<span style={{ opacity:.28,fontWeight:400 }}>Map</span></span>
        <div style={{ display:'flex',background:'#212128',borderRadius:7,padding:2,gap:2 }}>
          {['list','tree','timeline'].map(v=>(
            <button key={v} onClick={()=>setView(v)}
              style={{ padding:'3px 10px',borderRadius:5,border:'none',cursor:'pointer',fontSize:12,fontFamily:'inherit',
                background:view===v?'#2a2a34':'transparent',color:view===v?'#e2e2ee':'#606070' }}>
              {v==='list'?'☰ List':v==='tree'?'⎇ Tree':'📅 Timeline'}
            </button>
          ))}
        </div>
        <div style={{ marginLeft:'auto',display:'flex',gap:8,alignItems:'center' }}>
          <span style={{ fontSize:12,color:'#606070' }}>{user.displayName}</span>
          <img src={user.photoURL} width={26} height={26} style={{ borderRadius:'50%' }} alt=""/>
          <button onClick={logout} style={{ fontSize:11,color:'#606070',background:'none',border:'none',cursor:'pointer' }}>Logout</button>
        </div>
      </div>

      <div style={{ display:'flex',flex:1,overflow:'hidden' }}>
        {view==='list' && (
          <div style={{ width:175,background:'#141419',borderRight:'.5px solid #26262f',display:'flex',flexDirection:'column',flexShrink:0,overflowY:'auto' }}>
            <div style={{ padding:'10px 12px 5px',fontSize:10,fontWeight:600,color:'#606070',letterSpacing:'.7px' }}>DOMAINS</div>
            {domains.map(d=>(
              <div key={d.id} onClick={()=>setSelectedDomId(d.id)}
                style={{ display:'flex',alignItems:'center',gap:7,padding:'6px 10px',cursor:'pointer',background:selectedDomain?.id===d.id?'#19191f':'transparent' }}>
                <div style={{ width:8,height:8,borderRadius:'50%',background:d.color,flexShrink:0 }}/>
                <span style={{ fontSize:13,flex:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{d.name}</span>
              </div>
            ))}
            <button onClick={async()=>{ const name=prompt('Domain name?'); if(name) await addDomain({name,color:COLORS[domains.length%COLORS.length]}); }}
              style={{ margin:'6px 10px',padding:6,background:'none',border:'.5px dashed #26262f',borderRadius:6,color:'#606070',cursor:'pointer',fontSize:12 }}>
              + Add domain
            </button>
          </div>
        )}

        {view==='timeline' ? (
          <Timeline domains={domains}/>
        ) : view==='tree' ? (
          <TreeView domains={domains}/>
        ) : (
          <div style={{ flex:1,overflowY:'auto',padding:16 }}>
            {!selectedDomain ? (
              <div style={{ color:'#606070',fontSize:13,textAlign:'center',marginTop:60 }}>← Domain add karo ya select karo</div>
            ) : (
              <>
                <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:14 }}>
                  <div style={{ display:'flex',alignItems:'center',gap:8 }}>
                    <div style={{ width:10,height:10,borderRadius:'50%',background:selectedDomain.color }}/>
                    <span style={{ fontSize:15,fontWeight:500 }}>{selectedDomain.name}</span>
                    <span style={{ fontSize:12,color:'#606070' }}>({rootItems.length} goals)</span>
                  </div>
                  <button onClick={async()=>{ const name=prompt('Goal name?'); if(name) await addItem(selectedDomain.id,{name,status:'planned',parentId:null,imp:false,tl:false,reminder:false,deadline:''}); }}
                    style={{ padding:'5px 14px',background:'#212128',border:'.5px solid #26262f',borderRadius:6,color:'#e2e2ee',cursor:'pointer',fontSize:12 }}>
                    + Add goal
                  </button>
                </div>
                {rootItems.length===0 ? (
                  <div style={{ color:'#606070',fontSize:13,textAlign:'center',marginTop:48 }}>
                    <div style={{ fontSize:32,marginBottom:8 }}>🎯</div>
                    No goals yet — "+ Add goal" se shuru karo
                  </div>
                ) : (
                  <div style={{ display:'flex',flexDirection:'column',gap:2 }}>
                    {rootItems.map(item=>(
                      <GoalItem key={item.id} item={item} domId={selectedDomain.id}
                        allItems={selectedDomain.items||[]} depth={0} ops={ops}/>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
