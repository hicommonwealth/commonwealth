import { schemas } from '@hicommonwealth/core';
import { z } from 'zod';

const now = new Date();

const mockedContests: Array<z.infer<typeof schemas.queries.ContestResults>> = [
  {
    contest_address: '0x502607Eb8152E30Ac46902C898DBCaDC1508a9a5',
    community_id: 'basemas',
    name: 'contest name',
    image_url:
      'https://ethereum.org/_next/image/?url=%2F_next%2Fstatic%2Fmedia%2Fcommunity-hero.89b5ba2f.png&w=1920&q=75',
    funding_token_address: '0x502607Eb8152E30Ac46902C898DBCaDC1508a9a5',
    prize_percentage: null,
    payout_structure: [80, 20],
    ticker: 'ETH',
    decimals: 18,
    interval: 0,
    created_at: new Date(),
    cancelled: false,
    topics: [
      { id: 4423, name: 'General' },
      { id: 4425, name: 'bitcoin' },
      { id: 4426, name: 'ethereum' },
      { id: 4427, name: 'polkadot' },
    ],
    contests: [
      {
        contest_id: 1,
        start_time: new Date(),
        end_time: new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000),
        winners: [
          { creator_address: 'a1', prize: 0.3 },
          { creator_address: 'a2', prize: 0.1 },
        ],
        actions: [],
      },
    ],
  },
  {
    contest_address: '0x105607Eb8152E30Ac46902C898DBCaDC1508a9a5',
    community_id: 'basemas',
    name: 'contest name 2',
    image_url: '',
    funding_token_address: null,
    prize_percentage: 20,
    payout_structure: [60, 30, 10],
    ticker: 'ETH',
    decimals: 18,
    interval: 1,
    created_at: new Date(),
    cancelled: false,
    topics: [{ id: 4425, name: 'bitcoin' }],
    contests: [
      {
        contest_id: 2,
        start_time: new Date(),
        end_time: new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000),
        winners: [
          { creator_address: 'a1', prize: 1 },
          { creator_address: 'a2', prize: 2 },
        ],
        actions: [],
      },
      {
        contest_id: 3,
        start_time: new Date(),
        end_time: new Date(now.getTime() + 6 * 24 * 60 * 60 * 1000),
        winners: [
          { creator_address: 'a1', prize: 1 },
          { creator_address: 'a2', prize: 2 },
          { creator_address: 'a3', prize: 3 },
        ],
        actions: [],
      },
    ],
  },
  {
    contest_address: '0x107607Eb8152E30Ac46902C898DBCaDC1508a9a5',
    community_id: 'basemas',
    name: 'contest name 3',
    image_url: '',
    funding_token_address: '0x502607Eb8152E30Ac46902C898DBCaDC1508a9a5',
    prize_percentage: null,
    payout_structure: [50, 30, 20],
    ticker: 'ETH',
    decimals: 18,
    interval: 0,
    created_at: new Date(),
    cancelled: false,
    topics: [
      { id: 4425, name: 'bitcoin' },
      { id: 4426, name: 'ethereum' },
    ],
    contests: [
      {
        contest_id: 4,
        start_time: new Date(),
        end_time: new Date(now.getTime() + 59 * 60 * 1000),
        winners: [
          { creator_address: 'a1', prize: 0.9 },
          { creator_address: 'a2', prize: 0.11 },
        ],
        actions: [],
      },
    ],
  },
  {
    contest_address: '0x109607Eb8152E30Ac46902C898DBCaDC1508a9a5',
    community_id: 'basemas',
    name: 'contest name 4',
    image_url: '',
    funding_token_address: '0x502607Eb8152E30Ac46902C898DBCaDC1508a9a5',
    prize_percentage: null,
    payout_structure: [50, 30, 20],
    ticker: 'ETH',
    decimals: 18,
    interval: 0,
    created_at: new Date(),
    cancelled: true,
    topics: [
      { id: 4425, name: 'bitcoin' },
      { id: 4426, name: 'ethereum' },
    ],
    contests: [
      {
        contest_id: 5,
        start_time: new Date(),
        end_time: new Date(now.getTime() - 59 * 60 * 1000),
        winners: [
          { creator_address: 'a1', prize: 2 },
          { creator_address: 'a2', prize: 1 },
        ],
        actions: [],
      },
    ],
  },
];

export default mockedContests;
