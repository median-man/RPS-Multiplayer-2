// Function to handle user selection (rock, paper, or scissors chosen)
function handleSelection() {
  alert('chose ' + $(this).val());
}


// player clicks play button to start the game
// prompt player to choose rock, paper, scissors
// get the choice when the user clicks on one of the options
$('.selection').on('click', handleSelection);
// post choice to database
// when opponent makes a choice
// determine winner
// update score and display message for the result of the match
