const $=id=>document.getElementById(id),root=$("stage");
const canvas=document.createElement("canvas"),ctx=canvas.getContext("2d");root.appendChild(canvas);
let W=0,H=0,D=1,frame=0,scene=0,shake=0,particles=[],lastCaption="";
const C={ink:"#263c45",navy:"#172d3b",blue:"#6e8991",blue2:"#91a5a3",paper:"#e9e2d2",gold:"#d9bd7e",skin:"#a16f57",hair:"#28252b",red:"#a9584e",hill:"#70877c"};
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v)),mix=(a,b,t)=>a+(b-a)*t,ease=t=>{t=clamp(t);return t*t*(3-2*t)};
function resize(){D=Math.min(devicePixelRatio||1,1.6);W=innerWidth;H=innerHeight;canvas.width=W*D;canvas.height=H*D;ctx.setTransform(D,0,0,D,0,0);}
addEventListener("resize",resize);resize();
function poly(p,fill,stroke=C.ink,lw=2){ctx.beginPath();p.forEach((v,i)=>i?ctx.lineTo(v[0],v[1]):ctx.moveTo(v[0],v[1]));ctx.closePath();ctx.fillStyle=fill;ctx.fill();if(stroke){ctx.lineWidth=lw;ctx.strokeStyle=stroke;ctx.stroke();}}
function rect(x,y,w,h,c){ctx.fillStyle=c;ctx.fillRect(x,y,w,h);}
function ellipse(x,y,rx,ry,c,stroke=C.ink,lw=2){ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2);ctx.fillStyle=c;ctx.fill();if(stroke){ctx.lineWidth=lw;ctx.strokeStyle=stroke;ctx.stroke();}}
function line(x,y,X,Y,c=C.ink,lw=3){ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(X,Y);ctx.strokeStyle=c;ctx.lineWidth=lw;ctx.lineCap="round";ctx.stroke();}
function shadow(){ctx.shadowColor="rgba(10,25,31,.28)";ctx.shadowBlur=0;ctx.shadowOffsetX=6;ctx.shadowOffsetY=7;}
function unshadow(){ctx.shadowColor="transparent";ctx.shadowBlur=0;ctx.shadowOffsetX=0;ctx.shadowOffsetY=0;}
function cut(p,c){shadow();poly(p,c);unshadow();}
function text(s,x,y,size,c="#fff",align="center",font="Georgia"){ctx.font=size+"px "+font;ctx.textAlign=align;ctx.fillStyle=c;ctx.fillText(s,x,y);}
function say(who,words){const cap=$("caption");$("speaker").textContent=who;$("words").textContent=words;cap.style.opacity=1;if(window.speechSynthesis){speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(words);u.rate=who==="MARA"?.96:who==="CHILD"?.88:.9;u.pitch=who==="MARA"?1.0:who==="CHILD"?1.38:.78;u.volume=.95;const voices=speechSynthesis.getVoices();let v=who==="CHILD"?voices.find(x=>/female|samantha|aria|jenny/i.test(x.name)):who==="MARA"?voices.find(x=>/female|zira|samantha|aria/i.test(x.name)):voices.find(x=>/male|david|mark|daniel/i.test(x.name));if(v)u.voice=v;speechSynthesis.speak(u);}}
function hush(){ $("caption").style.opacity=0; if(window.speechSynthesis)speechSynthesis.cancel();}
function burst(x,y,n=30,speed=7){for(let i=0;i<n;i++){let a=Math.random()*Math.PI*2,v=(.3+Math.random())*speed;particles.push({x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v,life:35+Math.random()*45,r:2+Math.random()*5,rot:Math.random()*6,spin:(Math.random()-.5)*.3});}}
function drawParticles(){for(let i=particles.length-1;i>=0;i--){let p=particles[i];p.x+=p.vx;p.y+=p.vy;p.vy+=.12;p.vx*=.99;p.life--;p.rot+=p.spin;ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.rot);rect(-p.r,-p.r,p.r*2,p.r*2,p.life%2?C.paper:C.gold);ctx.restore();if(p.life<=0)particles.splice(i,1);}}
function paperSky(time,mood=0){let g=ctx.createLinearGradient(0,0,0,H);g.addColorStop(0,mood?"#536c78":"#a8c0bb");g.addColorStop(.58,mood?"#9a8c80":"#e5d9c2");g.addColorStop(1,"#c2b69e");rect(0,0,W,H,g);for(let i=0;i<6;i++){let x=((i*W/4-time*.42)%(W+240)+W+240)%(W+240)-120,y=H*(.12+(i%3)*.09);cut([[x-58,y+10],[x-33,y-13],[x-4,y-9],[x+14,y-31],[x+49,y-15],[x+64,y+9],[x+26,y+22],[x-42,y+21]],"#eee9dc");}
 for(let l=0;l<3;l++){let base=H*(.47+l*.075);ctx.beginPath();ctx.moveTo(0,H);for(let x=0;x<=W+20;x+=35){let y=base+Math.sin((x+time*(.22+l*.11))/100+l*2)*H*.022;ctx.lineTo(x,y);}ctx.lineTo(W,H);ctx.closePath();ctx.fillStyle=["#91a59a","#728a7e","#526e67"][l];ctx.fill();}}
function drawHangar(time){let x=W*.07-time*.08,y=H*.35,w=W*.43,h=H*.4;cut([[x,y+h],[x,y+h*.25],[x+w*.2,y],[x+w,y+h*.12],[x+w,y+h],[x+w*.86,y+h]],"#d8d3c2");poly([[x,y+h*.25],[x+w*.2,y],[x+w*.2,y+h*.8],[x,y+h]],"#b6b8ae");rect(x+w*.26,y+h*.4,w*.61,h*.6,"#425a63");for(let i=0;i<5;i++)line(x+w*(.3+i*.12),y+h*.42,x+w*(.3+i*.12),y+h,"#c9c7b8",2);for(let i=0;i<3;i++){let lx=x+w*(.35+i*.2);line(lx,y+10,lx,y-28,C.gold,3);ellipse(lx,y-30,5,5,"#ffe5a4",null);}}
function drawCity(time,collapse=0){let base=H*.72;for(let i=0;i<12;i++){let x=i*W/10-(time*.5%W),ww=55+(i%4)*18,hh=80+(i*37%170);let fold=collapse* Math.sin(i*3+time*.08)*65;ctx.save();ctx.translate(x,base);ctx.rotate(collapse*(i%2?-.16:.18));cut([[-ww/2,0],[-ww/2,-hh+fold],[0,-hh-18+fold],[ww/2,-hh+fold],[ww/2,0]],i%2?"#c9c2ae":"#d9d0bb");for(let wy=-hh+24;wy<-10;wy+=28)for(let wx=-ww/2+13;wx<ww/2-5;wx+=22)rect(wx,wy,8,12,i%3?"#758d8d":"#e5c98c");ctx.restore();}}
function drawMara(x,y,s=1,pose="stand",angle=0){ctx.save();ctx.translate(x,y);ctx.rotate(angle);ctx.scale(s,s);let run=pose==="run"?Math.sin(frame*.27)*.65:pose==="fall"?-.9:0;
 // boots + jointed legs
 ctx.save();ctx.rotate(run);cut([[-21,-7],[-4,-7],[-8,-80],[-27,-78]],"#263d49");cut([[-31,-4],[-3,-4],[-4,5],[-35,5]],"#1c2c35");ctx.restore();
 ctx.save();ctx.translate(8,-5);ctx.rotate(-run*.85);cut([[-8,-8],[12,-8],[25,-78],[7,-81]],"#314957");cut([[8,-4],[37,-4],[43,5],[9,5]],"#1c2c35");ctx.restore();
 // torso and flight jacket
 cut([[-35,-218],[31,-218],[40,-82],[23,-63],[-26,-63],[-43,-83]],C.blue);
 poly([[-35,-218],[-3,-208],[-7,-65],[-26,-63],[-43,-83]],"#526f7b");
 poly([[31,-218],[5,-207],[7,-65],[23,-63],[40,-82]],"#8ca1a0");
 line(-19,-193,20,-193,C.gold,4);rect(-5,-186,10,29,C.gold);
 // arms swing independently
 ctx.save();ctx.translate(-31,-204);ctx.rotate(pose==="run"?-run-.5:pose==="reach"?-.95:.18);cut([[-8,-8],[-23,0],[-36,59],[-22,68],[-3,20]],"#607d88");ellipse(-29,68,8,10,C.skin);ctx.restore();
 ctx.save();ctx.translate(31,-204);ctx.rotate(pose==="run"?run+.5:pose==="reach"?-1.1:-.2);cut([[8,-8],[23,0],[36,59],[22,68],[3,20]],"#81999b");ellipse(29,68,8,10,C.skin);ctx.restore();
 rect(-9,-247,18,31,C.skin);
 cut([[-28,-294],[-22,-324],[0,-339],[24,-325],[31,-296],[26,-254],[8,-237],[-15,-244],[-29,-264]],C.skin);
 cut([[-32,-295],[-29,-330],[-7,-352],[22,-344],[39,-315],[30,-278],[19,-304],[-6,-309],[-22,-280]],C.hair);
 poly([[-26,-291],[-36,-271],[-31,-238],[-20,-229],[-17,-273]],"#29252b");
 ellipse(-10,-289,2.6,3,"#27272a",null);ellipse(11,-289,2.6,3,"#27272a",null);line(-5,-265,5,-264,"#704a43",1.5);
 poly([[-22,-205],[-8,-205],[-8,-190],[-22,-190]],C.paper);text("CT",-15,-194,8,C.ink,"center","Arial");
 ctx.restore();}
function drawPlane(x,y,s=1,rot=0){ctx.save();ctx.translate(x,y);ctx.rotate(rot);ctx.scale(s,s);cut([[-180,-28],[-138,-49],[122,-49],[184,-26],[144,-8],[-148,-8]],"#eeeadd");poly([[-33,-47],[17,-137],[39,-137],[18,-47]],"#c9c8ba");poly([[-30,-8],[19,52],[42,52],[16,-8]],"#b8b9ae");poly([[-160,-30],[-189,-64],[-174,-70],[-128,-39]],"#d7d2c5");ellipse(-183,-35,7,7,C.gold,null);ctx.restore();}
function drawChild(x,y,s=1){ctx.save();ctx.translate(x,y);ctx.scale(s,s);cut([[-18,-7],[-3,-7],[-5,-48],[-20,-48]],"#6b6d73");cut([[4,-7],[19,-7],[22,-48],[8,-48]],"#555c68");cut([[-24,-95],[24,-95],[28,-48],[-27,-48]],"#c06f62");ellipse(0,-116,21,24,C.skin);cut([[-23,-119],[-20,-143],[2,-151],[24,-132],[18,-113],[9,-131],[-10,-129]],"#3a2a28");ctx.restore();}
function shotAirfield(time){paperSky(time);drawHangar(time);rect(0,H*.73,W,H*.27,"#737e78");for(let i=0;i<8;i++){let x=(i*190-time*.6)%(W+100);rect(x,H*.82,70,6,"#e9e0c8");}drawPlane(W*.68,H*.73,.82);drawMara(W*.36,H*.79,Math.min(1.12,H/690),"stand");drawChild(W*.18,H*.77,.72);text("KIJANI AIRFIELD",W-28,H-24,10,"#f3ead7","right","Arial");}
function shotTakeoff(time){paperSky(time);drawHangar(time);drawCity(time*.3,0);let p=clamp((time-260)/230);drawPlane(mix(W*.68,W*.53,ease(p)),mix(H*.72,H*.2,ease(p)),mix(.82,.53,p),-.2-p*.1);drawMara(W*.35,H*.79,Math.min(1.08,H/690),"reach");for(let i=0;i<18;i++){let x=(i*90-time*3)%(W+40);line(x,H*.68,x-45,H*.69,"#f7f0dd",1.5);} }
function shotStorm(time){paperSky(time,1);drawCity(time*.6,.3);let shakeX=Math.sin(frame*.8)*12;drawPlane(W*.5+shakeX,H*.44+Math.sin(frame*.4)*16,.95,Math.sin(frame*.5)*.1);drawMara(W*.5,H*.74,Math.min(1.2,H/620),"reach",Math.sin(frame*.6)*.08);for(let i=0;i<35;i++){let x=(i*77+frame*9)%(W+60)-30,y=(i*43+frame*13)%(H+30)-15;line(x,y,x-45,y+10,"#e9e5d8",1.3);} }
function shotImpossible(time){paperSky(time,1);drawCity(time,.95);let p=clamp((time-740)/150);drawPlane(mix(W*1.1,W*.36,ease(p)),mix(-H*.3,H*.54,ease(p)),1.1,.32+Math.sin(frame*.09)*.06);for(let i=0;i<60;i++){let x=(i*71+frame*3)%(W+20),y=(i*37-frame*5)%(H+20);ctx.save();ctx.translate(x,y);ctx.rotate(frame*.03+i);rect(-8,-5,16,10,i%2?"#e9e1d0":"#d6bc80");ctx.restore();}drawMara(W*.7,H*.77,Math.min(1.12,H/650),"fall",-.2);}
function shotMemory(time){let g=ctx.createLinearGradient(0,0,W,H);g.addColorStop(0,"#e7d8b8");g.addColorStop(1,"#9aaca1");rect(0,0,W,H,g);for(let i=0;i<5;i++){let x=W*.2+i*W*.14;poly([[x,H*.76],[x,H*.3],[x+70,H*.18],[x+140,H*.3],[x+140,H*.76]],i%2?"#d9cfb8":"#c8c4b3");}drawChild(W*.52,H*.78,1.3);drawMara(W*.78,H*.8,1.15,"reach");}
function shotCollapse(time){paperSky(time,1);drawCity(time,.9);let p=clamp((time-1100)/180);drawPlane(mix(W*.5,W*.9,ease(p)),mix(H*.5,-H*.25,ease(p)),.95,-.45);drawMara(W*.4,H*.78,Math.min(1.2,H/640),"reach",-.45);let g=ctx.createRadialGradient(W*.5,H*.4,20,W*.5,H*.4,W*.8);g.addColorStop(0,"rgba(238,221,182,0)");g.addColorStop(1,"rgba(5,19,28,.82)");rect(0,0,W,H,g);}
function sceneFor(f){if(f<260)shotAirfield(f);else if(f<500)shotTakeoff(f);else if(f<740)shotStorm(f);else if(f<1010)shotImpossible(f);else if(f<1210)shotMemory(f);else shotCollapse(f);}
const cues=[
[55,"CHILD","Mum? You promised you'd come home."],
[145,"MARA","I know, little star. One flight. Then I'm yours."],
[285,"CONTROL","Flight 001, you are cleared for departure. No deviations."],
[430,"MARA","Control... why is the runway getting longer?"],
[535,"CONTROL","Mara, abort. Your aircraft is appearing on radar twice."],
[680,"MARA","That's impossible. I'm looking at myself."],
[790,"FUTURE MARA","DO NOT LAND. THAT IS NOT THE CITY."],
[920,"MARA","Who are you?"],
[1035,"CHILD","Mum? I'm still waiting."],
[1145,"MARA","I promised I'd come home."],
[1285,"FUTURE MARA","Then stop trying to reach the past."]
];
let cueIndex=0,started=false;
function startStory(){if(started)return;started=true;let tc=$("titlecard");setTimeout(()=>{tc.style.opacity=0;setTimeout(()=>tc.style.display="none",1400);},1700);setTimeout(()=>{say("CHILD","Mum? You promised you'd come home.");},2400);}
function loop(){frame++;let f=frame;sceneFor(f);drawParticles();if(f===220)burst(W*.68,H*.52,24,5);if(f===490)burst(W*.52,H*.5,45,9);if(f===745)burst(W*.4,H*.45,70,12);if(f===1010){hush();say("CHILD","Mum? I'm still waiting.");}if(f===1210){hush();}if(f>1390){$("endcard").style.display="grid";requestAnimationFrame(()=> $("endcard").style.opacity=1);if(f===1392){hush();say("FUTURE MARA","You were never flying to the future. The future was trying to get back to you.");}}else{for(let i=cueIndex;i<cues.length;i++){if(f===cues[i][0]){cueIndex=i+1;say(cues[i][1],cues[i][2]);break;}}}requestAnimationFrame(loop);}
startStory();loop();