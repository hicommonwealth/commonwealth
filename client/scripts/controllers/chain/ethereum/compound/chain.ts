import BN from 'bn.js';
import { NodeInfo } from 'models';
import EthereumChain from '../chain';
import { attachSigner } from '../contractApi';
import CompoundAPI from './api';

// Thin wrapper over EthereumChain to guarantee the `init()` implementation
// on the Governance module works as expected.
// Also includes some API-but-not-Governance-related calls.
export default class CompoundChain extends EthereumChain {
  public compoundApi: CompoundAPI;

  public async init(selectedNode: NodeInfo) {
    await super.resetApi(selectedNode);
    await super.initMetadata();
    this.compoundApi = new CompoundAPI(
      null,
      selectedNode.address,
      this.api.currentProvider as any
    );
    await this.compoundApi.init(selectedNode.tokenName);
  }

  public deinit() {
    super.deinitMetadata();
    super.deinitEventLoop();
    super.deinitApi();
  }

  public async priorDelegates(address: string, blockNumber: number | string) {
    if (!this.compoundApi.Token) {
      console.warn('No token found, cannot fetch prior delegates');
      return new BN(0);
    }
    const delegates = await this.compoundApi.Token.getPriorVotes(address, blockNumber);
    return new BN(delegates.toString(), 10) || new BN(0);
  }

  public async balanceOf(address: string) {
    if (!this.compoundApi.Token) {
      console.warn('No token found, cannot fetch balance');
      return new BN(0);
    }
    const balance = await this.compoundApi.Token.balanceOf(address);
    return new BN(balance.toString(), 10) || new BN(0);
  }

  public async setDelegate(address: string, amount?: number) {
    if (!this.compoundApi.Token) {
      throw new Error('No token found, cannot fetch balance');
    }
    try {
      const contract = await attachSigner(
        this.app.wallets,
        this.app.user.activeAccount.address,
        this.compoundApi.Token
      );
      if (this.compoundApi.isTokenMPond(contract)) {
        if (!amount) {
          throw new Error('Must provide amount for MPond delegation.');
        }
        const gasLimit = await contract.estimateGas.delegate(address, amount);
        await contract.delegate(address, amount, { gasLimit });
      } else {
        const gasLimit = await contract.estimateGas.delegate(address);
        await contract.delegate(address, { gasLimit });
      }
    } catch (e) {
      console.error(e);
      throw e;
    }
  }

  public async getDelegate(): Promise<string> {
    const token = this.compoundApi.Token;
    if (!token) {
      console.warn('No token found, cannot fetch delegate');
      return null;
    }
    if (this.compoundApi.isTokenMPond(token)) {
      // TODO: a user can have multiple delegates on MPond, so we will need to make the logic more complex.
      //   For now, we will return nothing, as we cannot easily fetch it without a queryFilter().
      console.warn('Cannot fetch delegates on MPond-type token');
      return null;
    } else {
      const delegate = await token.delegates(this.app.user.activeAccount.address);
      return delegate;
    }
  }

  public async isHolder(address: string): Promise<boolean> {
    const m = await this.balanceOf(address);
    return !m.isZero();
  }

  public async isDelegate(address: string): Promise<boolean> {
    if (!this.compoundApi.Token) {
      console.warn('No token found, cannot fetch vote status');
      return null;
    }
    const voteAmount = await this.compoundApi.Token.getCurrentVotes(address);
    return !voteAmount.isZero();
  }
}
