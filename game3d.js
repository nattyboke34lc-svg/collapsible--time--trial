import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";

const $=id=>document.getElementById(id);
const host=$("game"),prompt=$("prompt"),mission=$("mission");
let renderer,scene,camera,clock,mara,plane,radio,beacon,collapseRing,planeEcho,rift,started=false,phase="intro",near="",collapseAt=0,collapseDone=false,moveTarget=null,storyIndex=0,storyCameraTarget=null,storyLookTarget=null;
const keys=new Set(),touch=new Set(),clockNow=()=>performance.now();
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const mat=(color,rough=.78,metal=0)=>new THREE.MeshStandardMaterial({color,roughness:rough,metalness:metal});
const mats={ground:mat("#718477"),concrete:mat("#626f72"),cream:mat("#c8c0aa"),roof:mat("#66584e"),glass:mat("#31566a",.24,.2),suit:mat("#7894a3",.68,.12),dark:mat("#263744"),skin:mat("#b77e60"),hair:mat("#29272a"),gold:mat("#e4c27b",.3,.55),white:mat("#dce4e6",.35,.16)};
function box(parent,x,y,z,w,h,d,m,rx=0,ry=0,rz=0){const o=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);o.position.set(x,y,z);o.rotation.set(rx,ry,rz);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o}
function sphere(parent,x,y,z,r,m,scale=[1,1,1]){const o=new THREE.Mesh(new THREE.SphereGeometry(r,24,18),m);o.position.set(x,y,z);o.scale.set(...scale);o.castShadow=true;parent.add(o);return o}
function cylinder(parent,x,y,z,rt,rb,h,m,n=20){const o=new THREE.Mesh(new THREE.CylinderGeometry(rt,rb,h,n),m);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o}
function label(text,x,y,z){const c=document.createElement("canvas");c.width=512;c.height=128;const g=c.getContext("2d");g.fillStyle="#081a29dd";g.fillRect(0,0,512,128);g.strokeStyle="#dfc487";g.lineWidth=3;g.strokeRect(4,4,504,120);g.fillStyle="#f2dfb2";g.font="bold 34px Arial";g.textAlign="center";g.fillText(text,256,78);const tex=new THREE.CanvasTexture(c);const s=new THREE.Sprite(new THREE.SpriteMaterial({map:tex,transparent:true,depthTest:false}));s.position.set(x,y,z);s.scale.set(3.3,.82,1);scene.add(s);return s}
function makeMara(){const g=new THREE.Group();scene.add(g);g.position.set(-5,0,3);
 const torso=new THREE.Mesh(new THREE.CapsuleGeometry(.31,.52,8,18),mats.suit);torso.position.set(0,1.12,0);torso.castShadow=true;g.add(torso);
 // Natural head silhouette, tied-back dark hair, and visible facial features.
 sphere(g,0,1.82,-.015,.25,mats.skin,[.82,1.05,.9]);
 sphere(g,0,1.99,.015,.265,mats.hair,[1,.62,1]);
 sphere(g,0,1.79,.205,.17,mats.hair,[.75,.8,1.05]);
 sphere(g,-.19,1.82,.035,.12,mats.hair,[.65,.9,.9]);
 sphere(g,.19,1.82,.035,.12,mats.hair,[.65,.9,.9]);
 sphere(g,-.09,1.84,-.225,.027,mats.white,[1,.8,.55]);sphere(g,.09,1.84,-.225,.027,mats.white,[1,.8,.55]);
 sphere(g,-.09,1.84,-.247,.013,mat("#26313a"));sphere(g,.09,1.84,-.247,.013,mat("#26313a"));
 sphere(g,0,1.77,-.235,.035,mats.skin,[.65,.7,.7]);
 box(g,-.09,1.89,-.22,.09,.018,.025,mats.hair,-.08,0,-.12);box(g,.09,1.89,-.22,.09,.018,.025,mats.hair,.08,0,.12);
 cylinder(g,0,1.55,0,.09,.1,.18,mats.skin);
 // Flight suit: collar, harness, utility belt, shoulder insignia and gloves.
 box(g,0,1.48,-.17,.38,.08,.045,mats.gold);
 box(g,-.19,1.13,-.18,.055,.58,.035,mats.white,-.18,0,-.12);
 box(g,.19,1.13,-.18,.055,.58,.035,mats.white,.18,0,.12);
 box(g,0,1.15,-.19,.16,.2,.035,mats.dark);
 box(g,.22,1.43,0,.16,.13,.12,mats.gold);
 box(g,0,.7,0,.58,.16,.36,mats.dark);
 box(g,-.22,.72,-.2,.12,.12,.035,mats.gold);
 const limbs=[];
 for(const side of [-1,1]){
  const arm=new THREE.Group();arm.position.set(side*.38,1.43,0);g.add(arm);
  const sleeve=new THREE.Mesh(new THREE.CapsuleGeometry(.105,.28,6,12),mats.suit);sleeve.position.y=-.25;sleeve.rotation.z=side*-.1;sleeve.castShadow=true;arm.add(sleeve);
  sphere(arm,0,-.5,0,.095,mats.dark);sphere(arm,0,-.57,-.015,.09,mats.skin);
  const leg=new THREE.Group();leg.position.set(side*.17,.66,0);g.add(leg);
  const trouser=new THREE.Mesh(new THREE.CapsuleGeometry(.13,.34,6,12),mats.dark);trouser.position.y=-.27;trouser.castShadow=true;leg.add(trouser);
  box(leg,0,-.57,-.015,.25,.15,.42,mats.dark);
  box(leg,0,-.5,-.23,.16,.055,.025,mats.gold);
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
 planeEcho=plane.clone(true);planeEcho.position.set(7,13,-31);planeEcho.scale.setScalar(.62);planeEcho.visible=false;scene.add(planeEcho);
 rift=new THREE.Mesh(new THREE.TorusGeometry(7,.22,16,120),new THREE.MeshStandardMaterial({color:"#b7dfff",emissive:"#4a9ddc",emissiveIntensity:2.4,metalness:.45,roughness:.2,transparent:true,opacity:.9}));rift.position.set(0,13,-34);rift.rotation.y=.15;rift.visible=false;scene.add(rift);
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
 if(phase==="story"&&storyCameraTarget&&storyLookTarget){camera.position.lerp(storyCameraTarget,.025);camera.lookAt(storyLookTarget);}
 if(started&&phase!=="collapse"&&phase!=="ending"){let v=new THREE.Vector3();if(moveTarget){const delta=moveTarget.clone().sub(mara.position);delta.y=0;if(delta.length()>.28){v.copy(delta.normalize().multiplyScalar(5.6*dt));mara.position.add(v);mara.rotation.y=Math.atan2(v.x,-v.z);mara.userData.limbs.forEach((l,i)=>l.rotation.x=Math.sin(t*10+(i%2)*Math.PI)*.42);}else moveTarget=null;}else{let f=(keys.has("w")||keys.has("arrowup")?1:0)-(keys.has("s")||keys.has("arrowdown")?1:0);let r=(keys.has("d")||keys.has("arrowright")?1:0)-(keys.has("a")||keys.has("arrowleft")?1:0);if(f||r){v.set(r,0,-f).normalize().multiplyScalar(5.6*dt);mara.position.add(v);mara.rotation.y=Math.atan2(v.x,-v.z);mara.userData.limbs.forEach((l,i)=>l.rotation.x=Math.sin(t*10+(i%2)*Math.PI)*.42);}}if(v.lengthSq()===0)mara.userData.limbs.forEach(l=>l.rotation.x*=.82);mara.position.x=clamp(mara.position.x,-20,20);mara.position.z=clamp(mara.position.z,-18,25);
 const target=new THREE.Vector3(mara.position.x,4.3,mara.position.z+8.2);camera.position.lerp(target,.085);camera.lookAt(mara.position.x,1.25,mara.position.z-1.5);
 const dRadio=dist(mara.position,radio.position),dBeacon=dist(mara.position,beacon.position);
 if(phase==="explore"&&dRadio<3.2)setPrompt("E / ACT  ·  LISTEN TO THE RADIO");else if(phase==="heard"&&dBeacon<3.8)setPrompt("E / ACT  ·  TOUCH THE RUNWAY BEACON");else if(phase==="explore")setPrompt("");else if(phase==="heard")setPrompt("Reach the pulsing beacon beyond the aircraft.");
 }
 if(phase==="collapse"){const elapsed=(clockNow()-collapseAt)/1000;const p=clamp(elapsed/8,0,1);scene.background.lerp(new THREE.Color("#111b38"),p*.12);scene.fog.color.lerp(new THREE.Color("#1a2441"),p*.08);camera.position.x=mara.position.x+Math.sin(elapsed*8)*.045;camera.position.y=4.3+Math.sin(elapsed*11)*.025;
 // The aircraft lifts without a pilot; runway fractures into luminous segments.
 plane.position.y=.7+Math.sin(elapsed*2)*.15+elapsed*.18;plane.rotation.z=Math.sin(elapsed*1.7)*.06;plane.userData.prop.rotation.z+=.6;
 collapseRing.scale.setScalar(.01+p*28);collapseRing.material.opacity=1-p;
 if(elapsed>8&&!collapseDone){collapseDone=true;finishCollapse()}}
 if(plane?.userData.prop&&phase!=="collapse")plane.userData.prop.rotation.z+=.04;
 if(beacon)beacon.children[1].scale.setScalar(1+Math.sin(t*3)*.12);
 renderer.render(scene,camera)}
const storySlides=[
 {k:"THE GRADUATION",t:"SHE EARNED EVERY INCH OF SKY.",p:"Mara remembers the day they pinned her wings. Her family filled the back row. Captain Elias stood at the edge of the stage, arms folded, pretending not to be proud. She had promised herself she would never waste the chance they had given her.",c:[-5,2.8,-3],look:[-5,1.7,3]},
 {k:"THE YEARS BEFORE",t:"NOTHING WAS GIVEN.",p:"Early mornings. Failed simulations. Long nights over flight manuals. A landing she had to repeat until her instructor finally nodded. Some classmates left. Some were promoted first. Mara stayed. She learned to trust preparation more than luck.",c:[-12,3,2],look:[-13,2,-8]},
 {k:"THE PROMOTION FLIGHT",t:"ONE FLIGHT FROM EVERYTHING.",p:"Tonight is her final evaluation. Complete the route and she earns senior mission pilot. Her own crew. Her own command. Her mother's message is still on her phone: “We knew you could do it.” Mara touches the small pair of wings inside her jacket.",c:[4,4,15],look:[0,1,5]},
 {k:"THE CHANGE OF ORDERS",t:"THE MISSION WAS NOT WHAT SHE ACCEPTED.",p:"A revised flight folder waits on the aircraft steps. The destination has changed. No explanation. Captain Elias will not meet her eyes. “Orders changed,” he says. Mara asks who authorised them. The radio answers before he can.",c:[-3,3,-1],look:[-5,1,-5]},
 {k:"THE LAST FLIGHT",t:"THEN THE SKY ANSWERED.",p:"At altitude, the compass spins. Control insists there is no other aircraft nearby. A voice comes through the static. It sounds exactly like Mara: “Do not land where they tell you.” Ahead, a second aircraft appears. Same markings. Same flight number. Another Mara is looking back.",c:[0,7,22],look:[0,3,-25]},
 {k:"SOMEWHERE ELSE",t:"WELCOME BACK, MARA.",p:"The clouds split open. For one impossible second, Mara sees a city hanging beneath the sky. Then everything goes white. She wakes at an airfield that looks like home, except the tower clock is seventeen years ahead. The radio is already on. Someone knows her name.",c:[0,6,30],look:[0,2,-30]}
];
function showStory(){const x=storySlides[storyIndex];$("storyKicker").textContent="CHAPTER ONE · "+x.k;$("storyCount").textContent=String(storyIndex+1).padStart(2,"0")+" / 06";$("storyTitle").textContent=x.t;$("storyText").textContent=x.p;$("storyHint").textContent="MARA · THE LAST FLIGHT";$("storyNext").textContent=storyIndex===storySlides.length-1?"TAKE CONTROL":"CONTINUE";storyCameraTarget=new THREE.Vector3(...x.c);storyLookTarget=new THREE.Vector3(...x.look);if(storyIndex>=4){rift.visible=true;planeEcho.visible=true;}if(storyIndex===5){scene.background.set("#718b9d");scene.fog.color.set("#718b9d");}if("speechSynthesis"in window){speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(x.t+". "+x.p);u.rate=.94;u.pitch=.91;u.volume=.85;speechSynthesis.speak(u);}}
function beginPlay(){if("speechSynthesis"in window)speechSynthesis.cancel();$("story").style.display="none";started=true;phase="explore";moveTarget=null;mara.position.set(-5,0,3);mission.innerHTML="MARA · UNKNOWN AIRFIELD<br>Find out who called your name.";setPrompt("Tap the ground to walk. Find the radio desk.");camera.position.set(-5,5,13);camera.lookAt(-5,1,0);}
function start(){$("intro").style.display="none";$("story").style.display="flex";phase="story";storyIndex=0;showStory();}
$("storyNext").addEventListener("click",()=>{if(storyIndex<storySlides.length-1){storyIndex++;showStory();}else beginPlay();});
$("storySkip").addEventListener("click",beginPlay);
$("start").addEventListener("click",start);$("act").addEventListener("click",interact);$("again").addEventListener("click",()=>location.reload());
window.addEventListener("keydown",e=>{const k=e.key.toLowerCase();if(["arrowup","arrowdown","arrowleft","arrowright"," "].includes(k))e.preventDefault();keys.add(k);if(k==="e"||k==="enter")interact()},{passive:false});window.addEventListener("keyup",e=>keys.delete(e.key.toLowerCase()));
const raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2(),groundPlane=new THREE.Plane(new THREE.Vector3(0,1,0),0),hit=new THREE.Vector3();
function attachGroundControls(){renderer.domElement.addEventListener("pointerdown",e=>{if(!started||phase==="story"||phase==="collapse"||phase==="ending")return;const rect=renderer.domElement.getBoundingClientRect();pointer.x=((e.clientX-rect.left)/rect.width)*2-1;pointer.y=-((e.clientY-rect.top)/rect.height)*2+1;raycaster.setFromCamera(pointer,camera);if(raycaster.ray.intersectPlane(groundPlane,hit)){moveTarget=new THREE.Vector3(clamp(hit.x,-20,20),0,clamp(hit.z,-18,25));setPrompt("Mara is moving to your selected location.");}});}

window.addEventListener("blur",()=>{keys.clear();touch.clear();moveTarget=null});window.addEventListener("resize",resize);
const style=document.createElement("style");style.textContent='.message{position:fixed;inset:0;z-index:8;display:grid;place-items:center;padding:20px;background:#061321a8;backdrop-filter:blur(5px)}.messageBox{width:min(540px,100%);padding:28px;background:#0a2031;border-left:2px solid #e4c57e;box-shadow:0 20px 80px #0008}.messageBox small{letter-spacing:.2em;color:#e4c57e;font-weight:800}.messageBox p{line-height:1.8;color:#e0e8e9;font-size:14px}.messageBox button{margin-top:8px}#collapseCaption{position:fixed;z-index:6;top:18%;left:0;width:100%;text-align:center;letter-spacing:.35em;font-size:11px;color:#f0d59a;text-shadow:0 2px 12px #000;animation:pulse 1s infinite alternate}@keyframes pulse{from{opacity:.35}to{opacity:1}}';document.head.appendChild(style);
try{buildWorld();attachGroundControls()}catch(e){console.error(e);host.innerHTML='<div style="position:fixed;inset:0;display:grid;place-items:center;padding:32px;color:#fff;text-align:center">The 3D scene could not start on this browser. Please check that WebGL and the internet connection are available, then reload.</div>'}
