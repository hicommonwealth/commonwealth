import { Codec } from '@polkadot/types/types';
import { ApiPromise, WsProvider } from '@polkadot/api';
import { TypeRegistry } from '@polkadot/types';
import { Event } from '@polkadot/types/interfaces';

import * as edgewareDefinitions from 'edgeware-node-types/dist/definitions';

import { SubstrateEventType } from './types';

export async function constructSubstrateApiPromise(url: string): Promise<ApiPromise> {
  const registry = new TypeRegistry();
  const edgewareTypes = Object.values(edgewareDefinitions)
    .map((v) => v.default)
    .reduce((res, { types }): object => ({ ...res, ...types }), {});
  return ApiPromise.create({
    provider : new WsProvider(url),
    types: { ...edgewareTypes },
    registry,
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
        default: return null;
      }
    case 'democracy':
      switch (event.method) {
        case 'Proposed': return SubstrateEventType.DemocracyProposed;
        case 'Started': return SubstrateEventType.DemocracyStarted;
        case 'Passed': return SubstrateEventType.DemocracyPassed;
        case 'NotPassed': return SubstrateEventType.DemocracyNotPassed;
        case 'Cancelled': return SubstrateEventType.DemocracyCancelled;
        default: return null;
      }
    default:
      return null;
  }
}
