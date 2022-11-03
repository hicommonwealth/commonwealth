import { ChainBase } from 'common-common/src/types';
import { ChainInfo, IChainAdapter, NodeInfo } from 'models';
import { IApp } from 'state';

import { SolanaToken } from './types';
import SolanaAccount from './account';
import SolanaAccounts from './accounts';
import SolanaChain from './chain';

class Solana extends IChainAdapter<SolanaToken, SolanaAccount> {
  public chain: SolanaChain;
  public accounts: SolanaAccounts;
  public readonly base = ChainBase.Solana;

  constructor(
    meta: ChainInfo,
    app: IApp,
  ) {
    super(meta, app);
    this.chain = new SolanaChain(this.app);
    this.accounts = new SolanaAccounts(this.app);
  }

  public async initApi() {
    await this.chain.init(this.meta);
    await this.accounts.init(this.chain);
    await super.initApi();
  }

  public async initData() {
    await super.initData();
  }

  public async deinit(): Promise<void> {
    await super.deinit();
    await this.accounts.deinit();
    await this.chain.deinit();
    console.log('Solana stopped.');
  }
}

export default Solana;
