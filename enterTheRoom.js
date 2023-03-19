//parse login + custom events API
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
if (roomId && roomId != "") {
    localStorage.setItem('BB-Room', roomId);
}

if (!roomId || !CurrentPlayer) {
    window.location = "index.html";
}

function triggerEvent(event, data) {
    window.dispatchEvent(
        new CustomEvent(event, { detail: data })
    );
}
function catchEvent(event, func) {
    window.addEventListener(event,
        (event) => { func(event.detail); }
    );
}
