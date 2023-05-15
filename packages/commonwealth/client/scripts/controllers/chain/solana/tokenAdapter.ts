import BN from 'bn.js';
import { ContractType } from 'common-common/src/types';
import $ from 'jquery';
import ITokenAdapter from '../../../models/ITokenAdapter';
import Solana from './adapter';

export default class Token extends Solana implements ITokenAdapter {
  public contractAddress: string;
  public hasToken = false;
  public tokenBalance: BN = new BN(0);

  public async activeAddressHasToken(activeAddress?: string): Promise<boolean> {
    if (!activeAddress) return false;
    this.hasToken = false;
    const account = this.accounts.get(activeAddress);

    if (!this.contractAddress) {
      // iterate through selectedChain.Contracts for the Aave type and return the address
      const solanaContracts = this.app.contracts.getByType(ContractType.SPL);
      if (!solanaContracts || !solanaContracts.length) {
        throw new Error('No Sol contracts found');
      }
      const solanaContract = solanaContracts[0];
      this.contractAddress = solanaContract.address;
    }

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
  }

  public async initData() {
    await super.initData();
    await this.activeAddressHasToken(this.app.user?.activeAccount?.address);
  }
}
