import { models } from '@hicommonwealth/model';
import { Button } from 'frames.js/express';
import moment from 'moment';
import { mustExist } from 'node_modules/@hicommonwealth/model/src/middleware/guards';
import { getContestBalance } from 'node_modules/@hicommonwealth/model/src/services/commonProtocol/contestHelper';
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

  const contestManager = await models.ContestManager.findOne({
    where: {
      contest_address: contest_address,
    },
    include: [
      {
        model: models.Community,
        include: [
          {
            model: models.ChainNode.scope('withPrivateData'),
          },
        ],
      },
    ],
  });
  mustExist('Contest Manager', contestManager);

  const chainNode = contestManager.Community!.ChainNode!;
  const chainNodeUrl = chainNode.private_url! || chainNode.url!;
  const contestBalance = await getContestBalance(
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

        <p style={{ fontSize: '32px' }}>{contest_address}</p>
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
        action="post"
        target={`${contest_address}/viewLeaderboard?fromMain=true`}
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
