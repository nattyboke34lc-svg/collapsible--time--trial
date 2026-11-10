import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js";

const $ = id => document.getElementById(id);
const stage = $("stage");
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x9fb6c0);
scene.fog = new THREE.FogExp2(0x9fb6c0, 0.0085);

const camera = new THREE.PerspectiveCamera(56, innerWidth / innerHeight, 0.1, 500);
camera.position.set(0, 8, 26);
const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.5));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;
stage.appendChild(renderer.domElement);

const clock = new THREE.Clock();
const mat = (color, roughness=0.78, metalness=0) => new THREE.MeshStandardMaterial({ color, roughness, metalness });
const M = {
  concrete: mat(0x777f7e), concrete2: mat(0x8d9690), navy: mat(0x263c4a), steel: mat(0x536b78,.4,.55),
  cream: mat(0xe5dfcf,.72), white: mat(0xe9e8df,.4,.15), gold: mat(0xc9a45d,.35,.65),
  glass: new THREE.MeshPhysicalMaterial({color:0x7898a3,roughness:.16,metalness:.28,transparent:true,opacity:.78}),
  skin: mat(0xa96f57), hair: mat(0x28242a), jacket: mat(0x526f7b), jacketLight: mat(0x81979a),
  pants: mat(0x293b49), rubber: mat(0x18232b), red: mat(0x9f554b), green: mat(0x71867c),
  warm: mat(0xc8b99a), dark: mat(0x17232d), amber: new THREE.MeshBasicMaterial({color:0xffd28a})
};
const hemi = new THREE.HemisphereLight(0xe5f1f3, 0x52606a, 2.0); scene.add(hemi);
const sun = new THREE.DirectionalLight(0xffe0b0, 3.1);
sun.position.set(-35,55,24); sun.castShadow = true;
sun.shadow.mapSize.set(1536,1536);
sun.shadow.camera.left=-55; sun.shadow.camera.right=55; sun.shadow.camera.top=55; sun.shadow.camera.bottom=-55;
sun.shadow.bias=-0.00025; scene.add(sun);
const fill = new THREE.DirectionalLight(0xa5c7dc,1.1); fill.position.set(25,18,-35); scene.add(fill);

function box(parent, name, size, position, material, cast=true, receive=true) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), material);
  mesh.name=name; mesh.position.set(...position); mesh.castShadow=cast; mesh.receiveShadow=receive;
  parent.add(mesh); return mesh;
}
function cylinder(parent, radiusTop, radiusBottom, height, position, material, radial=16, rotation=null) {
  const mesh=new THREE.Mesh(new THREE.CylinderGeometry(radiusTop,radiusBottom,height,radial),material);
  mesh.position.set(...position); if(rotation) mesh.rotation.set(...rotation);
  mesh.castShadow=true; mesh.receiveShadow=true; parent.add(mesh); return mesh;
}
function sphere(parent, radius, position, material, scale=[1,1,1]) {
  const mesh=new THREE.Mesh(new THREE.SphereGeometry(radius,20,14),material);
  mesh.position.set(...position); mesh.scale.set(...scale); mesh.castShadow=true; mesh.receiveShadow=true; parent.add(mesh); return mesh;
}
function ground() {
  box(scene,"airport apron",[260,.5,300],[0,-.42,35],M.concrete,false,true);
  box(scene,"runway",[27,.08,220],[0,-.13,86],mat(0x303b42),false,true);
  for(let z=-12;z<190;z+=13) box(scene,"runway dash",[.24,.035,5],[0,-.065,z],M.cream,false,false);
  for(const x of [-13.2,13.2]) for(let z=-8;z<190;z+=9) {
    const lamp=sphere(scene,.16,[x,-.02,z],M.amber,[1,.45,1]); lamp.material= new THREE.MeshBasicMaterial({color:0xffd38c});
  }
  for(let i=0;i<18;i++) {
    const x=(i%6-3)*34-6, z=-65-Math.floor(i/6)*36;
    const hill=sphere(scene,24,[x,2,z],mat(i%2?0x748a88:0x849994),[1,.24,.55]);
    hill.castShadow=false;
  }
  for(let i=0;i<7;i++) {
    const x=-65+i*21;
    const tower=box(scene,"distant hangar",[12,8,15],[x,4,-47],mat(0x9ca9a4),false,true);
    box(scene,"roof lip",[12.5,.5,15.5],[x,8.2,-47],M.steel,false,true);
  }
}
function buildHangar() {
  const g=new THREE.Group(); g.position.set(5,0,-8); scene.add(g);
  box(g,"rear wall",[34,12,.7],[0,6,-17],mat(0x65747a));
  box(g,"left wall",[.7,12,34],[-17,6,0],mat(0x84918d));
  box(g,"right wall",[.7,12,34],[17,6,0],mat(0x84918d));
  box(g,"roof",[35,.8,35],[0,12.2,0],mat(0x53636c));
  for(let x=-16;x<=16;x+=8) {
    box(g,"steel column",[.55,12,.55],[x,6,16.5],M.steel);
    box(g,"roof beam",[.45,.55,35],[x,11.5,0],M.steel);
  }
  for(let z=-16;z<=16;z+=8) box(g,"wall rib",[.25,11,.25],[-16.5,5.5,z],M.steel);
  box(g,"hangar floor",[33,.12,33],[0,-.25,0],mat(0x8a9088),false,true);
  for(let i=0;i<8;i++) {
    const lamp=new THREE.PointLight(0xffd99a,32,18,2);
    lamp.position.set(-13+i*3.7,10.8,8); g.add(lamp);
    sphere(g,.16,[-13+i*3.7,11,8],M.amber,[1,.25,1]);
  }
  const sign=box(g,"hangar sign",[8,1.2,.16],[0,10.5,16.9],M.navy,false,false);
  return g;
}
function buildPlane() {
  const g=new THREE.Group(); g.position.set(5,1.8,-7); scene.add(g);
  // fuselage runs along local Z, nose points toward the runway
  const body=cylinder(g,.86,.7,22,[0,0,0],M.white,32,[Math.PI/2,0,0]);
  body.scale.set(1,1,1);
  const nose=new THREE.Mesh(new THREE.ConeGeometry(.72,3,24),M.white);
  nose.rotation.x=-Math.PI/2; nose.position.set(0,.05,-12.1); nose.castShadow=true; g.add(nose);
  const tail=cylinder(g,.28,.42,2.8,[0,.18,10.5],M.cream,20,[Math.PI/2,0,0]);
  box(g,"main wing",[22,.34,3.3],[0,-.1,-1],M.cream);
  box(g,"left wingtip",[2,.24,2.5],[-11,-.04,-1],M.steel);
  box(g,"right wingtip",[2,.24,2.5],[11,-.04,-1],M.steel);
  box(g,"tailplane",[8,.22,2.2],[0,.2,9.2],M.cream);
  box(g,"fin",[.35,3.4,3.1],[0,1.7,9.4],M.white);
  for(const x of [-.64,.64]) {
    const engine=cylinder(g,.48,.56,3.6,[x*7,-.65,-1.2],M.steel,24,[Math.PI/2,0,0]);
    cylinder(g,.3,.3,.15,[x*7,-.65,-3],M.dark,24,[Math.PI/2,0,0]);
  }
  const cockpit=new THREE.Mesh(new THREE.BoxGeometry(1.3,.62,2.5),M.glass);
  cockpit.position.set(0,.72,-9.3); cockpit.rotation.x=-.18; cockpit.castShadow=true; g.add(cockpit);
  for(const z of [-8,-5,-2,1,4,7]) {
    for(const x of [-.83,.83]) {
      const win=new THREE.Mesh(new THREE.BoxGeometry(.08,.42,1.05),M.glass);
      win.position.set(x,.35,z); g.add(win);
    }
  }
  for(const x of [-.9,.9]) {
    cylinder(g,.1,.1,1.1,[x,-.9,4.8],M.steel,12);
    const wheel=cylinder(g,.4,.4,.22,[x,-1.38,4.8],M.rubber,20,[0,0,Math.PI/2]);
    wheel.castShadow=true;
  }
  cylinder(g,.09,.09,.8,[0,-.9,-8.5],M.steel,12);
  cylinder(g,.31,.31,.18,[0,-1.25,-8.5],M.rubber,18,[0,0,Math.PI/2]);
  // wing navigation lights
  for(const x of [-10.8,10.8]) {
    sphere(g,.18,[x,-.04,-1],new THREE.MeshBasicMaterial({color:x<0?0xff4f4f:0x5be0aa}));
  }
  return g;
}
function makePerson({coat=M.jacket, trousers=M.pants, hair=M.hair, female=false}={}) {
  const root=new THREE.Group();
  const torso=box(root,"torso",[.78,1.05,.43],[0,1.58,0],coat);
  box(root,"shirt",[.3,.55,.46],[0,1.68,-.015],M.cream,false,false);
  const hips=box(root,"hips",[.7,.32,.4],[0,1.02,0],trousers);
  const head=sphere(root,.34,[0,2.38,0],M.skin,[.84,1.08,.86]);
  sphere(root,.35,[0,2.58,.04],hair,[1,.63,1]);
  // hair framing the face
  sphere(root,.19,[-.25,2.36,.05],hair,[.5,1.3,.7]);
  sphere(root,.19,[.25,2.36,.05],hair,[.5,1.3,.7]);
  const eyeMat=mat(0x25252a,.4);
  sphere(root,.035,[-.105,2.4,.29],eyeMat,[1,1,.5]);
  sphere(root,.035,[.105,2.4,.29],eyeMat,[1,1,.5]);
  const limbs={};
  for(const side of [-1,1]) {
    const arm=new THREE.Group(); arm.position.set(side*.48,1.92,0); root.add(arm);
    const sleeve=cylinder(arm,.13,.16,.78,[0,-.38,0],coat,12);
    sphere(arm,.13,[0,-.82,.01],M.skin,[.8,1,.8]);
    limbs[side<0?"leftArm":"rightArm"]=arm;
    const leg=new THREE.Group(); leg.position.set(side*.22,.91,0); root.add(leg);
    cylinder(leg,.17,.14,.82,[0,-.42,0],trousers,12);
    box(leg,"boot",[.34,.17,.5],[0,-.84,-.08],M.rubber);
    limbs[side<0?"leftLeg":"rightLeg"]=leg;
  }
  box(root,"belt",[.73,.12,.43],[0,1.06,0],M.gold,false,false);
  root.userData.limbs=limbs;
  return root;
}
const hangar=buildHangar();
const plane=buildPlane(); plane.rotation.y=Math.PI;
ground();

// Scenic pass: layered mountain horizon, perimeter lights, service roads and airfield detail.
{
  const ridgeMat=mat(0x667d80), ridgeFar=mat(0x9aada8), treeMat=mat(0x405b50), trunkMat=mat(0x62594a);
  for(let i=0;i<26;i++){
    const x=-155+i*12.4, z=-115-(i%3)*17, height=18+(i%7)*4;
    const peak=new THREE.Mesh(new THREE.ConeGeometry(17+(i%4)*3,height,5),i%2?ridgeMat:ridgeFar);
    peak.position.set(x,height*.45,z); peak.rotation.y=(i%5)*.31; peak.scale.z=.58; peak.castShadow=false; scene.add(peak);
    const snow=new THREE.Mesh(new THREE.ConeGeometry(5,height*.24,5),mat(0xc5cfca));
    snow.position.set(x,height*.84,z+.1); snow.castShadow=false; scene.add(snow);
  }
  // Distant tree line gives the horizon scale and depth.
  for(let i=0;i<76;i++){
    const x=-145+i*3.9, z=-32-(i%5)*5, h=3.5+(i%6)*.65;
    cylinder(scene,.13,.2,h*.38,[x,h*.19,z],trunkMat,7);
    const crown=new THREE.Mesh(new THREE.ConeGeometry(1.4+(i%3)*.25,h,7),treeMat);
    crown.position.set(x,h*.62,z); crown.castShadow=false; scene.add(crown);
  }
  // Apron markings, taxiway edge lights and small service equipment.
  for(let z=-8;z<125;z+=18){
    box(scene,"taxiway guide",[.16,.025,7],[19,-.12,z],M.gold,false,false);
    for(const x of [-21,21]){
      const lamp=new THREE.PointLight(0x9ec8d8,1.8,9,2); lamp.position.set(x,.55,z); scene.add(lamp);
      sphere(scene,.09,[x,.18,z],new THREE.MeshBasicMaterial({color:0xb8e5ed}),[1,1,1]);
    }
  }
  for(let i=0;i<7;i++){
    const x=31+(i%3)*5, z=-17-Math.floor(i/3)*13;
    box(scene,"service cart",[2.8,1.15,1.5],[x,.58,z],i%2?M.white:M.green);
    box(scene,"cart windshield",[1.7,.55,.06],[x,.95,z-.77],M.glass,false,false);
    for(const wx of [-.85,.85]) cylinder(scene,.35,.35,.18,[x+wx,.32,z],M.rubber,12,[0,0,Math.PI/2]);
  }
  // Clouds are broad, soft silhouettes rather than floating decorative dots.
  const cloudMat=new THREE.MeshBasicMaterial({color:0xe2e5df,transparent:true,opacity:.52,depthWrite:false});
  for(let i=0;i<13;i++){
    const cloud=new THREE.Group();
    for(let j=0;j<5;j++){
      const puff=new THREE.Mesh(new THREE.SphereGeometry(1,12,8),cloudMat);
      puff.position.set(j*2.1,Math.sin(j*1.7)*.45,0); puff.scale.set(2.8,1.05,1.5); cloud.add(puff);
    }
    cloud.position.set(-90+i*19,30+(i%4)*5,-95-(i%3)*18); cloud.scale.setScalar(1+(i%3)*.25); scene.add(cloud);
  }
}

const mara=makePerson({coat:M.jacket,trousers:M.pants,hair:M.hair,female:true});
mara.position.set(-9,0,10); scene.add(mara);
const elias=makePerson({coat:M.red,trousers:mat(0x343d43),hair:mat(0x393331)});
elias.position.set(-7,0,-3.5); elias.rotation.y=.35; scene.add(elias);
const manifest=box(scene,"flight manifest",[.65,.09,.9],[-1.2,1.51,-7],M.gold);
manifest.rotation.y=.35;
const crate=box(scene,"cargo crate",[1.8,1.5,1.8],[-1.2,.7,-7],mat(0x8a7960));
box(scene,"crate straps",[1.84,.1,1.84],[-1.2,.85,-7],M.gold,false,false);
const radio=box(scene,"radio console",[1.5,1.1,.7],[-7,1,-4.8],M.steel);
box(scene,"radio screen",[.9,.52,.08],[-7,.99,-4.42],new THREE.MeshBasicMaterial({color:0x6da6a6}));
const timeRing=new THREE.Mesh(new THREE.TorusGeometry(5,.12,12,96),new THREE.MeshBasicMaterial({color:0xe4c17a,transparent:true,opacity:.0}));
timeRing.position.set(5,4,-10); timeRing.rotation.x=0; scene.add(timeRing);
const ghost=plane.clone(); ghost.traverse(o=>{if(o.isMesh){o.material=o.material.clone();o.material.transparent=true;o.material.opacity=.16;o.material.depthWrite=false;o.material.emissive=new THREE.Color(0x315e70);o.material.emissiveIntensity=.7;}}); ghost.position.set(5,1.1,-7); ghost.visible=false; scene.add(ghost);
const ambientDust=new THREE.Group(); scene.add(ambientDust);
for(let i=0;i<95;i++){const d=sphere(ambientDust,.025,[Math.random()*38-18,Math.random()*8+.5,Math.random()*38-20],new THREE.MeshBasicMaterial({color:0xe5d5b5,transparent:true,opacity:.25}),[1,1,1]);d.castShadow=false;}
const sunDisc=new THREE.Mesh(new THREE.SphereGeometry(5,20,12),new THREE.MeshBasicMaterial({color:0xffdfad}));
sunDisc.position.set(-55,43,-110); scene.add(sunDisc);

const player={speed:0,heading:0,walk:0};
let state="title",introTime=0,gameTime=0,dialogueTimer=0,activeTarget=null,manifestRead=false,metElias=false,decisionMade="",soundOn=true,endingTimer=0,thoughtTimer=0;
const keys={};
const touch={up:false,down:false,left:false,right:false};
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function distance(a,b){return Math.hypot(a.x-b.x,a.z-b.z);}
function setObjective(s){$("objective").textContent=s;}
function showHud(show=true){$("hud").style.opacity=show?1:0;$("controls").style.opacity=show?1:0;$("sound").style.display=show?"block":"none";$("music").style.display=show?"block":"none";}
function think(words,duration=4){$("thoughtWords").textContent=words;$("thought").style.opacity=1;thoughtTimer=duration;}

let musicContext=null, musicMaster=null, musicTimer=null, musicEnabled=true, melodyStep=0;
function startScore(){
 if(!musicEnabled)return;const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;
 if(!musicContext){
  musicContext=new AC();musicMaster=musicContext.createGain();musicMaster.gain.value=.0001;musicMaster.connect(musicContext.destination);
  const filter=musicContext.createBiquadFilter();filter.type="lowpass";filter.frequency.value=1500;filter.connect(musicMaster);
  [110,164.81,220,329.63].forEach((hz,i)=>{const o=musicContext.createOscillator(),g=musicContext.createGain();o.type=i===1?"triangle":"sine";o.frequency.value=hz;g.gain.value=i===0?.12:.045;o.connect(g);g.connect(filter);o.start();});
  const notes=[440,523.25,659.25,587.33,523.25,392,440,329.63,392,493.88,440,329.63];
  const play=()=>{if(!musicContext||!musicEnabled)return;const now=musicContext.currentTime,f=notes[melodyStep++%notes.length],o=musicContext.createOscillator(),g=musicContext.createGain(),lp=musicContext.createBiquadFilter();o.type="sine";o.frequency.value=f;lp.type="lowpass";lp.frequency.value=1800;g.gain.setValueAtTime(.0001,now);g.gain.exponentialRampToValueAtTime(.07,now+.18);g.gain.exponentialRampToValueAtTime(.0001,now+2.1);o.connect(lp);lp.connect(g);g.connect(musicMaster);o.start(now);o.stop(now+2.2);};
  musicTimer=window.setInterval(play,2350);play();
 }
 musicContext.resume();musicMaster.gain.cancelScheduledValues(musicContext.currentTime);musicMaster.gain.setTargetAtTime(.72,musicContext.currentTime,.9);
}
function stopScore(){if(musicContext&&musicMaster)musicMaster.gain.setTargetAtTime(.0001,musicContext.currentTime,.25);}
function toggleMusic(){musicEnabled=!musicEnabled;$("music").textContent="MUSIC: "+(musicEnabled?"ON":"OFF");if(musicEnabled)startScore();else stopScore();}

function say(who,words,duration=4){
  $("speaker").textContent=who;$("words").textContent=words;$("caption").style.opacity=1;
  dialogueTimer=duration;
  if(soundOn && "speechSynthesis" in window){
    speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(words);u.rate=who==="MARA"?.96:who==="ELIAS"?.9:.88;u.pitch=who==="MARA"?1.02:who==="ELIAS"?.82:1.12;u.volume=.85;
    const vs=speechSynthesis.getVoices();const v=vs.find(x=>who==="ELIAS"?/male|david|daniel|mark/i.test(x.name):/female|samantha|aria|zira|jenny/i.test(x.name));if(v)u.voice=v;speechSynthesis.speak(u);
  }
}
function hideCaption(){ $("caption").style.opacity=0;if("speechSynthesis" in window)speechSynthesis.cancel();}
function smooth(a,b,t){return a+(b-a)*t;}
function ease(t){t=clamp(t,0,1);return t*t*(3-2*t);}
function v3(x,y,z){return new THREE.Vector3(x,y,z);}
const introKeys=[
  {t:0,p:v3(-24,18,38),look:v3(0,3,-8)},
  {t:4.4,p:v3(-17,10,17),look:v3(-5,2,-4)},
  {t:8.2,p:v3(-5,5,17),look:v3(-8,2,9)},
  {t:12,p:v3(15,8,7),look:v3(5,2,-7)},
  {t:16,p:v3(0,5,20),look:v3(-9,1.5,10)}
];
function keyCamera(t){
  let i=0;while(i<introKeys.length-2 && t>introKeys[i+1].t)i++;
  const a=introKeys[i],b=introKeys[i+1],u=ease((t-a.t)/(b.t-a.t));
  camera.position.lerpVectors(a.p,b.p,u);
  camera.lookAt(new THREE.Vector3().lerpVectors(a.look,b.look,u));
}
function beginGame(){
  startScore();
  $("title").style.opacity=0;setTimeout(()=>$("title").style.display="none",1050);
  $("skip").style.display="block";state="intro";introTime=0;showHud(false);
  say("CHILD","Mum? You promised you'd come home.",3.5);
}
function finishIntro(){
  state="explore";$("skip").style.display="none";showHud(true);
  setObjective("Find Elias near the hangar entrance. He has something to tell you.");
  say("MARA","One flight. Then I'm coming home.",3.2);
  camera.position.set(mara.position.x,5,mara.position.z+9);camera.lookAt(mara.position.x,1.5,mara.position.z);
}
function skipIntro(){introTime=16.2;finishIntro();}
function startChoice(){
  state="choice";hideCaption();$("choice").style.display="grid";requestAnimationFrame(()=>$("choice").style.opacity=1);
  ghost.visible=true;timeRing.material.opacity=.72;
  setObjective("A decision will define this timeline.");
}
function finishEnding(choice){
  decisionMade=choice;state="ending";endingTimer=0;
  $("choice").style.opacity=0;setTimeout(()=>$("choice").style.display="none",900);
  $("endingTitle").innerHTML=choice==="signal"?"THE SIGNAL<br>ANSWERED.":"THE PROMISE<br>KEPT.";
  $("endingText").textContent=choice==="signal"
    ?"Mara follows the impossible transmission. Somewhere beyond this sky, another version of her finally hears an answer."
    :"Mara holds her course. The clinic receives what it needs, but the second signal keeps calling from a timeline she cannot see.";
  $("ending").style.display="grid";requestAnimationFrame(()=>$("ending").style.opacity=1);
  setObjective(choice==="signal"?"Timeline impact: an unknown voice was heard.":"Timeline impact: the clinic received its supplies.");
}
function interact(){
  if(state!=="explore")return;
  if(activeTarget==="elias"){
    metElias=true;state="talk";think("Two aircraft. One flight plan. Why does the second one have my name?",4.5);
    say("ELIAS","Mara. Your flight has appeared twice on the radar. Same aircraft. Same call sign. Two different times.",6);
    setObjective("The manifest is beside the cargo crate. Find out what changed.");
    setTimeout(()=>{if(state==="talk")state="explore";},6100);
  } else if(activeTarget==="manifest" && metElias && !manifestRead){
    manifestRead=true;manifest.material=M.gold;state="manifest";think("I did not write tomorrow. So who did?",4.2);
    say("MARA","This flight log is dated tomorrow. But the departure stamp is mine.",5);
    setObjective("Board the aircraft. Something is waiting in the cockpit.");
    setTimeout(()=>{if(state==="manifest")state="explore";},5100);
  } else if(activeTarget==="cockpit" && manifestRead){
    state="anomaly";hideCaption();think("That voice sounded exactly like me. But I have never said those words.",4.5);say("CONTROL","Mara, do not take off. We have another you on the runway.",5);
    setObjective("The timeline is splitting...");
    plane.rotation.y=.025;ghost.visible=true;timeRing.material.opacity=.85;
    setTimeout(()=>say("MARA","Then who just answered my radio?",4),3900);
    setTimeout(()=>{if(state==="anomaly")startChoice();},8200);
  }
}
function findTarget(){
  activeTarget=null;let best=3.2;
  const p=mara.position;
  const targets=[
    {id:"elias",obj:elias,label:"SPEAK TO ELIAS",enabled:!metElias},
    {id:"manifest",obj:crate,label:"INSPECT THE FLIGHT MANIFEST",enabled:metElias&&!manifestRead},
    {id:"cockpit",obj:plane,label:"BOARD THE AIRCRAFT",enabled:manifestRead}
  ];
  for(const t of targets){if(!t.enabled)continue;const d=distance(p,t.obj.position);if(d<best){best=d;activeTarget=t.id;$("promptText").textContent=t.label;}}
  $("prompt").style.opacity=activeTarget?"1":"0";
}
function updateIntro(dt){
  introTime+=dt;keyCamera(introTime);
  const L=mara.userData.limbs;
  mara.position.x=-9+Math.sin(introTime*.45)*.25;
  L.leftArm.rotation.x=Math.sin(introTime*2)*.08;
  L.rightArm.rotation.x=-Math.sin(introTime*2)*.08;
  if(introTime>2.2 && introTime<2.3)think("I told her I would be back before the stars came out.",4.1);
  if(introTime>5.2 && introTime<5.3)say("MARA","I know, little star. One flight. Then I'm yours.",3.5);
  if(introTime>9.3 && introTime<9.4)say("CONTROL","Flight 001, your departure time is not matching the tower clock.",4);
  if(introTime>13.2 && introTime<13.3){think("Tomorrow? Then why do I remember landing?",3.4);say("MARA","Control... what do you mean, tomorrow?",3.5);}
  if(introTime>17){hideCaption();finishIntro();}
}
function updateAnomaly(dt){
  timeRing.rotation.z+=dt*.35;timeRing.scale.setScalar(1+Math.sin(gameTime*2)*.045);
  ghost.position.x=plane.position.x+Math.sin(gameTime*.8)*.25;
  ghost.position.z=plane.position.z-.5;
  ghost.rotation.y=Math.sin(gameTime*.6)*.025;
  if(state==="anomaly")camera.position.lerp(v3(13,8,9),Math.min(1,dt*.25));
}
function update(dt){
  gameTime+=dt;thoughtTimer-=dt;if(thoughtTimer<=0)$("thought").style.opacity=0;dialogueTimer-=dt;if(dialogueTimer<=0 && $("caption").style.opacity!=="0")hideCaption();
  if(state==="intro")updateIntro(dt);
  if(state==="explore"){movePlayer(dt);followCamera(dt);findTarget();}
  if(state==="talk"||state==="manifest"){followCamera(dt);findTarget();}
  if(state==="anomaly"||state==="choice")updateAnomaly(dt);
  if(state==="ending")updateEnding(dt);
  ambientDust.children.forEach((d,i)=>{d.position.y+=Math.sin(gameTime*.7+i)*.0009;d.position.x+=Math.sin(gameTime*.3+i)*.0005;});
  renderer.render(scene,camera);
}
function animate(){requestAnimationFrame(animate);const dt=Math.min(clock.getDelta(),.04);update(dt);}
addEventListener("resize",()=>{
  camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();
  renderer.setSize(innerWidth,innerHeight);renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.5));
});
addEventListener("keydown",e=>{keys[e.code]=true;if(["ArrowUp","ArrowDown","ArrowLeft","ArrowRight","Space"].includes(e.code))e.preventDefault();if(e.code==="KeyE"||e.code==="Enter")interact();});
addEventListener("keyup",e=>keys[e.code]=false);
$("enter").addEventListener("click",beginGame);
$("skip").addEventListener("click",skipIntro);
$("act").addEventListener("click",interact);
$("follow").addEventListener("click",()=>finishEnding("signal"));
$("deliver").addEventListener("click",()=>finishEnding("promise"));
$("again").addEventListener("click",()=>location.reload());
$("music").addEventListener("click",toggleMusic);
$("sound").addEventListener("click",()=>{soundOn=!soundOn;$("sound").textContent="SOUND: "+(soundOn?"ON":"OFF");if(!soundOn&&"speechSynthesis"in window)speechSynthesis.cancel();});
document.addEventListener("visibilitychange",()=>{if(document.hidden)stopScore();else if(musicEnabled&&state!=="title")startScore();});
for(const [id,dir] of [["up","up"],["down","down"],["left","left"],["right","right"]]){
  const b=$(id);b.addEventListener("pointerdown",e=>{e.preventDefault();touch[dir]=true;b.setPointerCapture(e.pointerId);});
  ["pointerup","pointercancel","lostpointercapture"].forEach(ev=>b.addEventListener(ev,()=>touch[dir]=false));
}

// Camera orbit and expanded movement. Mouse/touch drag rotates the follow camera.
let orbitYaw=0, orbitPitch=.12, dragging=false, lastPointerX=0, lastPointerY=0, jumpVelocity=0, onGround=true;
renderer.domElement.style.cursor="grab";
renderer.domElement.addEventListener("pointerdown",e=>{if(e.pointerType==="mouse"&&e.button!==0)return;dragging=true;lastPointerX=e.clientX;lastPointerY=e.clientY;renderer.domElement.setPointerCapture(e.pointerId);});
renderer.domElement.addEventListener("pointermove",e=>{
  if(!dragging)return;
  const dx=e.clientX-lastPointerX, dy=e.clientY-lastPointerY; lastPointerX=e.clientX;lastPointerY=e.clientY;
  orbitYaw-=dx*.004; orbitPitch=clamp(orbitPitch+dy*.003,-.12,.48);
});
["pointerup","pointercancel","lostpointercapture"].forEach(ev=>renderer.domElement.addEventListener(ev,()=>dragging=false));
function movePlayer(dt){
  let f=(keys.KeyW||keys.ArrowUp||touch.up?1:0)-(keys.KeyS||keys.ArrowDown||touch.down?1:0);
  let s=(keys.KeyD||keys.ArrowRight||touch.right?1:0)-(keys.KeyA||keys.ArrowLeft||touch.left?1:0);
  const mag=Math.hypot(f,s); if(mag>0){f/=mag;s/=mag;}
  const running=keys.ShiftLeft||keys.ShiftRight;
  const speed=running?10.5:6.1;
  const sin=Math.sin(orbitYaw), cos=Math.cos(orbitYaw);
  const dx=(s*cos+f*sin)*speed*dt, dz=(s*sin-f*cos)*speed*dt;
  if(mag>0){
    mara.position.x=clamp(mara.position.x+dx,-35,35);
    mara.position.z=clamp(mara.position.z+dz,-38,52);
    mara.rotation.y=Math.atan2(dx,-dz); player.walk+=dt*(running?15:9);
  }
  if((keys.Space||keys.KeyJ)&&onGround){jumpVelocity=5.2;onGround=false;}
  jumpVelocity-=15*dt; mara.position.y+=jumpVelocity*dt;
  if(mara.position.y<=0){mara.position.y=0;jumpVelocity=0;onGround=true;}
  player.speed=smooth(player.speed,mag,Math.min(1,dt*9));
  const L=mara.userData.limbs;
  L.leftArm.rotation.x=Math.sin(player.walk)*.62*player.speed;
  L.rightArm.rotation.x=-Math.sin(player.walk)*.62*player.speed;
  L.leftLeg.rotation.x=-Math.sin(player.walk)*.72*player.speed;
  L.rightLeg.rotation.x=Math.sin(player.walk)*.72*player.speed;
  mara.position.y+=Math.abs(Math.sin(player.walk*2))*.035*player.speed*(onGround?1:0);
}
function followCamera(dt){
  const distanceBack=10.5, height=3.3+orbitPitch*9;
  const offsetX=Math.sin(orbitYaw)*distanceBack, offsetZ=Math.cos(orbitYaw)*distanceBack;
  const target=v3(mara.position.x+offsetX,height+mara.position.y,mara.position.z+offsetZ);
  camera.position.lerp(target,1-Math.pow(.0008,dt));
  camera.lookAt(mara.position.x,1.65+mara.position.y,mara.position.z);
}

function updateEnding(dt){
  endingTimer+=dt;timeRing.rotation.z+=dt*.8;
  timeRing.material.opacity=.35+Math.sin(endingTimer*3)*.3;
  ghost.position.y=1.8+Math.sin(endingTimer*1.8)*.8;
  ghost.position.x=5+Math.sin(endingTimer*.65)*1.4;
  plane.position.y=1.8+Math.sin(endingTimer*2.5)*.25;
  const target=v3(12+Math.sin(endingTimer*.16)*12,10,-28-endingTimer*.25);
  camera.position.lerp(target,Math.min(1,dt*.18));camera.lookAt(5,2,-7);
  if(endingTimer>5.8 && !$("stinger").dataset.shown){
    $("stinger").dataset.shown="yes";
    $("ending").style.opacity=0;
    setTimeout(()=>{
      $("ending").style.display="none";
      $("stinger").style.display="grid";
      requestAnimationFrame(()=>$("stinger").style.opacity=1);
      say("UNKNOWN VOICE","Mara... don't come home. I'm already here.",5);
    },900);
  }
}
$("title").style.display="grid";

animate();
