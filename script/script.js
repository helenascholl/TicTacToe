'use strict';

let game;
let player;
let opponentUsername;
let busy = false;
let winningPatterns = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6]
];

window.addEventListener('load', () => {
    firebase.initializeApp({
        apiKey: "AIzaSyANGXwlxFF2_JCqb3Ywrg9_2Z2eXCPI4KE",
        authDomain: "tictactoe-96606.firebaseapp.com",
        databaseURL: "https://tictactoe-96606.firebaseio.com",
        projectId: "tictactoe-96606",
        storageBucket: "",
        messagingSenderId: "503319319281",
        appId: "1:503319319281:web:6ad4e8269f5278bf"
    });

    firebase.auth().onAuthStateChanged(user => {
        let challengeWindow = document.getElementById('challengeWindow').style;
        let logInWindow = document.getElementById('logInWindow').style;
        let back = document.getElementById('back').style;
        let currentUsername = document.getElementById('currentUsername');
        let challenges = document.getElementById('challenges').style;

        if (user) {
            challengeWindow.left = 0;
            logInWindow.left = '-100vw';
            challengeWindow.opacity = 1;
            logInWindow.opacity = 0;
            back.opacity = 1;
            back.pointerEvents = 'all';
            challenges.right = 0;
            challenges.opacity = 1;
            
            if (user.displayName) {
                currentUsername.textContent = user.displayName;
                currentUsername.style.top = '1.5vmin';
            }
        } else {
            logInWindow.left = 0;
            challengeWindow.left = '100vw';
            logInWindow.opacity = 1;
            challengeWindow.opacity = 0;
            back.opacity = 0;
            back.pointerEvents = 'none';
            currentUsername.style.top = '-3vmin';
            challenges.right = '-100vw';
            challenges.opacity = 0;
        }
    });

    initField();

    firebase.database().ref('challenges').on('child_added', addChallenge);

    clickOnEnter('username', 'logIn');
    clickOnEnter('opponentUsername', 'challenge');

    document.getElementById('logIn').addEventListener('click', logIn);
    document.getElementById('challenge').addEventListener('click', challenge);
    document.getElementById('back').addEventListener('click', backToLogIn);
});

function initField() {
    let game = document.getElementById('game');
    let boxCount = 0;

    for (let i = 0; i < 3; i++) {
        let row = document.createElement('div');
        row.setAttribute('class', 'row');

        for (let j = 0; j < 3; j++) {
            let box = document.createElement('div');
            let icon = document.createElement('i');

            icon.style.fontSize = '8vmin';
            icon.style.opacity = 0;
            icon.setAttribute('id', `icon${boxCount}`)
    
            box.setAttribute('id', `box${boxCount++}`);
            box.setAttribute('class', 'box');
    
            box.addEventListener('click', selectBox);
    
            box.appendChild(icon);
            row.appendChild(box);
        }

        game.appendChild(row);
    }
}

function resetField() {
    for (let i = 0; i < 9; i++) {
        let icon = document.getElementById(`icon${i}`);

        icon.setAttribute('class', '');
        icon.style.opacity = 0;
    }
}

function backToLogIn() {
    // TODO: delete from database + delete user
    firebase.auth().signOut();
}

function backToChallenge() {
    let challengeWindow = document.getElementById('challengeWindow').style;
    let gameWindow = document.getElementById('gameWindow').style;
    let challenges = document.getElementById('challenges').style;
    let back = document.getElementById('back');

    challengeWindow.left = 0;
    challenges.right = 0;
    gameWindow.left = '100vw';
    challengeWindow.opacity = 1;
    challenges.opacity = 1;
    gameWindow.opacity = 0;

    setTimeout(() => {
        resetField();
        document.getElementById('winner').style.display = 'none';
    }, 200);

    back.removeEventListener('click', backToChallenge);

    setTimeout(() => {
        back.addEventListener('click', backToLogIn);
    }, 200);
}

function clickOnEnter(inputId, buttonId) {
    let input = document.getElementById(inputId);
    let callback = (event) => {
        if (event.key === 'Enter' && !busy) {
            document.getElementById(buttonId).click();
        }
    };

    input.addEventListener('focus', () => {
        input.addEventListener('keydown', callback);
    });
    input.addEventListener('blur', () => {
        input.removeEventListener('keydown', callback);
    });
    input.addEventListener('input', () => {
        document.getElementById(`${buttonId}Wrapper`).style.borderColor = '';
        document.getElementById(buttonId).style.borderLeftColor = '';
    });
}

function addChallenge(snapshotChallenge) {
    let currentUser = firebase.auth().currentUser;
    let challenge = snapshotChallenge.val();

    if (currentUser && challenge.to === currentUser.uid) {
        let challengeDiv = document.createElement('div');
        let accept = document.createElement('div');
        let i = document.createElement('i');
        let h3 = document.createElement('h3');

        challengeDiv.setAttribute('class', 'challenge');
        challengeDiv.style.left = '25vmin';
        accept.setAttribute('class', 'accept');
        i.setAttribute('class', 'fa fa-check');
        
        firebase.database().ref('users').once('value').then(snapshotUsers => {
            for (let user of snapshotUsers.val()) {
                if (user.uid === challenge.from) {
                    opponentUsername = user.username;
                    h3.textContent = opponentUsername;
                    h3.title = opponentUsername;
                }
            }
        }).catch(error => {
            console.error(error.message);
        });

        accept.addEventListener('click', () => {
            firebase.database().ref('challenges').once('value').then(snapshotChallenges => {
                let newChallenges = [];

                for (let child of snapshotChallenges.val()) {
                    if (child.from !== challenge.from && child.to !== challenge.to) {
                        newChallenges.push(child);
                    }
                }

                firebase.database().ref('challenges').set(newChallenges).then(() => {
                    let challengeWindow = document.getElementById('challengeWindow').style;
                    let gameWindow = document.getElementById('gameWindow').style;
                    let challenges = document.getElementById('challenges');
                    let back = document.getElementById('back');

                    gameWindow.left = 0;
                    challengeWindow.left = '-100vw';
                    challenges.style.right = '100vw';
                    gameWindow.opacity = 1;
                    challengeWindow.opacity = 0;
                    challenges.style.opacity = 0;

                    back.removeEventListener('click', backToLogIn);

                    setTimeout(() => {
                        let childNodes = challenges.childNodes;

                        back.addEventListener('click', backToChallenge);

                        for (let i = 0; i < childNodes.length; i++) {
                            if (childNodes[i].className === 'challenge' && childNodes[i].childNodes[0].textContent === opponentUsername) {
                                challenges.removeChild(childNodes[i]);
                                i--;
                            }
                        }
                    }, 200);

                    // TODO: set ready
                    game = `games/${challenge.from}/${challenge.to}`;
                    player = Player.O;

                    firebase.database().ref(`${game}`).on('child_changed', endGame);
                    firebase.database().ref(`${game}/field`).on('child_changed', drawField);
                }).catch(error => {
                    console.error(error.message);
                });
            }).catch(error => {
                console.error(error.message);
            });
        });

        accept.appendChild(i);
        challengeDiv.appendChild(h3);
        challengeDiv.appendChild(accept);
        document.getElementById('challenges').appendChild(challengeDiv);

        setTimeout(() => {
            challengeDiv.style.left = 0;
        }, 100);
    }
}

function selectBox(event) {
    firebase.database().ref(`${game}/turn`).once('value').then(snapshotTurn => {
        // TODO: check ready
        if (snapshotTurn.val() === player) {
            firebase.database().ref(`${game}/field`).once('value').then(snapshotPlayers => {
                let players = snapshotPlayers.val();
                let index = parseInt(event.target.id.replace('box', ''));

                if (players[index].player === Player.noPlayer) {
                    players[index].player = player;

                    firebase.database().ref(`${game}/field`).set(players).then(() => {
                        let turn = Player.X;
                        let winner;
    
                        if (player === Player.X) {
                            turn = Player.O;
                        }

                        let isFull = true;

                        for (let box of players) {
                            if (box.player === Player.noPlayer) {
                                isFull = false;
                            }
                        }

                        if (isFull) {
                            winner = Player.noPlayer;
                        }

                        for (let pattern of winningPatterns) {
                            let won = true;
    
                            for (let i = 0; i < pattern.length && won; i++) {
                                if (players[pattern[i]].player !== player) {
                                    won = false;
                                }
                            }

                            if (won) {
                                winner = player;
                            }
                        }

                        if (winner != undefined) {
                            turn = Player.noPlayer;

                            firebase.database().ref(`${game}/winner`).set(winner).catch(error => {
                                console.error(error.message);
                            });
                        }
                
                        firebase.database().ref(`${game}/turn`).set(turn).catch(error => {
                            console.error(error.message);
                        });
                    }).catch(error => {
                        console.error(error.message);
                    });
                }
            }).catch(error => {
                console.error(error.message);
            });
        }
    });
}

function drawField(snapshot) {
    let change = snapshot.val();
    let icon = document.getElementById(`icon${change.index}`);
    
    switch (change.player) {
        case Player.X:
            icon.setAttribute('class', 'fa fa-close');
            break;

        case Player.O:
            icon.setAttribute('class', 'fa fa-circle-o');
            break;
    }

    icon.style.opacity = 1;
}

function logIn() {
    let username = document.getElementById('username');

    if (username.value && !busy && !/[^a-z0-9]/i.test(username.value)) {
        busy = true;

        firebase.database().ref('users').once('value').then(snapshotUsers => {
            let users = snapshotUsers.val();

            if (!users) {
                users = [];
            }

            let isUnique = true;

            for (let i = 0; i < users.length && isUnique; i++) {
                if (users[i].username === username.value) {
                    isUnique = false;
                }
            }

            if (isUnique) {
                firebase.auth().signInAnonymously().then(() => {
                    users.push({
                        uid : firebase.auth().currentUser.uid,
                        username: username.value
                    });

                    firebase.database().ref('users').set(users).then(() => {
                        firebase.auth().currentUser.updateProfile({
                            displayName: username.value
                        }).then(() => {
                            // TODO: load
                            let currentUsername = document.getElementById('currentUsername');

                            currentUsername.textContent = username.value;
                            currentUsername.style.top = '1.5vmin';

                            setTimeout(() => {
                                username.value = '';
                                busy = false;
                            }, 200);
                        }).catch(error => {
                            console.error(error.message);
                        });
                    }).catch(error => {
                        console.error(error.message);
                    });
                });
            } else {
                // TODO: error message
                document.getElementById('logInWrapper').style.borderColor = '#ff4444';
                document.getElementById('logIn').style.borderLeftColor = '#ff4444';
                busy = false;
            }
        }).catch(error => {
            console.error(error.message);
        });
    } else {
        document.getElementById('logInWrapper').style.borderColor = '#ff4444';
        document.getElementById('logIn').style.borderLeftColor = '#ff4444';
    }
}

function challenge() {
    if (!busy) {
        busy = true;

        firebase.database().ref('users').once('value').then(snapshotUsers => {
            let found = false;
            let users = snapshotUsers.val();

            for (let i = 0; i < users.length && !found; i++) {
                let currentUser = firebase.auth().currentUser;
                let opponent = document.getElementById('opponentUsername');

                if (users[i].username == opponent.value && users[i].username !== currentUser.displayName) {
                    found = true;

                    firebase.database().ref('challenges').once('value').then(snapshotChallenges => {
                        let challenges = snapshotChallenges.val();
            
                        if (!challenges) {
                            challenges = [];
                        }
            
                        challenges.push({
                            from: currentUser.uid,
                            to: users[i].uid
                        });

                        opponentUsername = users[i].username;

                        firebase.database().ref('challenges').set(challenges).then(() => {
                            game = `games/${currentUser.uid}/${users[i].uid}`;
                            player = Player.X;

                            firebase.database().ref(game).set(new Game()).then(() => {
                                let challengeWindow = document.getElementById('challengeWindow').style;
                                let gameWindow = document.getElementById('gameWindow').style;
                                let challenges = document.getElementById('challenges').style;
                                let back = document.getElementById('back');

                                gameWindow.left = 0;
                                challengeWindow.left = '-100vw';
                                challenges.right = '100vw';
                                gameWindow.opacity = 1;
                                challengeWindow.opacity = 0;
                                challenges.opacity = 0;

                                back.removeEventListener('click', backToLogIn);

                                setTimeout(() => {
                                    back.addEventListener('click', backToChallenge);
                                    opponent.value = '';
                                }, 200);

                                firebase.database().ref(`${game}`).on('child_changed', endGame);
                                firebase.database().ref(`${game}/field`).on('child_changed', drawField);

                                busy = false;
                            }).catch(error => {
                                console.error(error.message);
                            });
                        }).catch(error => {
                            console.error(error.message);
                        });
                    }).catch(error => {
                        console.error(error.message);
                    });
                }
            }

            if (!found) {
                // TODO: error message
                document.getElementById('challengeWrapper').style.borderColor = '#ff4444';
                document.getElementById('challenge').style.borderLeftColor = '#ff4444';
                busy = false;
            }
        }).catch(error => {
            console.error(error.message);
        });
    }
}

function endGame(snapshotChange) {
    if (snapshotChange.val() === Player.noPlayer) {
        let winnerDiv = document.getElementById('winner');

        firebase.database().ref(`${game}/winner`).once('value').then(snapshotWinner => {
            let winner = snapshotWinner.val();

            if (winner === Player.noPlayer) {
                winnerDiv.textContent = 'Draw!';
            } else if (winner === player) {
                winnerDiv.textContent = `${firebase.auth().currentUser.displayName} won!`;
            } else {
                winnerDiv.textContent = `${opponentUsername} won!`;
            }
        }).catch(error => {
            console.error(error.message);
        });

        winnerDiv.style.display = 'block';
    }
}