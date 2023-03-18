//Refactor + split | understand execution order
//audio + controls + playerlist/leave

//player colors
//test room invite link
//?reenter as new/old user

//--------------------------------------------------------------------------------------------------------------------------------------------
//Game login
/*
defines:
    CurrentPlayer
    roomId
    
    triggerEvent(event, data_object)
    catchEvent(event, function(data))
*/
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
    window.addEventListener(event, 
        (event) => {func(event.detail)}
    );
}

//--------------------------------------------------------------------------------------------------------------------------------------------
//AGORA login
/*
requires:
    CurrentPlayer
    roomId

    triggerEvent

defines:
    channel
    client
    
    messageToPeers(data, PlayerId)
    initConnection()

triggers:
    playerJoined data.{PlayerId}
    playerLeft data.{PlayerId}
    messageFromPeer data.{from, type, content}

    leave+logout before unload
*/
let APP_ID = localStorage.getItem('BB-AppID');

if (!APP_ID) {
    window.location = "index.html";
}

let token = null;
let uid = CurrentPlayer;
let client;
let channel; 
//let messageToPeers;

async function initConnection() {
    client = await AgoraRTM.createInstance(APP_ID);
    await client.login({uid, token});
    channel = client.createChannel(roomId);
    await channel.join();

    channel.on('MemberJoined', AgoraUserJoined);
    channel.on('MemberLeft', AgoraUserLeft);
    client.on('MessageFromPeer', AgoraMessage);

    // messageToPeers = (data, PlayerId) => {
    //     console.log('message triggered');
    //     client.sendMessageToPeer(data, PlayerId);
    // };
};

async function AgoraUserJoined(PlayerId) {
 //   console.log('PlayerId:', PlayerId);
    triggerEvent('playerJoined', {PlayerId: PlayerId});
}

function AgoraUserLeft(PlayerId) {
    triggerEvent('playerLeft', {PlayerId: PlayerId});
}

async function AgoraMessage(message, PlayerId) {
    triggerEvent('messageFromPeer', Object.assign({}, JSON.parse(message.text), {from: PlayerId}));
}

window.addEventListener('beforeunload', async ()=> {await channel.leave(); await client.logout();});

function messageToPeers(data, PlayerId) {
    client.sendMessageToPeer(data, PlayerId);
}

//--------------------------------------------------------------------------------------------------------------------------------------------
//Agora2RTC
/*
uses:
    client
    

*/

catchEvent('messageFromPeer', data => {
    if (data.type === 'offer') {
        createAnswer(data.from, data.content);
    }
    
    if (data.type === 'answer') {
        addAnswer(data.content);
    }
    
    if (data.type === 'candidate') {
        if (peerConnection) {
            peerConnection.addIceCandidate(data.content);
        }
    }
    //convert to switch + add else to use for game data communication
});




//--------------------------------------------------------------------------------------------------------------------------------------------
//WebRTC
/*
uses: 
    messageToPeers

defines: 
    peerConnection
    localStream
    remoteStream
    dataChannel
*/



const servers = {iceServers:[{ urls:["stun:stun1.l.google.com:19302", "stun:stun2.l.google.com:19302"]}]};

let peerConnection;
let localStream;
let remoteStream;
let dataChannel;

async function enableLocalStream() {
    localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
    localStream.getTracks().forEach((track) => {
        peerConnection.addTrack(track, localStream);
    });
}

async function createPeerConnection(PlayerId) {
    peerConnection = new RTCPeerConnection(servers);

    //media
    remoteStream = new MediaStream();
    //await enableLocalStream();

    peerConnection.ontrack = (event) => {
        event.streams[0].getTracks().forEach((track) => {
            remoteStream.addTrack(track);
        });
    };

    peerConnection.onicecandidate = async (event) => {
        if (event.candidate) {
            //console.log("New ICE candidate:", event.candidate);
            messageToPeers({ text: JSON.stringify({ 'type': "candidate", 'content': event.candidate }) }, PlayerId);
        }
    };

    //data
    peerConnection.ondatachannel = async (event) => {
        event.channel.onmessage = message => {
            triggerEvent('receiveGameData', JSON.parse(message.data));
        };
    };

    dataChannel = peerConnection.createDataChannel('GameData');
}

async function createOffer(PlayerId) {
    await createPeerConnection(PlayerId);

    let offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);

    messageToPeers({ text: JSON.stringify({ 'type': "offer", 'content': offer }) }, PlayerId);
}

catchEvent('playerJoined', data => {
    createOffer(data.PlayerId);
});

//--------------------------------------------------------------------------------------------------------------------------------------------
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

catchEvent('receiveGameData', data => {
    if (data.type === 'roll') {
        logRoll(data.player, data.value);
    }        
});



//--------------------------------------------------------------------------------------------------------------------------------------------
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
    if (playerToRemove) {
        playerList.removeChild(playerToRemove);
    }
}

document.getElementById('video2').srcObject = remoteStream;

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

    client.sendMessageToPeer({ text: JSON.stringify({ 'type': "answer", 'content': answer }) }, PlayerId);
}

async function addAnswer(answer) {
    if (!peerConnection.currentRemoteDescription) {
        peerConnection.setRemoteDescription(answer);
    }
}




