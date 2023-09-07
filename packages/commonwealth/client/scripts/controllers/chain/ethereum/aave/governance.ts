import type { IAaveProposalResponse } from 'adapters/chain/aave/types';
import ProposalModule from '../../../../models/ProposalModule';
import type { IApp } from 'state';
import type EthereumAccounts from '../accounts';
import { attachSigner } from '../contractApi';
import type AaveApi from './api';
import type AaveChain from './chain';

import AaveProposal from './proposal';
import getFetch from 'helpers/getFetch';
import { BigNumber } from 'ethers';
import Aave from 'controllers/chain/ethereum/aave/adapter';
import axios from 'axios';
import { ApiEndpoints } from 'state/api/config';

export interface AaveProposalArgs {
  executor: string;
  targets: string[];
  values: string[];
  signatures: string[];
  calldatas: string[];
  withDelegateCalls: boolean[];
  ipfsHash: string;
}

function deserializeBigNumbers(obj: Record<string, any>) {
  // Base case: if the object is not an object or is null, return it as-is
  if (typeof obj !== 'object' || obj === null) {
    return obj;
  }

  // If the object matches the serialized BigNumber pattern, return a deserialized BigNumber
  if (obj.type === 'BigNumber' && obj.hex) {
    return BigNumber.from(obj.hex);
  }

  // If it's an array, iterate over each element and deserialize if needed
  if (Array.isArray(obj)) {
    return obj.map(deserializeBigNumbers);
  }

  // For plain objects, iterate over each property
  const result = {};
  for (const key in obj) {
    result[key] = deserializeBigNumbers(obj[key]);
  }
  return result;
}

export default class AaveGovernance extends ProposalModule<
  AaveApi,
  IAaveProposalResponse,
  AaveProposal
> {
  // CONSTANTS
  private _Accounts: EthereumAccounts;
  private _api: AaveApi;

  // GETTERS
  public get api() {
    return this._api;
  }

  // INIT / DEINIT
  constructor(app: IApp) {
    super(app);
  }

  // METHODS
  public async propose(args: AaveProposalArgs) {
    const address = this.app.user.activeAccount.address;
    const {
      executor,
      targets,
      values,
      signatures,
      calldatas,
      withDelegateCalls,
      ipfsHash,
    } = args;

    // validate args
    const nCalls = targets.length;
    if (nCalls === 0) {
      throw new Error('must provide at least one target');
    }

    if (
      values.length !== nCalls ||
      signatures.length !== nCalls ||
      calldatas.length !== nCalls ||
      withDelegateCalls.length !== nCalls
    ) {
      throw new Error('all argument arrays must have the same length');
    }

    const executorContract = await this._api.getDeployedExecutor(executor);
    if (!executorContract) {
      throw new Error('Executor not found.');
    }
    const isExecutorAuthorized =
      await this._api.Governance.isExecutorAuthorized(executorContract.address);
    if (!isExecutorAuthorized) {
      throw new Error('executor not authorized!');
    }

    // validate user
    const blockNumber = await this._api.Provider.getBlockNumber();
    const isPropositionPowerEnough =
      await executorContract.isPropositionPowerEnough(
        this._api.Governance.address,
        address,
        blockNumber - 1
      );
    if (!isPropositionPowerEnough) {
      throw new Error('user does not have enough proposition power');
    }

    // send transaction
    const contract = await attachSigner(
      this.app.user.activeAccount,
      this._api.Governance
    );
    const tx = await contract.create(
      executorContract.address,
      targets,
      values,
      signatures,
      calldatas,
      withDelegateCalls,
      ipfsHash,
      { gasLimit: this._api.gasLimit }
    );
    const txReceipt = await tx.wait();
    if (txReceipt.status !== 1) {
      throw new Error('Failed to execute proposal');
    }
  }

  public async init(chain: AaveChain, accounts: EthereumAccounts) {
    this._Accounts = accounts;
    this._api = chain.aaveApi;

    // await AaveGovernance.getProposals(chain.app.chain as Aave)
    // set init to true without fetching proposals so chainAdapterReady emits true
    this._initialized = true;
  }

  static async getProposals(aaveChain: Aave) {
    const { chain, accounts, governance, meta } = aaveChain;
    const res = await axios.get(
      `${chain.app.serverUrl()}${ApiEndpoints.FETCH_PROPOSALS}`,
      {
        params: {
          chainId: meta.id,
        },
      }
    );

    const proposals: IAaveProposalResponse[] = res.data.result.proposals;
    proposals.forEach((p) => {
      // this check is necessary because the store serializes the proposal instance if it already exists
      // thus replacing the proposal instance with a regular object
      if (!governance.store.getByIdentifier(p.identifier)) {
        new AaveProposal(accounts, governance, deserializeBigNumbers(p));
      }
    });

    await Promise.all(
      governance.store.getAll().map((p) => {
        p.init();
      })
    );

    return governance.store.getAll();
  }

  public deinit() {
    this.store.clear();
  }
}
