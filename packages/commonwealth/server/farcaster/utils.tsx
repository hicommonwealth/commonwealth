import { Actor, query } from '@hicommonwealth/core';
import { Contest, config } from '@hicommonwealth/model';
import { NeynarAPIClient } from '@neynar/nodejs-sdk';
import React from 'react';

export const circleCheckIcon = (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="100"
    height="100"
    fill="#9ac54f"
    viewBox="0 0 256 256"
  >
    {/* eslint-disable-next-line max-len */}
    <path d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm45.66,85.66-56,56a8,8,0,0,1-11.32,0l-24-24a8,8,0,0,1,11.32-11.32L112,148.69l50.34-50.35a8,8,0,0,1,11.32,11.32Z"></path>
  </svg>
);

export const circleXIcon = (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="100"
    height="100"
    fill="#ff521d"
    viewBox="0 0 256 256"
  >
    {/* eslint-disable-next-line max-len */}
    <path d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm37.66,130.34a8,8,0,0,1-11.32,11.32L128,139.31l-26.34,26.35a8,8,0,0,1-11.32-11.32L116.69,128,90.34,101.66a8,8,0,0,1,11.32-11.32L128,116.69l26.34-26.35a8,8,0,0,1,11.32,11.32L139.31,128Z"></path>
  </svg>
);

export const getFarcasterUser = async (fid: number) => {
  const client = new NeynarAPIClient(config.CONTESTS.NEYNAR_API_KEY!);
  const farcasterUser = await client.fetchBulkUsers([fid]);
  return farcasterUser.users.at(0);
};

export const getContestManagerScores = async (contest_address: string) => {
  const actor: Actor = { user: { email: '' } };
  const results = await query(Contest.GetAllContests(), {
    actor,
    payload: { contest_address },
  });

  if (!results?.length) {
    throw new Error('contest manager not found');
  }

  const contestManager = results[0];

  const prizes =
    contestManager.contests[0].score?.map(
      (score) => Number(score.prize) / 10 ** contestManager.decimals,
    ) || [];

  return { contestManager, prizes };
};
