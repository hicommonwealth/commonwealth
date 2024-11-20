import { command, config } from '@hicommonwealth/core';
import { Contest } from '@hicommonwealth/model';
import { Button } from 'frames.js/express';
import React from 'react';

import { frames } from '../../config';

export const contestCard = frames(async (ctx) => {
  const contest_address = ctx.url.pathname.split('/')[1];

  const contestManager = await command(Contest.GetContest(), {
    actor: { user: { email: '' } },
    payload: { contest_address, with_chain_node: true },
  });

  if (!contestManager) {
    return {
      title: 'N/A',
      image: (
        <div
          style={{
            backgroundColor: '#2A2432',
            color: 'white',
            padding: '40px',
            display: 'flex',
            flexDirection: 'column',
            width: '100%',
            height: '100%',
            lineHeight: '0.5',
          }}
        >
          <p
            style={{
              fontSize: '56px',
            }}
          >
            Not Found
          </p>
        </div>
      ),
    };
  }

  return {
    title: contestManager.name,
    image: (
      <div
        style={{
          backgroundColor: '#2A2432',
          color: 'white',
          padding: '40px',
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
          height: '100%',
          lineHeight: '0.5',
        }}
      >
        <p
          style={{
            lineHeight: '1.2',
            fontSize: '56px',
          }}
        >
          {contestManager.name}
        </p>

        {contestManager.description && (
          <p
            style={{
              fontSize: '32px',
              lineHeight: '1.2',
            }}
          >
            {contestManager.description}
          </p>
        )}

        <p style={{ fontSize: '42px' }}>Check prizes below 👇</p>
      </div>
    ),
    buttons: [
      <Button
        key="leaderboard"
        action="link"
        target={`${getBaseUrl()}/${contestManager.community_id}/contests/${contestManager.contest_address}`}
      >
        Leaderboard
      </Button>,
      <Button
        key="prizes"
        action="post"
        target={`/${contest_address}/contestPrizes`}
      >
        Prizes
      </Button>,
      <Button
        key="eligibility"
        action="post"
        target={`/${contest_address}/checkEligibility`}
      >
        Check Eligibility
      </Button>,
    ],
  };
});

const getBaseUrl = () => {
  switch (config.APP_ENV) {
    case 'local':
      return 'http://localhost:8080';
    case 'beta':
      return 'https://qa.commonwealth.im';
    case 'demo':
      return 'https://demo.commonwealth.im';
    default:
      return 'https://commonwealth.im';
  }
};
