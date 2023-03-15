//understend execution order
//rtc roll dice
//separate agora.js
//async refactor + ...
//vsc <-> git -> pages

function diceRoll() {

    let roll = Math.floor(100 * Math.random());
    //console.log("dice rolled");

    let log = document.getElementById("log");
    let logentry = log.appendChild(document.createElement("div"));
    logentry.innerHTML = "Player ? rolled " + roll;
    log.scrollTop = log.scrollHeight;

}

let APP_ID = localStorage.getItem('BB-AppID');
let queryString = window.location.search;
let urlParams = new URLSearchParams(queryString);
let roomId = urlParams.get('room');
if (!roomId || !APP_ID) {
    window.location = entry.html
}

let token = null;
let uid = String(Math.floor(Math.random() * 1000));
let client;
let channel; 

let localStream;
let remoteStream;
let peerConnection;

const servers = {
    iceServers:[
        {
            urls:["stun:stun1.l.google.com:19302", "stun:stun2.l.google.com:19302"]
        }
    ]
}

let handleMessageFromPeer = async (message, MemberId) => {
    message = JSON.parse(message.text);

    if (message.type === 'offer') {
        createAnswer(MemberId, message.offer);
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

let handleUserJoined = async (MemberId) => {
    console.log('new player joined: ', MemberId);
    createOffer(MemberId);
}

let init = async () => {
    client = await AgoraRTM.createInstance(APP_ID);
    await client.login({uid, token});
    channel = client.createChannel(roomId);
    await channel.join();

    channel.on('MemberJoined', handleUserJoined);
    client.on('MessageFromPeer', handleMessageFromPeer);


//    localStream = await navigator.mediaDevices.getUserMedia({video:true, audio: false});
//   document.getElementById('video1').srcObject = localStream;
}

let createPeerConnection = async (MemberId) => {
    peerConnection = new RTCPeerConnection(servers);

    remoteStream = new MediaStream();
    document.getElementById('video2').srcObject = remoteStream;

 //   if (!localStream) {
        localStream = await navigator.mediaDevices.getUserMedia({video:true, audio: false});
        document.getElementById('video1').srcObject = localStream;
 //   }

    localStream.getTracks().forEach((track) => {
        peerConnection.addTrack(track, localStream);
    });

    peerConnection.ontrack = (event) => {
        event.streams[0].getTracks().forEach((track) => {
            remoteStream.addTrack(track);
        })
    }

    peerConnection.onicecandidate = async (event) => {
        if (event.candidate) {
            //console.log("New ICE candidate:", event.candidate);
            client.sendMessageToPeer({text: JSON.stringify({'type': "candidate", 'candidate': event.candidate})}, MemberId);
        }
    }
}

let createOffer = async (MemberId) => {
    await createPeerConnection(MemberId);

    let offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);

    client.sendMessageToPeer({text: JSON.stringify({'type': "offer", 'offer': offer})}, MemberId);
}

let createAnswer = async (MemberId, offer) => {
    await createPeerConnection(MemberId);

    await peerConnection.setRemoteDescription(offer);

    let answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);

    client.sendMessageToPeer({text: JSON.stringify({'type': "answer", 'answer': answer})}, MemberId);
}

let addAnswer = async (answer) => {
    if (!peerConnection.currentRemoteDescription) {
        peerConnection.setRemoteDescription(answer);
    }
}

init();
