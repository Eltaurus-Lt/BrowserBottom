/*TODO:
send/receive GameData with messages
switch in signalFromPeer
signalFromPeer: event -> function
*/


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

let APP_ID = urlParams.get('app');
if (!APP_ID || APP_ID == "") {
    APP_ID = localStorage.getItem('BB-AppID');
} else {
    localStorage.setItem('BB-AppID', APP_ID);
}
if (!APP_ID || APP_ID == "") {
    window.location = "../../index.html";
}
let token = null;
let uid = CurrentPlayer;
let client;
let channel;

async function initConnection() {
    client = await AgoraRTM.createInstance(APP_ID);
    await client.login({ uid, token });
    channel = client.createChannel(roomId);
    await channel.join();

    channel.on('MemberJoined', AgoraUserJoined);
    channel.on('MemberLeft', AgoraUserLeft);
    client.on('MessageFromPeer', AgoraMessage);

}

async function AgoraUserJoined(PlayerId) {
    triggerEvent('playerJoined', { PlayerId: PlayerId });
}
function AgoraUserLeft(PlayerId) {
    triggerEvent('playerLeft', { PlayerId: PlayerId });
}
function signalToPeer(data, to) {
    client.sendMessageToPeer({ text: JSON.stringify(data) }, to);
}

async function AgoraMessage(message, fromPlayer) {
    triggerEvent('signalFromPeer', Object.assign({}, JSON.parse(message.text), { from: fromPlayer }));
}
window.addEventListener('beforeunload', async () => { await channel.leave(); await client.logout(); });




//RTCsignaling + messages
catchEvent('signalFromPeer', data => {
    if (data.type === 'offer') {
        triggerEvent('createAnswer', { 'offer': data.content, 'toPlayer': data.from });
    }

    if (data.type === 'answer') {
        triggerEvent('addAnswer', { 'answer': data.content, 'fromPlayer': data.from });
    }

    if (data.type === 'candidate') {
        //console.log('ice candidate signal received');
        triggerEvent('icecandidate', { 'candidate': data.content });
    }

    if (data.type === 'message') { //untested
        triggerEvent('receiveGameData', data.content);
    }
    //convert to switch 
});
