import { Button } from 'frames.js/express';
import React from 'react';
import { frames } from '../../config';
import { CardWithText } from '../../utils';

export const viewLeaderboard = frames(async () => {
  return {
    image: CardWithText({ text: 'Leaderboard' }),
    buttons: [
      <Button key="back" action="post" target="/contestCard">
        Back
      </Button>,
    ],
  };
});
