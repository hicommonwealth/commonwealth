import { Button } from 'frames.js/express';
import React from 'react';
import { frames } from '../../config';
import { CardWithText } from '../../utils';

export const contestCard = frames(async () => {
  return {
    image: CardWithText({ text: 'Contest' }),
    buttons: [
      <Button key="leaderboard" action="post" target="/viewLeaderboard">
        View Leaderboard
      </Button>,
      <Button key="eligibility" action="post" target="/checkEligibility">
        Check Eligibility
      </Button>,
    ],
  };
});
