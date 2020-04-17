import { ApiPromise, WsProvider } from '@polkadot/api';
import { TypeRegistry } from '@polkadot/types';

import * as edgewareDefinitions from 'edgeware-node-types/dist/definitions';

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
    types: {
      ...edgewareTypes,
      'voting::VoteType': 'VoteType',
      'voting::TallyType': 'TallyType',
      // chain-specific overrides
      Address: 'GenericAddress',
      Keys: 'SessionKeys4',
      StakingLedger: 'StakingLedgerTo223',
      Votes: 'VotesTo230',
      ReferendumInfo: 'ReferendumInfoTo239',
    },
    registry
  });
}
