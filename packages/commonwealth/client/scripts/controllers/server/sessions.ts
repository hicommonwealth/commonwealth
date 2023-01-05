import { ethers } from 'ethers';

class SessionsController {
  wallets: Record<string, ethers.Wallet>;
  // TODO: store expiration time on wallets[]

  constructor() {
    this.wallets = {};
  }

  public getAddress(chainId: number): string {
    return this.wallets[chainId]?.address;
  }

  public getOrCreateAddress(chainId: number): string {
    if (this.wallets[chainId]) {
      return this.wallets[chainId].address;
    }
    this.wallets[chainId] = ethers.Wallet.createRandom();
    return this.wallets[chainId].address;
  }
}

export default SessionsController;
