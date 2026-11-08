const CT=[
{t:"The Last Flight",r:"You are Mara, a pilot carrying medical supplies to a remote clinic.",s:"A fragmented radio transmission requests assistance. Its source is uncertain.",o:[["Navigation display","The planned route remains flyable. A second signal appears beyond it."],["Radio panel","A fragmented message requests help, but the sender cannot be identified."],["Flight log","The clinic is expecting time-sensitive medical supplies."]],c:"The clinic is waiting for supplies. An unknown sender may also need help.",p:"Which responsibility will guide your next move?",a:["Complete the delivery to the clinic.","Investigate the unknown signal first."],z:[["The clinic receives its delivery.","You honour the original commitment. The unknown signal remains unresolved.",86,"🏥"],["The signal receives an answer.","You establish contact and pass useful information to a response team. The delivery is delayed.",80,"📡"]]},
{t:"Power at Dawn",r:"You are Amara, a junior energy engineer helping a rural town restore its microgrid.",s:"A storm has disrupted power. The clinic and water station both need backup electricity.",o:[["Grid monitor","Available output is lower than current demand."],["Service board","The clinic needs reliable power. The water station needs electricity to pump water."],["Shift notes","A safe staged-restoration plan exists, but it will take longer."]],c:"The town needs both water and clinic services. Backup power cannot serve every demand at once.",p:"How will you organise the limited restoration window?",a:["Prioritise the clinic and arrange water delivery.","Restore both services in stages."],z:[["The clinic receives priority power.","The clinic continues its scheduled services while the town arranges water access.",84,"🏥"],["A staged restoration begins.","Both services return later, and the town gains a repeatable recovery plan.",91,"🔌"]]},
{t:"The Missing Archive",r:"You are Nia, an apprentice archivist at a coastal museum.",s:"A box of community records has arrived without its catalogue. The exhibition opens soon.",o:[["Uncatalogued box","Letters, maps and photographs from several decades are mixed together."],["Catalogue desk","A partial register names contributors, but some entries need verification."],["Interview recorder","A community elder has offered to help identify people and places."]],c:"The deadline is close, but publishing uncertain identifications could misrepresent peoples stories.",p:"What should the museum do first?",a:["Display verified records and explain what is unknown.","Delay this section and work with contributors to identify more material."],z:[["The exhibition opens with verified records.","Visitors see confirmed material and a note explaining gaps in the collection.",88,"🖼️"],["The community rebuilds the catalogue.","The section opens later with richer context supplied by contributors.",92,"🤝"]]},
{t:"The River Between",r:"You are Tavi, a student researcher monitoring river health with a local team.",s:"Two villages report changes in water clarity. Your teams first readings disagree.",o:[["Sample register","The first sample was collected after rainfall, which may affect clarity."],["Weather log","Heavy rain upstream could explain differences between readings."],["Community notes","Residents want an update, but the cause is not confirmed."]],c:"Residents need useful information, but the evidence is not strong enough to identify a cause.",p:"How should your team handle the community meeting?",a:["Share readings with clear limits and a retesting plan.","Collect another sample before presenting conclusions."],z:[["A careful interim update is shared.","Residents hear what observations show, what remains uncertain and when retesting will happen.",90,"📊"],["The team gathers another sample.","The additional sample gives the team a stronger basis for its next update.",89,"🧪"]]},
{t:"The Quiet Observatory",r:"You are Leila, a trainee astronomer on an overnight observatory shift.",s:"A faint new object appears in the observation queue, but the next telescope slot is reserved.",o:[["Observation feed","The signal is faint and needs confirmation before classification."],["Telescope schedule","Another team reserved the next window for a time-sensitive measurement."],["Signal notes","A second observatory may be able to check the signal independently."]],c:"A possible discovery has appeared, but one observation is not enough to establish what it is.",p:"What is the most responsible next step?",a:["Request independent confirmation and preserve the schedule.","Make a brief follow-up observation and notify the other team."],z:[["Independent confirmation is requested.","Another observatory checks the signal while the scheduled study continues.",93,"🌌"],["A short follow-up observation is made.","The team gathers another data point and informs the scheduled researchers.",85,"🔭"]]}
];
let ctNow=null;
function ctLoad(){
 const pool=CT.filter(x=>!ctNow||x.t!==ctNow.t);
 ctNow=pool[Math.floor(Math.random()*pool.length)]||CT[0];
 document.querySelector("#welcome .panel h2").textContent=ctNow.t;
 document.querySelector("#welcome .panel p").textContent="Enter a new life, investigate an unfamiliar situation, make a difficult decision and discover what your presence changes.";
 document.querySelector("#briefing h1").textContent=ctNow.t;
 document.querySelectorAll("#briefing p")[0].textContent=ctNow.r;
 document.querySelectorAll("#briefing p")[1].textContent=ctNow.s;
 document.querySelector("#cockpit h1").textContent="Read the situation.";
 document.querySelector("#cockpit .scene").innerHTML="<span>YOUR ENVIRONMENT</span>";
 ["nav","radio","log"].forEach((id,i)=>{document.querySelector("#"+id+" strong").textContent=ctNow.o[i][0];document.querySelector("#"+id+" span").textContent="Tap to investigate";});
 document.querySelector("#decision .scene").innerHTML="<span>A DECISION POINT</span>";
 document.querySelectorAll("#decision p")[1].textContent=ctNow.c;
 document.querySelectorAll("#decision p")[2].textContent=ctNow.p;
 const b=document.querySelectorAll("#decision button");
 b[0].textContent="A. "+ctNow.a[0];b[0].onclick=()=>choose("A");
 b[1].textContent="B. "+ctNow.a[1];b[1].onclick=()=>choose("B");
}
function inspect(id){
 const i={nav:0,radio:1,log:2}[id];
 if(explored.includes(id))return;
 explored.push(id);
 document.getElementById(id+"Text").textContent=ctNow.o[i][1];
 document.getElementById(id).classList.add("done");
 document.getElementById("exploreCount").textContent="INVESTIGATED: "+explored.length+"/3";
 document.getElementById("exploreMeter").style.width=(explored.length/3*100)+"%";
 if(explored.length===3){const b=document.getElementById("decisionButton");b.disabled=false;b.textContent="MAKE YOUR DECISION";}
}
function choose(letter){
 decision=letter==="A"?"supplies":"signal";
 const z=ctNow.z[letter==="A"?0:1];impact=z[2];
 document.getElementById("outcomeTitle").textContent=z[0];
 document.getElementById("outcomeArt").textContent=z[3];
 document.getElementById("outcomeText").textContent=z[1];
 document.getElementById("impactText").textContent="Your decision changes the priorities of this timeline. Reflect on who benefits and what remains unresolved.";
 document.getElementById("impactScore").textContent=impact;
 document.getElementById("impactMeter").style.width=impact+"%";
 go("outcome");
}
function restart(){
 tokens=0;explored=[];decision="";impact=0;mastery=false;perk=false;answered=false;reward=0;
 ["nav","radio","log"].forEach(id=>{document.getElementById(id).classList.remove("done");document.getElementById(id+"Text").textContent="Tap to investigate";});
 document.getElementById("exploreCount").textContent="INVESTIGATED: 0/3";
 document.getElementById("exploreMeter").style.width="0%";
 document.getElementById("decisionButton").disabled=true;
 document.getElementById("decisionButton").textContent="INVESTIGATION INCOMPLETE";
 document.getElementById("mathFeedback").textContent="";
 document.getElementById("mathExplanation").textContent="";
 document.getElementById("mathContinue").disabled=true;
 document.querySelectorAll(".choice").forEach(b=>b.classList.remove("selected"));
 document.getElementById("wallet").textContent="0";
 document.getElementById("copyMessage").textContent="";
 document.getElementById("perkButton").disabled=false;
 ctLoad();go("welcome");
}
ctLoad();