import { commonProtocol, models } from '@hicommonwealth/model';
import { Button } from 'frames.js/express';
import moment from 'moment';
import React from 'react';
import { frames } from '../../config';
import { FrameLayout } from '../../utils';

const PrizeRow = ({
  index,
  prize,
  ticker = 'ETH',
}: {
  index: number;
  prize: number;
  ticker?: string;
}) => {
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
        {ticker} {prize}
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
      <FrameLayout header="Current Prizes">
        {prizes.length ? (
          prizes.map((prize, index) => (
            <PrizeRow
              key={index}
              index={index}
              prize={prize}
              ticker={contestManager.ticker}
            />
          ))
        ) : (
          <p style={{ fontSize: '32px' }}>Contest has no prizes yet.</p>
        )}{' '}
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
