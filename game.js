let uid=null;
let room=null;
let isMaster=false;

auth.onAuthStateChanged(u=>{ if(u) uid=u.uid; });

firebase.database().ref(".info/connected").on("value",s=>{
document.getElementById("status").innerText=
s.val()?"🟢":"🔴";
});

function randomRoom(){
return Math.floor(1000+Math.random()*9000).toString();
}

function createRoom(){
const name=nameInput();
if(!name) return;

room=randomRoom();

db.ref("rooms/"+room).set({
master:uid,
state:"waiting",
resultCalculated:false
});

addPlayer(name);
enterRoom();
}

function joinRoom(){
const name=nameInput();
room=document.getElementById("roomInput").value.trim();
if(!name||!room) return;
addPlayer(name);
enterRoom();
}

function nameInput(){
return document.getElementById("name").value.trim();
}

function addPlayer(name){
db.ref("rooms/"+room+"/players/"+uid).set({
name:name,
points:0,
online:true
});
db.ref("rooms/"+room+"/players/"+uid+"/online").onDisconnect().set(false);
}

function enterRoom(){
document.getElementById("home").classList.add("hidden");
document.getElementById("game").classList.remove("hidden");
document.getElementById("roomCode").innerText="الغرفة: "+room;
listen();
}

function leaveRoom(){
db.ref("rooms/"+room+"/players/"+uid).remove();
location.reload();
}

function listen(){
db.ref("rooms/"+room).on("value",snap=>{
const d=snap.val();
if(!d) return;

isMaster=(d.master===uid);

renderPlayers(d);
handleState(d);
});
}

function renderPlayers(d){
const pDiv=document.getElementById("players");
pDiv.innerHTML="";

if(!d.players) return;

const sorted=Object.entries(d.players)
.sort((a,b)=>b[1].points-a[1].points);

sorted.forEach(([id,p])=>{
let mark="";
if(d.state==="writing" && d.answers && d.answers[id]) mark="✔";

let kick="";
if(isMaster && id!==uid)
kick=`<button onclick="kick('${id}')">❌</button>`;

pDiv.innerHTML+=`
<div class="player">
<span>${p.name} ${p.online?"🟢":"🔴"} ${mark}</span>
<span>${p.points}</span>
${kick}
</div>`;
});
}

function kick(id){
if(confirm("طرد اللاعب؟")){
db.ref("rooms/"+room+"/players/"+id).remove();
db.ref("rooms/"+room+"/answers/"+id).remove();
db.ref("rooms/"+room+"/votes/"+id).remove();
}
}

function handleState(d){
clearUI();

if(d.state==="waiting" && isMaster){
controls(`<button onclick="startRound()">بدء الجولة</button>`);
}

if(d.state==="writing"){
showQuestion(d);
}

if(d.state==="reveal_answers"){
showAnswers(d);
}

if(d.state==="reveal_majority"){
showMajority(d);
}

if(d.state==="voting"){
showVoting(d);
}

if(d.state==="results"){
showResults(d);
}
}

function clearUI(){
question.innerHTML="";
answers.innerHTML="";
voting.innerHTML="";
controls("");
answerBox.classList.add("hidden");
}

function controls(html){
document.getElementById("controls").innerHTML=html;
}

function startRound(){
const q=QUESTIONS[Math.floor(Math.random()*QUESTIONS.length)];

db.ref("rooms/"+room+"/players").once("value",snap=>{
const ids=Object.keys(snap.val());
const imp=ids[Math.floor(Math.random()*ids.length)];

db.ref("rooms/"+room).update({
state:"writing",
imposter:imp,
questionNormal:q.normal,
questionImposter:q.imposter,
answers:{},
votes:{},
resultCalculated:false
});
});
}

function showQuestion(d){
answerBox.classList.remove("hidden");
const q=(uid===d.imposter)?d.questionImposter:d.questionNormal;
question.innerText=q;

if(isMaster)
controls(`<button onclick="toReveal()">كشف الإجابات</button>`);
}

function sendAnswer(){
const t=answerInput.value.trim();
if(!t) return alert("الإجابة إجبارية");
db.ref("rooms/"+room+"/answers/"+uid).set(t);
answerBox.classList.add("hidden");
}

function toReveal(){
db.ref("rooms/"+room).update({state:"reveal_answers"});
}

function showAnswers(d){
answers.innerHTML="<h3>الإجابات:</h3>";
Object.entries(d.answers||{}).forEach(([id,a])=>{
answers.innerHTML+=`<p>${d.players[id].name}: ${a}</p>`;
});
if(isMaster)
controls(`<button onclick="toMajority()">كشف سؤال الغالبية</button>`);
}

function toMajority(){
db.ref("rooms/"+room).update({state:"reveal_majority"});
}

function showMajority(d){
question.innerHTML="سؤال الغالبية: "+d.questionNormal;
if(isMaster)
controls(`<button onclick="toVoting()">بدء التصويت</button>`);
}

function toVoting(){
db.ref("rooms/"+room).update({state:"voting"});
}

function showVoting(d){
voting.innerHTML="<h3>التصويت:</h3>";
Object.entries(d.players).forEach(([id,p])=>{
if(id!==uid){
voting.innerHTML+=
`<button onclick="vote('${id}')">${p.name}</button>`;
}
});

let votesList="";
Object.entries(d.votes||{}).forEach(([v,t])=>{
votesList+=`<p>${d.players[v].name} ➜ ${d.players[t].name}</p>`;
});
voting.innerHTML+=votesList;

if(isMaster)
controls(`<button onclick="finish()">إنهاء التصويت</button>`);
}

function vote(id){
if(id===uid) return;
db.ref("rooms/"+room+"/votes/"+uid).set(id);
}

function finish(){
db.ref("rooms/"+room).update({state:"results"});
}

function showResults(d){

if(d.resultCalculated) return;

db.ref("rooms/"+room+"/resultCalculated").set(true);

let counts={};
Object.values(d.votes||{}).forEach(v=>{
counts[v]=(counts[v]||0)+1;
});

Object.entries(counts).forEach(([id,c])=>{
voting.innerHTML+=`<p>${d.players[id].name}: ${c} صوت</p>`;
});

const imp=d.imposter;

Object.entries(d.votes||{}).forEach(([v,t])=>{
if(t===imp)
db.ref("rooms/"+room+"/players/"+v+"/points")
.transaction(p=>(p||0)+1);
});

if(counts[imp])
db.ref("rooms/"+room+"/players/"+imp+"/points")
.transaction(p=>(p||0)-1);
else
db.ref("rooms/"+room+"/players/"+imp+"/points")
.transaction(p=>(p||0)+1);

voting.innerHTML+=
`<h2>الامبوستر هو: ${d.players[imp].name}</h2>
<p>سؤاله: ${d.questionImposter}</p>`;

if(isMaster)
controls(`<button onclick="reset()">جولة جديدة</button>`);
}

function reset(){
db.ref("rooms/"+room).update({
state:"waiting",
answers:{},
votes:{}
});
}
