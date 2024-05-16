import { expect } from 'chai';
import ethers from 'ethers';
import { parseEvmEventToContestEvent } from '../../src/integration/events.utils';

describe('parseEvmEventToContestEvent', () => {
  it('should map NewContest chain event to RecurringContestManagerDeployed', () => {
    const result = parseEvmEventToContestEvent('NewContest', [
      '0x1', // contest
      '0x2', // namespace
      ethers.BigNumber.from(7), // interval
      false, // oneOff
    ]);
    console.debug(result);
    expect(result.contest_address).to.eq('0x1');
    expect(result.namespace).to.eq('0x2');
    expect(result.interval).to.eq(7);
  });

  it('should map NewContest chain event to OneOffContestManagerDeployed', () => {
    const result = parseEvmEventToContestEvent('NewContest', [
      '0x1', // contest
      '0x2', // namespace
      ethers.BigNumber.from(7), // interval/length?
      true, // oneOff
    ]);
    console.debug(result);
    expect(result.contest_address).to.eq('0x1');
    expect(result.namespace).to.eq('0x2');
    expect(result.length).to.eq(7);
  });

  it('should map NewRecurringContestStarted raw evm result to ContestStarted', () => {
    const result = parseEvmEventToContestEvent('NewRecurringContestStarted', [
      ethers.BigNumber.from(8), // contestId
      ethers.BigNumber.from(1000), // startTime
      ethers.BigNumber.from(1001), // endTime
    ]);
    console.debug(result);
    expect(result.contest_address).to.eq('');
    expect(result.contest_id).to.eq(8);
    expect(result.start_time.getTime()).to.eq(new Date(1000).getTime());
    expect(result.end_time.getTime()).to.eq(new Date(1001).getTime());
  });

  it('should map NewSingleContestStarted raw evm result to ContestStarted', () => {
    const result = parseEvmEventToContestEvent('NewSingleContestStarted', [
      ethers.BigNumber.from(2000), // startTime
      ethers.BigNumber.from(2001), // endTime
    ]);
    console.debug(result);
    expect(result.start_time.getTime()).to.eq(new Date(2000).getTime());
    expect(result.end_time.getTime()).to.eq(new Date(2001).getTime());
  });

  it('should map ContentAdded raw evm result to ContestContentAdded', () => {
    const result = parseEvmEventToContestEvent('ContentAdded', [
      ethers.BigNumber.from(9), // contentId
      '0x1', // creator
      '/threads/1', // url
    ]);
    console.debug(result);
    expect(result.content_id).to.eq(9);
    expect(result.creator_address).to.eq('0x1');
    expect(result.content_url).to.eq('/threads/1');
  });

  it('should map VoterVoted raw evm result to ContestContentUpvoted', () => {
    const result = parseEvmEventToContestEvent('VoterVoted', [
      '0x2', // voterAddress
      ethers.BigNumber.from(10), // contentId
      ethers.BigNumber.from(9000), // votingPower
    ]);
    console.debug(result);
    expect(result.content_id).to.eq(10);
    expect(result.voter_address).to.eq('0x2');
    expect(result.voting_power).to.eq(9000);
  });

  it('should map PrizeShareUpdated raw evm result to ContestWinnerRecorded', () => {
    const result = parseEvmEventToContestEvent('PrizeShareUpdated', [
      ethers.BigNumber.from(17), // newPrizeShare
    ]);
    console.debug(result);
    expect(result).to.deep.include({
      winners: [{ creator_address: '', prize: 17 }],
    });
  });
});
