import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";

const stage = document.querySelector(".stage");
const fallback = document.getElementById("world");
const host = document.createElement("div");
host.id = "world3d";
stage.insertBefore(host, stage.firstChild);

let renderer, scene3d, camera, avatar, plane, clock;
const markers = [];
const mats = {};
const state = () => window.__ctState;
const mapX = x => (x - 480) / 65;
const mapZ = y => (y - 350) / 65;

function material(color, roughness=0.8, metalness=0) {
  return new THREE.MeshStandardMaterial({color, roughness, metalness});
}
function box(parent, name, x,y,z, sx,sy,sz, mat, rx=0,ry=0,rz=0) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(sx,sy,sz), mat);
  mesh.name=name; mesh.position.set(x,y,z); mesh.rotation.set(rx,ry,rz); parent.add(mesh); return mesh;
}
function cylinder(parent,x,y,z,r1,r2,h,mat,segments=20) {
  const mesh=new THREE.Mesh(new THREE.CylinderGeometry(r1,r2,h,segments),mat);
  mesh.position.set(x,y,z);parent.add(mesh);return mesh;
}
function sphere(parent,x,y,z,r,mat) {
  const mesh=new THREE.Mesh(new THREE.SphereGeometry(r,20,14),mat);
  mesh.position.set(x,y,z);parent.add(mesh);return mesh;
}
function label(text, color="#f3d17a") {
  const c=document.createElement("canvas");c.width=512;c.height=96;
  const g=c.getContext("2d");g.fillStyle="rgba(5,18,32,.78)";
  g.roundRect(4,4,504,88,18);g.fill();g.font="bold 34px Arial";
  g.textAlign="center";g.fillStyle=color;g.fillText(text,256,61);
  const tex=new THREE.CanvasTexture(c);tex.colorSpace=THREE.SRGBColorSpace;
  const sprite=new THREE.Sprite(new THREE.SpriteMaterial({map:tex,transparent:true,depthTest:false}));
  sprite.scale.set(3.8,.72,1);return sprite;
}
function person(parent,x,z,shirt,skin="#b98261",isMara=false) {
  const group=new THREE.Group();group.position.set(x,0,z);parent.add(group);
  cylinder(group,0,.55,0,.19,.22,.85,material(shirt));
  sphere(group,0,1.12,0,.19,material(skin));
  sphere(group,0,1.23,-.015,.2,material(isMara?"#202b3a":"#302a27"));
  if(isMara) box(group,"flight-suit-detail",0,.66,.205,.22,.08,.025,material("#f2c96c"));
  return group;
}
function makePlane(parent) {
  const group=new THREE.Group();group.position.set(0,.55,0);parent.add(group);
  const white=material("#dce7ec",.35,.18),blue=material("#527d94",.35,.2),glass=material("#294d65",.18,.25);
  box(group,"fuselage",0,0,0,.62,.48,3.2,white);
  box(group,"nose",0,-.03,-1.75,.52,.38,.65,white,0,0,0);
  box(group,"wing",0,-.02,-.05,5.1,.12,.85,white);
  box(group,"tail-wing",0,.25,1.25,1.65,.09,.45,white);
  box(group,"tail-fin",0,.65,1.35,.12,.9,.42,blue);
  box(group,"cockpit",0,.28,-.82,.48,.3,.65,glass);
  for(const x of [-.22,.22]) cylinder(group,x,-.32,.8,.08,.08,.42,material("#26394b"),12);
  return group;
}
function makeMarker(id,x,z,title) {
  const group=new THREE.Group();group.position.set(x,.1,z);scene3d.add(group);
  const ring=new THREE.Mesh(new THREE.TorusGeometry(.35,.035,8,32),material("#f3c86b",.35,.25));
  ring.rotation.x=Math.PI/2;group.add(ring);
  const orb=sphere(group,0,.35,0,.12,material("#ffe4a0",.25,.15));
  const tag=label(title);tag.position.set(0,1.05,0);group.add(tag);
  markers.push({id,group,ring,orb});return group;
}
function build() {
  scene3d=new THREE.Scene();scene3d.background=new THREE.Color("#91bfd0");scene3d.fog=new THREE.Fog("#91bfd0",22,65);
  camera=new THREE.PerspectiveCamera(55,1,.1,120);
  renderer=new THREE.WebGLRenderer({antialias:true,alpha:false});
  renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.7));renderer.shadowMap.enabled=true;
  renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.outputColorSpace=THREE.SRGBColorSpace;
  renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.12;
  host.appendChild(renderer.domElement);fallback.style.display="none";
  const hemi=new THREE.HemisphereLight("#e4f6ff","#526b55",2.1);scene3d.add(hemi);
  const sun=new THREE.DirectionalLight("#fff1d1",3.1);sun.position.set(-8,14,-5);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);scene3d.add(sun);
  const ground=box(scene3d,"airfield-ground",0,-.25,0,42,.5,34,material("#718b72"));ground.receiveShadow=true;
  box(scene3d,"runway",0,.015,3,13,.035,28,material("#4d626b"));
  const stripeMat=material("#e5dfc2");
  for(let z=-9;z<15;z+=4)box(scene3d,"runway-mark",0,.04,z,.16,.025,1.5,stripeMat);
  const hangar= new THREE.Group();scene3d.add(hangar);
  box(hangar,"hangar-body",-10,2,-7,9,4,6,material("#c9b99a"));
  const roof= new THREE.Mesh(new THREE.ConeGeometry(6.2,2.2,4),material("#765c4b"));roof.position.set(-10,5,-7);roof.rotation.y=Math.PI/4;hangar.add(roof);
  box(hangar,"hangar-door",-10,1.4,-3.92,4.4,2.8,.12,material("#8aa8a8"));
  box(scene3d,"info-board",5,1.8,-7,6,.12,3,material("#1c4057"));
  const boardTag=label("FLIGHT INFORMATION","#e9f4f8");boardTag.position.set(5,3.2,-7);scene3d.add(boardTag);
  plane=makePlane(scene3d);plane.position.set(0,.5,0);
  person(scene3d,mapX(300),mapZ(315),"#d88b54");
  avatar=person(scene3d,mapX(130),mapZ(385),"#d7e7f2","#e0b18f",true);
  const pos={crew:[300,315],cargo:[510,390],radio:[690,280],weather:[790,420]};
  const names={crew:"GROUND CREW",cargo:"MEDICAL CARGO",radio:"RADIO DESK",weather:"WEATHER BOARD"};
  for(const id of Object.keys(pos))makeMarker(id,mapX(pos[id][0]),mapZ(pos[id][1]),names[id]);
  // Low ridges frame the airfield without blocking exploration.
  for(let i=0;i<9;i++){const m=new THREE.Mesh(new THREE.ConeGeometry(3+Math.random()*2,4+Math.random()*5,5),material(i%2?"#6d8990":"#829a91"));m.position.set(-19+i*5,-.2,-17-Math.random()*5);scene3d.add(m);}
  clock=new THREE.Clock();resize();window.addEventListener("resize",resize);animate();
}
function resize(){if(!renderer)return;const w=host.clientWidth||stage.clientWidth,h=host.clientHeight||w*9/16;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();}
function animate(){
  requestAnimationFrame(animate);
  const st=state();
  if(st&&avatar){
    const p=st.player;avatar.position.set(mapX(p.x),0,mapZ(p.y));
    const target=new THREE.Vector3(avatar.position.x+5,4.2,avatar.position.z+6.8);
    camera.position.lerp(target,.09);camera.lookAt(avatar.position.x,1,avatar.position.z);
    const air=st.scene==="airfield";
    plane.visible=air;
    markers.forEach(m=>{const active=st.found.has(m.id);m.group.visible=air&&!active;m.ring.rotation.z+=.012;m.orb.position.y=.35+Math.sin(performance.now()*.003)*.08;});
    if(!air){scene3d.background.set("#567d91");scene3d.fog.color.set("#567d91");}
    else{scene3d.background.set("#91bfd0");scene3d.fog.color.set("#91bfd0");}
  }
  renderer.render(scene3d,camera);
}
try{build();window.__ct3dReady=true;}
catch(err){console.error("3D scene could not start:",err);host.remove();fallback.style.display="block";}
