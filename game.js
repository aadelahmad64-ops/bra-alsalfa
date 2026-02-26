let currentRoom=null;
let currentUser=null;
let isMaster=false;

auth.onAuthStateChanged(user=>{
if(user) currentUser=user.uid;
});

firebase.database().ref(".info/connected").on("value",snap=>{
document.getElementById("connectionStatus").innerText=
snap.val()?"🟢 متصل":"🔴 غير متصل";
});

function randomID(){
return "bra-"+Math.floor(1000+Math.random()*9000);
}

function createRoom(){
const name=document.getElementById("playerName").value.trim();
if(!name) return alert("اكتب اسمك");

const roomID=randomID();
currentRoom=roomID;
isMaster=true;

db.ref("rooms/"+roomID).set({
master:currentUser,
state:"waiting"
});

db.ref("rooms/"+roomID+"/players/"+currentUser).set({
name:name,
points:0,
online:true
});

enterRoom(roomID);
}

function joinRoom(){
const name=document.getElementById("playerName").value.trim();
const roomID=document.getElementById("roomCodeInput").value.trim();
if(!name||!roomID) return;

currentRoom=roomID;

db.ref("rooms/"+roomID+"/players/"+currentUser).set({
name:name,
points:0,
online:true
});

enterRoom(roomID);
}

function enterRoom(roomID){
document.getElementById("home").classList.add("hidden");
document.getElementById("game").classList.remove("hidden");
document.getElementById("roomCode").innerText="الغرفة: "+roomID;

listenRoom();
}

function leaveRoom(){
db.ref("rooms/"+currentRoom+"/players/"+currentUser).remove();
location.reload();
}

function listenRoom(){
db.ref("rooms/"+currentRoom).on("value",snap=>{
const room=snap.val();
if(!room) return;

renderPlayers(room.players);
});
}

function renderPlayers(players){
const list=document.getElementById("playersList");
list.innerHTML="";

const sorted=Object.entries(players)
.sort((a,b)=>b[1].points-a[1].points);

sorted.forEach(([uid,p])=>{
const div=document.createElement("div");
div.className="playerCard";
div.innerHTML=`
<span>${p.name}</span>
<span>⭐ ${p.points}</span>
`;
list.appendChild(div);
});
       }
