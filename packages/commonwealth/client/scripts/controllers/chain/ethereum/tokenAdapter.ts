import BN from 'bn.js';
import { ContractType } from 'common-common/src/types';
import Ethereum from 'controllers/chain/ethereum/adapter';
import $ from 'jquery';
import type { IApp } from 'state';
import type ChainInfo from '../../../models/ChainInfo';
import type ITokenAdapter from '../../../models/ITokenAdapter';

export default class Token extends Ethereum implements ITokenAdapter {
  // required implementations for ITokenAdapter
  public contractAddress: string;
  public hasToken = false;
  public tokenBalance: BN = new BN(0);

  public async activeAddressHasToken(activeAddress?: string): Promise<boolean> {
    if (!activeAddress) return false;

    if (!this.contractAddress) {
      // iterate through selectedChain.Contracts for the erc20 type and return the address
      const tokenContracts = this.app.contracts.getCommunityContracts();
      if (tokenContracts?.length > 0) {
        const tokenContract = tokenContracts[0];
        this.contractAddress = tokenContract.address;
      }
    }

    this.hasToken = false;
    const account = this.accounts.get(activeAddress);

    // query balance -- defaults to native token
    try {
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
    } catch (e) {
      console.log(e);
      this.hasToken = false;
    }

    return this.hasToken;
  }

  // Extensions of Ethereum
  constructor(meta: ChainInfo, app: IApp) {
    super(meta, app);
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
