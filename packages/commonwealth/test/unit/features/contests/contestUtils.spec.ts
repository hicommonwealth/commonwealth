import type { Contest } from 'features/contests/types/contest';
import {
  getActiveContests,
  isContestActive,
  partitionContestsByStatus,
} from 'features/contests/utils/contestUtils';
import { describe, expect, test } from 'vitest';

const makeContest = (
  overrides: Partial<Contest> = {},
  endTimes: Array<string | undefined> = [],
): Contest => ({
  community_id: overrides.community_id || 'test-community',
  contest_address: overrides.contest_address || '0xcontest',
  is_farcaster_contest: overrides.is_farcaster_contest || false,
  interval: overrides.interval || 0,
  name: overrides.name || 'Contest',
  payout_structure: overrides.payout_structure || [100],
  topics: overrides.topics || [],
  cancelled: overrides.cancelled || false,
  contests:
    overrides.contests ||
    endTimes.map((end_time, index) => ({
      contest_id: index + 1,
      end_time: end_time ? (new Date(end_time) as unknown as Date) : undefined,
      score: [{ prize: '0' }],
    })),
  ...overrides,
});

describe('contestUtils', () => {
  test('isContestActive returns true only for non-cancelled contests with a future end time', () => {
    const activeContest = makeContest({}, ['2999-01-01T00:00:00.000Z']);
    const finishedContest = makeContest({}, ['2000-01-01T00:00:00.000Z']);
    const cancelledContest = makeContest({ cancelled: true }, [
      '2999-01-01T00:00:00.000Z',
    ]);

    expect(isContestActive({ contest: activeContest })).toBe(true);
    expect(isContestActive({ contest: finishedContest })).toBe(false);
    expect(isContestActive({ contest: cancelledContest })).toBe(false);
  });

  test('partitionContestsByStatus splits contests and sorts runs using existing rules', () => {
    const contests = [
      makeContest(
        {
          contest_address: '0x1',
        },
        [
          '2999-01-02T00:00:00.000Z',
          '2999-01-01T00:00:00.000Z',
          '2000-01-01T00:00:00.000Z',
        ],
      ),
      makeContest(
        {
          contest_address: '0x2',
        },
        ['2000-01-03T00:00:00.000Z', '2000-01-04T00:00:00.000Z'],
      ),
    ];
    contests[0].contests![0].score = [{ prize: '5' }];
    contests[0].contests![1].score = [{ prize: '20' }];

    const { activeContests, finishedContests } =
      partitionContestsByStatus(contests);

    expect(activeContests).toHaveLength(1);
    expect(activeContests[0].contest_address).toBe('0x1');
    expect(
      activeContests[0].contests?.map((contest) => contest.end_time),
    ).toEqual([
      new Date('2999-01-01T00:00:00.000Z'),
      new Date('2999-01-02T00:00:00.000Z'),
    ]);

    expect(finishedContests).toHaveLength(2);
    expect(
      finishedContests.find((contest) => contest.contest_address === '0x1')
        ?.contests?.[0]?.end_time,
    ).toEqual(new Date('2000-01-01T00:00:00.000Z'));
    expect(
      finishedContests
        .find((contest) => contest.contest_address === '0x2')
        ?.contests?.map((contest) => contest.end_time),
    ).toEqual([
      new Date('2000-01-04T00:00:00.000Z'),
      new Date('2000-01-03T00:00:00.000Z'),
    ]);
  });

  test('getActiveContests keeps only active contest runs', () => {
    const contests = [
      makeContest(
        {
          contest_address: '0x1',
        },
        ['2999-01-01T00:00:00.000Z', '2000-01-01T00:00:00.000Z'],
      ),
      makeContest(
        {
          contest_address: '0x2',
        },
        ['2000-01-02T00:00:00.000Z'],
      ),
    ];

    const activeContests = getActiveContests(contests);

    expect(activeContests).toHaveLength(1);
    expect(activeContests[0].contest_address).toBe('0x1');
    expect(activeContests[0].contests).toHaveLength(1);
    expect(activeContests[0].contests?.[0]?.end_time).toEqual(
      new Date('2999-01-01T00:00:00.000Z'),
    );
  });
});
