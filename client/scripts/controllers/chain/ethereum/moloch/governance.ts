import BN from 'bn.js';

import { ProposalModule, ITXModalData } from 'models/models';

import { ICompletable } from 'adapters/shared';
import { IMolochProposalResponse } from 'adapters/chain/moloch/types';
import ChainObjectController from 'controllers/server/chain_objects';
import { BigNumber } from 'ethers/utils';

import MolochProposal from './proposal';
import MolochMembers from './members';
import MolochAPI from './api';

export default class MolochGovernance extends ProposalModule<
  MolochAPI,
  IMolochProposalResponse,
  ICompletable,
  MolochProposal,
  null
> {
  // MEMBERS
  private _proposalCount: BN;
  private _proposalDeposit: BN;
  private _gracePeriod: BN;
  private _summoningTime: BN;
  private _votingPeriodLength: BN;
  private _periodDuration: BN;
  private _abortWindow: BN;
  private _totalShares: BN;
  private _totalSharesRequested: BN;
  private _guildBank: string;

  private _api: MolochAPI;
  private _Members: MolochMembers;
  private _useChainProposalData: boolean;
  private _fetcher: ChainObjectController<IMolochProposalResponse>;

  // GETTERS
  public get proposalCount() { return this._proposalCount; }
  public get proposalDeposit() { return this._proposalDeposit; }
  public get gracePeriod() { return this._gracePeriod; }
  public get summoningTime() { return this._summoningTime; }
  public get votingPeriodLength() { return this._votingPeriodLength; }
  public get periodDuration() { return this._periodDuration; }
  public get abortWindow() { return this._abortWindow; }
  public get totalShares() { return this._totalShares; }
  public get totalSharesRequested() { return this._totalSharesRequested; }
  public get guildbank() { return this._guildBank; }
  public get currentPeriod() {
    return ((Date.now() / 1000) - this.summoningTime.toNumber()) / this.periodDuration.toNumber();
  }

  public get api() { return this._api; }
  public get useChainProposalData() { return this._useChainProposalData; }
  public get fetcher() { return this._fetcher; }

  // INIT / DEINIT
  public async init(
    api: MolochAPI,
    MolochMembers: MolochMembers,
    chainObjectId: string,
    useChainProposalData = false,
  ) {
    this._Members = MolochMembers;
    this._useChainProposalData = useChainProposalData;
    this._api = api;
    this._guildBank = await this._api.Contract.guildBank();

    this._totalSharesRequested = new BN((await this._api.Contract.totalSharesRequested()).toString(), 10);
    this._totalShares = new BN((await this._api.Contract.totalShares()).toString(), 10);
    this._gracePeriod = new BN((await this._api.Contract.gracePeriodLength()).toString(), 10);
    this._abortWindow = new BN((await this._api.Contract.abortWindow()).toString(), 10);
    this._summoningTime = new BN((await this._api.Contract.summoningTime()).toString(), 10);
    this._votingPeriodLength = new BN((await this._api.Contract.votingPeriodLength()).toString(), 10);
    this._periodDuration = new BN((await this._api.Contract.periodDuration()).toString(), 10);
    this._proposalDeposit = new BN((await this._api.Contract.proposalDeposit()).toString(), 10);

    // fetch all proposals
    let proposalObjects: IMolochProposalResponse[];
    if (this._useChainProposalData) {
      console.log('Fetching moloch proposals from chain.');
      proposalObjects = [];
      const queueLength = await api.Contract.getProposalQueueLength();
      for (let n = 0; n < queueLength.toNumber(); ++n) {
        const rawProposal = await api.Contract.proposalQueue(n);
        const iProp = this.convertChainProposal(n, rawProposal);
        proposalObjects.push(iProp);
      }
    } else {
      console.log('Fetching moloch proposals from backend.');
      this._fetcher = new ChainObjectController<IMolochProposalResponse>(chainObjectId);
      const chainObjects = await this._fetcher.fetch();
      proposalObjects = chainObjects.map(({ objectData }) => objectData);
    }
    proposalObjects.map((p) => new MolochProposal(this._Members, this, p));
    this._proposalCount = new BN(proposalObjects.length);
    this._initialized = true;
  }

  public deinit() {
    this.store.clear();
  }

  public createTx(...args: any[]): ITXModalData {
    throw new Error('Method not implemented.');
  }

  public async approveShares(amountToApprove: BN) {
    // if (this._Members.api.userAddress !== this.address) {
    //   throw new Error('can only have metamask verified user approve tokens');
    // }

    const approvalTx = await this.api.tokenContract.approve(
      this._api.contractAddress,
      amountToApprove.toString(),
      { gasLimit: this._Members.api.gasLimit }
    );
    const approvalTxReceipt = await approvalTx.wait();
    if (approvalTxReceipt.status !== 1) {
      throw new Error('failed to approve amount');
    }

    // trigger update to refresh holdings
    return approvalTxReceipt;
  }

  // web wallet only create proposal transaction
  public async createPropWebTx(
    applicantAddress: string,
    tokenTribute: BN,
    sharesRequested: BN,
    details: string,
  ): Promise<MolochProposal> {
    if (!(await this._Members.isSenderDelegate())) {
      throw new Error('sender must be valid delegate');
    }

    if (parseInt(applicantAddress, 16) === 0) {
      throw new Error('applicant cannot be 0');
    }

    const MAX_N_SHARES = new BN(10).pow(new BN(18));
    const newShareCount = sharesRequested.add(this.totalShares).add(this.totalSharesRequested);
    if (newShareCount.gt(MAX_N_SHARES)) {
      throw new Error('too many shares requested');
    }

    // first, we must approve xfer of proposal deposit tokens from the submitter
    const approvalTx = await this._api.tokenContract.approve(
      this._api.userAddress,
      this.proposalDeposit.toString(),
      { gasLimit: this._api.gasLimit }
    );
    const approvalTxReceipt = await approvalTx.wait();
    if (approvalTxReceipt.status !== 1) {
      throw new Error('failed to approve proposal deposit');
    }

    // once approved we assume the applicant has approved the tribute and proceed
    const tx = await this._api.Contract.submitProposal(
      applicantAddress.toLowerCase(),
      tokenTribute.toString(),
      sharesRequested.toString(),
      details,
      { gasLimit: this._api.gasLimit },
    );
    const txReceipt = await tx.wait();
    if (txReceipt.status !== 1) {
      throw new Error('failed to submit proposal');
    }

    // if successful, refresh list of proposals to include new one
    if (this._useChainProposalData) {
      const queueLength = (await this.api.Contract.getProposalQueueLength()).toNumber();
      const currentCount = this._proposalCount.toNumber();
      let result: MolochProposal;
      for (let n = currentCount; n < queueLength; ++n) {
        const rawProposal = await this.api.Contract.proposalQueue(n);
        const iProp = this.convertChainProposal(n, rawProposal);
        const p = new MolochProposal(this._Members, this, iProp);
        if (p.data.applicantAddress === applicantAddress.toLowerCase()) {
          result = p;
        }
      }
      this._proposalCount = new BN(queueLength);
      return result;
    } else {
      const newObjects = await this._fetcher.forceUpdate('ADD');
      newObjects.map((p) => {
        if (this.store.getByIdentifier(p.objectData.id)) return;
        return new MolochProposal(this._Members, this, p.objectData);
      });
      this._proposalCount = new BN(this.store.getAll().length);
      return this.store.getAll().find((p) => p.applicantAddress === applicantAddress.toLowerCase());
    }
  }

  // converts a proposal object from the Contract into the equivalent
  // chain object type
  public convertChainProposal(
    n: number,
    p: {
      proposer: string;
      applicant: string;
      sharesRequested: BigNumber;
      startingPeriod: BigNumber;
      yesVotes: BigNumber;
      noVotes: BigNumber;
      processed: boolean;
      didPass: boolean;
      aborted: boolean;
      tokenTribute: BigNumber;
      details: string;
      maxTotalSharesAtYesVote: BigNumber;
      0: string;
      1: string;
      2: BigNumber;
      3: BigNumber;
      4: BigNumber;
      5: BigNumber;
      6: boolean;
      7: boolean;
      8: boolean;
      9: BigNumber;
      10: string;
      11: BigNumber;
    }
  ): IMolochProposalResponse {
    const startingPeriod = new BN(p.startingPeriod.toString());
    // convert into object data
    return {
      id: `${n}`,
      identifier: `${n}`,
      details: p.details,
      timestamp: startingPeriod.mul(this.periodDuration).add(this.summoningTime).toString(),
      startingPeriod: p.startingPeriod.toString(),
      delegateKey: p.proposer,
      applicantAddress: p.applicant,
      tokenTribute: p.tokenTribute.toString(),
      sharesRequested: p.sharesRequested.toString(),
      processed: p.processed,
      status: p.aborted ? 'ABORTED' :
        p.didPass ? 'PASSED' :
        p.processed ? 'FAILED' :
        startingPeriod.ltn(this.currentPeriod) ? 'IN_QUEUE' : 'VOTING_PERIOD',
      votes: [],
      yesVotes: p.yesVotes.toString(),
      noVotes: p.noVotes.toString(),
    };
  }
}
