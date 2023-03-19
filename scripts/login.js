//TODO:
//fetch('Players/colors.json') (local sever?)

const color_LS = localStorage.getItem('BB-Color');

fetch('https://raw.githubusercontent.com/Eltaurus-Lt/BrowserBottom/master/Players/colors.json')
  .then(response => response.json())
  .then(colors => {
    const colorCircles = document.getElementById('color-selection');
    colors.forEach(color => {
      const circle = document.createElement('input');
      circle.type = 'radio';
      circle.name = 'colorGroup';
      circle.id = circle.value = color[0];
      circle.className = 'colorCircle';
      circle.style.setProperty('--col-primary', '#' + color[2]);
      if (color_LS && color_LS === color[0]) {
        circle.checked = true;
      };
      circle.addEventListener('change', () =>{
        if (circle.checked) {
          localStorage.setItem('BB-Color', color[0]);
        }
      });
      colorCircles.appendChild(circle);
    });
  })
  .catch(error => console.error(error));


const AppId_in = document.getElementById('AgoraID-in');
const room_in = document.getElementById('room');
const playerName_in = document.getElementById('player-name');

const AppId_LS = localStorage.getItem('BB-AppID');
const room_LS = localStorage.getItem('BB-Room');
const playerName_LS = localStorage.getItem('BB-Name');


if (AppId_LS) {
    AppId_in.value = AppId_LS;
}
if (room_LS) {
    room_in.value = room_LS;
}
if (playerName_LS) {
    playerName_in.value = playerName_LS;
}


const form = document.querySelector('#login-data');
form.addEventListener('submit', (event) => {
  event.preventDefault();
  if (!AppId_in.value || !room_in.value || !playerName_in.value) {
    console.log("form incomplete");
    return;
  }

  const AppId = AppId_in.value;
  const room = room_in.value;
  const playerName = playerName_in.value;
  // const color = color_in.value;

  // Save form data to localStorage
  if (AppId && AppId!="") {
     localStorage.setItem('BB-AppID', AppId);
  }
  if (room && room!="") {
    localStorage.setItem('BB-Room', room);
  }
  if (playerName && playerName!="") {
    localStorage.setItem('BB-Name', playerName);
  }



  window.location = `Dice.html?room=${room}`;
  // Do something with the form data, for example:
  //const formData = { appid, room, playerName, color };
  //const encodedFormData = encodeURIComponent(JSON.stringify(formData));
  //const url = `http://example.com/otherpage.html?data=${encodedFormData}`;
  //window.location.href = url;
});