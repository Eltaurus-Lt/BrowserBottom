//1)move     
// document.getElementById('video2').srcObject = remoteStream;
// ||
// await enableLocalStream();
//down the stream
//2) checks if local/remote stream
//3) handle permission rejections

//audio + controls 
//player names list -> GameState -> Sync GameState on join

//requre agora-rtm from Agora.js
//script modules
//test room invite link
//?reenter as new/old user

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



const configuration = {
    iceServers:[
        { urls:["stun:stun1.l.google.com:19302", "stun:stun2.l.google.com:19302"]}
    ],
    offerToReceiveAudio: true,
    offerToReceiveVideo: true
};

let peerConnection;
let localStream;
let remoteStream;
let dataChannel;

async function enableLocalStream() {
    localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    localStream.getTracks().forEach((track) => {
        console.log("track added");
        peerConnection.addTrack(track, localStream);
    });
}

async function createPeerConnection(toPlayer) {
    peerConnection = new RTCPeerConnection(configuration);

    //media
    //remoteStream = new MediaStream();
    //document.getElementById('video2').srcObject = remoteStream;
    //await enableLocalStream();

    peerConnection.ontrack = (event) => {
        console.log("ontrack");
        event.streams[0].getTracks().forEach((track) => {
            document.getElementById('video2').style.display = 'inline-block';
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

//events API

catchEvent('playerJoined', data => {
    console.log("🎉",upperFirst(data.PlayerId), "player joined the party \\o/");    
    addPlayer(data.PlayerId);
});
catchEvent('playerLeft', data => {
    console.log(data.PlayerId, "went home =(");    
    removePlayer(data.PlayerId);
});
//console.log('playerJoined event:', typeof window['playerJoined']);



//Gameplay functions

addPlayer(CurrentPlayer);
initConnection();

