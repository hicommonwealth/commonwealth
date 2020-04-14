import { Codec } from '@polkadot/types/types';
import { ApiPromise, WsProvider } from '@polkadot/api';
import { TypeRegistry } from '@polkadot/types';
import { Event } from '@polkadot/types/interfaces';

import * as edgewareDefinitions from 'edgeware-node-types/dist/definitions';

import { SubstrateEventType } from './types';

/**
 * Attempts to open an API connection, retrying if it cannot be opened.
 * @param url websocket endpoing to connect to, including ws[s]:// and port
 * @returns a promise resolving to an ApiPromise once the connection has been established
 */
export function createApi(provider: WsProvider): ApiPromise {
  const registry = new TypeRegistry();
  const edgewareTypes = Object.values(edgewareDefinitions)
    .map((v) => v.default)
    .reduce((res, { types }): object => ({ ...res, ...types }), {});
  return new ApiPromise({
    provider,
    types: { ...edgewareTypes },
    registry
  });
}

export function decodeSubstrateCodec<T extends Codec>(d: T) {
  // TODO: convert codec types into "regular" types
  return d.toString();
}

export function parseEventType(event: Event): SubstrateEventType {
  switch (event.section) {
    case 'staking':
      switch (event.method) {
        case 'Slash': return SubstrateEventType.Slash;
        case 'Reward': return SubstrateEventType.Reward;
        default: return SubstrateEventType.Unknown;
      }
    case 'democracy':
      switch (event.method) {
        case 'Proposed': return SubstrateEventType.DemocracyProposed;
        case 'Started': return SubstrateEventType.DemocracyStarted;
        case 'Passed': return SubstrateEventType.DemocracyPassed;
        case 'NotPassed': return SubstrateEventType.DemocracyNotPassed;
        case 'Cancelled': return SubstrateEventType.DemocracyCancelled;
        default: return SubstrateEventType.Unknown;
      }
    case 'signaling':
      switch (event.method) {
        case 'NewProposal': return SubstrateEventType.NewSignalingProposal;
        default: return SubstrateEventType.Unknown;
      }
    default:
      return SubstrateEventType.Unknown;
  }
}
