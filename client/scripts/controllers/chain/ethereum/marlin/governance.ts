import BN from 'bn.js';
import EthDater from 'ethereum-block-by-date';

import { ProposalModule, ITXModalData, ChainEntity, IChainModule } from 'models';

import { ERC20Token, EthereumCoin } from 'adapters/chain/ethereum/types';
import { IMarlinProposalResponse } from 'adapters/chain/marlin/types';
import { EntityRefreshOption } from 'controllers/server/chain_entities';

// import { MarlinEvents } from '@commonwealth/chain-events';

import { IApp } from 'state';


import Marlin from './adapter';
import MarlinAPI from './api';
import MarlinProposal from './proposal';
// import MarlinHolder from './holders';
import MarlinHolders from './holders';

export interface ProposalArgs {
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
  private _Holders: MarlinHolders;


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
    super(app, (e) => new MarlinProposal(this._Holders, this, e));
  }

  // METHODS

  public async castVote(proposalId: number, support: boolean) {
    const tx = await this._api.governorAlphaContract.castVote(proposalId, support);
    const txReceipt = await tx.wait();
    if (txReceipt.status !== 1) {
      throw new Error(`Failed to cast vote on proposal #${proposalId}`);
    }
  }

  // PROPOSE

  public async propose(args: ProposalArgs) {
    const { targets, values, signatures, calldatas, description } = args;
    if (!targets || !values || !signatures || !calldatas || !description) return;
    const tx = await this._api.governorAlphaContract.propose(
      targets, values, signatures, calldatas, description,
    );
    const txReceipt = await tx.wait();
    if (txReceipt.status !== 1) {
      throw new Error('Failed to execute proposal');
    }
  }

  public async state(proposalId: number): Promise<number> {
    const state = await this._api.governorAlphaContract.state(proposalId);
    if (state === null) {
      throw new Error(`Failed to get state for proposal #${proposalId}`);
    }
    return state;
  }

  public async execute(proposalId: number) {
    const tx = await this._api.governorAlphaContract.execute(proposalId);
    const txReceipt = await tx.wait();
    if (txReceipt.status !== 1) {
      throw new Error(`Failed to execute proposal #${proposalId}`);
    }
  }

  public async queue(proposalId: number) {
    const tx = await this._api.governorAlphaContract.queue(proposalId);
    const txReceipt = await tx.wait();
    if (txReceipt.status !== 1) {
      throw new Error(`Failed to queue proposal #${proposalId}`);
    }
  }

  public async cancel(proposalId: number) {
    const tx = await this._api.governorAlphaContract.cancel(proposalId);
    const txReceipt = await tx.wait();
    if (txReceipt.status !== 1) {
      throw new Error(`Failed to cancel proposal #${proposalId}`);
    }
  }

  public async init() {
    this._quorumVotes = new BN((await this._api.governorAlphaContract.quorumVotes()).toString(), 10);
    this._proposalThreshold = new BN((await this._api.governorAlphaContract.proposalThreshold()).toString(), 10);
    this._proposalMaxOperations = new BN((await this._api.governorAlphaContract.proposalMaxOperations()).toString(), 10);
    this._votingDelay = new BN((await this._api.governorAlphaContract.votingDelay()).toString(), 10);
    this._votingPeriod = new BN((await this._api.governorAlphaContract.votingPeriod()).toString(), 10);
  }

  public deinit() {
    this.store.clear();
  }

  public createTx(...args: any[]): ITXModalData {
    throw new Error('Method not implemented.');
  }
}
