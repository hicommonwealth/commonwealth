import { Button } from 'frames.js/express';
import React from 'react';
import { frames } from '../../config';
import { CardWithText } from '../../utils';

export const startGame = frames(async () => {
  return {
    image: CardWithText({ text: 'Choose your weapon 🥊' }),
    buttons: [
      <Button key="rock" action="post" target="/result">
        Rock 🪨
      </Button>,
      <Button key="paper" action="post" target="/result">
        Paper 📄
      </Button>,
      <Button key="scissors" target="/result" action="post">
        Scissors ✂️
      </Button>,
    ],
  };
});
