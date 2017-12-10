// global vars
const opponent = {
  userName: '',
  choice: '',
  wins: 0,
  losses: 0,
};
const player = {
  userName: '',
  choice: '',
  wins: 0,
  losses: 0,
};
let playerNum = 0;

// database globals
const db = firebase.database();
const player1Ref = db.ref('/player1');
const player2Ref = db.ref('/player2');

// Function randomly returns 'rock', 'paper', or 'scissors'
function getRandomChoice() {
  const choices = ['rock', 'paper', 'scissors'];
  return choices[Math.floor(Math.random() * choices.length)];
}

// Function to get the winner. Returns a string of 'player', 'opponent', or 'tie'.
function getWinner() {
  if (player.choice === opponent.choice) {
    // return tie
    return 'tie';
  }
  if (
    (player.choice === 'rock' && opponent.choice === 'paper') ||
    (player.choice === 'paper' && opponent.choice === 'scissors') ||
    (player.choice === 'scissors' && opponent.choice === 'rock')
  ) {
    return 'opponent';
  }
  return 'player';
}

function joinGame() {
  // if there is no player1 connected then player joins game as player1
  return player1Ref
    .once('value')
    .then((snap) => {
      if (!snap.exists()) {
        player1Ref.set(player);
        player1Ref.onDisconnect().remove();
        playerNum = 1;
      }
    })
    // else if there is no player2 connected then player join game as player2
    .then(() => player2Ref.once('value'))
    .then((snap) => {
      if (!snap.exists() && !playerNum) {
        player2Ref.set(player);
        player2Ref.onDisconnect().remove();
        playerNum = 2;
      }
    });
}

function runGame() {

}

// get the choice when the user clicks on one of the options
$('.selection').on('click', function handleSelectionBtnClick() {
  
});

// display sign in at first
$('#startModal').modal({ backdrop: 'static' });

// when user clicks start
$('#signInForm').on('submit', (event) => {
  event.preventDefault();
  $('#joinAlert').removeClass('in');
  player.userName = $('#txtUserName').val().trim();
  joinGame()
    .then(() => {
      if (playerNum) $('#startModal').modal('hide');
      else $('#joinAlert').addClass('in');
    })
    .catch(console.log);
});
