import { Codec } from '@polkadot/types/types';
import { ApiPromise, WsProvider } from '@polkadot/api';
import { TypeRegistry } from '@polkadot/types';

import * as edgewareDefinitions from 'edgeware-node-types/dist/definitions';

export function constructSubstrateApiPromise(url: string): Promise<ApiPromise> {
  const registry = new TypeRegistry();
  const edgewareTypes = Object.values(edgewareDefinitions)
    .reduce((res, { types }): object => ({ ...res, ...types }), {});
  return ApiPromise.create({
    provider : new WsProvider(url),
    types: { ...edgewareTypes },
    registry,
  });
}

export function decodeSubstrateType<T extends Codec>(d: T) {
  // TODO: convert codec types into "regular" types
  return d;
}
