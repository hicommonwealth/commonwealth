import { BalanceProviderT } from '../types';

import CosmosToken from './cosmosToken';
import EthToken from './ethToken';
import RoninToken from './roninToken';
import SplToken from './splToken';
import TerraToken from './terraToken';

const providers: Array<BalanceProviderT<any>> = [
  CosmosToken,
  EthToken,
  RoninToken,
  SplToken,
  TerraToken,
];

const providerMap: { [name: string]: BalanceProviderT<any> } = providers.reduce((allProviders, provider) => {
  allProviders[provider.name] = provider;
  return allProviders;
}, {} as { [name: string]: BalanceProviderT<any> });

export default providerMap;
