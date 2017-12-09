// global vars
const player = { choice: '', wins: 0 };
const opponent = { choice: '', wins: 0 };

// Function to get the winner. Returns a string of 'player', 'opponent', or ''.
function getWinner() {
  if (player.choice === opponent.choice) {
    // return empty string on a tie
    return '';
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
  let msg = 'Tie';

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
  showResult(winner);

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

// Function to handle user selection (rock, paper, or scissors chosen)
function handleSelection() {
  const choices = ['rock', 'paper', 'scissors'];
  let winner = '';
  player.choice = $(this).val();

  // temporarily use computer as the opponent
  opponent.choice = choices[Math.floor(Math.random() * choices.length)];

  // post choice to database and determine winner

  // determine the winner and increment the score
  winner = getWinner();
  if (winner === 'player') player.wins += 1;
  if (winner === 'opponent') opponent.wins += 1;

  // update html for player choice
  renderGame(winner);
}

// Function to handle click on the play button
function handlePlayBtnClick() {
  $('#mainContainer').addClass('in');
}


// player clicks play button to start the game
$('#btnPlay').on('click', handlePlayBtnClick);

// TODO prompt player to choose rock, paper, scissors
// get the choice when the user clicks on one of the options
$('.selection').on('click', handleSelection);

// when opponent makes a choice
// determine winner
// update score and display message for the result of the match
