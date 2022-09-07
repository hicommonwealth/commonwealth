import * as solw3 from '@solana/web3.js';
import BN from 'bn.js';
import { NodeInfo, ITokenAdapter, ChainInfo } from 'models';
import { IApp } from 'state';

import Solana from './main';

export default class Token extends Solana implements ITokenAdapter {
  public readonly contractAddress: string;
  public hasToken = false;
  public tokenBalance: BN = new BN(0);
  public async activeAddressHasToken(activeAddress?: string): Promise<boolean> {
    if (!activeAddress) return false;
    this.hasToken = false;
    const account = this.accounts.get(activeAddress);


    const balanceResp = await $.post(`${this.app.serverUrl()}/tokenBalance`, {
      chain: this.meta.id,
      address: account.address,
      author_chain: account.chain.id,
    });
    if (balanceResp.result) {
      const balance = new BN(balanceResp.result, 10);
      this.hasToken = balance && !balance.isZero();
      if (balance) this.tokenBalance = balance;
    } else {
      this.hasToken = false;
    }
  }

  // Extensions of Solana
  constructor(meta: ChainInfo, app: IApp) {
    super(meta, app);
    // iterate through selectedChain.Contracts for the Aave type and return the address
    const solanaContracts = this.app.contracts.getByType('solana').filter((c) => c.symbol === meta.default_symbol);
    if (!solanaContracts || !solanaContracts.length) {
      throw new Error('No Sol contracts found');
    }
    const solanaContract = solanaContracts[0];
    this.contractAddress = solanaContract.address;
  }

  public async initData() {
    await super.initData();
    await this.activeAddressHasToken(this.app.user?.activeAccount?.address);
  }
}
