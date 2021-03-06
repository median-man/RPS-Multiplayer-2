// global vars
const defaultPlayer = () => ({
  userName: '',
  choice: '',
  wins: 0,
  losses: 0,
});
let opponent = defaultPlayer();
const player = defaultPlayer();
let playerNum = 0;

// database globals
const db = firebase.database();
const player1Ref = db.ref('/player1');
const player2Ref = db.ref('/player2');
const turnRef = db.ref('/turn');
const chatRef = db.ref('/chat');
let opponentRef = null;
let playerRef = null;

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
      $(choiceId)
        .removeClass('paper rock scissors deciding')
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

function prependChatMessage(name, message) {
  const $name = $('<b>').text(`${name}:`);
  $('<p>')
    .text(` ${message}`)
    .prepend($name)
    .prependTo('#chatMessages');
}

// Waiting for opponent modal
const oppModal = {
  show: () => $('#waitModal').modal({ backdrop: 'static', keyboard: false }),
  hide: () => $('#waitModal').modal('hide'),
};

// init opponent
function initOpponent() {
  // listen for changes to opponent data
  opponentRef.on('value', (snap) => {
    console.log('opponent changed', snap.val());
    if (snap.exists()) {
      const data = snap.val();
      opponent.userName = snap.val().userName;
      opponentView.setName(opponent.userName);

      // set name and update display if opponent name has changed
      opponentRef.on('child_changed', (childSnap) => {
        if (childSnap.key === 'choice') {
          opponent.choice = childSnap.val();
        } else if (childSnap.key === 'userName') {
          opponent.userName = childSnap.val();
          opponentView.setName(opponent.userName);
        } else if (childSnap.key === 'wins') {
          opponent.wins = data.wins;
          opponentView.setScore(opponent.wins);
        }
      });

      // hide waiting for opponent modal
      oppModal.hide();
    } else {
      if (opponent.userName) {
        prependChatMessage('Game', `${opponent.userName} left the game.`);
      }
      // opponent is not connected. reset values and display modal
      opponent = defaultPlayer();
      opponentView.setName('No Opponent');
      console.log('waiting for opponenet to join game');
      oppModal.show();
    }
  });
}

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

function handleTurnChange(turnNum) {
  // if player has made a choice but opponent has not
  if (turnNum === 1 && !opponent.choice) {
    console.log('waiting for opponent to choose');
    opponentView.setChoice('deciding');
    opponentView.show();
  }

  if (turnNum === 2) {
    // both players have made a choice
    console.log('resolve winner', `opponent: ${opponent.choice}, player: ${player.choice}`);
  }
}

// Function to handle joining game if possible
function joinGame() {
  // if there is no player1 connected then player joins game as player1
  return player1Ref
    .once('value')
    .then((snap) => {
      if (!snap.exists()) {
        playerRef = player1Ref;
        opponentRef = player2Ref;
        playerNum = 1;
      }
    })
    // else if there is no player2 connected then player joins game as player2
    .then(() => player2Ref.once('value'))
    .then((snap) => {
      if (!snap.exists() && !playerNum) {
        playerRef = player2Ref;
        opponentRef = player1Ref;
        playerNum = 2;
      }
    })
    .then(() => {
      // if playerNum is truthy
      if (playerNum) {
        // initialize turn object, player, and opponent
        turn.init();
        turn.onChange(handleTurnChange);
        playerRef.set(player);
        playerRef.onDisconnect().remove();
        initOpponent();

        // hide sign in modal and display userName
        playerView.setName(player.userName);
        $('#startModal').modal('hide');

        // TODO display welcome status message
        // push player joined game message to chat
        chatRef.push({ name: 'Game', message: `'${player.userName}' joined game.` });

        console.log(`connected as player ${playerNum}`, player);
      }

      // if player joined game and opponent hasn't
      if (playerNum && !opponent.userName) {
        // TODO display waiting for opponent status
        // console.log('waiting for an opponent');
        // $('#waitModal').modal({ backdrop: 'static', keyboard: false });
      }

      // if playerNum = truthy and other player is set && turn = 0
      if (playerNum && opponent.userName && turn.val() === 0) {
        // increment
        turn.increment();
      }
    });
}

// get chat and listen for new chat messages
chatRef.orderByKey().on('child_added', (childSnap) => {
  prependChatMessage(childSnap.val().name, childSnap.val().message);
});

// get the choice when the user clicks on one of the options
$('.selection').on('click', function handleSelectionBtnClick() {
  if (playerNum && !player.choice) {
    player.choice = $(this).val();
    // update database
    playerRef.update(player);

    // render the player's choice
    playerView.hide();
    playerView.setChoice(player.choice);
    playerView.show();

    prependChatMessage('Game', `You chose ${player.choice}.`);
    turn.increment();
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

// when chat form submit button is clicked
$('#chatForm').on('submit', (event) => {
  event.preventDefault();

  // get input and post message to server if player is in game
  const $input = $('#txtChatInput');
  const message = $input.val().trim();
  $input.val('');
  if (playerNum) chatRef.push({ name: player.userName, message });
});

/* Pseudocode ------------------

display chat messages and listen for chat messages
user enters name and clicks Start
if no player connected as player1
  playerNum = 1
  when player disconnects, call remove on the ref
  post the player data to the database
  opponent ref = player2 ref
if player1 is connected and no player connected as player2
  playerNum = 2
  when player disconnects, call remove on the ref
  opponent ref = player1 ref
if player1 && player2 are both set, player may not join game

if playerNum is truthy
  hide sign in modal
  display player name
  push player joined game message to chat
  begin listening for changein turn value
  begin listening for change in opponent data

when opponent data changes
  if opponent doesn't exist
    clear opponent display (name and any choice)
    display waiting for opponent msg
  if opponent exists
    hide waiting for opponent msg
    if choice has changed
      set opponent.choice
    if name has changed
      set name
      update display
    if score has changed
      set opp score
      update display

when user clicks a choice
  if playerNum is not truthy do nothing
  set the value of player.choice
  display the user's choice
  increment turn
  if turn = 1 (opponent hasn't made choice yet)
    display message waiting for opponent choice

when turn changes
  if turn = 2
    call function to resolve game

function to resolve game
  determine winner
  display result
  update player score
  reset player values
  if playerNum = 1
    push result message to chat
  after 3 seconds
    reset display
 */
