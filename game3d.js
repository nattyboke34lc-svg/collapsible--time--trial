import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";

const $=id=>document.getElementById(id);
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const lerp=(a,b,t)=>a+(b-a)*t;
const V=(x,y,z)=>new THREE.Vector3(x,y,z);
const mat=(color,rough=.72,metal=0)=>new THREE.MeshStandardMaterial({color,roughness:rough,metalness:metal});
const M={
 grass:mat("#647c69"),tarmac:mat("#59666b"),concrete:mat("#b7b5a8"),wall:mat("#b6b5a6"),roof:mat("#5d5148"),glass:mat("#294c5d",.22,.3),
 suit:mat("#8299a4",.58,.08),suitDark:mat("#30404a",.64,.12),skin:mat("#98654f",.7),hair:mat("#17191d",.45),gold:mat("#d9b873",.32,.5),white:mat("#e2e5df",.36,.12),rubber:mat("#20282d"),leaf:mat("#526c58"),crate:mat("#897453"),red:mat("#a85b4e")
};
let renderer,scene,camera,clock,player,radio,folder,crate,beacon,aircraft,stormClouds=[];
let started=false,phase="intro",moveTarget=null,nearTarget=null,objectiveIndex=0,choiceMade="",tutorialIndex=0;
const keys=new Set(),joy={x:0,y:0,active:false};
const objectives=[
 {name:"READ THE DEPLOYMENT ORDER",short:"FLIGHT FOLDER",pos:V(-10,0,-4),hint:"The folder is on the table beside the hangar."},
 {name:"CHECK THE DISTRESS TRANSMISSION",short:"RADIO DESK",pos:V(-5,0,-8),hint:"The radio desk is near the hangar wall."},
 {name:"VERIFY THE MEDICAL CARGO",short:"SUPPLY CRATE",pos:V(7,0,2),hint:"The marked medical crate is beside the aircraft."},
 {name:"CONTACT THE CLINIC",short:"FIELD RADIO",pos:V(13,0,-8),hint:"The field radio is beside the control tower."}
];
const tutorials=[
 ["MOVEMENT","Use W A S D or the arrow keys to walk. On a phone, hold the circular joystick and push in the direction you want Mara to move. Movement is deliberately slow and controllable."],
 ["LOOK & NAVIGATE","The camera follows Mara automatically. The small map in the upper-right shows your position, the next objective and the route. You can also tap a spot on the ground to walk there."],
 ["INTERACT","Walk close to a marked object, then press E or tap INTERACT. Read documents, listen to people and inspect the environment. The next objective unlocks only after the current one."],
 ["TRACK YOUR MISSION","The progress bar counts the four required tasks. The map shows how far you are from the next objective. Your final decision changes the mission outcome."]
];
const dialogue=[
 ["MARA","THE ROUTINE THAT NEVER HAPPENED","The evaluation flight was supposed to be forty minutes. A clean route, a landing, a signature. Then the storm warning came through, and every clock in Kijani seemed to start running faster."],
 ["CAPTAIN ELIAS","YOU'RE NOT CLEARED TO REFUSE","Mara, the assignment has changed. You're taking the medical aircraft to Ndera clinic. The senior crew is grounded. You're the only pilot current on this airframe."],
 ["MARA","I DIDN'T ACCEPT THIS MISSION","I accepted an evaluation. Not an emergency deployment with missing route data. You can't just put my name on an order and call it consent."],
 ["CAPTAIN ELIAS","I KNOW","I know. And I wouldn't ask if there were another crew. The clinic has patients waiting for supplies. We have a narrow weather window. I need you to understand what is at stake before you decide."],
 ["DR. AMINA","WE HAVE PEOPLE WAITING","This is Dr. Amina at Ndera. We have oxygen equipment and essential medicine running low. I won't tell you to fly into a storm. I am asking you to help us find a safe way to get what we need."],
 ["MARA","THEN SHOW ME THE WHOLE PICTURE","No more orders without answers. I'll check the aircraft, the cargo and the route. Then I'll make the call. If I fly, it will be because I understand the risk, not because someone made the choice for me."]
];
function box(parent,x,y,z,w,h,d,m,rx=0,ry=0,rz=0){const o=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);o.position.set(x,y,z);o.rotation.set(rx,ry,rz);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o}
function ball(parent,x,y,z,r,m,s=[1,1,1]){const o=new THREE.Mesh(new THREE.SphereGeometry(r,24,18),m);o.position.set(x,y,z);o.scale.set(...s);o.castShadow=true;parent.add(o);return o}
function cyl(parent,x,y,z,rt,rb,h,m,n=20){const o=new THREE.Mesh(new THREE.CylinderGeometry(rt,rb,h,n),m);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o}
function capsule(parent,x,y,z,r,len,m,rot=0){const o=new THREE.Mesh(new THREE.CapsuleGeometry(r,len,6,12),m);o.position.set(x,y,z);o.rotation.z=rot;o.castShadow=true;parent.add(o);return o}
function makeCharacter(){
 const g=new THREE.Group();scene.add(g);g.position.set(-15,0,8);
 // Anatomical proportions and layered flight clothing.
 const hips=box(g,0,.91,0,.48,.32,.28,M.suitDark);
 const torso=capsule(g,0,1.35,0,.29,.52,M.suit);torso.scale.set(1.08,1.08,.82);
 const neck=cyl(g,0,1.78,0,.085,.09,.17,M.skin);
 const head=ball(g,0,1.98,0,.22,M.skin,[.82,1.06,.82]);
 // Hair cap and individual swept-back braids/strands.
 ball(g,0,2.12,-.015,.235,M.hair,[1,.55,1]);
 ball(g,0,1.99,.15,.19,M.hair,[.95,.9,.45]);
 for(let i=0;i<7;i++){const strand=capsule(g,-.17+i*.055,1.83,-.12,.025,.24,M.hair,(i-3)*.055);strand.rotation.x=-.35;}
 ball(g,-.22,1.98,0,.055,M.skin,[.35,.8,.55]);ball(g,.22,1.98,0,.055,M.skin,[.35,.8,.55]);
 // Facial structure, eyes, brows, nose and mouth.
 for(const x of [-.075,.075]){ball(g,x,2.015,.183,.022,M.white,[1,.8,.5]);ball(g,x,2.015,.202,.01,mat("#20262b"));}
 box(g,-.075,2.06,.18,.07,.018,.025,M.hair,0,0,-.13);box(g,.075,2.06,.18,.07,.018,.025,M.hair,0,0,.13);
 ball(g,0,1.965,.2,.025,M.skin,[.55,.8,.6]);box(g,0,1.91,.195,.07,.012,.018,mat("#633d38"));
 // Collar, zipper, harness, insignia and utility belt.
 box(g,0,1.69,.02,.24,.075,.24,M.suitDark);box(g,0,1.37,.155,.018,.42,.018,M.gold);
 box(g,-.16,1.42,.14,.035,.5,.035,M.white,0,0,-.3);box(g,.16,1.42,.14,.035,.5,.035,M.white,0,0,.3);
 box(g,.21,1.57,.03,.1,.1,.08,M.gold);box(g,0,1.04,.02,.58,.12,.36,M.suitDark);
 // Shoulder panels and articulated arms.
 const limbs=[];
 for(const s of [-1,1]){
  const shoulder=new THREE.Group();shoulder.position.set(s*.34,1.59,0);g.add(shoulder);
  capsule(shoulder,0,-.22,0,.105,.25,M.suit,s*-.1);
  ball(shoulder,0,-.43,0,.085,M.suitDark);
  capsule(shoulder,0,-.53,.01,.065,.08,M.skin);
  const leg=new THREE.Group();leg.position.set(s*.15,.91,0);g.add(leg);
  capsule(leg,0,-.24,0,.105,.28,M.suitDark);
  ball(leg,0,-.46,0,.095,M.suitDark);
  box(leg,0,-.53,.09,.18,.1,.32,M.rubber);
  limbs.push(shoulder,leg);
 }
 // Flight helmet clipped to the belt, shoulder patch and small utility details.
 ball(g,-.43,.94,.02,.14,M.white,[1,.8,1]);box(g,.29,1.42,.1,.1,.14,.05,M.gold);
 g.userData.limbs=limbs;g.userData.torso=torso;g.userData.walk=0;return g;
}
function makeAircraft(){
 const g=new THREE.Group();scene.add(g);g.position.set(1,0,4);
 const fus=cyl(g,0,1.3,0,.47,.38,6.8,M.white,32);fus.rotation.x=Math.PI/2;
 ball(g,0,1.32,-2.8,.43,M.glass,[1,.8,1.3]);
 box(g,0,1.12,0,9,.18,1.1,M.white);
 box(g,0,1.28,1.85,2.5,.12,.7,M.white);box(g,0,1.6,2.15,.16,.85,.4,M.white);
 for(const s of [-1,1]){box(g,s*4.3,1.1,.1,.35,.16,.55,M.suitDark);cyl(g,s*.5,.5,1.7,.15,.15,.5,M.rubber).rotation.z=Math.PI/2;}
 const prop=new THREE.Group();prop.position.set(0,1.3,-3.35);g.add(prop);for(let i=0;i<3;i++){const b=box(prop,0,0,0,.1,1.2,.05,M.suitDark);b.rotation.z=i*Math.PI/3;}g.userData.prop=prop;return g;
}
function tree(x,z,s=1){const trunk=cyl(scene,x,1*s,z,.18*s,.27*s,2*s,mat("#69513c"));ball(scene,x,2.5*s,z,1.45*s,M.leaf,[1.05,1.25,1]);ball(scene,x-.7*s,2.2*s,z+.1,1*s,M.leaf);ball(scene,x+.65*s,2.3*s,z-.1,1*s,M.leaf);}
function makeMarker(pos,color){const g=new THREE.Group();g.position.copy(pos);scene.add(g);const ring=new THREE.Mesh(new THREE.TorusGeometry(1.05,.045,8,48),new THREE.MeshBasicMaterial({color,transparent:true,opacity:.9}));ring.rotation.x=Math.PI/2;ring.position.y=.08;g.add(ring);const beam=new THREE.Mesh(new THREE.CylinderGeometry(.025,.025,2.8,8),new THREE.MeshBasicMaterial({color,transparent:true,opacity:.25}));beam.position.y=1.5;g.add(beam);g.userData.ring=ring;return g;}
function buildWorld(){
 scene=new THREE.Scene();scene.background=new THREE.Color("#a8c0c4");scene.fog=new THREE.FogExp2("#a8c0c4",.009);
 camera=new THREE.PerspectiveCamera(56,innerWidth/innerHeight,.1,220);
 renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:"high-performance"});renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.7));renderer.setSize(innerWidth,innerHeight);renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.13;$("game").appendChild(renderer.domElement);
 scene.add(new THREE.HemisphereLight("#eff8ff","#56624d",2.25));const sun=new THREE.DirectionalLight("#ffe4c1",3.1);sun.position.set(-24,34,-15);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);sun.shadow.camera.left=-38;sun.shadow.camera.right=38;sun.shadow.camera.top=38;sun.shadow.camera.bottom=-38;scene.add(sun);
 box(scene,0,-.45,0,110,.8,110,M.grass);
 box(scene,0,.005,7,19,.05,54,M.tarmac);
 for(let z=-18;z<34;z+=6)box(scene,0,.04,z,.2,.025,2.7,M.white);
 for(const x of [-9.4,9.4])box(scene,x,.035,7,.1,.025,54,M.gold);
 // Hangar architecture with open doors and roof ribs.
 box(scene,-14,2.5,-10,13,5,10,M.wall);box(scene,-14,5.2,-10,13.5,.3,10.5,M.roof);
 box(scene,-14,1.9,-4.92,8,3.8,.14,M.suitDark);
 for(const x of [-18,-14,-10])box(scene,x,2.55,-4.8,2.4,1.15,.1,M.glass);
 for(let x=-19;x<=-9;x+=2.5)box(scene,x,4.9,-4.8,.08,3.8,.08,M.gold);
 // Control tower and windows.
 box(scene,14,2.5,-11,4,5,4,M.wall);box(scene,14,5.1,-11,4.7,.5,4.7,M.roof);box(scene,14,3.8,-8.9,3.3,1.1,.08,M.glass);
 cyl(scene,14,7.1,-11,.07,.08,3.6,M.suitDark);
 for(let i=0;i<3;i++){const blade=box(scene,14,8.8,-11,.12,2,.1,M.white);blade.rotation.z=i*Math.PI*2/3;}
 // Trees, fence, hills and service lamps.
 for(let i=0;i<15;i++){const x=-31+(i%8)*8,z=i<8?-27:34;tree(x,z,.8+Math.random()*.5);}
 for(let z=-24;z<38;z+=7){for(const x of [-25,25]){cyl(scene,x,1.2,z,.055,.07,2.4,M.suitDark);ball(scene,x,2.45,z,.16,M.gold);}}
 for(let i=0;i<16;i++){const h=6+Math.random()*8;const hill=new THREE.Mesh(new THREE.ConeGeometry(5+Math.random()*3,h,8),mat(i%2?"#7f9990":"#718b83"));hill.position.set(-44+i*6,h/2-1,-48-Math.random()*7);scene.add(hill);}
 // Supply staging, tables, objects.
 folder=new THREE.Group();folder.position.set(-10,0,-4);scene.add(folder);box(folder,0,.82,0,2.2,.12,1.3,M.suitDark);box(folder,0,.92,0,.75,.035,.9,M.gold);box(folder,0,.96,.02,.55,.02,.68,M.white);
 radio=new THREE.Group();radio.position.set(-5,0,-8);scene.add(radio);box(radio,0,.65,0,1.7,1.3,1.1,M.suitDark);box(radio,0,1.35,.02,1.15,.12,.7,M.white);for(let i=0;i<3;i++)ball(radio,-.3+i*.3,1.45,.1,.06,i===2?M.red:M.gold);
 crate=new THREE.Group();crate.position.set(7,0,2);scene.add(crate);box(crate,0,.65,0,1.7,1.3,1.6,M.crate);for(let x=-.55;x<=.55;x+=.55)box(crate,x,.65,.82,.045,1.25,.04,M.gold);box(crate,0,1.35,.82,.65,.12,.04,M.white);
 const fieldRadio=new THREE.Group();fieldRadio.position.set(13,0,-8);scene.add(fieldRadio);box(fieldRadio,0,.7,0,1.2,1.4,.8,M.suitDark);box(fieldRadio,0,1.45,.05,.8,.15,.55,M.gold);cyl(fieldRadio,.35,2,.1,.025,.025,1.2,M.white);
 beacon=new THREE.Group();beacon.position.set(0,0,23);scene.add(beacon);cyl(beacon,0,1,0,.15,.22,2,M.white);ball(beacon,0,2.1,0,.22,M.gold);
 aircraft=makeAircraft();player=makeCharacter();
 // Clouds and a distant rain wall, deliberately soft and readable.
 for(let i=0;i<15;i++){const cloud=new THREE.Group();scene.add(cloud);cloud.position.set(-32+i*5,14+Math.random()*5,-28-Math.random()*20);for(let j=0;j<4;j++)ball(cloud,(j-1.5)*1.8,Math.random()*.6,0,1.8,mat("#d9e1df",.98),[1.3,.52,.85]);stormClouds.push(cloud);}
 objectives.forEach((o,i)=>o.marker=makeMarker(o.pos,i===objectiveIndex?0xf0cf83:0x9bc2c5));
 clock=new THREE.Clock();resize();drawMap();animate();
}
function resize(){if(!renderer)return;camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);}
function dist(a,b){return Math.hypot(a.x-b.x,a.z-b.z);}
function setPrompt(t){$("prompt").textContent=t;$("prompt").style.opacity=t?"1":"0";}
function updateProgress(){const n=objectiveIndex;$("progressNum").textContent=n+" / 4";$("barfill").style.width=(n/4*100)+"%";$("objective").textContent=n<4?"OBJECTIVE · "+objectives[n].name:"OBJECTIVE · CHOOSE YOUR FLIGHT PLAN";$("mapfoot").innerHTML=n<4?"NEXT: "+objectives[n].short+"<br>DISTANCE: "+Math.round(dist(player.position,objectives[n].pos))+" M":"ALL CHECKS COMPLETE<br>AWAITING YOUR DECISION";}
function drawMap(){
 const c=$("map"),ctx=c.getContext("2d"),w=c.width,h=c.height;ctx.clearRect(0,0,w,h);
 ctx.fillStyle="#172c32";ctx.fillRect(0,0,w,h);ctx.strokeStyle="#ffffff20";ctx.lineWidth=2;
 for(let x=0;x<w;x+=36){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,h);ctx.stroke()}for(let y=0;y<h;y+=36){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(w,y);ctx.stroke()}
 ctx.fillStyle="#6a7773";ctx.fillRect(18,105,324,28);ctx.fillStyle="#c6bda6";ctx.fillRect(18,114,324,3);
 ctx.fillStyle="#788d86";ctx.fillRect(42,30,90,55);ctx.fillStyle="#304b59";ctx.fillRect(250,28,55,65);
 const map=(x,z)=>({x:180+(x/55)*300,y:116+(z/55)*200});
 const p=map(player.position.x,player.position.z);ctx.strokeStyle="#e5c77f";ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(p.x,p.y);if(objectiveIndex<4){const q=map(objectives[objectiveIndex].pos.x,objectives[objectiveIndex].pos.z);ctx.lineTo(q.x,q.y);}ctx.stroke();
 objectives.forEach((o,i)=>{const q=map(o.pos.x,o.pos.z);ctx.fillStyle=i<objectiveIndex?"#79c6a1":i===objectiveIndex?"#f1d28a":"#a7c2c7";ctx.beginPath();ctx.arc(q.x,q.y,i===objectiveIndex?8:5,0,Math.PI*2);ctx.fill();});
 ctx.fillStyle="#fff";ctx.beginPath();ctx.arc(p.x,p.y,7,0,Math.PI*2);ctx.fill();ctx.strokeStyle="#10202a";ctx.lineWidth=2;ctx.stroke();
}
function showTutorial(i){tutorialIndex=i;$("tutStep").textContent="FIELD GUIDE · "+String(i+1).padStart(2,"0")+" / 04";$("tutTitle").textContent=tutorials[i][0];$("tutText").textContent=tutorials[i][1];$("tutNext").textContent=i===3?"START MISSION":"NEXT";$("tutorial").style.display="block";phase="tutorial";}
function closeTutorial(){ $("tutorial").style.display="none";if(tutorialIndex<3)showTutorial(tutorialIndex+1);else{phase="play";setPrompt("Find the highlighted flight folder. Follow the map.");updateProgress();}}
function chooseVoice(speaker){if(!("speechSynthesis"in window))return;const voices=speechSynthesis.getVoices();let v;if(speaker==="MARA")v=voices.find(x=>/female|woman|zira|samantha|aria|jenny/i.test(x.name));else if(speaker==="DR. AMINA")v=voices.find(x=>/female|woman|susan|samantha|aria|jenny/i.test(x.name));else v=voices.find(x=>/male|david|mark|guy|daniel/i.test(x.name));return v;}
function speak(speaker,text){if(!("speechSynthesis"in window))return;speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(text);u.rate=speaker==="MARA"?.94:.91;u.pitch=speaker==="MARA"?1.02:speaker==="DR. AMINA"?1.08:.84;u.volume=.92;const v=chooseVoice(speaker);if(v)u.voice=v;speechSynthesis.speak(u);}
let cutIndex=0;
function showDialogue(i){cutIndex=i;const d=dialogue[i];$("speaker").textContent=d[0];$("lineTitle").textContent=d[1];$("lineText").textContent=d[2];$("sceneCount").textContent="SCENE "+String(i+1).padStart(2,"0")+" / 06";$("lineNext").textContent=i===dialogue.length-1?"TAKE CONTROL":"CONTINUE";$("cutscene").style.display="flex";speak(d[0],d[1]+". "+d[2]);phase="cinematic";}
function nextDialogue(){if(cutIndex<dialogue.length-1){showDialogue(cutIndex+1);}else{speechSynthesis?.cancel?.();$("cutscene").style.display="none";phase="tutorial";showTutorial(0);}}
function startCinematic(){ $("intro").style.display="none";phase="cinematic";showDialogue(0);}
function activateObjective(){
 if(objectiveIndex>=4)return;
 const o=objectives[objectiveIndex];if(dist(player.position,o.pos)>3.2){setPrompt("Walk closer to "+o.short.toLowerCase()+".");return;}
 const messages=[
 ["DEPLOYMENT ORDER","MARA'S ASSIGNMENT: NDERA CLINIC. Cargo: emergency medical supplies. Route: pending weather clearance. Authorisation: Captain Elias. Pilot acknowledgement: NOT SIGNED."],
 ["DISTRESS TRANSMISSION","CONTROL: Kijani tower to Mara. The storm front is moving faster than forecast. A second distress signal has appeared near the ridge. Confirm you copy. MARA: I copy. I still haven't agreed to this deployment."],
 ["CARGO MANIFEST","Three sealed medical cases. Oxygen regulators, temperature-sensitive medicine and emergency monitoring equipment. The clinic has confirmed receipt is urgent. The manifest also shows the cargo is not enough for every request."],
 ["DR. AMINA ON FIELD RADIO","DR. AMINA: We can receive the medical cases at the east landing strip, but the ridge route is unstable. If you can get us a safe arrival window, we can prepare the ground team. MARA: I'm checking the route now."]
 ];
 const [title,body]=messages[objectiveIndex];showFieldMessage(title,body);
 objectiveIndex++;updateProgress();drawMap();
 if(objectiveIndex<4){objectives.forEach((x,i)=>x.marker.userData.ring.material.color.setHex(i===objectiveIndex?0xf0cf83:0x9bc2c5));setPrompt("Next: "+objectives[objectiveIndex].hint);}
 else{setPrompt("All four checks complete. Choose your flight plan.");setTimeout(showChoice,450);}
}
function showFieldMessage(title,body){$("tutStep").textContent="MISSION INTEL";$("tutTitle").textContent=title;$("tutText").textContent=body;$("tutNext").textContent="CONTINUE";$("tutorial").style.display="block";phase="message";speak(title.includes("AMINA")?"DR. AMINA":title.includes("TRANSMISSION")?"CAPTAIN ELIAS":"MARA",body);}
function showChoice(){
 phase="choice";$("tutStep").textContent="COMMAND DECISION · MARA HAS THE FINAL SAY";$("tutTitle").textContent="WHICH FLIGHT PLAN?";$("tutText").textContent="The weather window is closing. The direct ridge route is faster but uncertain. The coastal route is longer, but the tower has a confirmed weather corridor. You decide how Mara responds to the deployment.";
 $("tutorial").style.display="block";$("tutNext").style.display="none";
 const panel=$("tutorial");let old=panel.querySelector(".choices");if(old)old.remove();
 const choices=document.createElement("div");choices.className="choices";choices.style.cssText="display:grid;gap:9px;margin-top:18px";
 [["TAKE THE DIRECT RIDGE ROUTE","Fast arrival. Higher uncertainty. This may reach the clinic sooner, but the team has less time to respond if conditions change.","direct"],["REQUEST THE COASTAL WEATHER CORRIDOR","Longer flight. Better information. The clinic gets a more predictable arrival window.","coastal"]].forEach(([label,desc,val])=>{const b=document.createElement("button");b.style.cssText="text-align:left;line-height:1.5;letter-spacing:.04em";b.textContent=label+"  ›";b.title=desc;b.onclick=()=>finishMission(val);choices.appendChild(b);const p=document.createElement("p");p.style.cssText="margin:0 0 6px 2px;font-size:11px";p.textContent=desc;choices.appendChild(p);});
 panel.appendChild(choices);
}
function finishMission(choice){
 choiceMade=choice;$("tutorial").style.display="none";$("tutNext").style.display="";phase="ending";$("ending").style.display="flex";
 if(choice==="direct"){$("endTitle").textContent="THE RIDGE ROUTE";$("endText").textContent="Mara chooses speed. She takes the direct route, keeps the aircraft high and asks the clinic team to prepare for a narrow arrival window. The supplies reach Ndera sooner, but the second distress signal remains unresolved. Captain Elias will have to answer for the missing route information.";}
 else{$("endTitle").textContent="THE COASTAL CORRIDOR";$("endText").textContent="Mara refuses to mistake urgency for certainty. She requests the verified coastal corridor and shares the weather window with Dr. Amina. The flight takes longer, but the ground team is ready and the clinic receives a reliable arrival time. The unknown distress signal is passed to the tower for a separate response.";}
 $("barfill").style.width="100%";$("progressNum").textContent="4 / 4";$("objective").textContent="MISSION COMPLETE · "+(choice==="direct"?"DIRECT ROUTE":"COASTAL CORRIDOR");
 if("speechSynthesis"in window){speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(choice==="direct"?"The direct route. The sky is waiting.":"The coastal corridor. We do this with our eyes open.");u.pitch=1;u.rate=.92;speechSynthesis.speak(u);}
}
function interact(){if(phase!=="play")return;if(objectiveIndex>=4){showChoice();return;}activateObjective();}
function updateMovement(dt,t){
 let dx=0,dz=0;if(keys.has("w")||keys.has("arrowup"))dz-=1;if(keys.has("s")||keys.has("arrowdown"))dz+=1;if(keys.has("a")||keys.has("arrowleft"))dx-=1;if(keys.has("d")||keys.has("arrowright"))dx+=1;
 dx+=joy.x;dz+=joy.y;
 if(moveTarget){const d=V(moveTarget.x-player.position.x,0,moveTarget.z-player.position.z);if(d.length()>.35){dx+=d.x;dz+=d.z;}else moveTarget=null;}
 const moving=Math.hypot(dx,dz)>.08;
 if(moving){const l=Math.hypot(dx,dz);dx/=l;dz/=l;const speed=4.2;player.position.x+=dx*speed*dt;player.position.z+=dz*speed*dt;player.rotation.y=Math.atan2(dx,dz);player.userData.walk+=dt*10;player.userData.limbs.forEach((limb,i)=>{limb.rotation.x=Math.sin(player.userData.walk+(i%2)*Math.PI)*.42;});player.userData.torso.rotation.z=Math.sin(player.userData.walk)*.025;}
 else{player.userData.limbs.forEach(l=>l.rotation.x=lerp(l.rotation.x,0,.18));player.userData.torso.rotation.z=lerp(player.userData.torso.rotation.z,0,.12);}
 player.position.x=clamp(player.position.x,-22,22);player.position.z=clamp(player.position.z,-21,28);
 const target=V(player.position.x,4.1,player.position.z+7.6);camera.position.lerp(target,.085);camera.lookAt(player.position.x,1.2,player.position.z-1.2);
}
function updateNearby(){
 if(phase!=="play")return;
 if(objectiveIndex>=4){setPrompt("All checks complete. Choose your flight plan.");return;}
 const o=objectives[objectiveIndex],d=dist(player.position,o.pos);
 $("mapfoot").innerHTML="NEXT: "+o.short+"<br>DISTANCE: "+Math.round(d)+" M";
 if(d<3.5)setPrompt("E / INTERACT  ·  "+o.short);else setPrompt(o.hint+"  ·  "+Math.round(d)+" m");
}
function animate(){
 requestAnimationFrame(animate);if(!renderer)return;const dt=Math.min(clock.getDelta(),.04),t=clock.elapsedTime;
 if(phase==="play"){updateMovement(dt,t);updateNearby();drawMap();}
 objectives.forEach((o,i)=>{if(o.marker){o.marker.userData.ring.rotation.z=t*.35;o.marker.userData.ring.scale.setScalar(i===objectiveIndex?1+.12*Math.sin(t*3):.72);}});
 if(aircraft?.userData.prop)aircraft.userData.prop.rotation.z+=.045;
 stormClouds.forEach((c,i)=>{c.position.x+=Math.sin(t*.05+i)*.001;});
 if(phase==="cinematic"){const angle=t*.12;camera.position.lerp(V(Math.sin(angle)*19,7+Math.sin(t*.3),22-Math.cos(angle)*10),.012);camera.lookAt(0,1,-3);}
 renderer.render(scene,camera);
}
function attachControls(){
 window.addEventListener("keydown",e=>{const k=e.key.toLowerCase();if(["arrowup","arrowdown","arrowleft","arrowright"," "].includes(k))e.preventDefault();keys.add(k);if(k==="e"||k==="enter")interact();},{passive:false});
 window.addEventListener("keyup",e=>keys.delete(e.key.toLowerCase()));
 $("mobileAct").addEventListener("click",interact);
 const stick=$("stick"),nub=$("nub");let pid=null;
 function stickMove(e){const r=stick.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2;let x=(e.clientX-cx)/(r.width*.34),y=(e.clientY-cy)/(r.height*.34);const l=Math.hypot(x,y);if(l>1){x/=l;y/=l;}joy.x=x;joy.y=y;nub.style.transform="translate("+x*30+"px,"+y*30+"px)";}
 stick.addEventListener("pointerdown",e=>{pid=e.pointerId;stick.setPointerCapture(pid);joy.active=true;stickMove(e);});
 stick.addEventListener("pointermove",e=>{if(pid===e.pointerId)stickMove(e);});
 const end=()=>{pid=null;joy.x=0;joy.y=0;joy.active=false;nub.style.transform="translate(0,0)";};
 stick.addEventListener("pointerup",end);stick.addEventListener("pointercancel",end);
 renderer.domElement.addEventListener("pointerdown",e=>{if(phase!=="play")return;const r=renderer.domElement.getBoundingClientRect(),p=new THREE.Vector2((e.clientX-r.left)/r.width*2-1,-((e.clientY-r.top)/r.height)*2+1),ray=new THREE.Raycaster();ray.setFromCamera(p,camera);const plane=new THREE.Plane(V(0,1,0),0),hit=V(0,0,0);if(ray.ray.intersectPlane(plane,hit))moveTarget=V(clamp(hit.x,-22,22),0,clamp(hit.z,-21,28));});
 window.addEventListener("blur",()=>{keys.clear();joy.x=joy.y=0;moveTarget=null;});
 window.addEventListener("resize",resize);
}
$("start").addEventListener("click",startCinematic);
$("lineNext").addEventListener("click",nextDialogue);
$("tutNext").addEventListener("click",()=>{if(phase==="tutorial")closeTutorial();else if(phase==="message"){$("tutorial").style.display="none";phase="play";setPrompt(objectiveIndex<4?objectives[objectiveIndex].hint:"Choose your flight plan.");} });
$("again").addEventListener("click",()=>location.reload());
try{buildWorld();attachControls();}catch(e){console.error(e);$("game").innerHTML='<div style="position:fixed;inset:0;display:grid;place-items:center;padding:30px;background:#102331;color:white;text-align:center">The 3D world could not start. Please reload with an internet connection and WebGL enabled.</div>';}
