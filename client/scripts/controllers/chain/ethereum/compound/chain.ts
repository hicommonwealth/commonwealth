import BN from 'bn.js';
import { IGovernorCompatibilityBravo__factory } from 'eth/types';
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
      IGovernorCompatibilityBravo__factory.connect,
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
    const delegates = await this.compoundApi.Token.getPriorVotes(address, blockNumber);
    return new BN(delegates.toString(), 10) || new BN(0);
  }

  public async balanceOf(address: string) {
    const balance = await this.compoundApi.Token.balanceOf(address);
    console.log('balanceOf Compound Accounts', balance);
    return new BN(balance.toString(), 10) || new BN(0);
  }

  public async setDelegate(address: string, amount: number) {
    // eslint-disable-next-line no-constant-condition
    if (true || !this.compoundApi.Token) {
      throw new Error('Cannot delegate, no token found!');
    }
    // try {
    //   const contract = await attachSigner(
    //     this.app.wallets,
    //     this.app.user.activeAccount.address,
    //     this.compoundApi.Token
    //   );
    //   // TODO: convert this to amountless
    //   const gasLimit = await contract.estimateGas.delegate(address, amount);
    //   await contract.delegate(address, amount, { gasLimit });
    // } catch (e) {
    //   console.error(e);
    //   throw new Error(e);
    // }
  }

  public async getDelegate(): Promise<string> {
    // TODO: I don't think this is implementable anymore because of how the MPOND delegates mapping works now
    return new Promise(() => 'Method Not Implemented');
    // const sender = this._api.userAddress;
    // const bridge = this._api.bridge;
    // try {
    //   const delegate = await this._api.mPondContract.delegates(bridge, sender);
    //   const zeroAddress = '0x0000000000000000000000000000000000000000';
    //   return delegate === zeroAddress ? null : delegate;
    // } catch (err) {
    //   console.error(err);
    //   return null;
    // }
  }

  public async isHolder(address: string): Promise<boolean> {
    const m = await this.compoundApi.Token.balanceOf(address);
    return !m.isZero();
  }

  public async isDelegate(address: string): Promise<boolean> {
    const delegator = await this.compoundApi.Token.getCurrentVotes(address);
    return !delegator.isZero();
  }
}
