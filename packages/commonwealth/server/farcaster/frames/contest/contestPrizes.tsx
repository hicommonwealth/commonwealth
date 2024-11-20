import { commonProtocol, models } from '@hicommonwealth/model';
import { Button } from 'frames.js/express';
import moment from 'moment';
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

export const contestPrizes = frames(async (ctx) => {
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
    contestBalance && contestBalance !== '0' && contestManager.payout_structure
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
        key="back"
        action="post"
        target={`/${contest_address}/contestCard`}
      >
        Back
      </Button>,
    ],
  };
});
