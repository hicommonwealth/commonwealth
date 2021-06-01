import { ProposalModule, ITXModalData } from 'models';
import { IApp } from 'state';
import { IAaveProposalResponse } from 'adapters/chain/aave/types';
import { AaveEvents, AaveTypes } from '@commonwealth/chain-events';

import AaveProposal from './proposal';
import AaveChain from './chain';
import { attachSigner } from '../contractApi';
import AaveApi from './api';
import EthereumAccounts from '../accounts';

export interface AaveProposalArgs {
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
    const contract = await attachSigner(this.app.wallets, address, this._api.Governance);
    const { targets, values, signatures, calldatas, withDelegateCalls, ipfsHash } = args;

    // TODO: validate caller/args

    const tx = await contract.create(
      this._api.Executor.address,
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

    console.log('Fetching aave proposals from chain.');

    // register new chain-event handlers
    this.app.chain.chainEntities.registerEntityHandler(
      AaveTypes.EntityKind.Proposal, (entity, event) => {
        this.updateProposal(entity, event);
      }
    );

    // fetch proposals
    const chainEventsContracts: AaveTypes.Api = { governance: this._api.Governance };
    const fetcher = new AaveEvents.StorageFetcher(
      chainEventsContracts // TODO: add tokens
    );
    const subscriber = new AaveEvents.Subscriber(chainEventsContracts, this.app.chain.id);
    const processor = new AaveEvents.Processor(chainEventsContracts);
    // TODO: add range as argument
    await this.app.chain.chainEntities.fetchEntities(this.app.chain.id, () => fetcher.fetch({
      startBlock: 12300000 // TODO: remove this
    }, true)); // TODO: remove this and combine with backend entities
    await this.app.chain.chainEntities.subscribeEntities(
      this.app.chain.id,
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
