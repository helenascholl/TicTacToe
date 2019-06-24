'use strict';

let game;
let player;
let opponentUsername;
let currentUserUsername;
let busy = false;
let winningPatterns = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
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
        let inviteWindow = document.getElementById('inviteWindow').style;
        let logInWindow = document.getElementById('logInWindow').style;
        let back = document.getElementById('back').style;

        if (user) {
            inviteWindow.left = 0;
            logInWindow.left = '-100vw';
            inviteWindow.opacity = 1;
            logInWindow.opacity = 0;
            back.opacity = 1;
            back.pointerEvents = 'all';

            firebase.database().ref('users').once('value').then(snapshot => {
                let users = snapshot.val();

                if (users) {
                    for (let account of snapshot.val()) {
                        if (user.uid === account.uid) {
                            currentUserUsername = account.username;
                        }
                    }
                }
            });
        } else {
            logInWindow.left = 0;
            inviteWindow.left = '100vw';
            logInWindow.opacity = 1;
            inviteWindow.opacity = 0;
            back.opacity = 0;
            back.pointerEvents = 'none';
        }
    });

    for (let i = 0; i < 9; i++) {
        let container = document.createElement('div');

        container.setAttribute('id', `container${i}`);
        container.setAttribute('class', 'container');

        container.addEventListener('click', selectContainer);

        document.getElementById('containers').appendChild(container);
    }

    firebase.database().ref('invitations').on('child_added', addInvitation);

    clickOnEnter('username', 'logIn');
    clickOnEnter('playerId', 'invite');

    document.getElementById('logIn').addEventListener('click', logIn);
    document.getElementById('invite').addEventListener('click', invite);
    document.getElementById('back').addEventListener('click', () => {
        firebase.auth().signOut();
    });
    document.getElementById('username').addEventListener('input', () => {
        document.getElementById('logInWrapper').style.borderColor = '';
        document.getElementById('logIn').style.borderLeftColor = '';
    });
});

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
}

function addInvitation(snapshotInvitation) {
    let currentUser = firebase.auth().currentUser;
    let invitation = snapshotInvitation.val();

    if (currentUser && invitation.to === currentUser.uid) {
        let invitationDiv = document.createElement('div');
        let accept = document.createElement('div');
        let h3 = document.createElement('h3');

        invitationDiv.setAttribute('class', 'invitaion');
        accept.setAttribute('class', 'accept');
        accept.textContent = 'Accept';
        
        firebase.database().ref('users').once('value').then(snapshotUsers => {
            for (let user of snapshotUsers.val()) {
                if (user.uid === invitation.from) {
                    opponentUsername = user.username;
                    h3.textContent = opponentUsername;
                }
            }
        }).catch(error => {
            console.error(error.message);
        });

        accept.addEventListener('click', () => {
            firebase.database().ref('invitations').once('value').then(snapshotInvitations => {
                let newInvitations = [];

                for (let child of snapshotInvitations.val()) {
                    if (child.from !== invitation.from && child.to !== invitation.to) {
                        newInvitations.push(child);
                    }
                }

                firebase.database().ref('invitations').set(newInvitations).then(() => {
                    document.getElementById('inviteWindow').style.display = 'none';
                    document.getElementById('game').style.display = 'flex';

                    game = `games/${invitation.from}/${invitation.to}`;
                    player = Player.O;
                    firebase.database().ref(`${game}`).on('child_changed', drawField);
                }).catch(error => {
                    console.error(error.message);
                });
            }).catch(error => {
                console.error(error.message);
            })
        });

        invitationDiv.appendChild(h3);
        invitationDiv.appendChild(accept);
        document.getElementById('invitations').appendChild(invitationDiv);
    }
}

function selectContainer(event) {
    firebase.database().ref(`${game}/turn`).once('value').then(snapshotTurn => {
        if (snapshotTurn.val() === player) {
            firebase.database().ref(`${game}/field`).once('value').then(snapshotPlayers => {
                let players = snapshotPlayers.val();
                let index = parseInt(event.target.id.replace('container', ''));

                if (players[index] === Player.noPlayer) {
                    players[index] = player;

                    firebase.database().ref(`${game}/field`).set(players).then(() => {
                        let turn = Player.X;
    
                        if (player === Player.X) {
                            turn = Player.O;
                        }

                        for (let pattern of winningPatterns) {
                            let won = true;
    
                            for (let i = 0; i < pattern.length && won; i++) {
                                if (players[pattern[i]] !== player) {
                                    won = false;
                                }
                            }

                            if (won) {
                                turn = Player.noPlayer;

                                firebase.database().ref(`${game}/winner`).set(player).catch(error => {
                                    console.error(error.message);
                                });
                            } else {
                                let isFull = true;

                                for (let container of players) {
                                    if (container === Player.noPlayer) {
                                        isFull = false;
                                    }
                                }

                                if (isFull) {
                                    turn = Player.noPlayer;

                                    firebase.database().ref(`${game}/winner`).set(Player.noPlayer).catch(error => {
                                        console.error(error.message);
                                    });
                                }
                            }
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

    if (change instanceof Array) {
        for (let i = 0; i < 9; i++) {
            switch (change[i]) {
                case Player.X:
                    document.getElementById(`container${i}`).setAttribute('class', 'container fa fa-close');
                    break;
    
                case Player.O:
                    document.getElementById(`container${i}`).setAttribute('class', 'container fa fa-circle-o');
                    break;
            }
        }
    } else if (change === Player.noPlayer) {
        endGame();
    }
}

function logIn() {
    let username = document.getElementById('username');

    if (username.value) {
        busy = true;

        firebase.auth().signInAnonymously().then(() => {
            firebase.database().ref('users').once('value').then(snapshot => {
                let users = snapshot.val();
                let id;
                let isUnique;

                if (!users) {
                    users = [];
                }

                do {
                    id = parseInt(Math.random() * 10000);
                    isUnique = true;

                    for (let i = 0; i < users.length && isUnique; i++) {
                        if (users[i].id === id) {
                            isUnique = false;
                        }
                    }
                } while (!isUnique);

                users.push({
                    id: id,
                    uid: firebase.auth().currentUser.uid,
                    username: username.value
                });

                currentUserUsername = username.value;

                firebase.database().ref('users').set(users).then(() => {
                    firebase.auth().currentUser.updateProfile({
                        displayName: id
                    }).then(() => {
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
            }).catch(error => {
                console.error(error.message);
            });
        }).catch(error => {
            console.error(error.message);
        });
    } else {
        document.getElementById('logInWrapper').style.borderColor = '#ff4444';
        document.getElementById('logIn').style.borderLeftColor = '#ff4444';
    }
}

function invite() {
    if (!busy) {
        busy = true;

        firebase.database().ref('users').once('value').then(snapshotUsers => {
            for (let user of snapshotUsers.val()) {
                let currentUser = firebase.auth().currentUser;

                if (user.id == document.getElementById('playerId').value && user.id !== currentUser.displayName) {
                    firebase.database().ref('invitations').once('value').then(snapshotInvitations => {
                        let invitations = snapshotInvitations.val();
            
                        if (!invitations) {
                            invitations = [];
                        }
            
                        invitations.push({
                            from: currentUser.uid,
                            to: user.uid
                        });

                        opponentUsername = user.username;

                        firebase.database().ref('invitations').set(invitations).then(() => {
                            game = `games/${currentUser.uid}/${user.uid}`;
                            player = Player.X;

                            firebase.database().ref(`${game}/field`).set(field).then(() => {
                                firebase.database().ref(`${game}/turn`).set(player).then(() => {
                                    document.getElementById('inviteWindow').style.display = 'none';
                                    document.getElementById('game').style.display = 'flex';

                                    firebase.database().ref(`${game}`).on('child_changed', drawField);

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
                    }).catch(error => {
                        console.error(error.message);
                    });
                } else {
                    document.getElementById('inviteWrapper').style.borderColor = '#ff4444';
                    document.getElementById('invite').style.borderLeftColor = '#ff4444';
                }
            }
        }).catch(error => {
            console.error(error.message);
        });
    }
}

function endGame() {
    let winnerDiv = document.getElementById('winner');

    firebase.database().ref(`${game}/winner`).once('value').then(snapshot => {
        let winner = snapshot.val();

        if (winner === Player.noPlayer) {
            winnerDiv.textContent = 'Draw!';
        } else if (winner === player) {
            winnerDiv.textContent = `${currentUserUsername} won!`;
        } else {
            winnerDiv.textContent = `${opponentUsername} won!`;
        }
    }).catch(error => {
        console.error(error.message);
    });

    winnerDiv.style.display = 'block';
}