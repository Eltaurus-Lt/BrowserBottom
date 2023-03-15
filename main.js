//understand execution order
//rtc roll dice
//player names

//separate agora.js
//async refactor + ...
//audio + controls + playerlist/leave

//room+appid for a share link

function logRoll(player, roll) {
    let log = document.getElementById("log");
    let logentry = log.appendChild(document.createElement("div"));
    logentry.innerHTML = (player ? player : "Player ?") + " rolled " + roll;
    log.scrollTop = log.scrollHeight;
}

function diceRoll() {

    let roll = Math.floor(100 * Math.random());
    //console.log("dice rolled");

    if (peerConnection && dataChannel) {
        dataChannel.send(JSON.stringify({
          type: 'roll',
          value: roll
        }));
    }
   
    logRoll("I", roll);
}



let APP_ID = localStorage.getItem('BB-AppID');
let queryString = window.location.search;
let urlParams = new URLSearchParams(queryString);
let roomId = urlParams.get('room');
if (!roomId || !APP_ID) {
    window.location = "index.html";
}

let token = null;
let uid = String(Math.floor(Math.random() * 1000));
let client;
let channel; 

let localStream;
let remoteStream;
let peerConnection;
let dataChannel;

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

let handleUserLeft = (MemberId) => {

}

let init = async () => {
    client = await AgoraRTM.createInstance(APP_ID);
    await client.login({uid, token});
    channel = client.createChannel(roomId);
    await channel.join();

    channel.on('MemberJoined', handleUserJoined);
    channel.on('MemberLeft', handleUserLeft);
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

    //data
    dataChannel = peerConnection.createDataChannel('GameData');
 
    peerConnection.ondatachannel = async (event) => {
        const dataChannel = event.channel;
      
        dataChannel.onmessage = event => {
          const data = JSON.parse(event.data);
      
          if (data.type === 'roll') {
            logRoll(null, data.value);
          }
        };
    };
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

let leaveChannel = async () => {
    await channel.leave();
    await client.logout();
}
window.addEventListener('beforeunload', leaveChannel);

init();
