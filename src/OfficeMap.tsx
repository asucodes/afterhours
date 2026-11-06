import {useEffect,useRef,useState} from 'react';
import {Minus,Plus,Maximize2,MousePointer2,Focus,Map,SunMoon,ArrowUpRight} from 'lucide-react';
import {TEAM,type CaseRecord,type Role} from '../shared/types';
import assetData from './pixelAssets.json';
import {agentBehavior,actorDrawDepth} from './ambient';
import {WORLD_W,WORLD_H,ROOMS,WALLS,FURNITURE,HOTSPOTS,HOMES,WORK_TARGETS,findPath,roleState,type Destination,type Hotspot} from './officeWorld';
type Props={darkMode?:boolean;record?:CaseRecord;selected:Role;onSelect:(role:Role)=>void;onWorkspace:()=>void;onNavigate?:(destination:Destination)=>void};
type Actor={role:Role;x:number;y:number;tx:number;ty:number;path:[number,number][];direction:number;left:boolean};
const ASSETS=assetData as Record<string,{url:string;w:number;h:number}>;
export default function OfficeMap({darkMode=false,record,selected,onSelect,onWorkspace,onNavigate}:Props){
 const simulationTime=useRef(0);const wrap=useRef<HTMLDivElement>(null),canvas=useRef<HTMLCanvasElement>(null);const images=useRef<Record<string,HTMLImageElement>>({});
 const actors=useRef<Actor[]>(TEAM.map(t=>({role:t.id,x:HOMES[t.id][0],y:HOMES[t.id][1],tx:HOMES[t.id][0],ty:HOMES[t.id][1],path:[],direction:0,left:false})));
 const [zoom,setZoom]=useState(window.innerWidth<800?1.6:1),[follow,setFollow]=useState(false),[night,setNight]=useState(false),[hover,setHover]=useState<{title:string;description:string}|null>(null);
 const live=useRef({record,selected,zoom,follow,night:darkMode||night});live.current={record,selected,zoom,follow,night:darkMode||night};const viewport=useRef({w:800,h:600,dpr:1});const camera=useRef({panX:0,panY:0,x:0,y:0,scale:1});const drag=useRef({down:false,moved:false,x:0,y:0,startX:0,startY:0});
 useEffect(()=>{for(const [name,a]of Object.entries(ASSETS)){const i=new Image();i.src=a.url;images.current[name]=i;}},[]);
 useEffect(()=>{const box=wrap.current!,c=canvas.current!;const resize=()=>{const b=box.getBoundingClientRect(),dpr=window.devicePixelRatio||1;viewport.current={w:b.width,h:b.height,dpr};c.width=Math.round(b.width*dpr);c.height=Math.round(b.height*dpr);};resize();const ro=new ResizeObserver(resize);ro.observe(box);return()=>ro.disconnect();},[]);
 useEffect(()=>{
  const c=canvas.current!,ctx=c.getContext('2d')!;let raf=0,last=performance.now(),elapsed=0;
  const r=(x:number,y:number,w:number,h:number,color:string)=>{ctx.fillStyle=color;ctx.fillRect(Math.round(x),Math.round(y),w,h);};
  const text=(s:string,x:number,y:number,color='#dce4d6',size=7,weight='normal')=>{ctx.fillStyle=color;ctx.font=`${weight} ${size}px monospace`;ctx.fillText(s,x,y);};
  const asset=(key:string,x:number,y:number,flip=false)=>{const a=ASSETS[key],im=images.current[key];if(!a||!im?.complete||!im.naturalWidth)return;if(flip){ctx.save();ctx.translate(Math.round(x+a.w),Math.round(y));ctx.scale(-1,1);ctx.drawImage(im,0,0,a.w,a.h);ctx.restore();}else ctx.drawImage(im,Math.round(x),Math.round(y),a.w,a.h);};
  const board=(x:number,y:number,w:number,h:number)=>{r(x+2,y+3,w,h,'#998469');r(x,y,w,h,'#a98359');r(x+2,y+2,w-4,h-4,'#f4f1db');r(x+3,y+3,w-6,1,'#fffbe9');};
  const draw=(now:number)=>{const dt=Math.max(0,Math.min((now-last)/1000,.05));last=now;elapsed+=dt;simulationTime.current=elapsed;const {w,h,dpr}=viewport.current,{record:state,selected:sel,zoom:z,follow:f,night:n}=live.current;
   ctx.setTransform(dpr,0,0,dpr,0,0);ctx.fillStyle=n?'#0a0b0d':'#f5f6f8';ctx.fillRect(0,0,w,h);ctx.imageSmoothingEnabled=false;
   const scale=Math.min((w-32)/WORLD_W,(h-36)/WORLD_H)*z;
   if(f){const a=actors.current.find(a=>a.role===sel)!;camera.current.panX+=( (WORLD_W/2-a.x)*scale-camera.current.panX)*.08;camera.current.panY+=((WORLD_H/2-a.y)*scale-camera.current.panY)*.08;}
   const ox=Math.round((w-WORLD_W*scale)/2+camera.current.panX),oy=Math.round((h-WORLD_H*scale)/2+camera.current.panY+5);camera.current={...camera.current,x:ox,y:oy,scale};ctx.setTransform(dpr*scale,0,0,dpr*scale,dpr*ox,dpr*oy);
   // Exterior courtyard, tiled circulation, and authored six-room floor plan.
   r(8,12,752,508,n?'#45605b':'#b7cbbf');r(16,20,736,492,n?'#748e7a':'#d7d9bf');
   for(let y=32;y<512;y+=16)for(let x=24;x<744;x+=16){r(x,y,16,16,(x+y)%32?'#c0d1c7':'#c9d9ce');r(x,y+15,16,1,'#afc3b5');r(x+15,y,1,16,'#afc3b5');}
   for(const room of ROOMS){r(room.x,room.y,room.w,room.h,room.color);for(let y=room.y;y<room.y+room.h;y+=16)for(let x=room.x;x<room.x+room.w;x+=16){if(room.role==='scout'||room.role==='coordinator'){r(x,y,16,1,'#483e3428');r(x+15,y,1,16,'#423b3425');if((x/16+y/16)%3===0)r(x+3,y+8,9,1,'#cfb38b15');}else{r(x,y,16,16,(x/16+y/16)%2?'#ffffff06':'#00000004');r(x,y,16,1,'#36453112');}}}
   // Rugs make work areas legible without covering the floor plan in dashboards.
   for(const [x,y,rw,rh,color,border]of [[92,113,104,103,'#755640','#b59a6b'],[340,112,88,104,'#886350','#c5a47a'],[584,113,104,103,'#465669','#8da6bb'],[92,352,104,103,'#775657','#ba9290'],[312,342,120,100,'#506e65','#91b6a0'],[584,352,104,103,'#65516f','#b4a0bf']] as [number,number,number,number,string,string][]){r(x,y,rw,rh,border);r(x+2,y+2,rw-4,rh-4,color);r(x+5,y+5,rw-10,rh-10,'#0000000c');for(let i=8;i<rw-8;i+=8){r(x+i,y+3,3,1,border);r(x+i,y+rh-4,3,1,border);}}
   for(const wall of WALLS){r(wall.x+3,wall.y+4,wall.w,wall.h,'#97b2a4');r(wall.x,wall.y,wall.w,wall.h,'#dce5ce');r(wall.x,wall.y,wall.w,3,'#f9f6e6');if(wall.w<=8)r(wall.x,wall.y,2,wall.h,'#b5c6ad');}
   // Windows frame a night skyline along the northern edge.
   for(const room of ROOMS.filter(x=>x.y<250)){for(const x of [room.x+18,room.x+room.w-70]){r(x-3,room.y-23,54,22,'#283a43');r(x,room.y-22,48,17,'#233f5b');r(x+23,room.y-22,2,17,'#9b9e90');r(x,room.y-14,48,2,'#969d91');for(let k=0;k<7;k++){r(x+3+k*6,room.y-12-(k%3)*2,4,7+(k%3)*2,'#182b40');if(k%2)r(x+4+k*6,room.y-10-(k%3)*2,1,1,'#e3c889');}r(x-4,room.y-4,56,4,'#a39a7d');}}
   // Door sills and framed room signs.
   for(const room of ROOMS){const dx=room.x+room.w/2-16,dy=room.y<250?room.y+room.h:room.y-24;r(dx,dy,32,room.y<250?8:24,'#9c8766');r(dx,dy,32,2,'#cfb78a');r(dx,dy+(room.y<250?6:22),32,2,'#655d4d');const sy=room.y+room.h-15;r(room.x+8,sy-9,room.w-16,19,'#f7f3dfdf');text(room.title,room.x+17,sy,'#4e6258',7,'bold');text(room.subtitle,room.x+17,sy+7,'#7b8a78',5);}
   // Depth-sort physical furniture and coworkers together.
   const toDraw:{y:number;run:()=>void}[]=FURNITURE.map(item=>({y:item.y+(item.key.startsWith('SOFA_')?12:(ASSETS[item.key]?.h||32)),run:()=>asset(item.key.startsWith('PC_FRONT_ON')?`PC_FRONT_ON_${Math.floor(elapsed*2)%3+1}`:item.key,item.x,item.y,item.key==='SOFA_SIDE'&&item.x>380)}));
   const reduce=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
   for(const a of actors.current){const behavior=agentBehavior(state,a.role,elapsed,reduce);const active=behavior.mode==='working';const target=behavior.target;if(a.tx!==target[0]||a.ty!==target[1]){a.tx=target[0];a.ty=target[1];a.path=findPath(a.x,a.y,a.tx,a.ty);}
    let walking=a.path.length>0;if(reduce){a.x=a.tx;a.y=a.ty;a.path=[];walking=false;}else if(walking){const [px,py]=a.path[0],speed=dt*42;if(Math.abs(a.x-px)>speed){a.left=px<a.x;a.direction=2;a.x+=Math.sign(px-a.x)*speed;}else if(Math.abs(a.y-py)>speed){a.direction=py<a.y?1:0;a.y+=Math.sign(py-a.y)*speed;}else{a.x=px;a.y=py;a.path.shift();}}
    toDraw.push({y:actorDrawDepth(behavior,a.y,walking),run:()=>{const index=TEAM.findIndex(t=>t.id===a.role);const img=images.current[`char_${index}`];r(a.x-6,a.y-1,12,3,'#14212a70');if(a.role===sel){r(a.x-10,a.y+2,20,1,'#ebc78b');r(a.x-11,a.y-1,2,3,'#ebc78b');r(a.x+9,a.y-1,2,3,'#ebc78b');}
     const walkingFrame=[0,1,2,1][Math.floor(elapsed*6)%4],workingFrame=3+Math.floor(elapsed*2)%2,frame=walking?walkingFrame:active?workingFrame:behavior.animation==='read'?5+Math.floor(elapsed*1.2)%2:1;const direction=walking?a.direction:behavior.direction;
     if(img?.complete&&img.naturalWidth){ctx.save();if((walking?a.left:behavior.left)&&direction===2){ctx.translate(Math.round(a.x),Math.round(a.y));ctx.scale(-1,1);ctx.drawImage(img,frame*16,direction*32,16,32,-8,-29,16,32);}else ctx.drawImage(img,frame*16,direction*32,16,32,Math.round(a.x)-8,Math.round(a.y)-29,16,32);ctx.restore();}
     if(!walking&&behavior.animation==='coffee'){const sip=Math.floor(elapsed*.7)%3===0?2:0;r(a.x+5,a.y-11-sip,4,4,'#f5edd5');r(a.x+9,a.y-10-sip,1,2,'#e0cfa9');r(a.x+6,a.y-13-sip,1,1,'#cbded1');}
     const member=TEAM[index];const name=member.name.toUpperCase();const labelW=name.length*4+10;r(a.x-labelW/2,a.y+6,labelW,10,'#14232be8');text(name,a.x-labelW/2+5,a.y+13,a.role===sel?'#f0d5a6':'#d2e1d5',6,'bold');
     const blocked=behavior.mode==='attention';if(active||blocked){const bx=a.x-9,by=a.y-46;r(bx,by,19,11,blocked?'#e2b37b':'#e6e9d8');r(bx+8,by+11,3,3,blocked?'#e2b37b':'#e6e9d8');if(blocked)text('!',bx+8,by+8,'#4d3b2c',8,'bold');else for(let k=0;k<3;k++)r(bx+4+k*4,by+5-(Math.floor(elapsed*4)%3===k?1:0),2,2,'#48675b');}
    }});
   }
   // Each important room object is a live, clickable view onto the case.
   board(48,64,160,35);text('AGENCY SHORTLIST',56,75,'#4e7259',7,'bold');const candidates=state?.candidates.filter(c=>!c.rejected)||[];if(candidates.length){for(let i=0;i<3;i++){r(55+i*49,81,45,11,'#dfdbc0');text(candidates[i]?.name.slice(0,8)||'—',58+i*49,89,'#3b514b',5);}}else{text('Waiting for your mission',56,88,'#83998b',6);}
   board(312,62,144,42);text('MISSION CONTROL',320,74,'#886944',7,'bold');text(state?`BRIEF V${state.version} / ${state.status.replace('_',' ').toUpperCase()}`:'NO ACTIVE MISSION',320,86,'#6c785f',6);text(state?`${state.brief.deadline||'DATE OPEN'}  ${state.brief.budget||'BUDGET OPEN'}`:'Describe your launch to Asu',320,97,'#7c886e',5);
   board(548,60,160,42);text('EVIDENCE LIBRARY',556,73,'#52738b',7,'bold');text(`${state?.evidence.length||0} RECORDS / CRUSTDATA`,556,87,'#617f8e',6);text('Company + people + public web',556,96,'#74929a',5);
   board(48,301,160,42);text('REQUIREMENT CHECKS',56,314,'#986c66',7,'bold');const checks=state?.candidates.flatMap(c=>c.assessments)||[];text(`${checks.filter(a=>a.status==='supported').length} SUPPORTED`,56,329,'#548169',6);text(`${checks.filter(a=>a.status==='unknown').length} UNKNOWN`,132,329,'#a17e45',6);for(let i=0;i<5;i++)r(58+i*29,334,22,2,['#9eb89b','#c6b17f','#9eb89b','#c6b17f','#ad9292'][i]);
   board(552,301,152,42);text('DELIVERY QUEUE',560,314,'#7a6892',7,'bold');const docs=state?.artifacts.filter(a=>a.state==='current'&&a.version===state.version).length||0;text(`${docs} DOCUMENTS / ${state?.inbox.length||0} DELIVERIES`,560,328,'#83708f',6);text('Briefing  /  Quotes  /  Handover',560,337,'#8e8191',5);
   // The internal dispatch station and shared shift log.
   r(661,443,46,30,'#333d48');r(663,441,42,24,'#a0aaa2');r(669,446,30,7,'#304846');r(671,449,22,2,docs?'#b7cb91':'#667e73');r(670,459,27,13,'#ece7d0');r(674,462,19,1,'#a5b1a2');r(674,465,15,1,'#a5b1a2');r(674,468,17,1,'#a5b1a2');text('INTERNAL INBOX',657,484,'#c4c7b5',5);
   board(316,448,136,24);text('SHIFT LOG',324,459,'#587f62',7,'bold');text(`${state?.events.length||0} RECORDED EVENTS`,324,467,'#7b977c',5);
   toDraw.sort((a,b)=>a.y-b.y).forEach(x=>x.run());
   // Small authored details: lamps, route markers, pinned notes and a kitchen counter.
   for(const [x,y]of [[88,116],[584,116],[88,353],[584,353],[338,128]]){r(x+4,y+4,2,12,'#a49067');r(x,y,10,5,'#efd59e');r(x-3,y+5,16,1,'#eacb7b45');r(x+1,y+16,8,2,'#8c7b58');}
   r(280,312,32,8,'#d2c6a4');r(282,300,14,13,'#4a5356');r(284,302,10,4,'#80948b');r(286,309,6,4,'#f0e3c3');r(300,306,7,6,'#c4ac84');r(302,302,3,3,'#c6bda4');
   for(let k=0;k<9;k++){const x=280+k*16;r(x,254,7,1,'#c3bb9630');}for(const x of [48,224,544,720]){r(x,254,4,4,'#c4b992');r(x+1,255,2,2,'#e3d6a2');}
   if(n){r(16,20,736,492,'#0c1d3212');}
   ctx.setTransform(dpr,0,0,dpr,0,0);raf=requestAnimationFrame(draw);
  };raf=requestAnimationFrame(draw);return()=>cancelAnimationFrame(raf);
 },[]);
 function point(e:{clientX:number;clientY:number}){const b=canvas.current!.getBoundingClientRect(),c=camera.current;return {x:(e.clientX-b.left-c.x)/c.scale,y:(e.clientY-b.top-c.y)/c.scale};}
 function hit(e:{clientX:number;clientY:number}):{role?:Role;object?:Hotspot;title:string;description:string}|undefined {const p=point(e);const a=actors.current.find(a=>Math.abs(a.x-p.x)<13&&p.y>a.y-32&&p.y<a.y+15);if(a){const member=TEAM.find(t=>t.id===a.role)!;return {role:a.role,title:`${member.name} · ${member.title}`,description:(()=>{const b=agentBehavior(record,a.role,simulationTime.current,window.matchMedia('(prefers-reduced-motion: reduce)').matches);return b.mode==='idle'?`${b.label} · Available`:b.label;})()};}const object=HOTSPOTS.find(o=>p.x>=o.x&&p.x<o.x+o.w&&p.y>=o.y&&p.y<o.y+o.h);if(object)return {object,title:object.title,description:object.description};return undefined;}
 function fit(){setZoom(1);setFollow(false);camera.current.panX=0;camera.current.panY=0;}
 return <div className="world-viewport" ref={wrap}>
  <canvas ref={canvas} aria-label="AfterHours headquarters. Six furnished rooms connected by corridors. Drag to pan, use zoom controls, and select coworkers or room boards." tabIndex={0} onKeyDown={e=>{if(e.key==='+'||e.key==='=')setZoom(z=>Math.min(z+.2,2.5));if(e.key==='-')setZoom(z=>Math.max(.6,z-.2));if(e.key.toLowerCase()==='f')fit();}} onPointerDown={e=>{drag.current={down:true,moved:false,x:e.clientX,y:e.clientY,startX:camera.current.panX,startY:camera.current.panY};e.currentTarget.setPointerCapture(e.pointerId);}} onPointerMove={e=>{const d=drag.current;if(d.down&&Math.hypot(e.clientX-d.x,e.clientY-d.y)>4){d.moved=true;setFollow(false);camera.current.panX=d.startX+e.clientX-d.x;camera.current.panY=d.startY+e.clientY-d.y;setHover(null);}else if(!d.down)setHover(hit(e)||null);}} onPointerUp={e=>{if(!drag.current.moved){const target=hit(e);if(target?.role)onSelect(target.role);else if(target?.object){onNavigate?onNavigate(target.object.destination):onWorkspace();}}drag.current.down=false;}} onPointerCancel={()=>{drag.current.down=false;}} onPointerLeave={()=>setHover(null)} onWheel={e=>{if(e.ctrlKey){e.preventDefault();setZoom(z=>Math.max(.6,Math.min(2.5,z-e.deltaY*.003)));}}} style={{cursor:drag.current.down?'grabbing':hover?'pointer':'grab'}}/>
  <div className="world-location"><span className="world-location-icon"><Map size={15}/></span><div><strong>AfterHours HQ</strong><span>Floor 01 / Launch operations</span></div></div>
  <div className="world-help"><MousePointer2 size={12}/> Drag to explore <span>·</span> Click to inspect</div>
  {hover&&<div className="world-tooltip"><strong>{hover.title}<ArrowUpRight size={12}/></strong><span>{hover.description}</span></div>}
  <div className="camera-controls"><button title="Zoom out" onClick={()=>setZoom(z=>Math.max(.6,z-.2))}><Minus size={15}/></button><span>{Math.round(zoom*100)}%</span><button title="Zoom in" onClick={()=>setZoom(z=>Math.min(2.5,z+.2))}><Plus size={15}/></button><i/><button title="Fit headquarters (F)" onClick={fit}><Maximize2 size={14}/></button><button title="Follow selected coworker" className={follow?'active':''} onClick={()=>setFollow(!follow)}><Focus size={15}/></button><button title="Toggle night lighting" className={night?'active':''} onClick={()=>setNight(!night)}><SunMoon size={15}/></button></div>
  <div className="world-minimap" aria-label="Office overview">{ROOMS.map(room=><button key={room.title} title={room.title} style={{left:`${room.x/WORLD_W*100}%`,top:`${room.y/WORLD_H*100}%`,width:`${room.w/WORLD_W*100}%`,height:`${room.h/WORLD_H*100}%`,background:room.color}} onClick={()=>{if(room.role)onSelect(room.role);else onNavigate?.("activity");}}>{room.role&&<i style={{background:room.accent}}/>}</button>)}</div>
 </div>;
}
