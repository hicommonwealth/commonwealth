import { SubstrateEventType } from '../types';

export interface IEventLabel {
  heading: string;
  label: string;
  linkUrl?: string;
}

export function labelEvent(blockNumber: number, type: SubstrateEventType, data: any): IEventLabel {
  switch (type) {
    case SubstrateEventType.Slash:
      return {
        heading: 'Validator Slashed',
        label: `Validator ${data.validator} was slashed by amount ${data.amount}.`,
      };
    case SubstrateEventType.Reward:
      return {
        heading: 'Validator Rewarded',
        label: `Validator ${data.validator} was rewarded by amount ${data.amount}.`,
      };
    case SubstrateEventType.DemocracyProposed:
      return {
        heading: 'Democracy Proposal Created',
        label: `A new Democracy proposal was introduced with deposit ${data.deposit}.`,
        linkUrl: null, // TODO
      };
    case SubstrateEventType.DemocracyStarted:
      return {
        heading: 'Democracy Referendum Started',
        label: `Referendum ${data.referendumIndex} has started, voting until block ${data.endBlock}.`,
        linkUrl: null, // TODO
      };
    case SubstrateEventType.DemocracyPassed:
      return {
        heading: 'Democracy Referendum Passed',
        label: data.dispatchBlock
          ? `Referendum ${data.referendumIndex} has passed and will be dispatched on block ${data.dispatchBlock}.`
          : `Referendum ${data.referendumIndex} has passed was dispatched on block ${blockNumber}`,
        linkUrl: null, // TODO ???
      };
    case SubstrateEventType.DemocracyNotPassed:
      return {
        heading: 'Democracy Referendum Failed',
        // TODO: include final tally?
        label: `Referendum ${data.referendumIndex} has failed.`,
        linkUrl: null, // will this exist?
      };
    case SubstrateEventType.DemocracyCancelled:
      return {
        heading: 'Democracy Referendum Cancelled',
        // TODO: include cancellation vote?
        label: `Referendum ${data.referendumIndex} was cancelled.`,
        linkUrl: null, // will this exist?
      };
    case SubstrateEventType.Unknown:
    default:
      throw new Error('unknown event type');
  }
}
