let roomId=null;
let uid=null;
let isMaster=false;

auth.onAuthStateChanged(user=>{
if(user) uid=user.uid;
});

firebase.database().ref(".info/connected").on("value",snap=>{
document.getElementById("connectionStatus").innerText =
snap.val() ? "🟢 متصل" : "🔴 غير متصل";
});

function randomRoomID(){
return Math.floor(1000 + Math.random()*9000).toString();
}

function createRoom(){
const name=document.getElementById("playerName").value.trim();
if(!name) return alert("اكتب اسمك");

roomId=randomRoomID();
isMaster=true;

db.ref("rooms/"+roomId).set({
master:uid,
state:"waiting",
round:0
});

addPlayer(name);
enterRoom();
}

function joinRoom(){
const name=document.getElementById("playerName").value.trim();
roomId=document.getElementById("roomCodeInput").value.trim();
if(!name||!roomId) return;

addPlayer(name);
enterRoom();
}

function addPlayer(name){
db.ref("rooms/"+roomId+"/players/"+uid).set({
name:name,
points:0,
online:true
});

db.ref("rooms/"+roomId+"/players/"+uid+"/online").onDisconnect().set(false);
}

function enterRoom(){
document.getElementById("home").classList.add("hidden");
document.getElementById("game").classList.remove("hidden");
document.getElementById("roomCode").innerText="الغرفة: "+roomId;
listenRoom();
}

function leaveRoom(){
db.ref("rooms/"+roomId+"/players/"+uid).remove();
location.reload();
}

function listenRoom(){
db.ref("rooms/"+roomId).on("value",snap=>{
const data=snap.val();
if(!data) return;

isMaster=(data.master===uid);
renderPlayers(data.players);
handleState(data);
});
}

function renderPlayers(players){
const container=document.getElementById("players");
container.innerHTML="";
if(!players) return;

const sorted=Object.entries(players).sort((a,b)=>b[1].points-a[1].points);

sorted.forEach(([id,p])=>{
const div=document.createElement("div");
div.className="playerCard";
div.innerHTML=`
<span>${p.name} ${p.online?"🟢":"🔴"}</span>
<span>⭐ ${p.points}</span>
`;
container.appendChild(div);
});
}

function handleState(data){
const state=data.state;

if(state==="waiting" && isMaster){
showMasterStart();
}

if(state==="writing"){
startWriting(data);
}

if(state==="reveal_answers"){
revealAnswers(data);
}

if(state==="voting"){
startVoting(data);
}

if(state==="results"){
showResults(data);
}
}

function showMasterStart(){
document.getElementById("controls").innerHTML=
'<button onclick="startRound()">بدء الجولة</button>';
}

function startRound(){
const question=QUESTIONS[Math.floor(Math.random()*QUESTIONS.length)];
const playersRef=db.ref("rooms/"+roomId+"/players");

playersRef.once("value",snap=>{
const players=Object.keys(snap.val());
const imposter=players[Math.floor(Math.random()*players.length)];

db.ref("rooms/"+roomId).update({
state:"writing",
imposter:imposter,
questionNormal:question.normal,
questionImposter:question.imposter,
answers:{},
votes:{}
});
});
}

function startWriting(data){
document.getElementById("answerBox").classList.remove("hidden");
document.getElementById("answersReveal").innerHTML="";
document.getElementById("votingSection").innerHTML="";
document.getElementById("controls").innerHTML="";

const q = (uid===data.imposter)?data.questionImposter:data.questionNormal;
document.getElementById("questionBox").innerText=q;

if(isMaster){
document.getElementById("controls").innerHTML=
'<button onclick="revealAnswersState()">كشف الإجابات</button>';
}
}

function sendAnswer(){
const txt=document.getElementById("answerInput").value.trim();
if(!txt) return alert("الإجابة إجبارية");

db.ref("rooms/"+roomId+"/answers/"+uid).set(txt);
document.getElementById("answerBox").classList.add("hidden");
}

function revealAnswersState(){
db.ref("rooms/"+roomId).update({state:"reveal_answers"});
}

function revealAnswers(data){
document.getElementById("answersReveal").innerHTML="<h3>الإجابات:</h3>";
if(!data.answers) return;

Object.entries(data.answers).forEach(([id,ans])=>{
const name=data.players[id].name;
document.getElementById("answersReveal").innerHTML+=
`<p><b>${name}:</b> ${ans}</p>`;
});

if(isMaster){
document.getElementById("controls").innerHTML=
'<button onclick="startVotingState()">بدء التصويت</button>';
}
}

function startVotingState(){
db.ref("rooms/"+roomId).update({state:"voting"});
}

function startVoting(data){
document.getElementById("votingSection").innerHTML="<h3>التصويت:</h3>";
Object.entries(data.players).forEach(([id,p])=>{
if(id===uid) return;
document.getElementById("votingSection").innerHTML+=
`<button onclick="vote('${id}')">${p.name}</button>`;
});
if(isMaster){
document.getElementById("controls").innerHTML=
'<button onclick="finishVoting()">إنهاء التصويت</button>';
}
}

function vote(target){
if(target===uid) return;
db.ref("rooms/"+roomId+"/votes/"+uid).set(target);
}

function finishVoting(){
db.ref("rooms/"+roomId).update({state:"results"});
}

function showResults(data){
let counts={};
Object.values(data.votes||{}).forEach(v=>{
counts[v]=(counts[v]||0)+1;
});
let top=null,max=0;
Object.entries(counts).forEach(([id,c])=>{
if(c>max){max=c;top=id;}
});

let resultText="";

if(top===data.imposter){
resultText="تم كشف الامبوستر!";
Object.entries(data.votes).forEach(([voter,target])=>{
if(target===data.imposter){
db.ref("rooms/"+roomId+"/players/"+voter+"/points").transaction(p=>(p||0)+1);
}
});
db.ref("rooms/"+roomId+"/players/"+data.imposter+"/points")
.transaction(p=>(p||0)-1);
}else{
resultText="لم يتم كشف الامبوستر!";
db.ref("rooms/"+roomId+"/players/"+data.imposter+"/points")
.transaction(p=>(p||0)+1);
}

document.getElementById("votingSection").innerHTML=
"<h2>"+resultText+"</h2>";

if(isMaster){
document.getElementById("controls").innerHTML=
'<button onclick="resetRound()">جولة جديدة</button>';
}
}

function resetRound(){
db.ref("rooms/"+roomId).update({
state:"waiting",
answers:{},
votes:{}
});
}
