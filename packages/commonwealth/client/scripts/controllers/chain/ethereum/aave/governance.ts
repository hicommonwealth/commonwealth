import { ProposalModule, ITXModalData } from 'models';
import { IApp } from 'state';
import { IAaveProposalResponse } from 'adapters/chain/aave/types';
import { AaveEvents, AaveTypes } from 'chain-events/src';
import { Executor } from 'common-common/src/eth/types';
import { chainToEventNetwork } from 'controllers/server/chain_entities';

import AaveProposal from './proposal';
import AaveChain from './chain';
import { attachSigner } from '../contractApi';
import AaveApi from './api';
import EthereumAccounts from '../accounts';

export interface AaveProposalArgs {
  executor: Executor | string,
  targets: string[],
  values: string[],
  signatures: string[],
  calldatas: string[],
  withDelegateCalls: boolean[],
  ipfsHash: string,
}

export default class AaveGovernance extends ProposalModule<
  AaveApi,
  IAaveProposalResponse,
  AaveProposal
> {
  // CONSTANTS
  private _Accounts: EthereumAccounts;
  private _Chain: AaveChain;
  private _api: AaveApi;

  // GETTERS
  public get api() { return this._api; }
  public get usingServerChainEntities() { return this._usingServerChainEntities; }

  // INIT / DEINIT
  constructor(app: IApp, private _usingServerChainEntities = false) {
    super(app, (e) => new AaveProposal(this._Chain, this._Accounts, this, e));
  }

  // METHODS
  public async propose(args: AaveProposalArgs) {
    const address = this.app.user.activeAccount.address;
    const { executor, targets, values, signatures, calldatas, withDelegateCalls, ipfsHash } = args;

    // validate args
    const nCalls = targets.length;
    if (nCalls === 0) {
      throw new Error('must provide at least one target');
    }

    if (values.length !== nCalls
      || signatures.length !== nCalls
      || calldatas.length !== nCalls
      || withDelegateCalls.length !== nCalls
    ) {
      throw new Error('all argument arrays must have the same length');
    }

    // validate executor
    const ex = typeof executor === 'string'
      ? this._api.getExecutor(executor)
      : executor;
    if (!ex) {
      throw new Error('Executor not found.');
    }
    const executorContract = ex.contract;
    const isExecutorAuthorized = await this._api.Governance.isExecutorAuthorized(executorContract.address);
    if (!isExecutorAuthorized) {
      throw new Error('executor not authorized!');
    }

    // validate user
    const blockNumber = await this._api.Provider.getBlockNumber();
    const isPropositionPowerEnough = await executorContract.isPropositionPowerEnough(
      this._api.Governance.address,
      address,
      blockNumber - 1,
    );
    if (!isPropositionPowerEnough) {
      throw new Error('user does not have enough proposition power');
    }

    // send transaction
    const contract = await attachSigner(this.app.wallets, this.app.user.activeAccount, this._api.Governance);
    const tx = await contract.create(
      executorContract.address,
      targets,
      values,
      signatures,
      calldatas,
      withDelegateCalls,
      ipfsHash,
      { gasLimit: this._api.gasLimit },
    );
    const txReceipt = await tx.wait();
    if (txReceipt.status !== 1) {
      throw new Error('Failed to execute proposal');
    }
  }

  public async init(chain: AaveChain, accounts: EthereumAccounts) {
    this._Chain = chain;
    this._Accounts = accounts;
    this._api = chain.aaveApi;

    // load server proposals
    console.log('Fetching aave proposals from backend.');
    await this.app.chain.chainEntities.refresh(this.app.chain.id);
    const entities = this.app.chain.chainEntities.store.getByType(AaveTypes.EntityKind.Proposal);
    entities.forEach((e) => this._entityConstructor(e));
    console.log(`Found ${entities.length} proposals!`);

    await Promise.all(this.store.getAll().map((p) => p.init()));

    // register new chain-event handlers
    this.app.chain.chainEntities.registerEntityHandler(
      AaveTypes.EntityKind.Proposal, (entity, event) => {
        this.updateProposal(entity, event);
      }
    );

    // kick off listener
    const chainEventsContracts: AaveTypes.Api = { governance: this._api.Governance as any };
    const subscriber = new AaveEvents.Subscriber(chainEventsContracts, this.app.chain.id);
    const processor = new AaveEvents.Processor(chainEventsContracts);
    await this.app.chain.chainEntities.subscribeEntities(
      this.app.chain.id,
      chainToEventNetwork(this.app.chain.meta),
      subscriber,
      processor,
    );

    this._initialized = true;
  }

  public deinit() {
    this.app.chain.chainEntities.deinit();
    this.store.clear();
  }

  public createTx(...args: any[]): ITXModalData {
    throw new Error('Method not implemented.');
  }
}
