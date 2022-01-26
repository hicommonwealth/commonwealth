import BN from 'bn.js';
import { ProposalModule, ITXModalData } from 'models';
import { ICompoundProposalResponse } from 'adapters/chain/compound/types';
import { CompoundEvents, CompoundTypes } from '@commonwealth/chain-events';
import { IApp } from 'state';
import { chainToEventNetwork, EntityRefreshOption } from 'controllers/server/chain_entities';
import { BigNumber, BigNumberish, ContractTransaction } from 'ethers';
import { GovernorCompatibilityBravo } from 'eth/types';
import CompoundAPI, { GovernorType } from './api';
import CompoundProposal from './proposal';
import CompoundChain from './chain';
import { attachSigner } from '../contractApi';
import EthereumAccounts from '../accounts';

export interface CompoundProposalArgs {
  targets: string[],
  values: string[],
  signatures?: string[],
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

  // capacities based on governor type
  private _supportsAbstain: boolean;
  public get supportsAbstain() { return this._supportsAbstain; }
  private _useAbstainInQuorum: boolean;
  public get useAbstainInQuorum() { return this._useAbstainInQuorum; }

  // INIT / DEINIT
  constructor(app: IApp, private _usingServerChainEntities = false) {
    super(app, (e) => new CompoundProposal(this._Accounts, this._Chain, this, e));
  }

  public async propose(args: CompoundProposalArgs): Promise<string> {
    const address = this.app.user.activeAccount.address;
    const contract = await attachSigner(this.app.wallets, address, this._api.Contract);

    const { targets, values, signatures, calldatas, description } = args;
    if (!targets || !values || !calldatas || !description)
      throw new Error('must provide targets, values, calldatas, description');
    if (parseInt(address, 16) === 0) {
      throw new Error('applicant cannot be 0');
    }

    let tx: ContractTransaction;
    if (this.api.govType === GovernorType.Oz) {
      // omit signatures in Oz
      const gasLimit = await contract.estimateGas['propose(address[],uint256[],bytes[],string)'](
        targets,
        values,
        calldatas,
        description,
      );
      tx = await contract['propose(address[],uint256[],bytes[],string)'](
        targets, values, calldatas, description,
        { gasLimit },
      );
    } else {
      const gasLimit = await contract.estimateGas['propose(address[],uint256[],string[],bytes[],string)'](
        targets,
        values,
        signatures,
        calldatas,
        description,
      );
      tx = await contract['propose(address[],uint256[],string[],bytes[],string)'](
        targets, values, signatures, calldatas, description,
        { gasLimit },
      );
    }
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

    this._votingDelay = new BN((await this._api.Contract.votingDelay()).toString());
    this._votingPeriod = new BN((await this._api.Contract.votingPeriod()).toString());

    // determine capacities and init type-specific parameters
    if (this.api.isGovAlpha(this.api.Contract)) {
      this._supportsAbstain = false;
      this._useAbstainInQuorum = false;
      this._quorumVotes = new BN((await this._api.Contract.quorumVotes()).toString());
      this._proposalThreshold = new BN((await this._api.Contract.proposalThreshold()).toString());
    } else if (this.api.govType === GovernorType.Bravo) {
      this._supportsAbstain = true;
      this._useAbstainInQuorum = false;
      this._quorumVotes = new BN((await this._api.Contract.quorumVotes()).toString());
      this._proposalThreshold = new BN((await this._api.Contract.proposalThreshold()).toString());
    } else {
      // OZ we need to query and parse counting mode
      const countingMode = await (this.api.Contract as GovernorCompatibilityBravo).COUNTING_MODE();
      const params = new URLSearchParams(countingMode);
      this._supportsAbstain = params.get('support') === 'bravo';
      this._useAbstainInQuorum = params.get('quorum') !== 'bravo';
      const blockNumber = await this._api.Provider.getBlockNumber();
      this._quorumVotes = new BN(
        (await (this.api.Contract as GovernorCompatibilityBravo).quorum(blockNumber - 1)
      ).toString());
    }

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
