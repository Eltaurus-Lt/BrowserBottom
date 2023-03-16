//Refactor + split | understand execution order
//audio + controls + playerlist/leave

//player colors
//test room invite link
//?reenter as new/old user


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

function callEvent(event, data) {
    document.dispatchEvent(
        new CustomEvent(event, {detail: data})
    );
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

async function init() {
    client = await AgoraRTM.createInstance(APP_ID);
    await client.login({uid, token});
    channel = client.createChannel(roomId);
    await channel.join();

    channel.on('MemberJoined', handleUserJoined);
    channel.on('MemberLeft', handleUserLeft);
    client.on('MessageFromPeer', handleAgoraMessage);
};
init();

async function leaveChannel() {
    await channel.leave();
    await client.logout();
}
window.addEventListener('beforeunload', leaveChannel);


async function handleUserJoined(PlayerId) {
    console.log(PlayerId, "joined the party \\o/");
    createOffer(PlayerId);
}

function handleUserLeft(PlayerId) {

}

async function handleAgoraMessage(message, PlayerId) {
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




