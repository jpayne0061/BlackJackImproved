$(document).ready(function () {

    //card module
    var values = ['A', 'K', 'Q', 'J', 10, 9, 8, 7, 6, 5, 4, 3, 2];
    var suits = ['C', 'S', 'D', 'H'];
    var cards = [];

    //card count module
    var countTotal = 0;
    var playerAces = 0;
    var dealerAces = 0;
    var dealerCountTotal = 0;
    var dealerMysteryCard;

    //turn state module
    var dealersTurn = false;
    var dealerBust = false;
    var playerBust = false;
    var playerDecided = false;
    var betPlaced = false;

    //money count module
    var bet = 50;
    var bankRoll;
    var handReport = {
        TheBankRoll: null,
        Wins: null,
        Push: null

    };

    //This function sends 'handReport' var to api for 
    //storage of data after the conclusion of each hand
    function sendBankUpdate(bank) {
        $.ajax({
            type: "POST",
            url: "/Account/UpdateBank",
            data: bank,
            complete: function () {
                handReport.Wins = null;
                handReport.Push = null;
            },
            dataType: "application/json"
        });

    }


    //if the user is logged in, this function retrieves
    //the current user's bankroll and sets the bankroll 
    //equal to that amount. The function returns true if 
    //data was successfully retrieved(ie, player is logged in)
    function getAndSetBankRoll() {
        $.ajax({
            url: "/api/ApplicationUsers/GetApplicationUser", success: function (result) {
                // generateQuotes(result);
                bankRoll = result["BankRoll"];
                $("#bank-roll").html(bankRoll);
                //console.log(result, "users test call");
                return true;
            }

        });
    }


    //this funciton generates a complete deck of cards from the 
    //the two arrays of suits and values
    //so that I didn't have to type them out individually
    function generateCards() {
        for (var i = 0; i < suits.length; i++) {
            var suit = suits[i];
            for (var j = 0; j < values.length; j++) {
                var suit_value_pair = [];
                suit_value_pair.push(suit);
                suit_value_pair.push(values[j]);
                cards.push(suit_value_pair);
            }
        }
    }


    //this function shuffes the generated deck of cards so 
    //that it is random with each deal
    function shuffle(array) {
        var currentIndex = array.length, temporaryValue, randomIndex;
        while (0 !== currentIndex) {

            randomIndex = Math.floor(Math.random() * currentIndex);
            currentIndex -= 1;
            temporaryValue = array[currentIndex];
            array[currentIndex] = array[randomIndex];
            array[randomIndex] = temporaryValue;
        }
        return array;
    }

    //this function takes an array and returns the url of the card image
    function get_card_image(card_array) {
        if (card_array[0] == 'H') {
            var suit = 'hearts';
        } else if (card_array[0] == 'C') {
            var suit = 'clubs';
        } else if (card_array[0] == 'D') {
            var suit = 'diamonds';
        } else if (card_array[0] == 'S') {
            var suit = 'spades';
        }

        if (card_array[1] == 'A') {
            var value = 'ace';
        } else if (card_array[1] == 'K') {
            var value = 'king';
        } else if (card_array[1] == 'Q') {
            var value = 'queen';
        } else if (card_array[1] == 'J') {
            var value = 'jack';
        } else {
            var value = card_array[1];
        }
        var image_url = "<img src='cards/" + suit + '_' + value + ".jpg' class='card'/>";
        return image_url;
    }

    //this function returns the url of the cover card
    function getCoverCard() {

        return "<img src='cards/cover.jpg' class='card' id='coverCard'/>";

    }


    //this function calaculates the value of the given card.
    //K,Q,J are 10. Aces are 11, until the count exceeds 21,
    //at which point, the value is reduced by 10(for each ace held by the player/dealer)
    //until the value is under 21
    //the BUST function is called afterward to determine if the player went bust 
    function calculateValue(card) {
        if (card[1] == 'A') {
            var value = 11;
            if (dealersTurn === false) {
                playerAces += 1;
            }
            if (dealersTurn === true) {
                dealerAces += 1;
            }
        } else if (card[1] == 'K') {
            var value = 10;
        } else if (card[1] == 'Q') {
            var value = 10;
        } else if (card[1] == 'J') {
            var value = 10;
        } else {
            var value = card[1];
        }
        if (dealersTurn === false) {
            countTotal += value;
        } else if (dealersTurn) {
            dealerCountTotal += value;
        }

        //REMOVE 10 FROM COUNT FOR EACH ACE IF OVER 21
        if (dealersTurn === false) {
            for (var i = 0; i < playerAces; i += 1) {
                if (countTotal > 21) {
                    countTotal -= 10;
                    playerAces -= 1;
                }
            }
        } else if (dealersTurn) {
            for (var i = 0; i < dealerAces; i += 1) {
                if (dealerCountTotal > 21) {
                    dealerCountTotal -= 10;
                    dealerAces -= 1;
                }
            }

        }

        bust();

    }

    //if the card countCount is > 21, then the player is bust
    //and the round is concluded
    function bust() {
        if (countTotal > 21) {
            //LOSE MONEY
            playerBust = true;
            $('#coverCard').replaceWith(get_card_image(dealerMysteryCard));
            //stopGame();
            ConcludeGame("playerBust");
        }

        if (dealerCountTotal > 21) {
            dealerBust = true;
            //stopGame();
            ConcludeGame("dealerBust");
        }

    }


    //this function shows the appropriate message(win or lose),
    //adjsuts the players bankRoll and after 3 seconds, calls the StartNewGame fuction
    //the 'MAGIC STRINGS' ('playerBust', etc) need to replaced with variables
    function ConcludeGame(string) {
        var overlay = jQuery('<div id="overlay"> </div>');
        if (string == "playerBust") {
            handReport.Wins = false;
            handReport.Push = false;
            bankRoll -= bet
            overlay.append("<div class='message'>You went bust</div>");
        }
        if (string == "dealerBust") {
            handReport.Wins = true;
            handReport.Push = false;
            bankRoll += bet;
            overlay.append("<div class='message'>Dealer went bust!</div>");
        }
        if (string == "YouWin") {
            handReport.Wins = true;
            handReport.Push = false;
            console.log(bankRoll, bet, "before math: bankRoll, bet");
            bankRoll += bet;
            console.log(bankRoll, bet, "after math: bankRoll, bet");
            overlay.append("<div class='message'>You Win!</div>");
        }
        if (string == "DealerWins") {
            handReport.Wins = false;
            handReport.Push = false;
            bankRoll -= bet
            overlay.append("<div class='message'>Dealer Wins</div>");
        }
        if (string == "push") {
            handReport.Push = true;
            handReport.Wins = false;
            overlay.append("<div class='message'>Push</div>");
        }

        overlay.appendTo(document.body);
        overlay.show();
        window.setTimeout(function () { startNewGame() }, 3000);

    }

    //this function sets the handReport variable to the players adjusted bankroll
    //and calls the sendBankReport method to send the players new data to the api
    //the data sent includes win/lose/push/bankroll
    //The function also resets all variables to their pre-game status and removes
    //styling and changes made to the DOM during the game
    function startNewGame() {

        handReport.TheBankRoll = bankRoll;
        sendBankUpdate(handReport);

        $("#bank-roll").html(bankRoll);
        $(".message").remove();
        $("#overlay").remove();
        $(".player-row").empty();
        $(".dealer-row").empty();
        $("#hit").addClass("grayed");
        $("#stand").addClass("grayed");
        $("#place-bet").removeClass("grayed");
        $("#bet-holder").html(bet);


        countTotal = 0;
        dealerCountTotal = 0;

        cards = [];
        playerAces = 0;
        dealerAces = 0;
        dealersTurn = false;
        dealerMysteryCard = null;
        dealerBust = false;
        playerBust = false;
        playerDecided = false
        betPlaced = false;
    }


    //this function simulates the first round of cards dealt to the
    //player and dealer
    function firstDeal() {
        var deal1 = cards.pop();
        $('.player-row').html(get_card_image(deal1));
        calculateValue(deal1);
        var deal2 = cards.pop();
        $('.player-row').append(get_card_image(deal2));
        calculateValue(deal2);

        dealersTurn = true;

        var dealer_deal1 = cards.pop();
        $('.dealer-row').html(get_card_image(dealer_deal1));
        calculateValue(dealer_deal1);
        dealerMysteryCard = cards.pop();
        $('.dealer-row').append(getCoverCard());
        calculateValue(dealerMysteryCard);

    }


    //this function calls and checks whether the getAndSetBankRoll
    //returns true(user logged in). If the method is true, the 
    //user is assigned his bankroll stored in the DB. If not, the 
    //un-logged-in user is assigned the default bankRoll
    if (getAndSetBankRoll() != true) {
        bankRoll = 1000;
        $("#bank-roll").html(bankRoll);
    };


    //the hit and stand buttons are assigned the 'grayed'
    //class(makes it translucent) to indicate a bet must be placed
    //before they can be clicked
    $("#hit").addClass("grayed");
    $("#stand").addClass("grayed");

    //bet is increased by 25 when clilcked. Bankroll 
    //decreases by 25
    $("#add-twenty-five").on("click", function () {
        if (!betPlaced) {
            bet += 25;
            bankRoll -= 25;
            $("#bet-holder").html(bet);
            $("#bank-roll").html(bankRoll);
        }

    });

    //opposit of the above function
    $("#minus-twenty-five").on("click", function () {
        if (!betPlaced) {
            bet -= 25;
            bankRoll += 25;
            $("#bet-holder").html(bet);
            $("#bank-roll").html(bankRoll);
        }

    });



    //upon placing the bet, the hit/stand buttons are fully 
    //visible and the place-bet button is grayed/disabled
    $("#place-bet").on("click", function () {
        if (!betPlaced) {
            $("#place-bet").addClass("grayed");
            $("#hit").removeClass("grayed");
            $("#stand").removeClass("grayed");
            betPlaced = true;
            generateCards();
            cards = shuffle(cards);
            firstDeal();
        }

    });



    //card is added to players hand.
    //card value is calculated
    $('#hit').click(function () {
        if (betPlaced) {
            dealersTurn = false;
            var hitCard = cards.pop();
            //playerHand.push(hitCard);
            $('.player-row').append(get_card_image(hitCard));
            calculateValue(hitCard);
        }

    });

    //after clicking, #stand button reveals dealers hidden card
    //and calls Conclude game, which determines the result of the game
    $('#stand').click(function () {
        if (betPlaced) {
            dealersTurn = true;
            playerDecided = true;
            $('#coverCard').replaceWith(get_card_image(dealerMysteryCard));
            while (dealerCountTotal < 17) {
                var hitCard = cards.pop();
                $('.dealer-row').append(get_card_image(hitCard));
                calculateValue(hitCard);
            }

            if (dealerCountTotal > countTotal && dealerBust === false) {
                ConcludeGame("DealerWins");
            }

            if (countTotal > dealerCountTotal && playerBust === false) {
                ConcludeGame("YouWin");
            }

            if (countTotal == dealerCountTotal && playerBust === false) {
                ConcludeGame("push");
            }
        }


    });


    //all of these selectors manage the visibilty 
    //of the login/register forms(which are hidden on the page to avoid redirects)
    $("#registerLink").on("click", function () {
        console.log("register clicked")
        $("#hidden-form").toggle();

    });

    $("#loginLink").on("click", function () {
        
        $("#hidden-form-login").toggle();

    });

    $("#cancel-register-login").on("click", function () {
        $("#hidden-form-login").toggle();
    });


    $("#resgister-form").submit(function () {
        $("#hidden-form").toggle();
    });

    $("#cancel-register").on("click", function () {
        console.log("something");
        $("#hidden-form").toggle();
    });
});