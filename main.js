//Refactor + split | understand execution order
//audio + controls + playerlist/leave

//player colors
//test room invite link
//?reenter as new/old user

/*
custom events: 
    playerJoined data.{PlayerId}

API: 
triggerEvent(event, data_object)
catchEvent(event, function(data))
*/


//Game Setting
let CurrentPlayer = localStorage.getItem('BB-Name');

let queryString = window.location.search;
let urlParams = new URLSearchParams(queryString);
let roomId = urlParams.get('room');
if (roomId && roomId!="")  {
    localStorage.setItem('BB-Room', roomId);
}
if (!roomId || !CurrentPlayer) {
    window.location = "index.html";
}

function triggerEvent(event, data) {
    window.dispatchEvent(
        new CustomEvent(event, {detail: data})
    );
}
function catchEvent(event, func) {
    window.addEventListener(event, (event) => {func(event.detail)});
}

//AGORA login
let APP_ID = localStorage.getItem('BB-AppID');

if (!APP_ID) {
    window.location = "index.html";
}

let token = null;
let uid = CurrentPlayer;
let client;
let channel; 

async function initConnection() {
    client = await AgoraRTM.createInstance(APP_ID);
    await client.login({uid, token});
    channel = client.createChannel(roomId);
    await channel.join();

    channel.on('MemberJoined', AgoraUserJoined);
    channel.on('MemberLeft', AgoraUserLeft);
    client.on('MessageFromPeer', AgoraMessage);
};

window.addEventListener('beforeunload', async ()=> {await channel.leave(); await client.logout();});


async function AgoraUserJoined(PlayerId) {
 //   console.log('PlayerId:', PlayerId);
    triggerEvent('playerJoined', {PlayerId: PlayerId});
    createOffer(PlayerId);
}

function AgoraUserLeft(PlayerId) {
    triggerEvent('playerLeft', {PlayerId: PlayerId});
}

async function AgoraMessage(message, PlayerId) {
    message = JSON.parse(message.text);

    if (message.type === 'offer') {
        createAnswer(PlayerId, message.offer);
    }

    if (message.type === 'answer') {
        addAnswer(message.answer);
    }

    if (message.type === 'candidate') {
        if (peerConnection) {
            peerConnection.addIceCandidate(message.candidate);
        }
    }

}


//Agora2RTC
const servers = {iceServers:[{ urls:["stun:stun1.l.google.com:19302", "stun:stun2.l.google.com:19302"]}]};

let peerConnection;
let localStream;
let remoteStream;
let dataChannel;

async function createMediaStreams() {
    remoteStream = new MediaStream();
    document.getElementById('video2').srcObject = remoteStream;

    localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
    localStream.getTracks().forEach((track) => {
        peerConnection.addTrack(track, localStream);
    });
}

async function createPeerConnection(PlayerId) {
    peerConnection = new RTCPeerConnection(servers);

    await createMediaStreams();


    peerConnection.ontrack = (event) => {
        event.streams[0].getTracks().forEach((track) => {
            remoteStream.addTrack(track);
        });
    };

    peerConnection.onicecandidate = async (event) => {
        if (event.candidate) {
            //console.log("New ICE candidate:", event.candidate);
            client.sendMessageToPeer({ text: JSON.stringify({ 'type': "candidate", 'candidate': event.candidate }) }, PlayerId);
        }
    };

    //data
    dataChannel = peerConnection.createDataChannel('GameData');

    peerConnection.ondatachannel = async (event) => {
        const dataChannel = event.channel;

        dataChannel.onmessage = event => {
            const data = JSON.parse(event.data);

            if (data.type === 'roll') {
                logRoll(data.player, data.value);
            }
        };
    };
}

async function createOffer(PlayerId) {
    await createPeerConnection(PlayerId);

    let offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);

    client.sendMessageToPeer({ text: JSON.stringify({ 'type': "offer", 'offer': offer }) }, PlayerId);
}



//RTC-Client
function sendGameState() {

}

function sendGameData(type, value) {

    if (peerConnection && dataChannel) {
        dataChannel.send(JSON.stringify({
          type: type,
          value: value,
          player: CurrentPlayer
        }));
    } else {
        console.log("Connection error: no peerConnection or dataChannel");
    }
}

function receiveGameData(data) {

}


//Game

//interface defs
let playerList = document.getElementById("playersList");

function addPlayer(PlayerId) {
    let newplayer = playerList.appendChild(document.createElement("li"));
    newplayer.innerHTML = PlayerId;
}

function removePlayer(PlayerId) {
    const players = Array.from(playerList.getElementsByTagName('li'));
    const playerToRemove = players.find(player => player.innerHTML.includes(PlayerId));
    playerList.removeChild(playerToRemove);
}

//events API

catchEvent('playerJoined', data => {
    //console.log(data.PlayerId, "joined the party \\o/");    
    addPlayer(data.PlayerId);
});
catchEvent('playerLeft', data => {
    console.log(data.PlayerId, "went home =(");    
    removePlayer(data.PlayerId);
});
//console.log('playerJoined event:', typeof window['playerJoined']);

//Gameplay functions

function logRoll(player, roll) {
    let log = document.getElementById("log");
    let logentry = log.appendChild(document.createElement("div"));
    logentry.innerHTML = (player ? player : "Player ?") + " rolled " + roll;
    log.scrollTop = log.scrollHeight;
}

function diceRoll() {
    let roll = Math.floor(100 * Math.random());
    sendGameData("roll", roll);  
    logRoll(CurrentPlayer, roll);
}

addPlayer(CurrentPlayer);
initConnection();




















async function createAnswer(PlayerId, offer) {
    await createPeerConnection(PlayerId);

    await peerConnection.setRemoteDescription(offer);

    let answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);

    client.sendMessageToPeer({ text: JSON.stringify({ 'type': "answer", 'answer': answer }) }, PlayerId);
}

async function addAnswer(answer) {
    if (!peerConnection.currentRemoteDescription) {
        peerConnection.setRemoteDescription(answer);
    }
}




