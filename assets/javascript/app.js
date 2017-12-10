// global vars
let opponent = {
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
const turnRef = db.ref('/turn');

// turn object
const turn = (function Turn() {
  let turnNum = 0;
  let isInitialized = false;
  let runOnChange = null;

  // function to set a callback to be run when turn is changed
  const onChange = (callback) => {
    if (typeof callback === 'function') runOnChange = callback;
    if (!callback) runOnChange = null;
    return this;
  };
  const set = (val) => {
    if (isInitialized) turnRef.set(val);
  };
  const increment = () => {
    set(turnNum + 1);
    return turnNum;
  };

  // Function sets intial state of turn
  const init = () => {
    // only runs if turn hasn't been initialized
    if (isInitialized) return null;
    isInitialized = true;

    // set turn to 0 on disconnect
    turnRef.onDisconnect().set(0);

    // reset turn number and listen for changes in turn ref
    turnRef.set(0);
    return turnRef.on('value', (snap) => {
      turnNum = parseInt(snap.val(), 10);
      if (typeof runOnChange === 'function') runOnChange(turnNum);
    });
  };

  // return public methods
  return {
    increment,
    init,
    onChange,
    set,
    val: () => turnNum,
  };
}());

// ui objects
function createPlayerView(choiceId, scoreId, nameId) {
  return {
    show: () => $(choiceId).addClass('in'),
    hide: () => $(choiceId).removeClass('in'),
    setChoice: (choice) => {
      console.log('setChoice called', choice);
      $(choiceId)
        .removeClass('paper rock scissors')
        .addClass(choice)
        .children()
        .first()
        .text(choice);
    },
    setName: name => $(nameId).text(name),
    setScore: wins => $(scoreId).text(wins),
  };
}
const playerView = createPlayerView('#playerChoice', '#playerWins', '#playerName');
const opponentView = createPlayerView('#oppChoice', '#oppWins', '#oppName');

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

function waitForOpponent() {
  if (playerNum === 1) {
    player2Ref.on('value', (snap) => {
      if (snap.exists()) {
        opponent.userName = snap.val().userName;
        player2Ref.off('value');
        opponentView.setName(opponent.userName);
      }
    });
  } else if (playerNum === 2) {
    player1Ref.on('value', (snap) => {
      if (snap.exists()) {
        opponent.userName = snap.val().userName;
        player1Ref.off('value');
        opponentView.setName(opponent.userName);
      }
    });
  }
}

// Function to handle joining game if possible
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
    // else if there is no player2 connected then player joins game as player2
    .then(() => player2Ref.once('value'))
    .then((snap) => {
      if (!snap.exists() && !playerNum) {
        player2Ref.set(player);
        player2Ref.onDisconnect().remove();
        playerNum = 2;
      }
    })
    .then(() => {
      // if playerNum is truthy
      if (playerNum) {
        // hide sign in modal and display userName
        playerView.setName(player.userName);
        $('#startModal').modal('hide');
        // TODO display welcome status message
        // TODO push player joined game message to chat
      }

      // if player joined game and opponent hasn't
      if (playerNum && turn.val() === 0) {
        // TODO display waiting for opponent status
      }

      // if playerNum = truthy and other player is set && turn = 0
      if (playerNum && turn.val() === 1) {
        // set turn to 1
      }
    });
}

// get the choice when the user clicks on one of the options
$('.selection').on('click', function handleSelectionBtnClick() {
  if (!player.choice) {
    player.choice = $(this).val();
    // update database
    if (playerNum === 1) {
      player1Ref.update(player);
    } else {
      player2Ref.update(player);
    }
    // render the players choice
    playerView.hide();
    playerView.setChoice(player.choice);
    playerView.show();

    // wait for opponent to make choice
    if (playerNum === 1) {
      player2Ref.on('value', (snap) => {
        if (snap.exists()) opponent = snap.val();
        if (opponent.choice) {
          // render the choice
          opponentView.hide();
          opponentView.setChoice(opponent.choice);
          opponentView.show();
          player2Ref.off('value');
          // resolve game
        }
      });
    } else if (playerNum === 2) {
      player1Ref.on('value', (snap) => {
        if (snap.exists()) opponent = snap.val();
        if (opponent.choice) {
          // render the choice
          opponentView.hide();
          opponentView.setChoice(opponent.choice);
          opponentView.show();
          player1Ref.off('value');
          // resolve game
        }
      });
    }
  }
});

// display sign in at first to get userName input
$('#startModal').modal({ backdrop: 'static' });

// when user clicks start
$('#signInForm').on('submit', (event) => {
  event.preventDefault();

  // hide unable to join alert if its showing
  $('#joinAlert').removeClass('in');

  // get user input and see if user is able to join the game
  player.userName = $('#txtUserName').val().trim();
  joinGame()
    .then(() => {
      if (playerNum) {
        // user joined game, update the display

      } else {
        // unable to join game. display alert
        $('#joinAlert').addClass('in');
      }
    })
    .catch(console.log);
});



/* Pseudocode ------------------

user enters name
if player1 not set, playerNum = 1
if player1 is set and player2 is not set, playerNum = 2
if player1 && player2 are both set, player may not join game

if playerNum is truthy
  hide sign in modal
  display player name
  display status message
  push player joined game message to chat

if playerNum = truthy && turn = 0
  display waiting for player to join message

if playerNum = truthy and other player is set && turn = 0
  set turn = 1

when user clicks a choice
  push game event message to chat
  increment turn
  display the user's choice

when turn changes
  if turn = 1
    display the opponents name
  if turn = 2 and player.choice is truthy
    display waiting for opponent to choose msg
  if turn = 3
    display opponent choice
    determine winner
    push game event message to chat
    display modal with result for 3 seconds
    reset player values (not the display)

when the result modal time is up
  reset the display
 */
