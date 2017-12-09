// global vars
const player = { choice: '' };
const opponent = { choice: '' };

function setChoice(id, value) {
  $(id)
    // update the class
    .removeClass('rock paper scissors')
    .addClass(value)
    .children()
    .first() // the span containing the text is the first child
    .text(value);
}

function renderGame() {
  const $circles = $('.circle');
  $circles.removeClass('in');

  // wait for fadeout before changing the values (.15 seconds to fade out)
  setTimeout(() => {
    // set the text and class for the player choice
    setChoice('#playerChoice', player.choice);
    setChoice('#oppChoice', opponent.choice);
    $circles.addClass('in');
  }, 140);

  // setTimeout(() => $circles.addClass('in'), 100);
}

// Function to handle user selection (rock, paper, or scissors chosen)
function handleSelection() {
  const choices = ['rock', 'paper', 'scissors'];
  player.choice = $(this).val();

  // temporarily use computer as the opponent
  opponent.choice = choices[Math.floor(Math.random() * choices.length)];

  // post choice to database
  // update html for player choice
  renderGame();
}


// player clicks play button to start the game
// prompt player to choose rock, paper, scissors
// get the choice when the user clicks on one of the options
$('.selection').on('click', handleSelection);

// when opponent makes a choice
// determine winner
// update score and display message for the result of the match
