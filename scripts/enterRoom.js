//parse login + custom events API
/*
defines:
    CurrentPlayer
    roomId
    
    triggerEvent(event, data_object)
    catchEvent(event, function(data))
*/

let CurrentPlayer = localStorage.getItem('BB-Color');

let queryString = window.location.search;
let urlParams = new URLSearchParams(queryString);
let roomId = urlParams.get('room');
if (roomId && roomId != "") {
    localStorage.setItem('BB-Room', roomId);
}

if (!roomId || !CurrentPlayer) {
    window.location = "../../index.html";
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

//capitalize the first letter in a string
function upperFirst(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }