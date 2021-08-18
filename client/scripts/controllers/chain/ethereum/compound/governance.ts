import BN from 'bn.js';
import { ProposalModule, ITXModalData } from 'models';
import { ICompoundProposalResponse } from 'adapters/chain/compound/types';
import { CompoundEvents, CompoundTypes } from '@commonwealth/chain-events';
import { IApp } from 'state';
import { EntityRefreshOption } from 'controllers/server/chain_entities';
import { BigNumberish } from 'ethers';
import CompoundAPI from './api';
import CompoundProposal from './proposal';
import CompoundChain from './chain';
import { attachSigner } from '../contractApi';
import EthereumAccounts from '../accounts';

export interface CompoundProposalArgs {
  targets: string[],
  values: string[],
  signatures: string[],
  calldatas: string[],
  description: string,
}

export default class CompoundGovernance extends ProposalModule<
  CompoundAPI,
  ICompoundProposalResponse,
  CompoundProposal
> {
  // MEMBERS // TODO: Holders anything?

  // CONSTANTS
  private _quorumVotes: BN;
  private _proposalThreshold: BN;
  private _proposalMaxOperations: BN;
  private _votingDelay: BN;
  private _votingPeriod: BN;
  // private _gracePeriod: BN;

  private _api: CompoundAPI;
  private _Chain: CompoundChain;
  private _Accounts: EthereumAccounts;

  // GETTERS
  // Contract Constants
  public get quorumVotes() { return this._quorumVotes; }
  public get proposalThreshold() { return this._proposalThreshold; }
  public get proposalMaxOperations() { return this._proposalMaxOperations; }
  public get votingDelay() { return this._votingDelay; }
  public get votingPeriod() { return this._votingPeriod; }
  // public get gracePeriod() { return this._gracePeriod; }

  public get api() { return this._api; }
  public get usingServerChainEntities() { return this._usingServerChainEntities; }

  // INIT / DEINIT
  constructor(app: IApp, private _usingServerChainEntities = false) {
    super(app, (e) => new CompoundProposal(this._Accounts, this._Chain, this, e));
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

  public async propose(args: CompoundProposalArgs) {
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

  public async init(chain: CompoundChain, Accounts: EthereumAccounts) {
    this._api = chain.compoundApi;
    this._Chain = chain;
    this._Accounts = Accounts;

    this._quorumVotes = new BN((await this._api.Contract.quorumVotes()).toString());
    this._proposalThreshold = new BN((await this._api.Contract.proposalThreshold()).toString());
    this._proposalMaxOperations = new BN((await this._api.Contract.proposalMaxOperations()).toString());
    this._votingDelay = new BN((await this._api.Contract.votingDelay()).toString());
    this._votingPeriod = new BN((await this._api.Contract.votingPeriod()).toString());
    // this._gracePeriod = new BN((await this._api.Timelock.GRACE_PERIOD()).toString());

    // load server proposals
    console.log('Fetching compound proposals from backend.');
    await this.app.chain.chainEntities.refresh(this.app.chain.id, EntityRefreshOption.AllEntities);
    const entities = this.app.chain.chainEntities.store.getByType(CompoundTypes.EntityKind.Proposal);
    entities.forEach((e) => this._entityConstructor(e));
    console.log(`Found ${entities.length} proposals!`);

    // no init logic currently needed
    // await Promise.all(this.store.getAll().map((p) => p.init()));

    // register new chain-event handlers
    this.app.chain.chainEntities.registerEntityHandler(
      CompoundTypes.EntityKind.Proposal, (entity, event) => {
        this.updateProposal(entity, event);
      }
    );

    // fetch proposals from chain
    // const fetcher = new AaveEvents.StorageFetcher(chainEventsContracts);
    const subscriber = new CompoundEvents.Subscriber(this._api.Contract, this.app.chain.id);
    const processor = new CompoundEvents.Processor(this._api.Contract);
    // await this.app.chain.chainEntities.fetchEntities(this.app.chain.id, () => fetcher.fetch());
    await this.app.chain.chainEntities.subscribeEntities(
      this.app.chain.id,
      subscriber,
      processor,
    );

    this._initialized = true;
  }

  public deinit() {
    this.store.clear();
  }

  public createTx(...args: any[]): ITXModalData {
    throw new Error('Method not implemented.');
  }
}
