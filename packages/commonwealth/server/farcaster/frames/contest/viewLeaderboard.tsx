import { error } from 'frames.js/core';
import { Button } from 'frames.js/express';
import React from 'react';
import { frames } from '../../config';
import { getInvertedColor, getLeaderboard, getRandomColor } from '../../utils';

const randomColor = getRandomColor();
const invertedColor = getInvertedColor(randomColor);

export const viewLeaderboard = frames(async (ctx) => {
  const fromMain = ctx.searchParams.fromMain;

  let leaderboardEntries;

  try {
    leaderboardEntries = await getLeaderboard();
  } catch (err) {
    console.log('error', err);
    return error('Something went wrong');
  }

  const noEntries = leaderboardEntries.length === 0;
  const entry = leaderboardEntries[0];

  const contest_address = ctx.url.pathname.split('/')[1];

  return {
    image: (
      <div
        style={{
          backgroundColor: '#2A2432',
          color: 'white',
          padding: '40px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          height: '100%',
          textAlign: 'center',
        }}
      >
        {noEntries ? (
          <p>No entries yet</p>
        ) : (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            <div
              style={{
                borderRadius: '50%',
                width: '100px',
                height: '100px',
                backgroundColor: `#${randomColor}`,
                color: `#${invertedColor}`,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                fontSize: '56px',
              }}
            >
              {entry.nickname.charAt(0).toUpperCase()}
            </div>

            <p
              style={{
                fontSize: '56px',
                marginBottom: '0px',
              }}
            >
              {entry.nickname}
            </p>

            <p style={{ fontSize: '32px', padding: '0 20%' }}>{entry.text}</p>
            <p style={{ fontSize: '24px' }}>{entry.likes} Likes</p>
          </div>
        )}
      </div>
    ),
    buttons: [
      ...(noEntries
        ? []
        : [
            ...(fromMain
              ? []
              : [
                  <Button
                    key="prev"
                    action="post"
                    target="/viewLeaderboard?prev"
                  >
                    ◀
                  </Button>,
                ]),
            <Button
              key="next"
              action="post"
              target={`/${contest_address}/viewLeaderboard?next`}
            >
              ▶
            </Button>,
          ]),
      <Button
        key="view-cast"
        action="post"
        target={`/${contest_address}/contestCard`}
      >
        View Cast
      </Button>,
    ],
  };
});
