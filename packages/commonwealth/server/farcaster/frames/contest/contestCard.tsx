import { config, query } from '@hicommonwealth/core';
import { Contest, config as modelConfig } from '@hicommonwealth/model';
import { Button } from 'frames.js/express';
import React from 'react';

import { buildContestLeaderboardUrl, getBaseUrl } from '@hicommonwealth/shared';
import { frames } from '../../config';

const formatTimeRemaining = (createdAt: Date, intervalDays: number): string => {
  const endTime = new Date(createdAt);
  endTime.setDate(endTime.getDate() + intervalDays);

  const now = new Date();
  const timeLeft = endTime.getTime() - now.getTime();

  if (timeLeft <= 0) return 'Contest ended';

  const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
  const hours = Math.floor(
    (timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
  );

  if (days > 0) return `${days}d ${hours}h remaining`;
  return `${hours}h remaining`;
};

export const contestCard = frames(async (ctx) => {
  const contest_address = ctx.url.pathname.split('/')[1];

  const contestManager = await query(Contest.GetContest(), {
    actor: { user: { email: '' } },
    payload: {
      contest_address,
      with_chain_node: true,
    },
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
          background: 'linear-gradient(180deg, #2A2432 0%, #1F1A26 100%)',
          color: 'white',
          padding: '40px',
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
          height: '100%',
          borderRadius: '16px',
          gap: '16px',
          lineHeight: '1.2',
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

        {contestManager.created_at && (
          <p
            style={{
              fontSize: '28px',
              color: '#E6E6E6',
              marginTop: '8px',
            }}
          >
            {formatTimeRemaining(
              new Date(contestManager.created_at),
              contestManager.interval,
            )}
          </p>
        )}

        {contestManager.Community && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              marginTop: '8px',
            }}
          >
            {contestManager.Community.icon_url && (
              <img
                src={contestManager.Community.icon_url}
                alt={`${contestManager.Community.name} logo`}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                }}
              />
            )}
            <p
              style={{
                fontSize: '24px',
                color: '#E6E6E6',
              }}
            >
              {contestManager.Community.name}
            </p>
          </div>
        )}

        <p style={{ fontSize: '42px', marginTop: 'auto' }}>
          Check prizes below 👇
        </p>
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
