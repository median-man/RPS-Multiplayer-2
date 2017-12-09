// global vars
let isInGame = false;
const opponent = { choice: '', wins: 0 };
const player = { choice: '', wins: 0 };
const db = firebase.database();

// DB Functions  ===============================================

// --- db globals ---
const refPlayers = db.ref('/players');
const refIsConnected = db.ref('.info/connected');
let refThisPlayer = null;

// Function to update the player on the db
function getOpponentChoice() {

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
function renderGame(winner) {
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
  let winner = '';

  // only continue if player has made a choice
  if (!player.choice) return false;

  if (!opponent.choice) {
    // wait for opponent to choose
    // render game
    renderGame();
    return false;
  }

  // temporarily use computer as the opponent
  opponent.choice = getRandomChoice();

  // TODO post choice to database and determine winner

  // determine the winner and increment the score
  winner = getWinner();
  if (winner === 'player') player.wins += 1;
  if (winner === 'opponent') opponent.wins += 1;

  // update html for player choice
  renderGame(winner);

  // reset values
  opponent.choice = '';
  player.choice = '';

  return true;
}

function waitForPlayer() {
  console.log('waiting for player');
  // set in game state to false
  isInGame = false;
  // TODO show 'waiting for player' in opponent panel
}

// DB Events  ===============================================

// Add user to connections
refIsConnected.on('value', (snap) => {
  if (snap.val()) {
    // add connection and remove it on disconnect
    refThisPlayer = refPlayers.push(true);
    refThisPlayer.onDisconnect().remove();
  }
});

// Update game based on number of players connected
refPlayers.on('value', (snap) => {
  const playersCount = snap.numChildren();
  console.log({ playersCount });

  if (playersCount === 2) {
    isInGame = true;
    runGame();
  } else {
    isInGame = false;
    // waitForOpponent();
  }
});

// UI Events ===============================================

// player clicks play button to start the game
// $('#btnPlay').on('click', () => $('#mainContainer').addClass('in'));

// get the choice when the user clicks on one of the options
$('.selection').on('click', function handleSelectionBtnClick() {
  player.choice = $(this).val();
  runGame();
});

// TODO prompt player to choose rock, paper, scissors
