import { EventNames } from '@hicommonwealth/core';
import ethers from 'ethers';
import { describe, expect, test } from 'vitest';
import {
  ContestContentAdded,
  ContestContentUpvoted,
  ContestStarted,
  OneOffContestManagerDeployed,
  RecurringContestManagerDeployed,
} from '../../src/integration/events.schemas';
import { parseEvmEventToContestEvent } from '../../src/integration/events.utils';

const contestAddress = '0x888';

describe('parseEvmEventToContestEvent', () => {
  test('should map NewContest chain event to RecurringContestManagerDeployed outbox shape', () => {
    const { event_name, event_payload } = parseEvmEventToContestEvent(
      'NewContest',
      null,
      [
        '0x1', // contest
        '0x2', // namespace
        ethers.BigNumber.from(7), // interval
        false, // oneOff
      ],
    );
    expect(event_name).to.eq(EventNames.RecurringContestManagerDeployed);
    const parsedEvent = RecurringContestManagerDeployed.parse(event_payload);
    console.debug(parsedEvent);
    expect(parsedEvent.contest_address).to.eq('0x1');
    expect(parsedEvent.namespace).to.eq('0x2');
    expect(parsedEvent.interval).to.eq(7); // prop of RecurringContestManagerDeployed
  });

  test('should map NewContest chain event to OneOffContestManagerDeployed outbox shape', () => {
    const { event_name, event_payload } = parseEvmEventToContestEvent(
      'NewContest',
      null,
      [
        '0x1', // contest
        '0x2', // namespace
        ethers.BigNumber.from(7), // interval is same as length
        true, // oneOff
      ],
    );
    expect(event_name).to.eq(EventNames.OneOffContestManagerDeployed);
    const parsedEvent = OneOffContestManagerDeployed.parse(event_payload);
    console.debug(parsedEvent);
    expect(parsedEvent.contest_address).to.eq('0x1');
    expect(parsedEvent.namespace).to.eq('0x2');
    expect(parsedEvent.length).to.eq(7);
  });

  test('should map NewRecurringContestStarted raw evm result to ContestStarted outbox shape', () => {
    const { event_name, event_payload } = parseEvmEventToContestEvent(
      'NewRecurringContestStarted',
      contestAddress,
      [
        ethers.BigNumber.from(8), // contestId
        ethers.BigNumber.from(1000), // startTime
        ethers.BigNumber.from(1001), // endTime
      ],
    );
    expect(event_name).to.eq(EventNames.ContestStarted);
    const parsedEvent = ContestStarted.parse(event_payload);
    console.debug(parsedEvent);
    expect(parsedEvent.contest_address).to.eq(contestAddress);
    expect(parsedEvent.contest_id).to.eq(8);
    expect(parsedEvent.start_time.getTime()).to.eq(
      new Date(1000 * 1000).getTime(),
    );
    expect(parsedEvent.end_time.getTime()).to.eq(
      new Date(1001 * 1000).getTime(),
    );
  });

  test('should map ContentAdded raw evm result to ContestContentAdded outbox shape', () => {
    const { event_name, event_payload } = parseEvmEventToContestEvent(
      'ContentAdded',
      contestAddress,
      [
        ethers.BigNumber.from(9), // contentId
        '0x1', // creator
        '/threads/1', // url
      ],
    );
    expect(event_name).to.eq(EventNames.ContestContentAdded);
    const parsedEvent = ContestContentAdded.parse(event_payload);
    console.debug(parsedEvent);
    expect(parsedEvent.contest_address).to.eq(contestAddress);
    expect(parsedEvent.content_id).to.eq(9);
    expect(parsedEvent.creator_address).to.eq('0x1');
    expect(parsedEvent.content_url).to.eq('/threads/1');
  });

  test('should map VoterVotedRecurring raw evm result to ContestContentUpvoted outbox shape', () => {
    const { event_name, event_payload } = parseEvmEventToContestEvent(
      'VoterVotedRecurring',
      contestAddress,
      [
        '0x2', // voterAddress
        ethers.BigNumber.from(10), // contentId
        ethers.BigNumber.from(888), // contestId
        ethers.BigNumber.from(9000), // votingPower
      ],
    );
    expect(event_name).to.eq(EventNames.ContestContentUpvoted);
    const parsedEvent = ContestContentUpvoted.parse(event_payload);
    console.debug(parsedEvent);
    expect(parsedEvent.contest_address).to.eq(contestAddress);
    expect(parsedEvent.content_id).to.eq(10);
    expect(parsedEvent.contest_id).to.eq(888);
    expect(parsedEvent.voter_address).to.eq('0x2');
    expect(parsedEvent.voting_power).to.eq('9000');
  });

  test('should map VoterVotedOneOff raw evm result to ContestContentUpvoted outbox shape', () => {
    const { event_name, event_payload } = parseEvmEventToContestEvent(
      'VoterVotedOneOff',
      contestAddress,
      [
        '0x2', // voterAddress
        ethers.BigNumber.from(10), // contentId
        ethers.BigNumber.from(9000), // votingPower
      ],
    );
    expect(event_name).to.eq(EventNames.ContestContentUpvoted);
    const parsedEvent = ContestContentUpvoted.parse(event_payload);
    console.debug(parsedEvent);
    expect(parsedEvent.contest_address).to.eq(contestAddress);
    expect(parsedEvent.content_id).to.eq(10);
    expect(parsedEvent.voter_address).to.eq('0x2');
    expect(parsedEvent.voting_power).to.eq('9000');
  });

  test('should throw if the wrong number of args are used outbox shape', () => {
    expect(() => {
      parseEvmEventToContestEvent('VoterVotedRecurring', contestAddress, [
        '0x2', // voterAddress
      ]);
    }).to.throw('evm parsed args does not match signature');
  });
});
