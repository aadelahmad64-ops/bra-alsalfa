let uid=null;
let room=null;
let isMaster=false;

auth.onAuthStateChanged(u=>{
if(u) uid=u.uid;
});

firebase.database().ref(".info/connected").on("value",s=>{
document.getElementById("status").innerText=
s.val()?"🟢":"🔴";
});

function randomRoom(){
return Math.floor(1000+Math.random()*9000).toString();
}

function createRoom(){
const name=getName();
if(!name) return;

room=randomRoom();

db.ref("rooms/"+room).set({
master:uid,
state:"waiting",
resultsDone:false
});

addPlayer(name);
enterRoom();
}

function joinRoom(){
const name=getName();
room=document.getElementById("roomInput").value.trim();
if(!name||!room) return;

addPlayer(name);
enterRoom();
}

function getName(){
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
const div=document.getElementById("players");
div.innerHTML="";

if(!d.players) return;

const sorted=Object.entries(d.players)
.sort((a,b)=>b[1].points-a[1].points);

sorted.forEach(([id,p])=>{
let answeredMark="";
if(d.state==="writing" && d.answers && d.answers[id]){
answeredMark="✔";
}

let kick="";
if(isMaster && id!==uid){
kick=`<button onclick="kick('${id}')">❌</button>`;
}

div.innerHTML+=`
<div class="player">
<span>${p.name} ${p.online?"🟢":"🔴"} ${answeredMark}</span>
<span>${p.points}</span>
${kick}
</div>`;
});
}

function kick(id){
if(confirm("هل تريد طرد اللاعب؟")){
db.ref("rooms/"+room+"/players/"+id).remove();
db.ref("rooms/"+room+"/answers/"+id).remove();
db.ref("rooms/"+room+"/votes/"+id).remove();
}
}

function handleState(d){

clearUI();

if(d.state==="waiting" && isMaster){
setControls(`<button onclick="startRound()">بدء الجولة</button>`);
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
document.getElementById("question").innerHTML="";
document.getElementById("answers").innerHTML="";
document.getElementById("voting").innerHTML="";
setControls("");
document.getElementById("answerBox").classList.add("hidden");
}

function setControls(html){
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
resultsDone:false
});
});
}

function showQuestion(d){
document.getElementById("answerBox").classList.remove("hidden");
const q=(uid===d.imposter)?d.questionImposter:d.questionNormal;
document.getElementById("question").innerText=q;

if(isMaster){
setControls(`<button onclick="toReveal()">كشف الإجابات</button>`);
}
}

function sendAnswer(){
const t=document.getElementById("answerInput").value.trim();
if(!t) return alert("الإجابة إجبارية");

db.ref("rooms/"+room+"/answers/"+uid).set(t);
document.getElementById("answerBox").classList.add("hidden");
}

function toReveal(){
db.ref("rooms/"+room).update({state:"reveal_answers"});
}

function showAnswers(d){
const box=document.getElementById("answers");
box.innerHTML="<h3>الإجابات:</h3>";

Object.entries(d.answers||{}).forEach(([id,a])=>{
box.innerHTML+=`<p>${d.players[id].name}: ${a}</p>`;
});

if(isMaster){
setControls(`<button onclick="toMajority()">كشف سؤال الغالبية</button>`);
}
}

function toMajority(){
db.ref("rooms/"+room).update({state:"reveal_majority"});
}

function showMajority(d){
document.getElementById("question").innerHTML=
"سؤال الغالبية: "+d.questionNormal;

if(isMaster){
setControls(`<button onclick="toVoting()">بدء التصويت</button>`);
}
}

function toVoting(){
db.ref("rooms/"+room).update({state:"voting"});
}

function showVoting(d){
const vDiv=document.getElementById("voting");
vDiv.innerHTML="<h3>التصويت:</h3>";

Object.entries(d.players).forEach(([id,p])=>{
if(id!==uid){
vDiv.innerHTML+=
`<button onclick="vote('${id}')">${p.name}</button>`;
}
});

// عرض من صوت على من
Object.entries(d.votes||{}).forEach(([v,t])=>{
vDiv.innerHTML+=
`<p>${d.players[v].name} ➜ ${d.players[t].name}</p>`;
});

if(isMaster){
setControls(`<button onclick="finish()">إنهاء التصويت</button>`);
}
}

function vote(id){
if(id===uid) return;
db.ref("rooms/"+room+"/votes/"+uid).set(id);
}

function finish(){
db.ref("rooms/"+room).update({state:"results"});
}

function showResults(d){

const vDiv=document.getElementById("voting");
vDiv.innerHTML="<h3>نتائج التصويت:</h3>";

let counts={};

Object.values(d.votes||{}).forEach(v=>{
counts[v]=(counts[v]||0)+1;
});

// عرض عدد الأصوات
Object.entries(counts).forEach(([id,c])=>{
vDiv.innerHTML+=`<p>${d.players[id].name}: ${c} صوت</p>`;
});

// عرض من صوت على من
Object.entries(d.votes||{}).forEach(([v,t])=>{
vDiv.innerHTML+=`<p>${d.players[v].name} ➜ ${d.players[t].name}</p>`;
});

const imp=d.imposter;

// الحساب فقط من الماستر ومرة واحدة
if(isMaster && !d.resultsDone){

db.ref("rooms/"+room+"/resultsDone").set(true);

Object.entries(d.votes||{}).forEach(([v,t])=>{
if(t===imp){
db.ref("rooms/"+room+"/players/"+v+"/points")
.transaction(p=>(p||0)+1);
}
});

// إذا في أحد صوت عليه → -1
if(counts[imp]){
db.ref("rooms/"+room+"/players/"+imp+"/points")
.transaction(p=>(p||0)-1);
}else{
db.ref("rooms/"+room+"/players/"+imp+"/points")
.transaction(p=>(p||0)+1);
}
}

// كشف الامبوستر دائماً
vDiv.innerHTML+=`
<h2>الامبوستر هو: ${d.players[imp].name}</h2>
<p>سؤاله: ${d.questionImposter}</p>
`;

if(isMaster){
setControls(`<button onclick="reset()">جولة جديدة</button>`);
}
}

function reset(){
db.ref("rooms/"+room).update({
state:"waiting",
answers:{},
votes:{},
resultsDone:false
});
}
