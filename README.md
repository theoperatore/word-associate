Word Association Game
=====================

**A Game of Wits and Inside Jokes**

*Server version: 0.5.1*

A word association game web server that uses web sockets to exchange player data in near-real time. The server runs using Node.js with the modules Express and Socket.IO and can be played with any number of players, but 3+ yields the most fun!

The game can be played on any device with an internet connection or on any device with a connection to the same network the server is running on. 

Designed for mobile client use with a small webserver.

Installation
============

Currently, the game server runs on [Node.js](http://nodejs.org/) with modules: [Express](http://expressjs.com/) and [Socket.IO](http://socket.io/).

Once Node.js is installed, the easiest way to get Express and Socket.IO is to use the built in NodePackageManager, npm:

    $ npm install express
    $ npm install socket.io

**Further implementations of the server will have Express and Socket.IO packaged into this repo**

Starting the game server
========================

To start your game server, all that is required is to run the server.js file inside node:

    $ node server.js

This starts the game server on port 8080.

Changing the game server port requires opening 'server.js' and editing the var 'port', on line 8, to the desired port number.

How to Play
===========

There are two different game modes: 'Circle of Friends' and 'Pick the Best'.

**Cirlce of Friends**

In this game mode, each round a leader is selected from the connected players. The leader enters in a word for the rest of the players to associate with.

Each player enters what they think is the most popular answer among the other players.

After each player has submitted an answer the players that are 'most in sync' with the leader, i.e. the players who answered the same, get a point.

The round is now over, a new leader is selected and the game continues.

*Example*

Players 1,2,3 and 4.

Player 1 is the Leader this round and enters the word: Party.
Player 2 guesses Bus.
Player 3 guesses Horse.
Player 4 guesses Horse.

At the end of the round, Player 3 and Player 4 get 1 point because they were the most in sync with the Leader.

Player 2 guessed a different word and therefore does not get a point.

A new Player is selected as the Leader (excluding Player 1 because that player was the Leader the last round) and a new round starts.

**Pick the Best**

This game mode has a similar game structure as *Circle of Friends* mode but instead of players being awarded points based on submitting the same word, the current Leader **chooses** the player(s) that get(s) a point for that round.

*Example*

Players 1,2,3 and 4.

Player 1 is the Leader and enters the word: Party.
Player 2 guesses Horse.
Player 3 guesses Bus.
Player 4 guesses Wagon.

The Leader looks at all of the words submitted by the players and decides which player(s) score a point.

Player 1 knows that 'Party Horse' is a recurring theme among his/her D&D campaigns and associates long nights of crazy nonsensical laughter with Party Horse. Player 1 awards Player 2 a point for being downright hilarious.

The round is over, a new Leader is selected (excluding Player 1 because that player was the Leader the last round) and a new rounds starts.

TODO
====

- finish up game mode scoring logic
- handle player connections/disconnections during gameplay
- style client views
- test client views on multiple browsers and devices