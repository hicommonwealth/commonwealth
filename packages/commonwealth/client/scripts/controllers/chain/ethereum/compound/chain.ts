import type { ERC20Votes } from '@hicommonwealth/chains';
import { ContractType } from '@hicommonwealth/core';
import { EthereumCoin } from 'adapters/chain/ethereum/types';
import BN from 'bn.js';
import type { BigNumber } from 'ethers';
import type ChainInfo from '../../../../models/ChainInfo';
import EthereumChain from '../chain';
import { attachSigner } from '../contractApi';
import CompoundAPI, { GovernorTokenType } from './api';

// Thin wrapper over EthereumChain to guarantee the `init()` implementation
// on the Governance module works as expected.
// Also includes some API-but-not-Governance-related calls.
export default class CompoundChain extends EthereumChain {
  public compoundApi: CompoundAPI;

  public coins(n: number, inDollars?: boolean) {
    return new EthereumCoin(
      this.app?.chain?.meta.default_symbol || '???',
      n,
      inDollars,
    );
  }

  public async init(selectedChain: ChainInfo) {
    await super.resetApi(selectedChain);
    await super.initMetadata();
    // iterate through selectedChain.Contracts for the Compound type and return the address
    const compoundContracts = this.app.contracts.getByType(
      ContractType.COMPOUND,
    );
    if (!compoundContracts || !compoundContracts.length) {
      throw new Error('No Compound contracts found');
    }
    const compoundContract = compoundContracts[0];
    this.compoundApi = new CompoundAPI(
      compoundContract.address,
      this.api.currentProvider as any,
    );
    await this.compoundApi.init(selectedChain.tokenName);
  }

  public deinit() {
    super.deinitMetadata();
    super.deinitEventLoop();
    super.deinitApi();
  }

  public async balanceOf(address: string) {
    if (!this.compoundApi.Token) {
      console.warn('No token found, cannot fetch balance');
      return new BN(0);
    }
    const balance = await this.compoundApi.Token.balanceOf(address);
    return new BN(balance.toString(), 10) || new BN(0);
  }

  public async setDelegate(address: string) {
    if (!this.compoundApi.Token) {
      throw new Error('No token found, cannot fetch balance');
    }
    try {
      const contract = await attachSigner(
        this.app.user.activeAccount,
        this.compoundApi.Token,
      );
      if (this.compoundApi.isTokenMPond(contract)) {
        // automatically delegate all token when using delegation on MPond
        const amount = await this.balanceOf(address);
        console.log(`Delegating ${amount}`);
        const gasLimit = await contract.estimateGas.delegate(
          address,
          amount.toString(),
        );
        console.log(`Estimated ${gasLimit}`);
        await contract.delegate(address, amount.toString(), { gasLimit });
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
      // TODO: a user can have multiple delegates on MPond and it cannot be easily fetched. We ignore for now.
      console.warn('Cannot fetch delegates on MPond-type token');
      return null;
    } else {
      const delegate = await token.delegates(
        this.app.user.activeAccount.address,
      );
      return delegate;
    }
  }

  public async isDelegate(address: string, block?: number): Promise<boolean> {
    if (!this.compoundApi.Token) {
      console.warn('No token found, cannot fetch vote status');
      return null;
    }
    let voteAmount: BigNumber;
    if (this.compoundApi.tokenType === GovernorTokenType.OzVotes) {
      if (block) {
        voteAmount = await (this.compoundApi.Token as ERC20Votes).getPastVotes(
          address,
          block,
        );
      } else {
        voteAmount = await (this.compoundApi.Token as ERC20Votes).getVotes(
          address,
        );
      }
    } else {
      if (block) {
        voteAmount = await this.compoundApi.Token.getPriorVotes(address, block);
      } else {
        voteAmount = await this.compoundApi.Token.getCurrentVotes(address);
      }
    }
    return !voteAmount.isZero();
  }
}
