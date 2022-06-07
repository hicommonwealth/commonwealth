import Cosmos from 'controllers/chain/cosmos/main';

import { NodeInfo, ITokenAdapter, ChainInfo } from 'models';
import $ from 'jquery';
import { IApp } from 'state';
import BN from 'bn.js';

export default class Token extends Cosmos implements ITokenAdapter {
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

  // Extensions of Cosmos
  constructor(meta: ChainInfo, app: IApp) {
    super(meta, app);
  }

  public async initData() {
    await super.initData();
    await this.activeAddressHasToken(this.app.user?.activeAccount?.address);
  }
}