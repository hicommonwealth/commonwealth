import { config, query } from '@hicommonwealth/core';
import { Contest, config as modelConfig } from '@hicommonwealth/model';
import { Button } from 'frames.js/express';
import React from 'react';

import { buildContestLeaderboardUrl, getBaseUrl } from '@hicommonwealth/shared';
import { frames } from '../../config';
import { FrameLayout } from '../../utils';

export const contestCard = frames(async (ctx) => {
  const contest_address = ctx.url.pathname.split('/')[1];

  const contestManager = await query(Contest.GetContest(), {
    actor: { user: { email: '' } },
    payload: { contest_address, with_chain_node: true, with_contests: true },
  });

  if (!contestManager) {
    return {
      title: 'Contest not found',
      image: (
        <FrameLayout header="Contest not found">
          <p
            style={{
              fontSize: '32px',
            }}
          >
            Try to run the contest again.
          </p>
        </FrameLayout>
      ),
    };
  }

  if (contestManager.ended || contestManager.cancelled) {
    return {
      title: 'Contest Ended',
      image: (
        <FrameLayout header="Contest Ended">
          <p
            style={{
              fontSize: '32px',
            }}
          >
            New entries will not be accepted.
          </p>
        </FrameLayout>
      ),
    };
  }

  const leaderboardUrl = buildContestLeaderboardUrl(
    getBaseUrl(config.APP_ENV),
    contestManager.community_id,
    contestManager.contest_address,
  );

  const endTime = contestManager.contests?.[0]?.end_time;

  return {
    title: contestManager.name,
    image: (
      <FrameLayout header={contestManager.name}>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            flexGrow: 1,
          }}
        >
          {contestManager.description && (
            <p
              style={{
                fontSize: '36px',
                lineHeight: '1.2',
              }}
            >
              {contestManager.description}
            </p>
          )}

          {endTime && (
            <p
              style={{
                fontSize: '30px',
                lineHeight: '1.2',
              }}
            >
              Submit entries by replying below until{' '}
              {endTime.toLocaleString(undefined, {
                timeZoneName: 'longGeneric',
              })}
            </p>
          )}

          <p
            style={{
              fontSize: '42px',
              display: 'flex',
              justifyContent: 'flex-end',
              alignItems: 'center',
            }}
          >
            Contest by {contestManager.Community?.name}
            {contestManager.Community?.icon_url && (
              <img
                src={contestManager.Community?.icon_url}
                alt=""
                style={{
                  width: '80px',
                  height: '80px',
                  borderRadius: '50%',
                  marginLeft: '16px',
                }}
              />
            )}
          </p>
        </div>
      </FrameLayout>
    ),
    buttons: [
      <Button key="leaderboard" action="link" target={leaderboardUrl}>
        Leaderboard
      </Button>,
      <Button
        key="voting-rules"
        action="post"
        target={`/${contest_address}/votingRules`}
      >
        Voting Rules
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
