// Declare namespace app
const app = {};

// function to retrieve profile data with username inputted into API url

app.getProfileData = function(username) {
    $.ajax({
        url: `https://api.chess.com/pub/player/${username}`,
        method: "GET",
        dataType: "json",
        error : function(jqXHR, textStatus, errorThrown) { 
          if(jqXHR.status == 404 || errorThrown == 'Not Found') 
          { 
            // In the event of an invalid username, empty all fields and display error message
              $('.profile-results').empty();
              $('.stats-results').empty();
              $('.country-results').empty();
              $('.games-results').empty();

              app.displayError(username);
          }
        }
        }).then(result => {
        $('.profile-results').empty();
        // Note the country data is an API within the original API so we use result here to find the nested API
        app.getCountryData(result);
        
        
        });
};

app.getCountryData = function(object) {
    $.ajax({
        url: `${object.country}`,
        method: "GET",
        dataType: "json",
        }).then(result => {
        $('.country-results').empty();
        app.displayCountryData(result);
            // Call profile display function
        
        app.displayProfileData(object);
        });
};


// function to retrieve stats data with username inputted into API url

app.getStatsData = function(username) {
    $.ajax({
        url: `https://api.chess.com/pub/player/${username}/stats`,
        method: "GET",
        dataType: "json",

        }).then(result => {
        $('.stats-results').empty();
        app.displayStatsData(result);
        
        });
};

app.getGamesData = function(username) {
    $.ajax({
        url: `https://api.chess.com/pub/player/${username}/games/2021/05`,
        method: "GET",
        dataType: "json",

        }).then(result => {
        $('.games-results').empty();
       
        // Use two parameters for display games data, since we need the case sensitive username to determine game data
        app.displayGamesData(result, username);

        });
};

// Display ELO rating info in a table
app.displayStatsData = function(result) {
       
        const statsHtml = `<div class ="rapid-results">
        <h3>Rapid</h3>
        <p>Current: ${result.chess_rapid.last.rating}</p>
        <p>Best: ${result.chess_rapid.best.rating}</p>
    </div>

    <div class ="blitz-results">
        <h3>Blitz</h3>
        <p>Current: ${result.chess_blitz.last.rating}</p>
        <p>Best: ${result.chess_blitz.best.rating}</p>
    </div>

    <div class ="bullet-results">
        <h3>Bullet</h3>
        <p>Current: ${result.chess_bullet.last.rating}</p>
        <p>Best: ${result.chess_bullet.best.rating}</p>
    </div>
    `
        
       $('.stats-results').append(statsHtml);
  };

app.displayProfileData = function(result) {
       
    // In order to display the username with case sensitivity, we access it through the URL and take off the 29 characters of the url prior to the member name. Note there is an endpoint called username but it is all lowercase
    let userName = result.url.slice(29);
   
    // Convert date formate to readable format for humans
    let joinDate = new Date(result.joined * 1000).toDateString();
    let lastOnline = new Date(result.last_online * 1000).toDateString();

    const profileHtml = `<div class="profile">
    <a href=${result.url}>${userName}</a>
    <div class="img-box">
          <img src="${result.avatar}" alt="some-alt-text">
    </div>
    <p>Date joined: ${joinDate}</p>
    <p>Last online: ${lastOnline}</p>
    </div>`
    
   $('.profile-results').append(profileHtml);
    // call getGamesData with case sensitive username
   app.getGamesData(userName);
};

app.displayCountryData = function(result) {
       
    const countryHtml = `<div>
    <p>Country: ${result.name}</p>
    </div>`
    
   $('.country-results').append(countryHtml);
};

app.displayGamesData = function(result, username) {
        // Find total wins, losses and draws through either indludes or does not include
        
        const totalGames = result.games.filter(e => e.pgn);
        // console.log(totalGames);
        // console.log(username);
        const wonGames = totalGames.filter((e) => {
            
           return e.pgn.includes(`${username} won`) 
           
        });

        // console.log(wonGames);
        const drawnGames = totalGames.filter(e => e.pgn.includes("drawn"));
        const lostOrDrawnGames = totalGames.filter(e => !e.pgn.includes(`${username} won`));

        // Within wins and losses, find HOW the game was won/lost
        const meResign = lostOrDrawnGames.filter(e => e.pgn.includes("resignation"));
        const opponentResign = wonGames.filter(e => e.pgn.includes("resignation"));
        const meFlag = lostOrDrawnGames.filter(e => e.pgn.includes("on time"));
        const opponentFlag = wonGames.filter(e => e.pgn.includes("on time"));
        const meCheckmate = wonGames.filter(e => e.pgn.includes("checkmate"));
        const opponentCheckmate = lostOrDrawnGames.filter(e => e.pgn.includes("checkmate"));
        const meAbandon = lostOrDrawnGames.filter(e => e.pgn.includes("abandoned"));
        const opponentAbandon = wonGames.filter(e => e.pgn.includes("abandoned"));

        // Calculate percentages of wins/losses/draws and various game results
        const winPercentage = ((wonGames.length/totalGames.length)*100).toFixed(2);
        const lossPercentage = (((lostOrDrawnGames.length-drawnGames.length)/totalGames.length)*100).toFixed(2);
        const drawPercentage = ((drawnGames.length/totalGames.length)*100).toFixed(2);

        const meCheckmatePercentage = ((meCheckmate.length/wonGames.length)*100).toFixed(2);
        const opponentCheckmatePercentage = ((opponentCheckmate.length/(lostOrDrawnGames.length-drawnGames.length))*100).toFixed(2);
        const meResignPercentage = ((meResign.length/(lostOrDrawnGames.length-drawnGames.length))*100).toFixed(2);
        const opponentResignPercentage = ((opponentResign.length/wonGames.length)*100).toFixed(2);
        const meAbandonPercentage = ((meAbandon.length/(lostOrDrawnGames.length-drawnGames.length))*100).toFixed(2);
        const opponentAbandonPercentage = ((opponentAbandon.length/wonGames.length)*100).toFixed(2);
        // Note "flag" is a chess term for running out of time
        const opponentFlagPercentage = ((opponentFlag.length/wonGames.length)*100).toFixed(2);
        const meFlagPercentage = ((meFlag.length/(lostOrDrawnGames.length-drawnGames.length))*100).toFixed(2);

    const gamesHtml = `<h2>Recent Chess</h2>
    
    <div class ="win-results">
    <h3>Win percentage ${winPercentage}%</h3>
    <p>Checkmate: ${meCheckmatePercentage}%</p>
    <p>Resignation: ${opponentResignPercentage}%</p>
    <p>Timeout: ${opponentFlagPercentage}%</p>
    <p>Abandoned: ${opponentAbandonPercentage}%</p>
</div>

<div class ="loss-results">
    <h3>Loss percentage ${lossPercentage}%</h3>
    <p>Checkmate: ${opponentCheckmatePercentage}%</p>
    <p>Resignation: ${meResignPercentage}%</p>
    <p>Timeout: ${meFlagPercentage}%</p>
    <p>Abandoned: ${meAbandonPercentage}%</p>
</div>

<div class ="draw-results">
    <h3>Draw percentage ${drawPercentage}%</h3>
</div>
`
    
   $('.games-results').append(gamesHtml);
};

// Function to display error in event of invalid username
app.displayError = function(invalidUser) {
    
    const errorHtml = `<div>
    <h2>Could not find profile for username: ${invalidUser}</h2>
    </div>`    
    $('.stats-results').append(errorHtml);

};


// Initialize function
app.init = function() {

    $('form').on('submit', function(event) {
        event.preventDefault();
        const selection = $('input').val();
        app.getStatsData(selection);
        app.getProfileData(selection);
        
      });
    
  };

$(function() {
    app.init();
  });