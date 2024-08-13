import { Button } from 'frames.js/express';
import React from 'react';
import { frames } from '../../config';
import { CardWithText } from '../../utils';

export const contestCard = frames(async () => {
  // here we would need to be able to fetch data related to contest eg
  // image, title, description, prizes
  // check designs https://www.figma.com/design/NNqlhNPHvn0O96TCBIi6WU/Contests?node-id=960-3689&t=8ogN11dhaRqJP8ET-1

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
