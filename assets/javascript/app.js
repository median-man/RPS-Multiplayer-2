// global vars
const opponent = { choice: '', wins: 0 };
const player = { choice: '', wins: 0 };
const db = firebase.database();

// DB Functions  ===============================================

// --- db globals ---
let refThisPlayer = null;
let refOpponent = null;

function getOpponentChoice(callback) {
  // get the opponents choice
  refOpponent.on('value', (snap) => {
    if (snap.exists()) opponent.choice = snap.val().choice;

    // once opponent has made a choice, update the value and
    // stop listening for opponent choice and run the game
    if (opponent.choice) {
      console.log(`opponent chose ${opponent.choice}`);
      refOpponent.off('value');
      if (callback) callback();
    }
  });
}

// Function to update the player info on the db
function updatePlayer() {
  if (refThisPlayer) refThisPlayer.set(player);
}

// UI Functions ===============================================

// Function to set the values/classes for the circle which displays
// a player's/opponent's choice
function setChoice(id, value) {
  $(id)
    // update the class
    .removeClass('rock paper scissors')
    .addClass(value)
    .children()
    .first() // the span containing the text is the first child
    .text(value);
}

// Function to update and display the result modal
function showResult(winner) {
  const $modal = $('#resultModal');
  let msg = 'Tied';

  // set the message to display (initially set to Tie)
  if (winner === 'opponent') msg = 'You lost.';
  if (winner === 'player') msg = 'You won!';

  // update and display the modal
  $modal.find('.modal-title').text(msg);
  $modal.modal();
}

// Function to update html for the game
function renderGame(winner, callback) {
  const $circles = $('.circle');

  // fade out the circles in the player/opponent panels
  $circles.removeClass('in');

  // display the result modal
  if (winner) showResult(winner);

  // update score
  $('#playerWins').text(player.wins);
  $('#oppWins').text(opponent.wins);

  // wait for fadeout before changing the values (.15 seconds to fade out)
  setTimeout(() => {
    // set the text and class for the player choice
    setChoice('#playerChoice', player.choice);
    setChoice('#oppChoice', opponent.choice);
    $circles.addClass('in');
    if (callback) callback();
  }, 140);
}

// Game Logic ===============================================

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

function runGame() {
  let winner = 'tie';

  // determine the winner and increment the score
  winner = getWinner();
  if (winner === 'player') player.wins += 1;
  if (winner === 'opponent') opponent.wins += 1;

  // update html for player choice
  renderGame(winner, () => {
    player.choice = '';
    opponent.choice = '';
    updatePlayer();
  });

  return true;
}

// DB Events  ===============================================

db.ref().on('value', (snap) => {
  // set database reference to the player data if game doesn't
  // already have two players connected
  if (!snap.child('player1').exists() && !refThisPlayer) {
    refThisPlayer = db.ref('player1');
    updatePlayer();
    refOpponent = db.ref('player2');
    refThisPlayer.onDisconnect().remove();
  } else if (!snap.child('player2').exists() && !refThisPlayer) {
    refThisPlayer = db.ref('player2');
    updatePlayer();
    refOpponent = db.ref('player1');
    refThisPlayer.onDisconnect().remove();
  }
});

// UI Events ===============================================

// get the choice when the user clicks on one of the options
$('.selection').on('click', function handleSelectionBtnClick() {
  player.choice = $(this).val();
  opponent.choice = '';
  renderGame();
  updatePlayer();
  getOpponentChoice(runGame);
});
