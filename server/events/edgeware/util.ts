import { Codec } from '@polkadot/types/types';
import { ApiPromise, WsProvider } from '@polkadot/api';
import { TypeRegistry } from '@polkadot/types';

import * as edgewareDefinitions from 'edgeware-node-types/dist/definitions';

import { SubstrateConnectionOptions } from './types';

export function constructSubstrateApiPromise(
  connectionOptions: SubstrateConnectionOptions,
): Promise<ApiPromise> {
  const registry = new TypeRegistry();
  const edgewareTypes = Object.values(edgewareDefinitions)
    .reduce((res, { types }): object => ({ ...res, ...types }), {});
  return ApiPromise.create({
    provider : new WsProvider(connectionOptions.url),
    types: { ...edgewareTypes },
    registry,
  });
}

export function decodeSubstrateType<T extends Codec>(d: T) {
  // TODO: convert codec types into "regular" types
  return d;
}
