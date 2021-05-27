import { ProposalModule, ITXModalData } from 'models';
import { IApp } from 'state';

import AaveAPI from './api';
import AaveProposal from './proposal';
import AaveHolders from './holders';
import AaveChain from './chain';
import { attachSigner } from '../contractApi';
import AaveApi from './api';
import { IAaveProposalResponse } from 'shared/adapters/chain/aave/types';

export interface AaveProposalArgs {
  executorAddress: string;
  targets: string[],
  values: string[],
  signatures: string[],
  calldatas: string[],
  withDelegateCalls: boolean[],
  ipfsHash: string,
}

export default class AaveGovernance extends ProposalModule<
  AaveAPI,
  IAaveProposalResponse,
  AaveProposal
> {
  // CONSTANTS
  private _Holders: AaveHolders;
  private _Chain: AaveChain;
  private _api: AaveApi;

  // GETTERS
  public get api() { return this._api; }
  public get usingServerChainEntities() { return this._usingServerChainEntities; }

  // INIT / DEINIT
  constructor(app: IApp, private _usingServerChainEntities = false) {
    super(app, (e) => new AaveProposal(this._Holders, this, e));
  }

  // METHODS
  public async propose(args: AaveProposalArgs) {
    const address = this.app.user.activeAccount.address;
    const contract = await attachSigner(this.app.wallets, address, this._api.Contract);
    const { executorAddress, targets, values, signatures, calldatas, withDelegateCalls, ipfsHash } = args;
  
    // TODO: validate caller/args

    const tx = await contract.create(
      executorAddress,
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

  public async init(chain: AaveChain, holders: AaveHolders) {
    this._Chain = chain;
    this._Holders = holders;
    this._api = chain.aaveApi;
    this._initialized = true;
  }

  public deinit() {
    this.store.clear();
  }

  public createTx(...args: any[]): ITXModalData {
    throw new Error('Method not implemented.');
  }
}
