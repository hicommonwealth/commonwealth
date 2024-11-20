import { command, config } from '@hicommonwealth/core';
import { commonProtocol } from '@hicommonwealth/model';
import { Button } from 'frames.js/express';
import moment from 'moment';
import { GetContest } from 'node_modules/@hicommonwealth/model/src/contest';
import React from 'react';
import { frames } from '../../config';

const PrizeRow = ({ index, prize }: { index: number; prize: number }) => {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
      }}
    >
      <p
        style={{
          marginBottom: '0px',
        }}
      >
        {moment.localeData().ordinal(index + 1)} Prize
      </p>
      <p
        style={{
          marginBottom: '0px',
          textShadow: '0px 0px 3px white',
        }}
      >
        ETH {prize}
      </p>
    </div>
  );
};

export const contestCard = frames(async (ctx) => {
  // here we would need to be able to fetch data related to contest eg
  // image, title, description, prizes
  // check designs https://www.figma.com/design/NNqlhNPHvn0O96TCBIi6WU/Contests?node-id=960-3689&t=8ogN11dhaRqJP8ET-1

  const contest_address = ctx.url.pathname.split('/')[1];

  const contestManager = await command(GetContest(), {
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

  const chainNode = contestManager.Community!.ChainNode!;
  const chainNodeUrl = chainNode.private_url! || chainNode.url!;
  const contestBalance = await commonProtocol.contestHelper.getContestBalance(
    chainNodeUrl,
    contestManager.contest_address,
    contestManager.interval === 0,
  );

  const prizes =
    contestBalance && contestManager.payout_structure
      ? contestManager.payout_structure.map(
          (percentage) =>
            (Number(contestBalance) * (percentage / 100)) /
            Math.pow(10, contestManager.decimals || 18),
        )
      : [];

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
            fontSize: '56px',
          }}
        >
          {contestManager.name}
        </p>

        {contestManager.description && (
          <p
            style={{
              fontSize: '32px',
            }}
          >
            {contestManager.description}
          </p>
        )}

        <p style={{ fontSize: '24px' }}>{contest_address}</p>

        <p style={{ fontSize: '42px' }}>Current Prizes</p>

        {prizes.length ? (
          prizes.map((prize, index) => (
            <PrizeRow key={index} index={index} prize={prize} />
          ))
        ) : (
          <p style={{ fontSize: '32px' }}>Contest has no prizes yet.</p>
        )}
      </div>
    ),
    buttons: [
      <Button
        key="leaderboard"
        action="link"
        target={`${getBaseUrl()}/${contestManager.community_id}/contests/${contestManager.contest_address}`}
      >
        View Leaderboard
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
