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

    // query balance
    const mintPubKey = new solw3.PublicKey(this.contractAddress);
    try {
      const { value } =
        await this.chain.connection.getParsedTokenAccountsByOwner(
          account.publicKey,
          { mint: mintPubKey }
        );
      const amount: string =
        value[0]?.account?.data?.parsed?.info?.tokenAmount?.amount;
      const balance = new BN(amount, 10);
      this.hasToken = balance && !balance.isZero();
      if (balance) this.tokenBalance = balance;
      return this.hasToken;
    } catch (e) {
      console.error(
        `Failed to query token balance for mint ${this.contractAddress}: ${e.message}`
      );
      return false;
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
