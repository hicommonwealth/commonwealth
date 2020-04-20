import { SubstrateBalanceString } from '../types';
import { IEventLabel, IChainEventData, LabelerFilter } from '../../interfaces';

function fmtAddr(addr : string) {
  if (!addr) return;
  if (addr.length < 16) return addr;
  return `${addr.slice(0, 5)}…${addr.slice(addr.length - 3)}`;
}

/* eslint-disable max-len */
const labelerFunc: LabelerFilter = (
  blockNumber: number,
  chainId: string,
  data: IChainEventData,
  balanceFormatter: (balance: SubstrateBalanceString) => string = (s) => s,
): IEventLabel => {
  switch (data.kind) {
    case 'slash': {
      const { validator, amount } = data;
      return {
        heading: 'Validator Slashed',
        label: `Validator ${fmtAddr(validator)} was slashed by amount ${balanceFormatter(amount)}.`,
      };
    }
    case 'reward': {
      const { validator, amount } = data;
      return {
        heading: 'Validator Rewarded',
        label: `Validator ${fmtAddr(validator)} was rewarded by amount ${balanceFormatter(amount)}.`,
      };
    }
    case 'bonded': {
      const { stash, controller, amount } = data;
      return {
        heading: 'Bonded',
        label: `You bonded ${balanceFormatter(amount)} from controller ${fmtAddr(controller)} to stash ${fmtAddr(stash)}.`,
      };
    }
    case 'unbonded': {
      const { stash, controller, amount } = data;
      return {
        heading: 'Bonded',
        label: `You unbonded ${balanceFormatter(amount)} from controller ${fmtAddr(controller)} to stash ${fmtAddr(stash)}.`,
      };
    }
    case 'vote-delegated': {
      const { who, target } = data;
      return {
        heading: 'Vote Delegated',
        label: `Your account ${fmtAddr(target)} received a voting delegation from ${fmtAddr(who)}.`
      };
    }
    case 'democracy-proposed': {
      const { deposit, proposalIndex } = data;
      return {
        heading: 'Democracy Proposal Created',
        label: `A new Democracy proposal was introduced with deposit ${balanceFormatter(deposit)}.`,
        linkUrl: chainId ? `/${chainId}/proposal/democracyproposal/${proposalIndex}` : null,
      };
    }
    case 'democracy-started': {
      const { endBlock, referendumIndex } = data;
      return {
        heading: 'Democracy Referendum Started',
        label: endBlock
          ? `Referendum ${referendumIndex} launched, and will be voting until block ${endBlock}.`
          : `Referendum ${referendumIndex} launched.`,
        linkUrl: chainId ? `/${chainId}/proposal/referendum/${referendumIndex}` : null,
      };
    }
    case 'democracy-passed': {
      const { dispatchBlock, referendumIndex } = data;
      return {
        heading: 'Democracy Referendum Passed',
        label: dispatchBlock
          ? `Referendum ${referendumIndex} passed and will be dispatched on block ${dispatchBlock}.`
          : `Referendum ${referendumIndex} passed was dispatched on block ${blockNumber}.`,
      };
    }
    case 'democracy-not-passed': {
      const { referendumIndex } = data;
      return {
        heading: 'Democracy Referendum Failed',
        // TODO: include final tally?
        label: `Referendum ${referendumIndex} has failed.`,
      };
    }
    case 'democracy-cancelled': {
      const { referendumIndex } = data;
      return {
        heading: 'Democracy Referendum Cancelled',
        // TODO: include cancellation vote?
        label: `Referendum ${referendumIndex} was cancelled.`,
      };
    }
    case 'democracy-executed': {
      const { referendumIndex, executionOk } = data;
      return {
        heading: 'Democracy Referendum Executed',
        label: `Referendum ${referendumIndex} was executed ${executionOk ? 'successfully' : 'unsuccessfully'}.`,
      };
    }
    case 'treasury-proposed': {
      const { proposalIndex, proposer, value } = data;
      return {
        heading: 'Treasury Proposal Created',
        label: `Treasury proposal ${proposalIndex} was introduced by ${fmtAddr(proposer)} for ${balanceFormatter(value)}.`,
        linkUrl: chainId ? `/${chainId}/proposal/treasuryproposal/${proposalIndex}` : null,
      };
    }
    case 'treasury-awarded': {
      const { proposalIndex, value, beneficiary } = data;
      return {
        heading: 'Treasury Proposal Awarded',
        label: `Treasury proposal ${proposalIndex} of ${balanceFormatter(value)} was awarded to ${fmtAddr(beneficiary)}.`,
      };
    }
    case 'treasury-rejected': {
      const { proposalIndex } = data;
      return {
        heading: 'Treasury Proposal Rejected',
        label: `Treasury proposal ${proposalIndex} was rejected.`,
      };
    }
    default: {
      throw new Error('unknown event type');
    }
  }
};

export default labelerFunc;
