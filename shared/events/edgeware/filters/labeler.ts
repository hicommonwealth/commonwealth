import BN from 'bn.js';

import { SubstrateBalanceString, SubstrateEventKind } from '../types';
import { IEventLabel, IChainEventData, LabelerFilter } from '../../interfaces';
import { SubstrateCoin } from '../../../adapters/chain/substrate/types';

function fmtAddr(addr : string) {
  if (!addr) return;
  if (addr.length < 16) return addr;
  return `${addr.slice(0, 5)}…${addr.slice(addr.length - 3)}`;
}

// ideally we shouldn't hard-code this stuff, but we need the header to appear before the chain loads
const EDG_DECIMAL = 18;

const edgBalanceFormatter = (chain, balance: SubstrateBalanceString): string => {
  const denom = chain === 'edgeware'
    ? 'EDG'
    : chain === 'edgeware-local' || chain === 'edgeware-testnet'
      ? 'tEDG' : null;
  if (!denom) {
    throw new Error('unexpected chain');
  }
  const dollar = (new BN(10)).pow(new BN(EDG_DECIMAL));
  const coin = new SubstrateCoin(denom, new BN(balance, 10), dollar);
  return coin.format(true);
};

/* eslint-disable max-len */
/**
 * This a labeler function, which takes event data and describes it in "plain english",
 * such that we can display a notification regarding its contents.
 */
const labelerFunc: LabelerFilter = (
  blockNumber: number,
  chainId: string,
  version: string,
  data: IChainEventData,
): IEventLabel => {
  const balanceFormatter = (bal) => edgBalanceFormatter(chainId, bal);
  switch (data.kind) {
    /**
     * Staking Events
     */
    case SubstrateEventKind.Slash: {
      const { validator, amount } = data;
      return {
        heading: 'Validator Slashed',
        label: `Validator ${fmtAddr(validator)} was slashed by amount ${balanceFormatter(amount)}.`,
      };
    }
    case SubstrateEventKind.Reward: {
      const { amount } = data;
      return {
        heading: 'Validator Rewarded',
        label: data.validator
          ? `Validator ${fmtAddr(data.validator)} was rewarded by amount ${balanceFormatter(amount)}.`
          : `All validators were rewarded by amount ${balanceFormatter(amount)}.`,
      };
    }
    case SubstrateEventKind.Bonded: {
      const { stash, controller, amount } = data;
      return {
        heading: 'Bonded',
        label: `You bonded ${balanceFormatter(amount)} from controller ${fmtAddr(controller)} to stash ${fmtAddr(stash)}.`,
      };
    }
    case SubstrateEventKind.Unbonded: {
      const { stash, controller, amount } = data;
      return {
        heading: 'Bonded',
        label: `You unbonded ${balanceFormatter(amount)} from controller ${fmtAddr(controller)} to stash ${fmtAddr(stash)}.`,
      };
    }

    /**
     * Democracy Events
     */
    case SubstrateEventKind.VoteDelegated: {
      const { who, target } = data;
      return {
        heading: 'Vote Delegated',
        label: `Your account ${fmtAddr(target)} received a voting delegation from ${fmtAddr(who)}.`
      };
    }
    case SubstrateEventKind.DemocracyProposed: {
      const { deposit, proposalIndex } = data;
      return {
        heading: 'Democracy Proposal Created',
        label: `A new Democracy proposal was introduced with deposit ${balanceFormatter(deposit)}.`,
        linkUrl: chainId ? `/${chainId}/proposal/democracyproposal/${proposalIndex}` : null,
      };
    }
    case SubstrateEventKind.DemocracyStarted: {
      const { endBlock, referendumIndex } = data;
      return {
        heading: 'Democracy Referendum Started',
        label: endBlock
          ? `Referendum ${referendumIndex} launched, and will be voting until block ${endBlock}.`
          : `Referendum ${referendumIndex} launched.`,
        linkUrl: chainId ? `/${chainId}/proposal/referendum/${referendumIndex}` : null,
      };
    }
    case SubstrateEventKind.DemocracyPassed: {
      const { dispatchBlock, referendumIndex } = data;
      return {
        heading: 'Democracy Referendum Passed',
        label: dispatchBlock
          ? `Referendum ${referendumIndex} passed and will be dispatched on block ${dispatchBlock}.`
          : `Referendum ${referendumIndex} passed was dispatched on block ${blockNumber}.`,
      };
    }
    case SubstrateEventKind.DemocracyNotPassed: {
      const { referendumIndex } = data;
      return {
        heading: 'Democracy Referendum Failed',
        // TODO: include final tally?
        label: `Referendum ${referendumIndex} has failed.`,
      };
    }
    case SubstrateEventKind.DemocracyCancelled: {
      const { referendumIndex } = data;
      return {
        heading: 'Democracy Referendum Cancelled',
        // TODO: include cancellation vote?
        label: `Referendum ${referendumIndex} was cancelled.`,
      };
    }
    case SubstrateEventKind.DemocracyExecuted: {
      const { referendumIndex, executionOk } = data;
      return {
        heading: 'Democracy Referendum Executed',
        label: `Referendum ${referendumIndex} was executed ${executionOk ? 'successfully' : 'unsuccessfully'}.`,
      };
    }

    /**
     * Preimage Events
     */

    /**
     * Treasury Events
     */
    case SubstrateEventKind.TreasuryProposed: {
      const { proposalIndex, proposer, value } = data;
      return {
        heading: 'Treasury Proposal Created',
        label: `Treasury proposal ${proposalIndex} was introduced by ${fmtAddr(proposer)} for ${balanceFormatter(value)}.`,
        linkUrl: chainId ? `/${chainId}/proposal/treasuryproposal/${proposalIndex}` : null,
      };
    }
    case SubstrateEventKind.TreasuryAwarded: {
      const { proposalIndex, value, beneficiary } = data;
      return {
        heading: 'Treasury Proposal Awarded',
        label: `Treasury proposal ${proposalIndex} of ${balanceFormatter(value)} was awarded to ${fmtAddr(beneficiary)}.`,
      };
    }
    case SubstrateEventKind.TreasuryRejected: {
      const { proposalIndex } = data;
      return {
        heading: 'Treasury Proposal Rejected',
        label: `Treasury proposal ${proposalIndex} was rejected.`,
      };
    }

    /**
     * Elections Events
     */

    /**
     * Collective Events
     */

    /**
     * Signaling Events
     */
    default: {
      // ensure exhaustive matching -- gives ts error if missing cases
      const _exhaustiveMatch: never = data.kind;
      throw new Error('unknown event type');
    }
  }
};

export default labelerFunc;
