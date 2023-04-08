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
