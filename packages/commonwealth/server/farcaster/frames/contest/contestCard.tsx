import { config, query } from '@hicommonwealth/core';
import { Contest, config as modelConfig } from '@hicommonwealth/model';
import { Button } from 'frames.js/express';
import React from 'react';

import { buildContestLeaderboardUrl, getBaseUrl } from '@hicommonwealth/shared';
import { frames } from '../../config';

export const contestCard = frames(async (ctx) => {
  const contest_address = ctx.url.pathname.split('/')[1];

  const contestManager = await query(Contest.GetContest(), {
    actor: { user: { email: '' } },
    payload: { contest_address, with_chain_node: true },
  });

  if (!contestManager) {
    return {
      title: 'Contest not found',
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
            Contest not found.
          </p>
        </div>
      ),
    };
  }

  if (contestManager.ended || contestManager.cancelled) {
    return {
      title: 'Contest Ended',
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
            Contest ended. New entries will not be accepted.
          </p>
        </div>
      ),
    };
  }

  const leaderboardUrl = buildContestLeaderboardUrl(
    getBaseUrl(config.APP_ENV),
    contestManager.community_id,
    contestManager.contest_address,
  );

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
      <Button key="leaderboard" action="link" target={leaderboardUrl}>
        Leaderboard
      </Button>,
      <Button
        key="prizes"
        action="post"
        target={`/${contest_address}/contestPrizes`}
      >
        Prizes
      </Button>,
      <Button key="install" action="link" target={getActionInstallUrl()}>
        Add Upvote Action
      </Button>,
    ],
  };
});

export const getActionInstallUrl = () => {
  // add environment to button label in non-prod environments
  let buttonLabel = 'Upvote+Content';
  if (config.APP_ENV !== 'production') {
    buttonLabel += `+${config.APP_ENV}`;
  }
  // eslint-disable-next-line max-len
  return `https://warpcast.com/~/add-cast-action?actionType=post&name=${buttonLabel}&icon=thumbsup&postUrl=${modelConfig.CONTESTS.FARCASTER_ACTION_URL}`;
};
