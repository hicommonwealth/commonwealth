import Ethereum from 'controllers/chain/ethereum/adapter';

import { NodeInfo, ITokenAdapter, ChainInfo } from 'models';
import $ from 'jquery';
import { IApp } from 'state';
import BN from 'bn.js';

export default class Token extends Ethereum implements ITokenAdapter {
  // required implementations for ITokenAdapter
  public readonly contractAddress: string;
  public hasToken = false;
  public tokenBalance: BN = new BN(0);
  public async activeAddressHasToken(activeAddress?: string): Promise<boolean> {
    if (!activeAddress) return false;
    this.hasToken = false;
    const account = this.accounts.get(activeAddress);

    // query balance
    const balanceResp = await $.post(`${this.app.serverUrl()}/tokenBalance`, {
      chain: this.meta.id,
      address: account.address,
      author_chain: account.chain.id,
      contract_address: this.contractAddress,
    });
    if (balanceResp.result) {
      const balance = new BN(balanceResp.result, 10);
      this.hasToken = balance && !balance.isZero();
      if (balance) this.tokenBalance = balance;
    } else {
      this.hasToken = false;
    }
    return this.hasToken;
  }

  // Extensions of Ethereum
  constructor(meta: ChainInfo, app: IApp) {
    super(meta, app);
    this.contractAddress = meta.address;
  }

  public async initApi() {
    await this.chain.initMetadata();
    await this.accounts.init(this.chain);
    this._apiInitialized = true;
  }

  public async initData() {
    await super.initData();
    await this.activeAddressHasToken(this.app.user?.activeAccount?.address);
  }
}
