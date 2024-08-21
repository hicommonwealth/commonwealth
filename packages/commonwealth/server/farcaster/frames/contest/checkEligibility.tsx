import { Button } from 'frames.js/express';
import React from 'react';
import { frames } from '../../config';
import { circleCheckIcon, circleXIcon } from '../../utils';

// TODO remove when will be hooked up to real data
async function fakeApiCall() {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (Math.random() > 0.5) {
        return resolve('eligible');
      } else {
        return reject('not eligible');
      }
    }, 1000);
  });
}

export const checkEligibility = frames(async () => {
  let eligible: boolean;

  try {
    await fakeApiCall();
    eligible = true;
  } catch {
    eligible = false;
  }

  const base64Icon = eligible ? circleCheckIcon : circleXIcon;
  const title = eligible ? 'You are eligible to enter' : 'You are not eligible';
  const description = eligible
    ? 'Reply to this cast or quote this frame to be entered into the contest.'
    : 'In order to enter this contest you must connect an Ethereum wallet to your Farcaster account.';

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
        <img
          style={{ width: '100px', height: '100px' }}
          alt="icon"
          src={base64Icon}
        />

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
      <Button key="back" action="post" target="/contestCard">
        Back
      </Button>,
    ],
  };
});
