import { query } from '@hicommonwealth/core';
import { Contest } from '@hicommonwealth/model';
import { Button } from 'frames.js/express';
import React from 'react';
import { frames } from '../../config';
import { FrameLayout } from '../../utils';

export const votingRules = frames(async (ctx) => {
  const contest_address = ctx.url.pathname.split('/')[1];

  const contestManager = await query(Contest.GetContest(), {
    actor: { user: { email: '' } },
    payload: { contest_address, with_chain_node: true },
  });

  if (!contestManager) {
    return {
      title: 'Contest not found',
      image: (
        <FrameLayout header="Contest not found">
          <p style={{ fontSize: '32px' }}>Try to run the contest again.</p>
        </FrameLayout>
      ),
    };
  }

  return {
    title: 'Voting Rules',
    image: (
      <FrameLayout header="Voting Rules">
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
            padding: '20px',
            fontSize: '32px',
          }}
        >
          <ul
            style={{
              listStyle: 'none',
              margin: 0,
              padding: 0,
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              lineHeight: '1.1',
            }}
          >
            <li>
              • All votes are weighted by the token used to fund the contest
            </li>
            <li>
              • Users must have the requisite token in their Farcaster verified
              wallet to vote
            </li>
            <li>
              • Add the &quot;upvote content&quot; action to add your votes to
              the entries
            </li>
            <li>• Any reply to the frame is considered an entry</li>
            <li>
              • Check the leaderboard after voting to see if your votes were
              applied
            </li>
          </ul>
        </div>
      </FrameLayout>
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
