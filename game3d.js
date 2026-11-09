const $ = id => document.getElementById(id);
const world = $("world");
let canvas, ctx, W=0, H=0, t=0, phase="idle", choice=0, camera=0, targetCamera=0, raf=0;
const palette={sky:"#b9c9c5",sky2:"#e1d8c2",mount:"#81938a",mount2:"#647c75",concrete:"#9a9a8b",navy:"#243b4a",blue:"#607d89",cream:"#e9dfc6",gold:"#d2b77c",skin:"#9c6c55",hair:"#29252a",paper:"#d8c7a4",red:"#9e514b"};
function poly(points,fill,stroke="#34434a",lw=2){ctx.beginPath();points.forEach((p,i)=>i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]));ctx.closePath();ctx.fillStyle=fill;ctx.fill();if(stroke){ctx.lineWidth=lw;ctx.strokeStyle=stroke;ctx.stroke();}}
function rect(x,y,w,h,c,stroke="#34434a",lw=2){ctx.fillStyle=c;ctx.fillRect(x,y,w,h);if(stroke){ctx.lineWidth=lw;ctx.strokeStyle=stroke;ctx.strokeRect(x,y,w,h);}}
function ellipse(x,y,rx,ry,c,stroke="#34434a",lw=2){ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2);ctx.fillStyle=c;ctx.fill();if(stroke){ctx.lineWidth=lw;ctx.strokeStyle=stroke;ctx.stroke();}}
function line(x1,y1,x2,y2,c="#34434a",lw=3){ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.strokeStyle=c;ctx.lineWidth=lw;ctx.lineCap="round";ctx.stroke();}
function paperShadow(){ctx.shadowColor="rgba(20,35,40,.22)";ctx.shadowBlur=0;ctx.shadowOffsetX=6;ctx.shadowOffsetY=7;}
function resetShadow(){ctx.shadowColor="transparent";ctx.shadowBlur=0;ctx.shadowOffsetX=0;ctx.shadowOffsetY=0;}
function cutout(points,fill){paperShadow();poly(points,fill);resetShadow();}
function text(str,x,y,size,color="#f7f0df",align="center",font="Georgia"){ctx.font=size+"px "+font;ctx.textAlign=align;ctx.fillStyle=color;ctx.fillText(str,x,y);}
function background(){
  const g=ctx.createLinearGradient(0,0,0,H);g.addColorStop(0,palette.sky);g.addColorStop(.62,palette.sky2);g.addColorStop(1,"#c2b69d");rect(0,0,W,H,g,null);
  // floating paper clouds
  for(let i=0;i<5;i++){let x=((i*237-t*.12)%(W+180)+W+180)%(W+180)-90,y=H*.15+(i%3)*H*.055;cutout([[x-48,y],[x-28,y-17],[x-4,y-13],[x+12,y-28],[x+38,y-15],[x+52,y+2],[x+25,y+13],[x-36,y+12]],"#e9e5d8");}
  // distant layered hills
  const shift=(camera*.13)%W;
  for(let i=0;i<3;i++){let y=H*.48+i*H*.07;ctx.beginPath();ctx.moveTo(-W,y);for(let x=-W;x<2*W;x+=70){ctx.lineTo(x+shift+i*25,y+Math.sin((x+t*.03+i*60)/115)*22);}ctx.lineTo(2*W,H);ctx.lineTo(-W,H);ctx.closePath();ctx.fillStyle=[palette.mount,palette.mount2,"#526e68"][i];ctx.fill();}
  // runway + folded paper markings
  rect(0,H*.73,W,H*.27,"#777f79",null);poly([[0,H*.73],[W,H*.68],[W,H*.77],[0,H*.82]],"#a4a08e",null);
  for(let i=0;i<8;i++){let x=((i*170-camera*.65)%(W+100)+W+100)%(W+100);poly([[x,H*.78],[x+55,H*.775],[x+77,H*.79],[x+20,H*.8]],"#e6dfc8",null);}
  // hangar as a folded paper stage
  const hx=W*.08-camera*.3,hy=H*.36,hw=W*.37,hh=H*.4;
  cutout([[hx,hy+hh],[hx,hy+hh*.28],[hx+hw*.18,hy],[hx+hw,hy+hh*.13],[hx+hw,hy+hh],[hx+hw*.85,hy+hh]],"#d4d0c1");
  poly([[hx,hy+hh*.28],[hx+hw*.18,hy],[hx+hw*.18,hy+hh*.8],[hx,hy+hh]],"#b5b5a7");
  rect(hx+hw*.27,hy+hh*.4,hw*.58,hh*.6,"#485d64","#3d5055",3);
  for(let i=0;i<4;i++)line(hx+hw*(.32+i*.14),hy+hh*.43,hx+hw*(.32+i*.14),hy+hh,"#c5c4b5",2);
}
function drawMara(x,y,s=1,turn=0){
  ctx.save();ctx.translate(x,y);ctx.scale(s,s);ctx.rotate(turn);
  // feet, legs and torso are separate paper layers
  cutout([[-21,0],[-4,0],[-5,-70],[-24,-70]],"#283b48");cutout([[7,0],[25,0],[26,-70],[9,-70]],"#314958");
  cutout([[-33,-5],[-4,-5],[-5,5],[-38,5]],"#1d2e3a");cutout([[5,-5],[35,-5],[40,5],[8,5]],"#1d2e3a");
  cutout([[-29,-145],[28,-145],[35,-65],[22,-50],[-22,-50],[-37,-67]],palette.blue);
  poly([[-29,-145],[-4,-135],[-5,-58],[-22,-50],[-37,-67]],"#4e6c7b");
  poly([[28,-145],[4,-135],[5,-58],[22,-50],[35,-65]],"#79929a");
  line(-18,-126,18,-126,palette.gold,4);rect(-5,-121,10,30,palette.gold,null);
  // arms, paper joints
  cutout([[-28,-137],[-44,-125],[-55,-76],[-43,-69],[-25,-112]],"#637f8c");
  cutout([[28,-137],[44,-124],[54,-83],[43,-75],[25,-112]],"#79939a");
  ellipse(-49,-71,8,10,palette.skin);ellipse(49,-77,8,10,palette.skin);
  // neck and face
  rect(-8,-164,16,23,palette.skin,null);
  cutout([[-24,-205],[-17,-225],[0,-233],[18,-224],[26,-203],[22,-174],[9,-161],[-12,-163],[-25,-181]],palette.skin);
  // hair as an oversized layered silhouette, with side braids
  cutout([[-27,-204],[-25,-230],[-7,-245],[17,-238],[31,-218],[26,-186],[18,-197],[14,-220],[-4,-214],[-18,-196]],palette.hair);
  cutout([[-23,-200],[-31,-183],[-27,-153],[-18,-148],[-15,-184]],"#29252a");
  poly([[17,-224],[27,-211],[25,-184],[18,-173],[15,-199]],"#403039");
  ellipse(-9,-198,2.5,3,"#25272a",null);ellipse(10,-198,2.5,3,"#25272a",null);
  line(-5,-179,5,-178,"#704a43",1.5);
  // stitched patch
  poly([[-22,-139],[-8,-139],[-8,-124],[-22,-124]],palette.cream);text("CT",-15,-128,8,"#354b55","center","Arial");
  ctx.restore();
}
function drawAircraft(x,y,s=1){
  ctx.save();ctx.translate(x,y);ctx.scale(s,s);
  cutout([[-180,-35],[-132,-49],[122,-49],[178,-27],[145,-12],[-145,-12]],"#eee9da");
  poly([[-30,-49],[20,-130],[38,-130],[18,-49]],"#c8c7ba");
  poly([[-30,-12],[20,48],[40,48],[15,-12]],"#b7b7aa");
  poly([[-160,-36],[-187,-68],[-173,-73],[-128,-43]],"#d8d4c6");
  poly([[130,-36],[171,-62],[181,-55],[164,-25]],"#d8d4c6");
  poly([[-178,-33],[-156,-40],[-141,-38],[-158,-27]],"#54727e");
  for(let i=0;i<3;i++){let a=t*.045+i*Math.PI*2/3;line(-183,-35,-183+Math.cos(a)*31,-35+Math.sin(a)*31,"#354b55",4);}
  line(-70,-47,-70,-12,"#657f88",3);line(-35,-47,-35,-12,"#657f88",3);
  ctx.restore();
}
function sceneFrame(){
  ctx.clearRect(0,0,W,H);background();
  const bob=Math.sin(t*.045)*3;
  // runway props drift slowly to imply depth
  for(let i=0;i<4;i++){let x=((i*W*.31-camera*.42)%(W+100)+W+100)%(W+100);cutout([[x,H*.68],[x+12,H*.68],[x+10,H*.52],[x+2,H*.52]],"#465c60");}
  drawAircraft(W*.66-camera*.08,H*.68,.82);
  // crate with a bright paper seal
  const px=W*.75-camera*.03,py=H*.66;
  cutout([[px-34,py-49],[px+32,py-49],[px+38,py],[px-39,py]],"#987c55");
  rect(px-5,py-48,10,48,palette.gold,null);rect(px-24,py-31,48,14,"#e8dfc8",null);text("M.V.",px,py-20,9,"#354b55","center","Arial");
  drawMara(W*.34-camera*.08,H*.78+bob,Math.min(1.08,H/650),Math.sin(t*.018)*.018);
  // scene-specific character rising entrance
  if(phase==="opening"&&t<180){let rise=Math.max(0,1-t/70);ctx.globalAlpha=1-rise;drawMara(W*.34-camera*.08,H*.78+rise*H*.38,Math.min(1.08,H/650));ctx.globalAlpha=1;}
  // paper grain / edge vignette
  const v=ctx.createLinearGradient(0,0,0,H);v.addColorStop(0,"rgba(20,38,46,.13)");v.addColorStop(.2,"transparent");v.addColorStop(.78,"transparent");v.addColorStop(1,"rgba(20,38,46,.35)");rect(0,0,W,H,v,null);
  text("KIJANI AIRFIELD",W-28, H-25,10,"#f1ead9","right","Arial");
}
function animate(){t++;camera+=(targetCamera-camera)*.025;sceneFrame();raf=requestAnimationFrame(animate);}
function resize(){W=canvas.width=Math.floor(innerWidth*Math.min(devicePixelRatio||1,1.6));H=canvas.height=Math.floor(innerHeight*Math.min(devicePixelRatio||1,1.6));canvas.style.width="100%";canvas.style.height="100%";ctx.setTransform(1,0,0,1,0,0);}
function voice(who,words){if(!window.speechSynthesis)return;speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(words);u.rate=who==="MARA"?.94:.88;u.pitch=who==="MARA"?1.02:who==="ELIAS"?.78:1.12;const vs=speechSynthesis.getVoices();const v=who==="MARA"?vs.find(x=>/female|zira|samantha|aria|jenny/i.test(x.name)):vs.find(x=>/male|david|mark|guy|daniel/i.test(x.name));if(v)u.voice=v;speechSynthesis.speak(u);}
function subtitle(who,words){$("who").textContent=who;$("line").textContent=words;voice(who,words);}
function hideCard(){$("card").style.display="none";}
function card(tag,title,body,buttons){$("eyebrow").textContent=tag;$("cardtitle").textContent=title;$("body").textContent=body;const a=$("actions");a.innerHTML="";buttons.forEach(b=>{const el=document.createElement("button");el.textContent=b.label;if(b.secondary)el.className="secondary";el.onclick=b.run;a.appendChild(el);});$("card").style.display="block";}
function shot(x){targetCamera=x;}
function begin(){phase="opening";t=0;$("start").style.display="none";$("skip").style.display="block";shot(0);subtitle("RADIO CONTROL","Mara, do you copy?");setTimeout(()=>{if(phase!=="opening")return;subtitle("MARA","Copy. I'm at the aircraft. What's changed?");},2300);setTimeout(()=>{if(phase!=="opening")return;shot(95);subtitle("CAPTAIN ELIAS","Your flight plan just changed. You're leaving in twelve minutes.");},4900);setTimeout(()=>{if(phase!=="opening")return;subtitle("MARA","I was told this was a routine evaluation.");card("INCOMING ORDERS","A mission you never accepted","A sealed package must be delivered to Ndera Clinic. No route details. No cargo manifest. One instruction: do not open it.",[{label:"ASK WHY YOU WERE CHOSEN",run:()=>{choice++;hideCard();subtitle("MARA","Why me? And why is the package sealed?");setTimeout(()=>{if(phase!=="opening")return;subtitle("ELIAS","Because it was addressed to you. Personally.");showPackage();},2200);}},{label:"DEMAND THE FULL BRIEFING",secondary:true,run:()=>{choice--;hideCard();subtitle("MARA","I don't move until I see the full briefing.");setTimeout(()=>{if(phase!=="opening")return;subtitle("ELIAS","Then look at the package. There's something you need to see.");showPackage();},2200);}}]);},7600);}
function showPackage(){phase="package";shot(180);$("hint").style.display="block";$("hint").textContent="THE PACKAGE IS WAITING · CHOOSE TO INSPECT";card("OBJECTIVE 01","Something is wrong with the seal","The package is on the trolley beside the aircraft. You don't need to walk anywhere. Choose what Mara does next.",[{label:"INSPECT THE PACKAGE",run:inspect},{label:"LEAVE IT SEALED",secondary:true,run:futureMessage}]);}
function inspect(){phase="inspect";hideCard();shot(235);$("hint").style.display="none";subtitle("MARA","This seal...");setTimeout(()=>{if(phase!=="inspect")return;subtitle("MARA","It has my name. And a date seventeen years from now.");card("UNAUTHORISED OBJECT","17 YEARS IN THE FUTURE","The label reads: MARA V. / FLIGHT 001 / RETURN TO SENDER. The seal bears the same insignia as the patch on Mara's flight suit.",[{label:"BREAK THE SEAL",run:openPackage},{label:"CALL ELIAS FIRST",secondary:true,run:callElias}]);},1900);}
function callElias(){hideCard();phase="call";subtitle("MARA","Captain, the package is addressed to me. The date is impossible.");setTimeout(()=>{if(phase!=="call")return;subtitle("ELIAS","Do not open it. I'm serious, Mara. Whatever you hear, do not open it.");card("WARNING","He knows what's inside","For the first time, the captain sounds afraid. The radio channel is still open.",[{label:"OPEN IT ANYWAY",run:openPackage},{label:"OBEY THE ORDER",secondary:true,run:futureMessage}]);},2100);}
function openPackage(){hideCard();phase="reveal";shot(270);subtitle("MARA","I'm opening it.");setTimeout(()=>{if(phase!=="reveal")return;subtitle("UNKNOWN WOMAN","Mara. If you can hear this, the first flight has already happened.");setTimeout(()=>{if(phase!=="reveal")return;subtitle("UNKNOWN WOMAN","You must not let me board that aircraft.");card("RECORDED MESSAGE · DATE UNKNOWN","The voice is yours.","The recording is unmistakably Mara's voice. Older. Exhausted. Behind her, an alarm is counting down. Then she says one more thing.",[{label:"ASK WHO SHE IS",run:()=>finish(true)},{label:"ASK WHAT HAPPENED",secondary:true,run:()=>finish(true)}]);},2600);},1900);}
function futureMessage(){phase="future";hideCard();shot(90);subtitle("RADIO CONTROL","Mara... we have a problem.");setTimeout(()=>{if(phase!=="future")return;subtitle("UNKNOWN WOMAN","Don't take off. Please. I know what happens if you do.");card("UNKNOWN TRANSMISSION","A voice with your face","The signal has no source. The voice sounds exactly like Mara, but the timestamp is seventeen years ahead.",[{label:"TRACE THE SIGNAL",run:()=>finish(false)},{label:"ASK HER WHAT HAPPENS",secondary:true,run:()=>finish(false)}]);},2100);}
function finish(opened){phase="ending";hideCard();$("skip").style.display="none";$("hint").style.display="none";$("ending").style.display="flex";if(opened){$("endtitle").textContent="YOU WERE NEVER THE FIRST.";$("endcopy").textContent="Inside the package is a flight recorder. It contains a recording of Mara, seventeen years older, warning her not to board. The last frame shows the same airfield. The same aircraft. And someone standing behind her.";$("endmicro").textContent="TIMELINE INTEGRITY: 61% · OBJECT OPENED";}else{$("endtitle").textContent="SHE KNOWS YOUR NEXT MOVE.";$("endcopy").textContent="Mara leaves the package sealed. The radio goes silent. Then the aircraft's cockpit lights switch on by themselves. A voice comes through the headset: 'Thank you for not opening it. Now please don't let me land.'";$("endmicro").textContent="TIMELINE INTEGRITY: 84% · OBJECT SEALED";}if(window.speechSynthesis){speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(opened?"You were never the first.":"She knows your next move.");u.rate=.85;speechSynthesis.speak(u);}}
function init(){canvas=document.createElement("canvas");canvas.id="cardboard-stage";canvas.style.cssText="position:absolute;inset:0;width:100%;height:100%;display:block";world.appendChild(canvas);ctx=canvas.getContext("2d");resize();animate();$("begin").onclick=begin;$("replay").onclick=()=>location.reload();$("skip").onclick=()=>{if(phase==="opening"){hideCard();showPackage();}else if(phase!=="ending"){hideCard();showPackage();}};window.addEventListener("resize",resize);}
init();