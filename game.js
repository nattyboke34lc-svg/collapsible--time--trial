import * as THREE from 'three';

const stage=document.querySelector('#stage');
const scene=new THREE.Scene(); scene.background=new THREE.Color(0xb8dce8); scene.fog=new THREE.Fog(0xb8dce8,32,115);
const camera=new THREE.PerspectiveCamera(54,innerWidth/innerHeight,.1,220);
const renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(devicePixelRatio,1.65));renderer.setSize(innerWidth,innerHeight);renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.18;stage.appendChild(renderer.domElement);
scene.add(new THREE.HemisphereLight(0xe8f7ff,0x9c8068,2.15));
const sun=new THREE.DirectionalLight(0xffe5b5,3.2);sun.position.set(-16,27,13);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);sun.shadow.camera.left=-35;sun.shadow.camera.right=35;sun.shadow.camera.top=35;sun.shadow.camera.bottom=-35;scene.add(sun);
const mat=(color,roughness=1)=>new THREE.MeshStandardMaterial({color,roughness,flatShading:true});
const paper=(color)=>new THREE.MeshStandardMaterial({color,roughness:.94,flatShading:true});
const cream=paper(0xf8e9ce),white=paper(0xfff8e9),blue=paper(0x66899c),blue2=paper(0x9cbac2),navy=paper(0x344f67),coral=paper(0xd99c82),gold=paper(0xd9b775),green=paper(0x9db99d),dark=paper(0x415b63);
function box(parent,w,h,d,material,x,y,z,opts={}){const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;if(opts.rot)m.rotation.set(...opts.rot);parent.add(m);return m}
function cone(parent,r1,r2,h,material,x,y,z,seg=5){const m=new THREE.Mesh(new THREE.CylinderGeometry(r1,r2,h,seg),material);m.position.set(x,y,z);m.castShadow=true;parent.add(m);return m}
function sphere(parent,r,material,x,y,z,scale=[1,1,1]){const m=new THREE.Mesh(new THREE.IcosahedronGeometry(r,1),material);m.position.set(x,y,z);m.scale.set(...scale);m.castShadow=true;parent.add(m);return m}
function group(parent,x=0,y=0,z=0){const g=new THREE.Group();g.position.set(x,y,z);parent.add(g);return g}
// Ground and folded runway
const ground=new THREE.Mesh(new THREE.PlaneGeometry(240,240),paper(0xd9e4d2));ground.rotation.x=-Math.PI/2;ground.position.y=-.18;ground.receiveShadow=true;scene.add(ground);
const runway=box(scene,12,.18,82,paper(0xd6c1a7),0,-.02,-8);runway.receiveShadow=true;
for(let z=-44;z<31;z+=8)box(scene,.22,.025,3,white,0,.09,z);
for(let side of [-1,1]){box(scene,.18,.06,84,gold,side*6.2,.08,-8);}
// distant hills
for(let i=0;i<15;i++){const x=(i-7)*12;const h=4+(i*7%8);const hill=new THREE.Mesh(new THREE.ConeGeometry(8,h,5),paper(i%2?0xaac5b8:0x9db9b4));hill.position.set(x,h/2-1,-48-(i%3)*7);hill.rotation.y=i*.4;hill.receiveShadow=true;scene.add(hill)}
// folded paper cloud clusters
const clouds=[];for(let i=0;i<13;i++){const c=group(scene,(i-6)*13,11+(i%3)*2,-42-(i%4)*13);for(let j=0;j<5;j++)sphere(c,1.7,white,(j-2)*1.6,(j%2)*.65,Math.sin(j)*.7,[1.4,.8,1]);clouds.push(c)}
// Hangar shell behind the player
const hangar=group(scene,0,0,-32);box(hangar,38,12,1.2,paper(0xe9d8bd),0,6,0);box(hangar,40,.8,1.8,paper(0xc8b49a),0,12.3,0);
const roof=new THREE.Mesh(new THREE.ConeGeometry(23,7,4),paper(0xd6c4a9));roof.position.set(0,15,-.3);roof.rotation.y=Math.PI/4;roof.scale.set(1,.65,.58);roof.castShadow=true;hangar.add(roof);
for(let x of [-18,-9,0,9,18])box(hangar,.35,11,.5,gold,x,5.7,.7);
const hangarDoor=box(hangar,12,8,.25,paper(0x8daeb4),0,4,1.1);for(let x=-5;x<=5;x+=2.5)box(hangar,.09,8,.12,white,x,4,1.27);
// trees as folded paper
for(let i=0;i<24;i++){let side=i%2?1:-1,z=-45+i*3.7;let x=side*(13+(i%4)*2);const tr=group(scene,x,0,z);cone(tr,.22,.35,1.5,paper(0x9c795f),0,.65,0,5);for(let k=0;k<3;k++){const leaf=new THREE.Mesh(new THREE.ConeGeometry(1.3,2.5,5),paper(k%2?0x91b49a:0xa9c6a4));leaf.position.y=1.9+k*1.15;leaf.rotation.y=k*.8;leaf.castShadow=true;tr.add(leaf)}}
// Aircraft: original small passenger plane, parked facing toward camera
const plane=group(scene,0,2,-13);
const fus=new THREE.Mesh(new THREE.CapsuleGeometry(1.25,13,5,8),paper(0xf7f0e3));fus.rotation.x=Math.PI/2;fus.scale.set(.88,.85,1);fus.castShadow=true;plane.add(fus);
const nose=new THREE.Mesh(new THREE.ConeGeometry(1.12,3.5,8),paper(0xe7d7bd));nose.rotation.x=-Math.PI/2;nose.position.z=8.1;nose.castShadow=true;plane.add(nose);
box(plane,17,.22,3.5,white,0,-.35,-.2,{rot:[0,0,0]});box(plane,7,.18,2.4,white,0,.25,-6.4);
for(let s of [-1,1]){const engine=new THREE.Mesh(new THREE.CylinderGeometry(.56,.65,2.4,9),paper(0x9cb5bc));engine.rotation.x=Math.PI/2;engine.position.set(s*4.2,-.75,.1);engine.castShadow=true;plane.add(engine);sphere(plane,.55,navy,s*4.2,-.75,1.15,[1,.5,1]);}
for(let i=0;i<7;i++){const win=sphere(plane,.18,blue2,-.65+i*.22,.82,0,[.7,.7,.25]);}
// Wing details, tail, propeller
const tail=box(plane,3,.18,2,white,0,.5,-7.5);tail.rotation.z=.1;box(plane,.22,2.6,1.7,white,0,1.55,-7.5);
const prop=group(plane,0,0,10.1);for(let i=0;i<3;i++){const blade=box(prop,.25,2.6,.1,navy,0,1.3,0);blade.rotation.z=i*Math.PI*2/3;}
const wheels=[];for(let s of [-1,1]){const wheel=new THREE.Mesh(new THREE.TorusGeometry(.38,.12,6,12),dark);wheel.rotation.y=Math.PI/2;wheel.position.set(s*2,-1.65,1.8);wheel.castShadow=true;plane.add(wheel);wheels.push(wheel)}
// Small terminal and flight-board story props
const terminal=group(scene,-12,0,-8);box(terminal,5,3.6,2,cream,0,1.8,0);box(terminal,5.3,.25,2.2,gold,0,3.7,0);box(terminal,2.1,1.6,.1,blue,-.7,1.8,1.05);box(terminal,.9,1.4,.1,coral,1.2,.7,1.05);
const board=group(scene,-8,2,-5);box(board,3.8,2.2,.25,navy,0,0,0);box(board,3.45,1.8,.08,paper(0xece3cf),0,0,.18);
const boardText=makeText('FLIGHT 001  ·  06:10',2.7,.2);boardText.position.set(-1.32,.65,.25);board.add(boardText);
const radio=group(scene,10,1,-4);box(radio,1.2,1.6,.7,blue,0,0,0);box(radio,.85,.52,.08,cream,0,.38,.39);for(let i=0;i<3;i++)sphere(radio,.08,gold,-.3+i*.3,-.28,.43);
const gate=group(scene,0,0,7);for(let x of [-2.8,2.8])box(gate,.38,5.4,.5,gold,x,2.7,0);box(gate,6.2,.38,.5,cream,0,5.4,0);box(gate,5.5,.1,.55,blue,0,4.9,.05);
const gateText=makeText('THRESHOLD',2.3,.24);gateText.position.set(-1.15,4.12,.36);gate.add(gateText);
function makeText(txt,size,height){const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=128;const ctx=canvas.getContext('2d');ctx.clearRect(0,0,1024,128);ctx.font='700 54px Arial';ctx.fillStyle='#fff8e9';ctx.textAlign='left';ctx.fillText(txt,15,83);const tex=new THREE.CanvasTexture(canvas);tex.colorSpace=THREE.SRGBColorSpace;const m=new THREE.Mesh(new THREE.PlaneGeometry(size,height),new THREE.MeshBasicMaterial({map:tex,transparent:true,side:THREE.DoubleSide}));return m}
// Mara: bespoke stylized 3D avatar with articulated limbs and soft idle animation
const mara=group(scene,0,0,12);mara.rotation.y=Math.PI;
const joints={};
const torso=box(mara,.95,1.25,.52,blue,0,1.65,0);torso.rotation.z=-.035;
box(mara,.72,.35,.55,blue2,0,2.22,.02);box(mara,.2,.56,.57,cream,0,1.75,.29);
const belt=box(mara,.98,.13,.55,gold,0,1.08,0);
const neck=cone(mara,.18,.18,.3,coral,0,2.37,0,8);
const head=group(mara,0,2.85,0);sphere(head,.48,coral,0,0,0,[.82,1.03,.78]);
// hair cap and braids
sphere(head,.49,navy,0,.22,-.08,[1.03,.65,.91]);
for(let s of [-1,1]){for(let k=0;k<5;k++){sphere(head,.105,k%2?navy:paper(0x594454),s*(.42+.025*Math.sin(k)), -.18-k*.19,.03,[.9,1.18,.9])}}
const beanie=sphere(head,.49,paper(0xa8a6b8),0,.48,-.02,[1.02,.48,.95]);const brim=box(head,.88,.12,.75,paper(0xc6c2cd),0,.31,.12);brim.rotation.z=-.04;
for(let s of [-1,1]){sphere(head,.045,dark,s*.17,.02,.39,[.7,1.3,.4]);sphere(head,.06,paper(0xe5a18c),s*.27,-.12,.35,[1.2,.6,.4])}
const smile=box(head,.16,.035,.04,paper(0x8e4d4b),0,-.2,.4);
function limb(parent,upper,lower,material,x,y,z,arm=false){const pivot=group(parent,x,y,z);const a=box(pivot,arm?.22:.3,upper,arm?.22:.3,material,0,-upper/2,0);const elbow=group(pivot,0,-upper,0);const b=box(elbow,arm?.19:.26,lower,arm?.19:.26,material,0,-lower/2,0);const hand=sphere(elbow,.14,coral,0,-lower,0);return {pivot,elbow,upper,lower}}
joints.leftArm=limb(mara,.72,.62,blue,-.58,2.05,0,true);joints.rightArm=limb(mara,.72,.62,blue,.58,2.05,0,true);
joints.leftLeg=limb(mara,.72,.62,navy,-.27,1.08,0,false);joints.rightLeg=limb(mara,.72,.62,navy,.27,1.08,0,false);
for(let s of [-1,1]){const boot=box(mara,.36,.2,.56,cream,s*.27,.12,.1);}
// Camera, movement and state
const clock=new THREE.Clock();let started=false,ended=false,choiceOpen=false,score=0,axisX=0,axisY=0,keys={},near='',lastSubtitle=0,walkT=0,collapseT=0,collapseActive=false,muted=false;
const ui=id=>document.getElementById(id);
function subtitle(text,duration=4){ui('subtitle').textContent=text;ui('subtitle').style.opacity=1;lastSubtitle=duration}
function setTask(text){ui('task').textContent=text}
const targets=[{id:'board',name:'flight board',obj:board,pos:new THREE.Vector3(-8,0,-5),done:false},{id:'radio',name:'radio',obj:radio,pos:new THREE.Vector3(10,0,-4),done:false},{id:'gate',name:'threshold',obj:gate,pos:new THREE.Vector3(0,0,7),done:false}];
const cameraTarget=new THREE.Vector3(0,2.2,12);camera.position.set(0,5.2,20);camera.lookAt(cameraTarget);
function showChoice(){choiceOpen=true;ui('choice').style.display='grid';requestAnimationFrame(()=>ui('choice').style.opacity=1);subtitle('MARA: Every choice leaves a mark. But what does this world need from me?',5)}
function finish(signal){ended=true;choiceOpen=false;ui('choice').style.display='none';const impact=signal?84:72;score=impact;ui('score').textContent=String(score).padStart(2,'0');ui('endTitle').textContent=signal?'THE SIGNAL CARRIES':'THE PROMISE HOLDS';ui('endText').textContent=signal?'You followed the voice beyond the known timeline. The signal becomes a path, and someone on the other side remembers that you came.':'You protected the people who trusted you. The timeline records a quieter kind of courage: the lives that continued because you chose to stay.';ui('impactline').textContent='IMPACT INDEX  '+impact+'  ·  MEMORY TRACE ESTABLISHED';ui('ending').style.display='grid';requestAnimationFrame(()=>ui('ending').style.opacity=1);if(signal){collapseActive=true;collapseT=0}}
function interact(){if(!started||ended||choiceOpen)return;if(!near){subtitle('Move closer to something that catches your attention.',2);return}const t=targets.find(q=>q.id===near);if(!t||t.done)return;t.done=true;if(near==='board'){score+=20;ui('score').textContent=String(score).padStart(2,'0');setTask('Find the voice on the radio');subtitle('The flight board lists a departure that has not happened yet. Your name is already on the manifest.',5)}else if(near==='radio'){score+=25;ui('score').textContent=String(score).padStart(2,'0');setTask('Approach the threshold');subtitle('RADIO: Mara, if you can hear this, the timeline is already folding. Someone needs you to choose.',6)}else{score+=15;ui('score').textContent=String(score).padStart(2,'0');showChoice()}}
function move(dt){let ix=(keys.KeyD||keys.ArrowRight?1:0)-(keys.KeyA||keys.ArrowLeft?1:0)+axisX;let iz=(keys.KeyS||keys.ArrowDown?1:0)-(keys.KeyW||keys.ArrowUp?1:0)+axisY;const len=Math.hypot(ix,iz);if(len>1){ix/=len;iz/=len}const moving=len>.08;if(moving){mara.position.x=THREE.MathUtils.clamp(mara.position.x+ix*dt*6.1,-16,16);mara.position.z=THREE.MathUtils.clamp(mara.position.z+iz*dt*6.1,-1,20);mara.rotation.y=Math.atan2(ix,iz);walkT+=dt*9}else{walkT+=dt*1.3}const swing=moving?Math.sin(walkT)*.48:Math.sin(walkT)*.045;joints.leftLeg.pivot.rotation.x=swing;joints.rightLeg.pivot.rotation.x=-swing;joints.leftArm.pivot.rotation.x=-swing*.55-.08;joints.rightArm.pivot.rotation.x=swing*.55-.08;head.rotation.y=Math.sin(walkT*.45)*.045;head.rotation.x=Math.sin(walkT*.7)*.018;mara.position.y=moving?Math.abs(Math.sin(walkT*2))*.055:Math.sin(walkT)*.018;const desired=new THREE.Vector3(mara.position.x*.58,4.2,mara.position.z+8.8);camera.position.lerp(desired,1-Math.pow(.001,dt));cameraTarget.set(mara.position.x,2.15,mara.position.z-.4);camera.lookAt(cameraTarget);
near='';let best=3.15;for(const t of targets){if(t.done)continue;const d=mara.position.distanceTo(t.pos);if(d<best){best=d;near=t.id}}ui('hint').style.opacity=near?1:0;ui('hint').textContent=near?'E  ·  '+targets.find(t=>t.id===near).name.toUpperCase()+'  ·  INTERACT':'';}
// Timeline fracture: luminous folded aperture, expanding rings and a controlled warp
const rift=group(scene,0,5,-8);const ringMat=new THREE.MeshBasicMaterial({color:0xffe6b3,transparent:true,opacity:0,side:THREE.DoubleSide});const rings=[];for(let i=0;i<5;i++){const ring=new THREE.Mesh(new THREE.TorusGeometry(2.2+i*.55,.035,8,72),ringMat.clone());ring.rotation.y=.18+i*.22;ring.position.z=-i*.18;rift.add(ring);rings.push(ring)}const core=new THREE.Mesh(new THREE.CircleGeometry(2.15,48),new THREE.MeshBasicMaterial({color:0x263f58,transparent:true,opacity:0,side:THREE.DoubleSide}));rift.add(core);const riftLight=new THREE.PointLight(0xffdca1,0,18);rift.add(riftLight);
function collapse(dt){if(!collapseActive)return;collapseT+=dt;const p=Math.min(1,collapseT/5.2);rings.forEach((r,i)=>{r.material.opacity=Math.sin(Math.min(1,p*1.5)*Math.PI)*.72;r.scale.setScalar(1+p*(.55+i*.08));r.rotation.z+=dt*(i%2?-.5:.5)});core.material.opacity=Math.min(.88,p*.9);riftLight.intensity=p*3.5;rift.scale.setScalar(.6+p*.7);if(p>.55){const pulse=1+Math.sin(collapseT*12)*.025;rift.scale.setScalar((.6+p*.7)*pulse)}}
function animate(){requestAnimationFrame(animate);const dt=Math.min(clock.getDelta(),.04);if(started&&!ended&&!choiceOpen){move(dt);if(lastSubtitle>0&&(lastSubtitle-=dt)<=0)ui('subtitle').style.opacity=0;}collapse(dt);clouds.forEach((c,i)=>{c.position.x+=dt*(i%2?-.22:.17);if(c.position.x>105)c.position.x=-105;if(c.position.x< -105)c.position.x=105});prop.rotation.z+=dt*2.2;renderer.render(scene,camera)}
function begin(){started=true;ui('title').style.opacity=0;setTimeout(()=>ui('title').style.display='none',700);setTask('Inspect the flight board');subtitle('MARA: The air feels different here. Like the whole world is holding its breath.',5)}
ui('begin').addEventListener('click',begin);ui('interact').addEventListener('click',interact);ui('choiceSignal').addEventListener('click',()=>finish(true));ui('choicePromise').addEventListener('click',()=>finish(false));ui('restart').addEventListener('click',()=>location.reload());
ui('sound').addEventListener('click',()=>{muted=!muted;ui('sound').textContent=muted?'SOUND OFF':'SOUND ON';});
// Keyboard and touch joystick
addEventListener('keydown',e=>{keys[e.code]=true;if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(e.code))e.preventDefault();if(e.code==='KeyE'||e.code==='Enter')interact()});addEventListener('keyup',e=>keys[e.code]=false);addEventListener('blur',()=>keys={});
const stick=ui('stick'),knob=ui('knob');let pointer=null;function updateStick(e){const r=stick.getBoundingClientRect();const dx=e.clientX-(r.left+r.width/2),dy=e.clientY-(r.top+r.height/2),max=r.width*.34,l=Math.hypot(dx,dy),scale=l>max?max/l:1;axisX=dx*scale/max;axisY=dy*scale/max;knob.style.transform='translate('+dx*scale+'px,'+dy*scale+'px)'}function resetStick(){pointer=null;axisX=axisY=0;knob.style.transform='translate(0,0)'}stick.addEventListener('pointerdown',e=>{pointer=e.pointerId;stick.setPointerCapture(pointer);updateStick(e)});stick.addEventListener('pointermove',e=>{if(pointer===e.pointerId)updateStick(e)});['pointerup','pointercancel','lostpointercapture'].forEach(ev=>stick.addEventListener(ev,resetStick));
addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);renderer.setPixelRatio(Math.min(devicePixelRatio,1.65))});
animate();