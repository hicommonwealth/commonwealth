import { expect } from 'chai';
import ethers from 'ethers';
import { z } from 'zod';
import {
  OneOffContestManagerDeployed,
  RecurringContestManagerDeployed,
} from '../../src/integration/events.schemas';
import { parseEvmEventToContestEvent } from '../../src/integration/events.utils';

const timestamp = new Date();
const contestAddress = '0x888';

describe('parseEvmEventToContestEvent', () => {
  it('should map NewContest chain event to RecurringContestManagerDeployed', () => {
    const result = parseEvmEventToContestEvent('NewContest', null, timestamp, [
      '0x1', // contest
      '0x2', // namespace
      ethers.BigNumber.from(7), // interval
      false, // oneOff
    ]) as z.infer<typeof RecurringContestManagerDeployed>;
    console.debug(result);
    expect(result.created_at).to.eq(timestamp);
    expect(result.contest_address).to.eq('0x1');
    expect(result.namespace).to.eq('0x2');
    expect(result.interval).to.eq(7);
  });

  it('should map NewContest chain event to OneOffContestManagerDeployed', () => {
    const result = parseEvmEventToContestEvent('NewContest', null, timestamp, [
      '0x1', // contest
      '0x2', // namespace
      ethers.BigNumber.from(7), // interval is same as length
      true, // oneOff
    ]) as z.infer<typeof OneOffContestManagerDeployed>;
    console.debug(result);
    expect(result.created_at).to.eq(timestamp);
    expect(result.contest_address).to.eq('0x1');
    expect(result.namespace).to.eq('0x2');
    expect(result.length).to.eq(7);
  });

  it('should map NewRecurringContestStarted raw evm result to ContestStarted', () => {
    const result = parseEvmEventToContestEvent(
      'NewRecurringContestStarted',
      contestAddress,
      timestamp,
      [
        ethers.BigNumber.from(8), // contestId
        ethers.BigNumber.from(1000), // startTime
        ethers.BigNumber.from(1001), // endTime
      ],
    );
    console.debug(result);
    expect(result.created_at).to.eq(timestamp);
    expect(result.contest_address).to.eq(contestAddress);
    expect(result.contest_id).to.eq(8);
    expect(result.start_time.getTime()).to.eq(new Date(1000 * 1000).getTime());
    expect(result.end_time.getTime()).to.eq(new Date(1001 * 1000).getTime());
  });

  it('should map NewSingleContestStarted raw evm result to ContestStarted', () => {
    const result = parseEvmEventToContestEvent(
      'NewSingleContestStarted',
      contestAddress,
      timestamp,
      [
        ethers.BigNumber.from(2000), // startTime
        ethers.BigNumber.from(2001), // endTime
      ],
    );
    console.debug(result);
    expect(result.created_at).to.eq(timestamp);
    expect(result.contest_address).to.eq(contestAddress);
    expect(result.contest_id).to.eq(0); // single == 0
    expect(result.start_time.getTime()).to.eq(new Date(2000 * 1000).getTime());
    expect(result.end_time.getTime()).to.eq(new Date(2001 * 1000).getTime());
  });

  it('should map ContentAdded raw evm result to ContestContentAdded', () => {
    const result = parseEvmEventToContestEvent(
      'ContentAdded',
      contestAddress,
      timestamp,
      [
        ethers.BigNumber.from(9), // contentId
        '0x1', // creator
        '/threads/1', // url
      ],
    );
    console.debug(result);
    expect(result.created_at).to.eq(timestamp);
    expect(result.contest_address).to.eq(contestAddress);
    expect(result.content_id).to.eq(9);
    expect(result.creator_address).to.eq('0x1');
    expect(result.content_url).to.eq('/threads/1');
  });

  it('should map VoterVoted raw evm result to ContestContentUpvoted', () => {
    const result = parseEvmEventToContestEvent(
      'VoterVoted',
      contestAddress,
      timestamp,
      [
        '0x2', // voterAddress
        ethers.BigNumber.from(10), // contentId
        ethers.BigNumber.from(9000), // votingPower
      ],
    );
    console.debug(result);
    expect(result.created_at).to.eq(timestamp);
    expect(result.contest_address).to.eq(contestAddress);
    expect(result.content_id).to.eq(10);
    expect(result.voter_address).to.eq('0x2');
    expect(result.voting_power).to.eq(9000);
  });
});
