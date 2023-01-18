import { default as CosmosBalanceProvider } from './cosmos';
import { default as EthTokenBalanceProvider } from './ethToken';
import { default as RoninBalanceProvider } from './ronin';
import { default as SplTokenBalanceProvider } from './splToken';
import { default as TerraBalanceProvider } from './terra';

const providers = [
  new CosmosBalanceProvider(),
  new EthTokenBalanceProvider(),
  new RoninBalanceProvider(),
  new SplTokenBalanceProvider(),
  new TerraBalanceProvider(),
];

export default providers;
