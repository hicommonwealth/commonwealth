import BN from 'bn.js';
import { GovernorAlpha__factory } from 'eth/types';
import { NodeInfo } from 'models';
import EthereumChain from '../chain';
import { attachSigner } from '../contractApi';
import CompoundAPI from './api';
import { BigNumber } from 'ethers';

// Thin wrapper over EthereumChain to guarantee the `init()` implementation
// on the Governance module works as expected.
// Also includes some API-but-not-Governance-related calls.
export default class CompoundChain extends EthereumChain {
  public compoundApi: CompoundAPI;

  public async init(selectedNode: NodeInfo) {
    await super.resetApi(selectedNode);
    await super.initMetadata();
    this.compoundApi = new CompoundAPI(
      GovernorAlpha__factory.connect,
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
    return new BN(balance.toString(), 10) || new BN(0);
  }

  public async getVotingPower(address: string) {
    const num = await this.compoundApi.Token.numCheckpoints(address);
    if (num === 0) return BigNumber.from(0);
    const { fromBlock, votes } = await this.compoundApi.Token.checkpoints(address, num - 1);
    // Todo move this into shared
    const votesByDecimals = votes.div(BigNumber.from(10).pow(BigNumber.from(this.compoundApi.decimals)));
    return votesByDecimals;
  }

  public async setDelegate(address: string, amount: number) {
    try {
      const contract = await attachSigner(
        this.app.wallets,
        this.app.user.activeAccount.address,
        this.compoundApi.Token,
      );
      const bal = await this.balanceOf(address);
      console.log(`User balance: ${bal.toString()}`)
      console.log(`${amount} to delegate before decimals`);
      const balBN = BigNumber.from(amount);
      const decimals = BigNumber.from(10).pow(BigNumber.from(this.compoundApi.decimals));
      const delegateAmt = balBN.mul(decimals).toString();
      console.log(`${delegateAmt} after decimals`);
      const gasLimit = await contract.estimateGas.delegate(address, delegateAmt);
      await contract.delegate(address, delegateAmt, { gasLimit });
    } catch (e) {
      throw new Error(e);
    }
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
