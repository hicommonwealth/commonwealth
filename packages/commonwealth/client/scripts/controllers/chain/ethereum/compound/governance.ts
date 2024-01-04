import type { ICompoundProposalResponse } from 'adapters/chain/compound/types';
import axios from 'axios';
import type {
  GovernorCompatibilityBravo,
  GovernorCountingSimple,
} from 'common-common/src/eth/types';
import Compound from 'controllers/chain/ethereum/compound/adapter';
import { deserializeBigNumbers } from 'controllers/chain/ethereum/util';
import type { BigNumberish, ContractTransaction } from 'ethers';
import { BigNumber } from 'ethers';
import type { IApp } from 'state';
import { ApiEndpoints } from 'state/api/config';
import ProposalModule from '../../../../models/ProposalModule';
import type { ITXModalData } from '../../../../models/interfaces';
import type EthereumAccounts from '../accounts';
import { attachSigner } from '../contractApi';
import type CompoundAPI from './api';
import { GovernorType } from './api';
import type CompoundChain from './chain';
import CompoundProposal from './proposal';

export interface CompoundProposalArgs {
  targets: string[];
  values: string[];
  signatures?: string[];
  calldatas: string[];
  description: string;
}

export default class CompoundGovernance extends ProposalModule<
  CompoundAPI,
  ICompoundProposalResponse,
  CompoundProposal
> {
  // CONSTANTS
  private _quorumVotes: BigNumber;
  private _proposalThreshold: BigNumber;
  private _votingPeriod: BigNumber;

  private _api: CompoundAPI;
  private _Chain: CompoundChain;
  private _Accounts: EthereumAccounts;

  // GETTERS
  public get quorumVotes() {
    return this._quorumVotes;
  }

  public get proposalThreshold() {
    return this._proposalThreshold;
  }

  public get votingPeriod() {
    return this._votingPeriod;
  }

  public get api() {
    return this._api;
  }

  // capacities based on governor type
  private _supportsAbstain: boolean;
  public get supportsAbstain() {
    return this._supportsAbstain;
  }

  private _useAbstainInQuorum: boolean;
  public get useAbstainInQuorum() {
    return this._useAbstainInQuorum;
  }

  // INIT / DEINIT
  constructor(app: IApp) {
    super(app);
  }

  public async propose(args: CompoundProposalArgs): Promise<string> {
    const address = this.app.user.activeAccount.address;
    const contract = await attachSigner(
      this.app.user.activeAccount,
      this._api.Contract,
    );

    const { targets, values, signatures, calldatas, description } = args;
    if (!targets || !values || !calldatas || !description)
      throw new Error('must provide targets, values, calldatas, description');
    if (parseInt(address, 16) === 0) {
      throw new Error('applicant cannot be 0');
    }

    let tx: ContractTransaction;
    if (this.api.govType === GovernorType.Oz) {
      // omit signatures in Oz
      const gasLimit = await contract.estimateGas[
        'propose(address[],uint256[],bytes[],string)'
      ](targets, values, calldatas, description);
      tx = await contract['propose(address[],uint256[],bytes[],string)'](
        targets,
        values,
        calldatas,
        description,
        { gasLimit },
      );
    } else {
      const gasLimit = await contract.estimateGas[
        'propose(address[],uint256[],string[],bytes[],string)'
      ](targets, values, signatures, calldatas, description);
      tx = await contract[
        'propose(address[],uint256[],string[],bytes[],string)'
      ](targets, values, signatures, calldatas, description, { gasLimit });
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

    this._votingPeriod = BigNumber.from(
      (await this._api.Contract.votingPeriod()).toString(),
    );

    // determine capacities and init type-specific parameters
    if (this.api.isGovAlpha(this.api.Contract)) {
      this._supportsAbstain = false;
      this._useAbstainInQuorum = false;
      this._quorumVotes = BigNumber.from(
        (await this._api.Contract.quorumVotes()).toString(),
      );

      this._proposalThreshold = BigNumber.from(
        (await this._api.Contract.proposalThreshold()).toString(),
      );
    } else if (this.api.govType === GovernorType.Bravo) {
      this._supportsAbstain = true;
      this._useAbstainInQuorum = false;
      this._quorumVotes = BigNumber.from(
        (await this._api.Contract.quorumVotes()).toString(),
      );
      this._proposalThreshold = BigNumber.from(
        (await this._api.Contract.proposalThreshold()).toString(),
      );
    } else {
      // OZ we need to query and parse counting mode
      const countingMode = await (
        this.api.Contract as GovernorCompatibilityBravo
      ).COUNTING_MODE();
      const params = new URLSearchParams(countingMode);
      this._supportsAbstain = params.get('support') === 'bravo';
      this._useAbstainInQuorum = params.get('quorum') !== 'bravo';
      const blockNumber = await this._api.Provider.getBlockNumber();
      this._quorumVotes = BigNumber.from(
        (
          await (this.api.Contract as GovernorCompatibilityBravo).quorum(
            blockNumber - 1,
          )
        ).toString(),
      );
      this._proposalThreshold = BigNumber.from(
        (
          await (
            this.api.Contract as GovernorCountingSimple
          ).proposalThreshold()
        ).toString(),
      );
    }

    this._initialized = true;
  }

  static async getProposals(compoundChain: Compound) {
    const { chain, accounts, governance, meta } = compoundChain;
    const res = await axios.get(
      `${chain.app.serverUrl()}${ApiEndpoints.FETCH_PROPOSALS}`,
      {
        params: {
          chainId: meta.id,
        },
      },
    );
    const proposals: ICompoundProposalResponse[] = res.data.result.proposals;
    proposals.forEach((p) => {
      if (!governance.store.getByIdentifier(p.identifier)) {
        new CompoundProposal(
          accounts,
          chain,
          governance,
          deserializeBigNumbers(p),
        );
      }
    });

    return governance.store.getAll();
  }

  public deinit() {
    this.store.clear();
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public createTx(...args: any[]): ITXModalData {
    throw new Error('Method not implemented.');
  }
}
