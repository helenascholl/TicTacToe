'use strict';

let field = [];
const Player = {
    noPlayer: 0,
    X: 1,
    O: 2
};

for (let i = 0; i < 9; i++) {
    field[i] = Player.noPlayer;
}