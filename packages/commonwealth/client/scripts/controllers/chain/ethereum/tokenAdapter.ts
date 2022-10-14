import Ethereum from 'controllers/chain/ethereum/adapter';

import BN from 'bn.js';
import { ContractType } from 'common-common/src/types';
import $ from 'jquery';
import { ChainInfo, ITokenAdapter } from 'models';
import { IApp } from 'state';

export default class Token extends Ethereum implements ITokenAdapter {
  // required implementations for ITokenAdapter
  public contractAddress: string;
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
  }

  public async initApi() {
    // iterate through selectedChain.Contracts for the erc20 type and return the address
    const tokenContracts = this.app.contracts.getByType(ContractType.ERC20).filter((c) => c.symbol === meta.default_symbol);
    if (!tokenContracts || !tokenContracts.length) {
      throw new Error('No ERC20 contracts found');
    }
    const tokenContract = tokenContracts[0];
    this.contractAddress = tokenContract.address;

    await this.chain.initMetadata();
    await this.accounts.init(this.chain);
    this._apiInitialized = true;
  }

  public async initData() {
    await super.initData();
    await this.activeAddressHasToken(this.app.user?.activeAccount?.address);
  }
}
