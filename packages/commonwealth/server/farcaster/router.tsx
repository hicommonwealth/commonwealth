import express from 'express';
import { Button } from 'frames.js/express';
import React from 'react';
import { frames } from './config';

const farcasterRouter = express.Router();

export const gameHandler = frames(async () => {
  return {
    image: (
      <div
        style={{
          alignItems: 'center',
          background: 'black',
          backgroundSize: '100% 100%',
          display: 'flex',
          flexDirection: 'column',
          flexWrap: 'nowrap',
          height: '100%',
          justifyContent: 'center',
          textAlign: 'center',
          width: '100%',
        }}
      >
        <div
          style={{
            color: 'white',
            fontSize: 60,
            fontStyle: 'normal',
            letterSpacing: '-0.025em',
            lineHeight: 1.4,
            marginTop: 30,
            padding: '0 120px',
            whiteSpace: 'pre-wrap',
          }}
        >
          Choose your weapon
        </div>
      </div>
    ),
    buttons: [
      <Button key="rock" action="post" target="/result">
        Rock
      </Button>,
      <Button key="paper" action="post" target="/result">
        Paper
      </Button>,
      <Button key="scissors" target="/result" action="post">
        Scissors
      </Button>,
    ],
  };
});

export const resultHandler = frames(async (ctx) => {
  const rand = Math.floor(Math.random() * 3);
  const choices = ['rock', 'paper', 'scissors'];
  const userChoice = choices[(Number(ctx.pressedButton?.index) || 1) - 1];
  const computerChoice = choices[rand];
  let msg = '';

  if (userChoice === computerChoice) {
    msg = 'draw';
  }

  if (
    (userChoice === 'rock' && computerChoice === 'scissors') ||
    (userChoice === 'paper' && computerChoice === 'rock') ||
    (userChoice === 'scissors' && computerChoice === 'paper')
  ) {
    msg = 'You win';
  }

  if (
    (userChoice === 'rock' && computerChoice === 'paper') ||
    (userChoice === 'paper' && computerChoice === 'scissors') ||
    (userChoice === 'scissors' && computerChoice === 'rock')
  ) {
    msg = 'You lose';
  }

  const color =
    msg === 'draw'
      ? 'lightgray'
      : msg === 'You win'
      ? 'lightgreen'
      : 'lightpink';

  return {
    image: (
      <div
        style={{
          alignItems: 'center',
          background: color,
          backgroundSize: '100% 100%',
          display: 'flex',
          flexDirection: 'column',
          flexWrap: 'nowrap',
          height: '100%',
          justifyContent: 'center',
          textAlign: 'center',
          width: '100%',
        }}
      >
        <div
          style={{
            color: 'white',
            fontSize: 60,
            fontStyle: 'normal',
            letterSpacing: '-0.025em',
            lineHeight: 1.4,
            marginTop: 30,
            padding: '0 120px',
            whiteSpace: 'pre-wrap',
            display: 'flex',
          }}
        >
          {userChoice} vs {computerChoice}
        </div>

        <div
          style={{
            color: 'white',
            fontSize: 60,
            fontStyle: 'normal',
            letterSpacing: '-0.025em',
            lineHeight: 1.4,
            marginTop: 30,
            padding: '0 120px',
            whiteSpace: 'pre-wrap',
          }}
        >
          {msg}
        </div>
      </div>
    ),
    buttons: [
      <Button key="play again" action="post" target="/game">
        Play again
      </Button>,
    ],
  };
});

farcasterRouter.get('/game', gameHandler);
farcasterRouter.post('/game', gameHandler);
farcasterRouter.post('/result', resultHandler);

export default farcasterRouter;
