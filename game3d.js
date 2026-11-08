import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";

const $=id=>document.getElementById(id);
const host=$("game"),prompt=$("prompt"),mission=$("mission");
let renderer,scene,camera,clock,mara,plane,radio,beacon,collapseRing,started=false,phase="intro",near="",collapseAt=0,collapseDone=false;
const keys=new Set(),touch=new Set(),clockNow=()=>performance.now();
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const mat=(color,rough=.78,metal=0)=>new THREE.MeshStandardMaterial({color,roughness:rough,metalness:metal});
const mats={ground:mat("#718477"),concrete:mat("#626f72"),cream:mat("#c8c0aa"),roof:mat("#66584e"),glass:mat("#31566a",.24,.2),suit:mat("#7894a3",.68,.12),dark:mat("#263744"),skin:mat("#b77e60"),hair:mat("#29272a"),gold:mat("#e4c27b",.3,.55),white:mat("#dce4e6",.35,.16)};
function box(parent,x,y,z,w,h,d,m,rx=0,ry=0,rz=0){const o=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);o.position.set(x,y,z);o.rotation.set(rx,ry,rz);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o}
function sphere(parent,x,y,z,r,m,scale=[1,1,1]){const o=new THREE.Mesh(new THREE.SphereGeometry(r,24,18),m);o.position.set(x,y,z);o.scale.set(...scale);o.castShadow=true;parent.add(o);return o}
function cylinder(parent,x,y,z,rt,rb,h,m,n=20){const o=new THREE.Mesh(new THREE.CylinderGeometry(rt,rb,h,n),m);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o}
function label(text,x,y,z){const c=document.createElement("canvas");c.width=512;c.height=128;const g=c.getContext("2d");g.fillStyle="#081a29dd";g.fillRect(0,0,512,128);g.strokeStyle="#dfc487";g.lineWidth=3;g.strokeRect(4,4,504,120);g.fillStyle="#f2dfb2";g.font="bold 34px Arial";g.textAlign="center";g.fillText(text,256,78);const tex=new THREE.CanvasTexture(c);const s=new THREE.Sprite(new THREE.SpriteMaterial({map:tex,transparent:true,depthTest:false}));s.position.set(x,y,z);s.scale.set(3.3,.82,1);scene.add(s);return s}
function makeMara(){const g=new THREE.Group();scene.add(g);g.position.set(-5,0,3);
 const torso=box(g,0,1.12,0,.62,.9,.34,mats.suit);torso.rotation.x=-.05;
 sphere(g,0,1.82,0,.25,mats.skin,[.82,1.05,.9]);
 sphere(g,0,1.99,-.045,.265,mats.hair,[1,.65,1]);
 // swept-back hair and neck
 sphere(g,-.18,1.79,-.12,.15,mats.hair,[.65,.8,.9]);
 cylinder(g,0,1.55,0,.09,.1,.18,mats.skin);
 // collar, harness, belt and shoulder details
 box(g,0,1.48,.18,.38,.08,.025,mats.gold);
 box(g,-.19,1.13,.18,.055,.58,.025,mats.white,-.18,0,-.12);
 box(g,.19,1.13,.18,.055,.58,.025,mats.white,.18,0,.12);
 box(g,0,.7,.02,.58,.16,.36,mats.dark);
 const limbs=[];
 for(const side of [-1,1]){
  const arm=new THREE.Group();arm.position.set(side*.38,1.43,0);g.add(arm);
  cylinder(arm,0,-.27,0,.105,.13,.52,mats.suit,16).rotation.z=side*-.1;
  sphere(arm,0,-.55,.02,.11,mats.skin);
  const leg=new THREE.Group();leg.position.set(side*.17,.66,0);g.add(leg);
  cylinder(leg,0,-.26,0,.13,.105,.55,mats.dark,16);
  box(leg,0,-.57,.08,.25,.15,.42,mats.dark);
  limbs.push(arm,leg);
 }
 g.userData.limbs=limbs;g.userData.torso=torso;return g}
function makePlane(){const g=new THREE.Group();scene.add(g);g.position.set(0,.7,5);
 // nose points toward -Z
 const fus= new THREE.Mesh(new THREE.CylinderGeometry(.43,.34,5.6,24),mats.white);fus.rotation.x=Math.PI/2;fus.position.y=.05;fus.castShadow=true;g.add(fus);
 sphere(g,0,.1,-2.2,.39,mats.glass,[1,.8,1.3]);
 box(g,0,-.02,0,9,.16,1.12,mats.white);
 box(g,0,.32,1.85,2.7,.12,.72,mats.white);
 box(g,0,.78,2.05,.18,1.05,.5,mats.white);
 box(g,0,-.05,2.5,.95,.08,.58,mats.white);
 for(const s of [-1,1]){const strut=cylinder(g,s*.5,-.45,.9,.045,.045,.85,mats.dark);strut.rotation.z=s*.18;const wheel=cylinder(g,s*.52,-.82,.95,.17,.17,.12,mats.dark,18);wheel.rotation.z=Math.PI/2;}
 const prop=new THREE.Group();prop.position.set(0,.05,-2.8);g.add(prop);for(let i=0;i<3;i++){const b=box(prop,0,0,0,.12,1.25,.07,mats.dark);b.rotation.z=i*Math.PI/3;}g.userData.prop=prop;return g}
function buildWorld(){
 scene=new THREE.Scene();scene.background=new THREE.Color("#9dbac2");scene.fog=new THREE.FogExp2("#9dbac2",.012);
 camera=new THREE.PerspectiveCamera(58,innerWidth/innerHeight,.1,180);
 renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:"high-performance"});renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.6));renderer.setSize(innerWidth,innerHeight);renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.12;host.appendChild(renderer.domElement);
 scene.add(new THREE.HemisphereLight("#eaf6ff","#58634f",2.1));const sun=new THREE.DirectionalLight("#ffe2b3",3.2);sun.position.set(-18,25,-12);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);sun.shadow.camera.left=-30;sun.shadow.camera.right=30;sun.shadow.camera.top=30;sun.shadow.camera.bottom=-30;scene.add(sun);
 const ground=box(scene,0,-.35,0,90,.7,90,mats.ground);ground.receiveShadow=true;
 // Runway and markings
 box(scene,0,.015,7,17,.04,54,mats.concrete);
 for(let z=-17;z<30;z+=6)box(scene,0,.04,z,.22,.025,2.8,mat("#d8d1b9"));
 for(const x of [-8.7,8.7]){box(scene,x,.03,7,.12,.03,54,mat("#b7b6a4"))}
 // Hangar with roof and open door
 box(scene,-13,2.5,-9,12,5,9,mats.cream);box(scene,-13,5.35,-9,13,.28,10,mats.roof);
 const roof2=box(scene,-13,6.25,-9,13,.22,10,mats.roof);roof2.rotation.z=.12;
 box(scene,-13,1.8,-4.42,7,3.6,.15,mat("#293d49"));
 for(const x of [-17,-13,-9])box(scene,x,2.4,-4.3,2.5,1.3,.12,mats.glass);
 // Tower
 box(scene,12,2.4,-10,3.4,4.8,3.4,mats.cream);box(scene,12,5,-10,4.2,.45,4.2,mats.roof);box(scene,12,3.7,-8.23,2.8,1.05,.08,mats.glass);
 cylinder(scene,12,7.3,-10,.09,.09,4,mats.dark);const wind=new THREE.Group();wind.position.set(12,8.8,-10);scene.add(wind);for(let i=0;i<3;i++){const b=box(wind,0,0,0,.16,2.1,.12,mats.white);b.rotation.z=i*Math.PI*2/3;}
 // perimeter lights and trees
 for(let z=-20;z<32;z+=8){for(const x of [-23,23]){cylinder(scene,x,1.3,z,.07,.09,2.6,mats.dark);sphere(scene,x,2.7,z,.2,mats.gold)}}
 for(let i=0;i<18;i++){const x=-30+(i%9)*7.2,z=-27+Math.floor(i/9)*55;cylinder(scene,x,1,z,.22,.32,2,mat("#665440"));sphere(scene,x,3,z,1.7,mat(i%2?"#587363":"#657e6d"),[1,1.2,1]);}
 // distant ridgeline
 for(let i=0;i<16;i++){const h=5+Math.random()*9;const m=new THREE.Mesh(new THREE.ConeGeometry(5+Math.random()*4,h,7),mat(i%2?"#829a94":"#738a87"));m.position.set(-42+i*5.7,h/2-1,-43-Math.random()*5);m.castShadow=true;scene.add(m)}
 mara=makeMara();plane=makePlane();
 // Radio desk, console and beacon
 box(scene,-5,.55,-5,2.4,1.1,1.3,mat("#334b58"));box(scene,-5,1.15,-5,.8,.12,.55,mats.dark);
 radio=new THREE.Group();radio.position.set(-5,1.3,-5);scene.add(radio);const lamp=sphere(radio,0,.2,0,.13,mat("#efbd6d",.22,.3));lamp.material.emissive=new THREE.Color("#e4a34d");lamp.material.emissiveIntensity=1.8;
 label("RADIO SIGNAL",-5,3,-5);
 beacon=new THREE.Group();beacon.position.set(0,.2,19);scene.add(beacon);cylinder(beacon,0,1,0,.15,.22,2,mat("#d6d2c4"));sphere(beacon,0,2.1,0,.22,mats.gold);label("RUNWAY BEACON",0,3.1,19);collapseRing=new THREE.Mesh(new THREE.TorusGeometry(1,.08,8,120),new THREE.MeshBasicMaterial({color:"#f1d28b",transparent:true,opacity:0}));collapseRing.rotation.x=Math.PI/2;collapseRing.position.set(0,.25,19);collapseRing.scale.setScalar(.01);scene.add(collapseRing);
 // Plane name mark
 label("MARA'S AIRCRAFT",0,3.2,5);
 // cinematic volumetric-ish clouds
 for(let i=0;i<12;i++){const cloud=new THREE.Group();scene.add(cloud);cloud.position.set(-28+i*5,13+Math.random()*5,-25-Math.random()*16);for(let j=0;j<4;j++)sphere(cloud,(j-1.5)*1.7,Math.random()*.7,0,1.8,mat("#d9e1df",1),[1.3,.55,.8]);}
 clock=new THREE.Clock();resize();animate()}
function resize(){if(!renderer)return;camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight)}
function setPrompt(t){prompt.textContent=t;prompt.style.opacity=t?"1":"0"}
function dist(a,b){return Math.hypot(a.x-b.x,a.z-b.z)}
function interact(){if(!started||phase==="collapse"||phase==="ending")return;
 if(phase==="explore"&&dist(mara.position,radio.position)<3.2){phase="heard";mission.innerHTML="MARA · THE TRANSMISSION<br>That voice is yours.";setPrompt("");showMessage("RADIO / 19:42:08","A burst of static. Then Mara's own voice, strained and close: “If you can hear this, do not take off. The runway ends before the sky does. You have eight minutes.” The receiver clicks dead.");return}
 if(phase==="heard"&&dist(mara.position,beacon.position)<3.8){beginCollapse();return}
 setPrompt(phase==="explore"?"Find the radio desk. The signal is coming from the hangar side.":phase==="heard"?"The runway beacon is pulsing. Get closer.":"");}
function showMessage(title,body){const layer=document.createElement("div");layer.className="message";layer.innerHTML='<div class="messageBox"><small>'+title+'</small><p>'+body+'</p><button id="dismiss">CONTINUE</button></div>';document.body.appendChild(layer);$("dismiss").onclick=()=>{layer.remove();setPrompt("The beacon is beyond the aircraft. Move toward the pulsing light.");}}
function beginCollapse(){phase="collapse";collapseAt=clockNow();collapseDone=false;setPrompt("");mission.innerHTML="MARA · 19:49:59<br>Eight minutes have passed.";const overlay=document.createElement("div");overlay.id="collapseCaption";overlay.textContent="THE TIMELINE IS NO LONGER STABLE";document.body.appendChild(overlay)}
function finishCollapse(){phase="ending";$("endTitle").textContent="THE SKY REMEMBERS."; $("endText").textContent="Mara reaches the beacon as the runway folds into a ribbon of light. For one suspended second, every possible flight hangs above her. Then the airfield disappears. In the silence, the radio speaks one last time: “You made it here.” The voice is still hers. The timeline closes."; $("ending").style.display="flex"}
function animate(){requestAnimationFrame(animate);if(!renderer)return;const dt=Math.min(clock.getDelta(),.04),t=clock.elapsedTime;
 if(started&&phase!=="collapse"&&phase!=="ending"){let f=(keys.has("w")||keys.has("arrowup")||touch.has("forward")?1:0)-(keys.has("s")||keys.has("arrowdown")||touch.has("back")?1:0);let r=(keys.has("d")||keys.has("arrowright")||touch.has("right")?1:0)-(keys.has("a")||keys.has("arrowleft")||touch.has("left")?1:0);const moving=f||r;if(moving){const v=new THREE.Vector3(r,0,-f).normalize().multiplyScalar(5.2*dt);mara.position.add(v);mara.position.x=clamp(mara.position.x,-20,20);mara.position.z=clamp(mara.position.z,-18,25);mara.rotation.y=Math.atan2(v.x,-v.z);mara.userData.limbs.forEach((l,i)=>l.rotation.x=Math.sin(t*11+(i%2)*Math.PI)*.48)}else mara.userData.limbs.forEach(l=>l.rotation.x*=.82);
 const target=new THREE.Vector3(mara.position.x+7,5.1,mara.position.z+10);camera.position.lerp(target,.07);camera.lookAt(mara.position.x,1.2,mara.position.z-1.3);
 const dRadio=dist(mara.position,radio.position),dBeacon=dist(mara.position,beacon.position);
 if(phase==="explore"&&dRadio<3.2)setPrompt("E / ACT  ·  LISTEN TO THE RADIO");else if(phase==="heard"&&dBeacon<3.8)setPrompt("E / ACT  ·  TOUCH THE RUNWAY BEACON");else if(phase==="explore")setPrompt("");else if(phase==="heard")setPrompt("Reach the pulsing beacon beyond the aircraft.");
 }
 if(phase==="collapse"){const elapsed=(clockNow()-collapseAt)/1000;const p=clamp(elapsed/8,0,1);scene.background.lerp(new THREE.Color("#111b38"),p*.12);scene.fog.color.lerp(new THREE.Color("#1a2441"),p*.08);camera.position.x=mara.position.x+7+Math.sin(elapsed*8)*.045;camera.position.y=5.1+Math.sin(elapsed*11)*.025;
 // The aircraft lifts without a pilot; runway fractures into luminous segments.
 plane.position.y=.7+Math.sin(elapsed*2)*.15+elapsed*.18;plane.rotation.z=Math.sin(elapsed*1.7)*.06;plane.userData.prop.rotation.z+=.6;
 for(let i=0;i<12;i++){const obj=scene.children.filter(o=>o.isMesh&&o.geometry?.type==="BoxGeometry")[i];if(obj&&obj.position.z<22){obj.position.y+=.004+elapsed*.0007;obj.rotation.z+=.0007}}
 const ring=new THREE.Mesh(new THREE.TorusGeometry(1+p*28,.08,8,120),new THREE.MeshBasicMaterial({color:"#f1d28b",transparent:true,opacity:1-p}));ring.rotation.x=Math.PI/2;ring.position.set(0,.3,19);scene.add(ring);setTimeout(()=>{scene.remove(ring);ring.geometry.dispose();ring.material.dispose()},60);
 if(elapsed>8&&!collapseDone){collapseDone=true;finishCollapse()}}
 if(plane?.userData.prop&&phase!=="collapse")plane.userData.prop.rotation.z+=.04;
 if(beacon)beacon.children[1].scale.setScalar(1+Math.sin(t*3)*.12);
 renderer.render(scene,camera)}
function start(){started=true;phase="explore";$("intro").style.display="none";mission.innerHTML="MARA · KIJANI AIRFIELD<br>Find the source of the voice.";setPrompt("Find the radio desk beside the hangar.");}
$("start").addEventListener("click",start);$("act").addEventListener("click",interact);$("again").addEventListener("click",()=>location.reload());
window.addEventListener("keydown",e=>{const k=e.key.toLowerCase();if(["arrowup","arrowdown","arrowleft","arrowright"," "].includes(k))e.preventDefault();keys.add(k);if(k==="e"||k==="enter")interact()},{passive:false});window.addEventListener("keyup",e=>keys.delete(e.key.toLowerCase()));
document.querySelectorAll("[data-move]").forEach(b=>{const d=b.dataset.move;b.addEventListener("pointerdown",e=>{e.preventDefault();touch.add(d);b.setPointerCapture?.(e.pointerId)});const stop=()=>touch.delete(d);["pointerup","pointercancel","lostpointercapture","pointerleave"].forEach(ev=>b.addEventListener(ev,stop))});
window.addEventListener("blur",()=>{keys.clear();touch.clear()});window.addEventListener("resize",resize);
const style=document.createElement("style");style.textContent='.message{position:fixed;inset:0;z-index:8;display:grid;place-items:center;padding:20px;background:#061321a8;backdrop-filter:blur(5px)}.messageBox{width:min(540px,100%);padding:28px;background:#0a2031;border-left:2px solid #e4c57e;box-shadow:0 20px 80px #0008}.messageBox small{letter-spacing:.2em;color:#e4c57e;font-weight:800}.messageBox p{line-height:1.8;color:#e0e8e9;font-size:14px}.messageBox button{margin-top:8px}#collapseCaption{position:fixed;z-index:6;top:18%;left:0;width:100%;text-align:center;letter-spacing:.35em;font-size:11px;color:#f0d59a;text-shadow:0 2px 12px #000;animation:pulse 1s infinite alternate}@keyframes pulse{from{opacity:.35}to{opacity:1}}';document.head.appendChild(style);
try{buildWorld()}catch(e){console.error(e);host.innerHTML='<div style="position:fixed;inset:0;display:grid;place-items:center;padding:32px;color:#fff;text-align:center">The 3D scene could not start on this browser. Please check that WebGL and the internet connection are available, then reload.</div>'}
