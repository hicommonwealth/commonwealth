import BN from 'bn.js';
import { ProposalModule, ITXModalData } from 'models';
import { ICompoundProposalResponse } from 'adapters/chain/compound/types';
import { CompoundEvents, CompoundTypes } from '@commonwealth/chain-events';
import { IApp } from 'state';
import { chainToEventNetwork, EntityRefreshOption } from 'controllers/server/chain_entities';
import { BigNumber, BigNumberish } from 'ethers';
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
  // CONSTANTS
  private _quorumVotes: BN;
  private _proposalThreshold: BN;
  private _votingDelay: BN;
  private _votingPeriod: BN;

  private _api: CompoundAPI;
  private _Chain: CompoundChain;
  private _Accounts: EthereumAccounts;

  // GETTERS
  public get quorumVotes() { return this._quorumVotes; }
  public get proposalThreshold() { return this._proposalThreshold; }
  public get votingDelay() { return this._votingDelay; }
  public get votingPeriod() { return this._votingPeriod; }

  public get api() { return this._api; }
  public get usingServerChainEntities() { return this._usingServerChainEntities; }

  public get supportsAbstain(): boolean {
    if (!this.api) return null;
    // Bravo supports abstain
    // TODO: check `COUNTING_MODE` in OZGov
    return !this.api.isGovAlpha(this.api.Contract);
  }

  public get supportsDelegationAmount(): boolean {
    if (!this.api?.Token) return null;
    return !!this.api.isTokenMPond(this.api.Token);
  }

  // INIT / DEINIT
  constructor(app: IApp, private _usingServerChainEntities = false) {
    super(app, (e) => new CompoundProposal(this._Accounts, this._Chain, this, e));
  }

  public async propose(args: CompoundProposalArgs): Promise<string> {
    const address = this.app.user.activeAccount.address;
    const contract = await attachSigner(this.app.wallets, address, this._api.Contract);

    const { targets, values, signatures, calldatas, description } = args;
    if (!targets || !values || !signatures || !calldatas || !description)
      throw new Error('must provide targets, values, signatures, calldatas, description');
    if (parseInt(address, 16) === 0) {
      throw new Error('applicant cannot be 0');
    }

    const gasLimit = await contract.estimateGas['propose(address[],uint256[],string[],bytes[],string)'](
      targets,
      values,
      signatures,
      calldatas,
      description,
    );
    const tx = await contract['propose(address[],uint256[],string[],bytes[],string)'](
      targets, values, signatures, calldatas, description,
      { gasLimit },
    );
    const txReceipt = await tx.wait();
    if (txReceipt.status !== 1) {
      throw new Error('Failed to execute proposal');
    }
    const id = (txReceipt.events[0]?.args[0] as BigNumber).toHexString();
    return id;
  }

  public async state(proposalId: BigNumberish): Promise<number> {
    const state = await this._api.Contract.state(proposalId);
    if (state === null) {
      throw new Error(`Failed to get state for proposal #${proposalId}`);
    }
    return state;
  }

  public async init(chain: CompoundChain, Accounts: EthereumAccounts) {
    this._api = chain.compoundApi;
    this._Chain = chain;
    this._Accounts = Accounts;

    this._quorumVotes = new BN((await this._api.Contract.quorumVotes()).toString());
    this._proposalThreshold = new BN((await this._api.Contract.proposalThreshold()).toString());
    this._votingDelay = new BN((await this._api.Contract.votingDelay()).toString());
    this._votingPeriod = new BN((await this._api.Contract.votingPeriod()).toString());

    // load server proposals
    console.log('Fetching compound proposals from backend.');
    await this.app.chain.chainEntities.refresh(this.app.chain.id, EntityRefreshOption.AllEntities);
    const entities = this.app.chain.chainEntities.store.getByType(CompoundTypes.EntityKind.Proposal);
    console.log(`Found ${entities.length} proposals!`);
    entities.forEach((e) => this._entityConstructor(e));
    await Promise.all(this.store.getAll().map((p) => p.init()));

    // register new chain-event handlers
    this.app.chain.chainEntities.registerEntityHandler(
      CompoundTypes.EntityKind.Proposal, (entity, event) => {
        this.updateProposal(entity, event);
        const proposal = this.store.getByIdentifier(entity.typeId);
        if (!proposal.initialized) {
          proposal.init();
        }
      }
    );

    // kick off listener
    const subscriber = new CompoundEvents.Subscriber(this._api.Contract as any, this.app.chain.id);
    const processor = new CompoundEvents.Processor(this._api.Contract as any);
    await this.app.chain.chainEntities.subscribeEntities(
      this.app.chain.id,
      chainToEventNetwork(this.app.chain.meta.chain),
      subscriber,
      processor
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
