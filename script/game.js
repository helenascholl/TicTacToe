'use strict';

const Player = {
    noPlayer: 0,
    X: 1,
    O: 2
};

class Game {
    constructor() {
        this.turn = Player.X;
        this.ready = false;
        this.field = [];

        for (let i = 0; i < 9; i++) {
            this.field[i] = Player.noPlayer;
        }
    }
}