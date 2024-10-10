import { Button } from 'frames.js/express';
import React from 'react';
import { frames } from '../../config';
import { circleCheckIcon, circleXIcon, fakeApiCall } from '../../utils';

export const checkEligibility = frames(async (ctx) => {
  let eligible: boolean;

  try {
    await fakeApiCall({ error: 'error' });
    eligible = true;
  } catch {
    eligible = false;
  }

  const icon = eligible ? circleCheckIcon : circleXIcon;
  const title = eligible ? 'You are eligible to enter' : 'You are not eligible';
  const description = eligible
    ? 'Reply to this cast or quote this frame to be entered into the contest.'
    : 'In order to enter this contest you must connect an Ethereum wallet to your Farcaster account.';

  const contest_address = ctx.url.pathname.split('/')[1];

  return {
    image: (
      <div
        style={{
          backgroundColor: '#2A2432',
          color: 'white',
          padding: '40px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          height: '100%',
          textAlign: 'center',
        }}
      >
        {icon}

        <p
          style={{
            fontSize: '56px',
            marginBottom: '0px',
          }}
        >
          {title}
        </p>

        <p style={{ fontSize: '32px', padding: '0 20%' }}>{description}</p>
      </div>
    ),
    buttons: [
      <Button
        key="back"
        action="post"
        target={`/${contest_address}/contestCard`}
      >
        Back
      </Button>,
    ],
  };
});
