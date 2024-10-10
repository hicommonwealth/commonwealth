import { Button } from 'frames.js/express';
import React from 'react';
import { frames } from '../../config';
import { CardWithText } from '../../utils';

export const resultGame = frames(async (ctx) => {
  const rand = Math.floor(Math.random() * 3);
  const choices = ['Rock', 'Paper', 'Scissors'];
  const userChoice = choices[(Number(ctx.pressedButton?.index) || 1) - 1];
  const computerChoice = choices[rand];
  let msg = '';

  if (userChoice === computerChoice) {
    msg = 'Draw ⚖️';
  }

  if (
    (userChoice === 'Rock' && computerChoice === 'Scissors') ||
    (userChoice === 'Paper' && computerChoice === 'Rock') ||
    (userChoice === 'Scissors' && computerChoice === 'Paper')
  ) {
    msg = 'You win 🏆';
  }

  if (
    (userChoice === 'Rock' && computerChoice === 'Paper') ||
    (userChoice === 'Paper' && computerChoice === 'Scissors') ||
    (userChoice === 'Scissors' && computerChoice === 'Rock')
  ) {
    msg = 'You lose 😩';
  }

  const color = msg.includes('Draw')
    ? 'lightgray'
    : msg.includes('win')
      ? 'lightgreen'
      : 'lightpink';

  return {
    image: CardWithText({
      text: `${userChoice} vs ${computerChoice}: ${msg}`,
      color,
    }),
    buttons: [
      <Button key="play again" action="post" target="/game">
        Play again 🔄
      </Button>,
    ],
  };
});
