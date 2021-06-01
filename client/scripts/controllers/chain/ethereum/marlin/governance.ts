import BN from 'bn.js';
import { ProposalModule, ITXModalData } from 'models';
import { IMarlinProposalResponse } from 'adapters/chain/marlin/types';
import { IApp } from 'state';

import { BigNumberish } from 'ethers';
import MarlinAPI from './api';
import MarlinProposal from './proposal';
import MarlinChain from './chain';
import { attachSigner } from '../contractApi';
import EthereumAccounts from '../accounts';

export interface MarlinProposalArgs {
  targets: string[],
  values: string[],
  signatures: string[],
  calldatas: string[], // TODO: CHECK IF THIS IS RIGHT
  description: string,
}

export default class MarlinGovernance extends ProposalModule<
  MarlinAPI,
  IMarlinProposalResponse,
  MarlinProposal
> {
  // MEMBERS // TODO: Holders anything?

  // CONSTANTS
  private _quorumVotes: BN;
  private _proposalThreshold: BN;
  private _proposalMaxOperations: BN;
  private _votingDelay: BN;
  private _votingPeriod: BN;

  private _api: MarlinAPI;
  private _Chain: MarlinChain;
  private _Accounts: EthereumAccounts;

  // GETTERS
  // Contract Constants
  public get quorumVotes() { return this._quorumVotes; }
  public get proposalThreshold() { return this._proposalThreshold; }
  public get proposalMaxOperations() { return this._proposalMaxOperations; }
  public get votingDelay() { return this._votingDelay; }
  public get votingPeriod() { return this._votingPeriod; }

  public get api() { return this._api; }
  public get usingServerChainEntities() { return this._usingServerChainEntities; }

  // INIT / DEINIT
  constructor(app: IApp, private _usingServerChainEntities = false) {
    super(app, (e) => new MarlinProposal(this._Accounts, this._Chain, this, e));
  }

  // METHODS

  public async castVote(proposalId: number, support: boolean) {
    const address = this.app.user.activeAccount.address;
    const contract = await attachSigner(this.app.wallets, address, this._api.Contract);

    const tx = await contract.castVote(proposalId, support);
    const txReceipt = await tx.wait();
    if (txReceipt.status !== 1) {
      throw new Error(`Failed to cast vote on proposal #${proposalId}`);
    }
  }

  // PROPOSE

  public async propose(args: MarlinProposalArgs) {
    const address = this.app.user.activeAccount.address;
    const contract = await attachSigner(this.app.wallets, address, this._api.Contract);

    const { targets, values, signatures, calldatas, description } = args;
    if (!targets || !values || !signatures || !calldatas || !description) return;
    if (!(await this._Chain.isDelegate(address))) throw new Error('sender must be valid delegate');
    const priorDelegates = await this._Chain.priorDelegates(address, this._api.Provider.blockNumber);
    if (this.proposalThreshold < priorDelegates) {
      throw new Error('sender must have requisite delegates');
    }
    if (parseInt(address, 16) === 0) {
      throw new Error('applicant cannot be 0');
    }

    const tx = await contract.propose(
      targets, values, signatures, calldatas, description,
      { gasLimit: this._api.gasLimit },
    );
    const txReceipt = await tx.wait();
    if (txReceipt.status !== 1) {
      throw new Error('Failed to execute proposal');
    }
  }

  public async state(proposalId: BigNumberish): Promise<number> {
    const state = await this._api.Contract.state(proposalId);
    if (state === null) {
      throw new Error(`Failed to get state for proposal #${proposalId}`);
    }
    return state;
  }

  public async execute(proposalId: number) {
    const address = this.app.user.activeAccount.address;
    const contract = await attachSigner(this.app.wallets, address, this._api.Contract);

    const tx = await contract.execute(proposalId);
    const txReceipt = await tx.wait();
    if (txReceipt.status !== 1) {
      throw new Error(`Failed to execute proposal #${proposalId}`);
    }
  }

  public async queue(proposalId: number) {
    const address = this.app.user.activeAccount.address;
    const contract = await attachSigner(this.app.wallets, address, this._api.Contract);

    const tx = await contract.queue(proposalId);
    const txReceipt = await tx.wait();
    if (txReceipt.status !== 1) {
      throw new Error(`Failed to queue proposal #${proposalId}`);
    }
  }

  public async cancel(proposalId: number) {
    const address = this.app.user.activeAccount.address;
    const contract = await attachSigner(this.app.wallets, address, this._api.Contract);

    const tx = await contract.cancel(proposalId);
    const txReceipt = await tx.wait();
    if (txReceipt.status !== 1) {
      throw new Error(`Failed to cancel proposal #${proposalId}`);
    }
  }

  public async init(chain: MarlinChain, Accounts: EthereumAccounts) {
    this._api = chain.marlinApi;
    this._Chain = chain;
    this._Accounts = Accounts;

    this._quorumVotes = new BN((await this._api.Contract.quorumVotes()).toString());
    this._proposalThreshold = new BN((await this._api.Contract.proposalThreshold()).toString());
    this._proposalMaxOperations = new BN((await this._api.Contract.proposalMaxOperations()).toString());
    this._votingDelay = new BN((await this._api.Contract.votingDelay()).toString());
    this._votingPeriod = new BN((await this._api.Contract.votingPeriod()).toString());
    this._initialized = true;
  }

  public deinit() {
    this.store.clear();
  }

  public createTx(...args: any[]): ITXModalData {
    throw new Error('Method not implemented.');
  }
}
