//GameState (playerlist + )
//Refactor + split
//audio + controls 

//player colors
//test room invite link
//?reenter as new/old user

//--------------------------------------------------------------------------------------------------------------------------------------------
//AGORA login
/*
requires:
    CurrentPlayer
    roomId

defines:  
    signalToPeer(data, PlayerId)
    initConnection()

triggers:
    playerJoined data.{PlayerId}
    playerLeft data.{PlayerId}
    createAnswer.{offer, toPlayer}
    addAnswer.{answer, fromPlayer}
    icecandidate.{candidate}
    [receiveGameData.{...}]

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

async function initConnection() {
    client = await AgoraRTM.createInstance(APP_ID);
    await client.login({uid, token});
    channel = client.createChannel(roomId);
    await channel.join();

    channel.on('MemberJoined', AgoraUserJoined);
    channel.on('MemberLeft', AgoraUserLeft);
    client.on('MessageFromPeer', AgoraMessage);

};

async function AgoraUserJoined(PlayerId) {
    triggerEvent('playerJoined', {PlayerId: PlayerId});
}

function AgoraUserLeft(PlayerId) {
    triggerEvent('playerLeft', {PlayerId: PlayerId});
}

function signalToPeer(data, to) {
    client.sendMessageToPeer({text: JSON.stringify(data)}, to);
}

async function AgoraMessage(message, fromPlayer) {
    triggerEvent('signalFromPeer', Object.assign({}, JSON.parse(message.text), {from: fromPlayer}));
}

window.addEventListener('beforeunload', async ()=> {await channel.leave(); await client.logout();});


//RTCsignaling + messages
catchEvent('signalFromPeer', data => {
    if (data.type === 'offer') {
        triggerEvent('createAnswer', {'offer': data.content, 'toPlayer': data.from});
    }
    
    if (data.type === 'answer') {
        triggerEvent('addAnswer', {'answer': data.content, 'fromPlayer': data.from});
    }
    
    if (data.type === 'candidate') {
        triggerEvent('icecandidate', {'candidate': data.content})
    }

    if (data.type === 'message') { //untested
        triggerEvent('receiveGameData', data.content);
    }
    //convert to switch 
});




//--------------------------------------------------------------------------------------------------------------------------------------------
//WebRTC
/*
requres: 
    signalToPeer

defines: 
    peerConnection
    localStream
    remoteStream
    dataChannel

catches:
    playerJoined
    createAnswer
    addAnswer
    icecandidate

triggers:
    receiveGameData
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

async function createPeerConnection(toPlayer) {
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
            signalToPeer({'type': "candidate", 'content': event.candidate}, toPlayer);
        }
    };

    //data
    peerConnection.ondatachannel = async (event) => {
        event.channel.onmessage = message => {
            triggerEvent('RTCmessage', JSON.parse(message.data));
        };
    };

    dataChannel = peerConnection.createDataChannel('GameData');
}

async function createOffer(toPlayer) {

    let offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);

    signalToPeer({'type': "offer", 'content': offer }, toPlayer);
}

catchEvent('createAnswer', async data => {
    await createPeerConnection(data.toPlayer);
    await peerConnection.setRemoteDescription(data.offer);

    let answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);

    signalToPeer({ 'type': "answer", 'content': answer }, data.toPlayer);
});

catchEvent('addAnswer', data => {
    if (!peerConnection.currentRemoteDescription) {
        peerConnection.setRemoteDescription(data.answer);
    }
});

catchEvent('icecandidate', data => {
    if (peerConnection) {
        peerConnection.addIceCandidate(data.candidate);
    }
});

catchEvent('playerJoined', async data => {
    await createPeerConnection(data.PlayerId);
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

catchEvent('RTCmessage', data => {
    if (data.type === 'gameState') {
        triggerEvent('receiveGameState', data);
    } else if (data.type === 'chatMessage') {
        triggerEvent('receiveChatMessage', data);
    } else {
        triggerEvent('receiveGameData', data);
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

catchEvent('receiveGameData', data => {
    if (data.type === 'roll') {
        logRoll(data.player, data.value);
    }        
});

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

