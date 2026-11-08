import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";

const stage=document.querySelector(".stage");
const fallback=document.getElementById("world");
const host=document.createElement("div");
host.id="world3d";
stage.insertBefore(host,stage.firstChild);

let renderer,scene,camera,avatar,plane,clock,flightStart=0;
const markers=[];
const mat=(color,roughness=0.82,metalness=0)=>new THREE.MeshStandardMaterial({color,roughness,metalness});
const mapX=x=>(x-480)/65;
const mapZ=y=>(y-350)/65;
const game=()=>window.__ctState;

function addBox(parent,x,y,z,w,h,d,material,rx=0,ry=0,rz=0){
 const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material);
 m.position.set(x,y,z);m.rotation.set(rx,ry,rz);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;
}
function addSphere(parent,x,y,z,r,material){
 const m=new THREE.Mesh(new THREE.SphereGeometry(r,18,14),material);m.position.set(x,y,z);m.castShadow=true;parent.add(m);return m;
}
function addLabel(text){
 const c=document.createElement("canvas");c.width=512;c.height=96;
 const g=c.getContext("2d");g.fillStyle="rgba(5,18,32,.86)";g.beginPath();g.roundRect(4,4,504,88,18);g.fill();
 g.font="bold 32px Arial";g.textAlign="center";g.fillStyle="#f5d88e";g.fillText(text,256,61);
 const tex=new THREE.CanvasTexture(c);tex.colorSpace=THREE.SRGBColorSpace;
 const s=new THREE.Sprite(new THREE.SpriteMaterial({map:tex,transparent:true,depthTest:false}));
 s.scale.set(3.5,.66,1);return s;
}
function makePerson(parent,x,z,shirt,skin,isMara=false){
 const root=new THREE.Group();root.position.set(x,0,z);parent.add(root);
 const torso=addBox(root,0,.83,0,.48,.72,.27,mat(shirt),0,0,0);
 const head=addSphere(root,0,1.42,0,.22,mat(skin));
 const hair=addSphere(root,0,1.53,-.035,.225,mat(isMara?"#283342":"#332b27"));
 hair.scale.set(1,.72,.95);
 const armMat=mat(isMara?"#d7e7f2":shirt),legMat=mat("#27384a");
 const limbs=[];
 for(const side of [-1,1]){
  const arm=new THREE.Group();arm.position.set(side*.31,1.08,0);root.add(arm);
  addBox(arm,0,-.25,0,.14,.52,.15,armMat);limbs.push(arm);
  const leg=new THREE.Group();leg.position.set(side*.13,.48,0);root.add(leg);
  addBox(leg,0,-.22,0,.17,.48,.19,legMat);limbs.push(leg);
 }
 if(isMara){addBox(root,0,.9,.15,.26,.1,.025,mat("#f2c96c"));addBox(root,-.18,1.05,.02,.13,.13,.3,mat("#c1d9e7"));}
 root.userData.limbs=limbs;root.userData.torso=torso;return root;
}
function makePlane(){
 const root=new THREE.Group();
 const white=mat("#e6edf0",.38,.12),blue=mat("#527d94",.4,.16),glass=mat("#294d65",.2,.25),dark=mat("#26394b");
 addBox(root,0,0,0,.72,.55,3.9,white);
 addBox(root,0,-.03,-2.05,.6,.42,.8,white);
 addBox(root,0,-.02,-.95,.58,.32,.72,glass);
 addBox(root,0,-.03,.05,6.2,.14,1.05,white);
 addBox(root,0,.26,1.58,1.9,.1,.55,white);
 addBox(root,0,.7,1.67,.16,1,.5,blue);
 for(const side of [-1,1]){
  const wheel=new THREE.Mesh(new THREE.CylinderGeometry(.14,.14,.1,16),dark);wheel.rotation.z=Math.PI/2;wheel.position.set(side*.34,-.46,.85);root.add(wheel);
  const stripe=addBox(root,side*1.5,.06,.05,.7,.025,.08,blue);stripe.rotation.y=side*.08;
 }
 const prop=new THREE.Group();prop.position.set(0,0,-2.45);root.add(prop);
 for(let i=0;i<3;i++){const blade=addBox(prop,0,0,0,.08,1.15,.06,dark);blade.rotation.z=i*Math.PI/3;}
 root.userData.prop=prop;return root;
}
function marker(id,x,z,title){
 const group=new THREE.Group();group.position.set(x,.08,z);scene.add(group);
 const ring=new THREE.Mesh(new THREE.TorusGeometry(.43,.045,10,36),mat("#f3c86b",.32,.2));ring.rotation.x=Math.PI/2;group.add(ring);
 const orb=addSphere(group,0,.48,0,.15,mat("#ffe5a0",.2,.15));
 const tag=addLabel(title);tag.position.set(0,1.25,0);group.add(tag);
 markers.push({id,group,ring,orb});
}
function buildAirfield(){
 const ground=addBox(scene,0,-.28,0,38,.5,30,mat("#789174"));ground.receiveShadow=true;
 addBox(scene,0,.005,3,12,.035,27,mat("#52646c"));
 const stripe=mat("#e5dfc2");
 for(let z=-9;z<15;z+=4)addBox(scene,0,.04,z,.17,.025,1.6,stripe);
 const hangar=new THREE.Group();scene.add(hangar);
 addBox(hangar,-10,1.9,-7,9,3.8,6,mat("#d2c4a7"));
 const roof=new THREE.Mesh(new THREE.ConeGeometry(6.4,2.2,4),mat("#80624e"));roof.position.set(-10,4.9,-7);roof.rotation.y=Math.PI/4;roof.castShadow=true;hangar.add(roof);
 addBox(hangar,-10,1.25,-3.92,4.8,2.5,.12,mat("#8eafb2"));
 for(const x of [-12.7,-10,-7.3])addBox(hangar,x,2.8,-3.89,1.25,.8,.05,mat("#91bdc9"));
 const tower=new THREE.Group();scene.add(tower);
 addBox(tower,7,2,-7,3.4,4,3.4,mat("#c8d4d3"));
 addBox(tower,7,4,-7,4.1,.5,4.1,mat("#647d87"));
 addBox(tower,7,3.2,-5.24,2.8,1,.08,mat("#284e65"));
 const board=addLabel("FLIGHT INFORMATION");board.position.set(7,5,-7);scene.add(board);
 for(let i=0;i<12;i++){
  const x=-17+i*3.1;
  const trunk=addBox(scene,x,.8,11,.28,1.6,.28,mat("#80654d"));
  const crown=addSphere(scene,x,2,11,.95,mat(i%2?"#587b64":"#6d896d"));crown.scale.set(1,1.15,1);
 }
 for(let i=0;i<8;i++){
  const hill=new THREE.Mesh(new THREE.ConeGeometry(3+Math.random()*2,4+Math.random()*4,6),mat(i%2?"#718d8b":"#8aa29a"));
  hill.position.set(-18+i*5,-.1,-17-Math.random()*4);hill.castShadow=true;scene.add(hill);
 }
 const crew=makePerson(scene,mapX(300),mapZ(315),"#d88b54","#d5a77f",false);
 crew.scale.setScalar(1.03);
 plane=makePlane();plane.position.set(0,.58,0);scene.add(plane);
 avatar=makePerson(scene,mapX(130),mapZ(385),"#d7e7f2","#e0b18f",true);
 const points={crew:[300,315],cargo:[510,390],radio:[690,280],weather:[790,420]};
 const names={crew:"GROUND CREW",cargo:"MEDICAL CARGO",radio:"RADIO DESK",weather:"WEATHER BOARD"};
 Object.keys(points).forEach(id=>marker(id,mapX(points[id][0]),mapZ(points[id][1]),names[id]));
}
function build(){
 scene=new THREE.Scene();scene.background=new THREE.Color("#9bc9d9");scene.fog=new THREE.Fog("#9bc9d9",25,58);
 camera=new THREE.PerspectiveCamera(52,1,.1,140);
 renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,powerPreference:"high-performance"});
 renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.5));renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
 renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.08;
 host.appendChild(renderer.domElement);fallback.style.display="none";
 scene.add(new THREE.HemisphereLight("#e8f7ff","#596b52",2.1));
 const sun=new THREE.DirectionalLight("#fff0d2",2.8);sun.position.set(-9,16,-8);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);scene.add(sun);
 buildAirfield();clock=new THREE.Clock();resize();window.addEventListener("resize",resize);
 animate();
}
function resize(){
 if(!renderer)return;const w=Math.max(1,stage.clientWidth),h=Math.max(1,stage.clientHeight);
 renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();
}
function animate(){
 requestAnimationFrame(animate);
 const st=game(),now=performance.now();
 if(st&&avatar){
  if(st.scene==="airfield"){
   avatar.visible=true;plane.visible=true;
   const p=st.player;avatar.position.set(mapX(p.x),0,mapZ(p.y));
   const moving=!!(window.__ctMoving);
   const swing=moving?Math.sin(now*.012)*.48:Math.sin(now*.002)*.025;
   avatar.userData.limbs.forEach((limb,i)=>{limb.rotation.x=(i%2===0?1:-1)*swing;});
   const desired=new THREE.Vector3(avatar.position.x+3.1,3.1,avatar.position.z+5.4);
   camera.position.lerp(desired,.12);camera.lookAt(avatar.position.x,1.05,avatar.position.z);
   markers.forEach(m=>{
    const active=st.found.has(m.id);m.group.visible=!active;
    m.ring.rotation.z+=.009;m.orb.position.y=.48+Math.sin(now*.003)*.09;
   });
   scene.background.set("#9bc9d9");scene.fog.color.set("#9bc9d9");
  }else{
   avatar.visible=false;markers.forEach(m=>m.group.visible=false);
   if(!flightStart)flightStart=now;
   const t=(now-flightStart)/1000;
   plane.visible=true;plane.position.set(Math.sin(t*.22)*.8,1.4+Math.min(t*.18,2.1),-t*1.1);
   plane.rotation.z=Math.sin(t*.4)*.025;plane.rotation.x=-.035;
   plane.userData.prop.rotation.z+=.55;
   scene.background.set("#668da4");scene.fog.color.set("#668da4");
   const desired=new THREE.Vector3(plane.position.x+4,plane.position.y+3.2,plane.position.z+8);
   camera.position.lerp(desired,.055);camera.lookAt(plane.position.x,plane.position.y,plane.position.z-2);
  }
 }
 renderer.render(scene,camera);
}
try{build();window.__ct3dReady=true;}
catch(error){console.error("3D scene failed; using 2D fallback.",error);host.remove();fallback.style.display="block";}
