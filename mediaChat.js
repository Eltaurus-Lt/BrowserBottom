//videochat
let videoMonitor = document.getElementById('video2');
// videoMonitor.srcObject = remoteStream;
// let connectionBtn = document.getElementById('toggleMedia');
// connectionBtn.onclick = async () => {
//     await enableLocalStream();
// //    videoMonitor.srcObject = localStream;
// }
let monitorBtn = document.getElementById('toggleMonitor');
monitorBtn.onclick = () => {
    let status = monitorBtn.getAttribute('data-on');
    if (status && status === "on") {
        videoMonitor.style.visibility = 'hidden';
        monitorBtn.setAttribute('data-on', "off");
    } else {
        videoMonitor.style.visibility = 'visible';
        monitorBtn.setAttribute('data-on', "on");
    }

};
