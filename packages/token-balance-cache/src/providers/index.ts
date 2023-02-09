import { default as CosmosBalanceProvider } from './cosmos';
import Erc1155BalanceProvider from './erc1155';
import Erc20BalanceProvider from './erc20';
import Erc721BalanceProvider from './erc721';
import { default as EthTokenBalanceProvider } from './ethToken';
import { default as RoninBalanceProvider } from './ronin';
import { default as SplTokenBalanceProvider } from './splToken';
import { default as TerraBalanceProvider } from './terra';

const providers = [
  new CosmosBalanceProvider(),
  new EthTokenBalanceProvider(),
  new Erc20BalanceProvider(),
  new Erc721BalanceProvider(),
  new Erc1155BalanceProvider(),
  new RoninBalanceProvider(),
  new SplTokenBalanceProvider(),
  new TerraBalanceProvider(),
];

export default providers;
