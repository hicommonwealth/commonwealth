import * as solw3 from '@solana/web3.js';
import BN from 'bn.js';
import { NodeInfo, ITokenAdapter } from 'models';
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
      chain: this.meta.chain.id,
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
  constructor(meta: NodeInfo, app: IApp) {
    super(meta, app);
    this.contractAddress = meta.address;
  }

  public async initData() {
    await super.initData();
    await this.activeAddressHasToken(this.app.user?.activeAccount?.address);
  }
}
