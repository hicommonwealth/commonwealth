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

export const commonLogo = (
  <div
    style={{
      display: 'flex',
      width: '100%',
      height: '100%',
    }}
  >
    <svg
      width="100"
      height="100"
      viewBox="0 0 323 314"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <g clipPath="url(#clip0_3131_148)">
        <path
          // eslint-disable-next-line max-len
          d="M225.238 305.854C278.71 305.854 322.058 262.507 322.058 209.034C322.058 155.562 278.71 112.214 225.238 112.214C171.765 112.214 128.417 155.562 128.417 209.034C128.417 262.507 171.765 305.854 225.238 305.854Z"
          fill="#FF80D7"
        />
        <path
          // eslint-disable-next-line max-len
          d="M161.031 193.64C214.503 193.64 257.851 150.292 257.851 96.8201C257.851 43.3478 214.503 0 161.031 0C107.558 0 64.2107 43.3478 64.2107 96.8201C64.2107 150.292 107.558 193.64 161.031 193.64Z"
          fill="#0279CC"
        />
        <path
          // eslint-disable-next-line max-len
          d="M96.8201 305.854C150.292 305.854 193.64 262.507 193.64 209.034C193.64 155.562 150.292 112.214 96.8201 112.214C43.3478 112.214 0 155.562 0 209.034C0 262.507 43.3478 305.854 96.8201 305.854Z"
          fill="#FF1F02"
        />
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          // eslint-disable-next-line max-len
          d="M161.029 281.504C181.032 263.766 193.639 237.873 193.639 209.036C193.639 180.198 181.032 154.306 161.029 136.569C141.025 154.306 128.417 180.198 128.417 209.036C128.417 237.873 141.025 263.766 161.029 281.504Z"
          fill="#EF0000"
        />
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          // eslint-disable-next-line max-len
          d="M255.721 117.11C246.395 160.841 207.543 193.639 161.03 193.639C150.38 193.639 140.133 191.92 130.549 188.744C139.875 145.013 178.726 112.214 225.239 112.214C235.889 112.214 246.137 113.934 255.721 117.11Z"
          fill="#2D40AA"
        />
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          // eslint-disable-next-line max-len
          d="M66.3376 117.11C75.9215 113.934 86.1695 112.214 96.8189 112.214C143.332 112.214 182.183 145.013 191.509 188.744C181.925 191.92 171.678 193.639 161.028 193.639C114.515 193.639 75.6631 160.841 66.3376 117.11Z"
          fill="#331B1D"
        />
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          // eslint-disable-next-line max-len
          d="M161.03 136.569C176.206 150.025 187.125 168.176 191.512 188.745C181.928 191.922 171.68 193.64 161.03 193.64C150.38 193.64 140.133 191.922 130.549 188.745C134.935 168.176 145.854 150.025 161.03 136.569Z"
          fill="#310D18"
        />
      </g>
      <defs>
        <clipPath id="clip0_3131_148">
          <rect width="322.667" height="313.946" fill="white" />
        </clipPath>
      </defs>
    </svg>
  </div>
);
