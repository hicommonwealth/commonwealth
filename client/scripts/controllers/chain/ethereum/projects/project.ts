import $ from 'jquery';
import app from 'state';
import moment from 'moment';

import { BigNumber, providers } from 'ethers';
import { IProject, IProject__factory } from 'eth/types';
import ParticipantStore from './participant_store';
import { CWBacker, CWCurator } from './participants';
import { attachSigner } from '../contractApi';

export class CWProject {
  private _Contract: IProject;
  public get Contract() { return this._Contract; }

  private _Provider: providers.Provider;
  public get Provider() { return this._Provider; }

  private _address: string;
  public get address() { return this._address; }

  private _initialized: boolean;
  public get initialized() { return this._initialized; }

  private _id: number;
  public get id() { return this._id; }

  private _ipfsHash: string;
  public get ipfsHash() { return this._ipfsHash; }

  private _beneficiary: string;
  public get beneficiary() { return this._beneficiary; }

  private _creator: string;
  public get creator() { return this._creator; }

  private _title: string;
  public get title() { return this._title; }

  private _description: string;
  public get description() { return this._description; }

  private _deadline: moment.Moment;
  public get deadline() { return this._deadline; }

  private _threshold: string;
  public get threshold() { return this._threshold; }

  private _funding: BigNumber;
  public get funding() { return this._funding; }

  private _curatorFee: number;
  public get curatorFee() { return this._curatorFee; }

  private _backers: ParticipantStore<CWBacker>;
  public get backers() { return this._backers; }

  private _curators: ParticipantStore<CWCurator>;
  public get curators() { return this._curators; }

  constructor(
    provider: providers.Provider,
    address: string,
    id: number,
    ipfsHash: string,
    beneficiary: string,
    creator: string,
    title: string,
    description: string,
    deadline: moment.Moment,
    threshold: string,
    curatorFee: number,
  ) {
    this._id = id;
    this._Provider = provider;
    this._ipfsHash = ipfsHash;
    this._beneficiary = beneficiary;
    this._creator = creator;
    this._address = address;
    this._title = title;
    this._description = description;
    this._deadline = deadline;
    this._threshold = threshold;
    this._curatorFee = curatorFee;
    this._backers = new ParticipantStore<CWBacker>();
    this._curators = new ParticipantStore<CWCurator>();
  }

  // Called from Project page to enable backing, curating
  public async init() {
    if (this._initialized) return;
    this._Contract = IProject__factory.connect(this._address, this._Provider);
    // check for deployed? maybe not
    this._initialized = true;
  }

  // Wll not work until we figure out how to get a wallet
  public async back(value: string) {
    if (!this.initialized) {
      throw new Error('Project not initialized')
    }
    const backerAddress = app.user.activeAccount.address;
    const contract = await attachSigner(app.wallets, backerAddress, this.Contract);
    const tx = await contract.back('token', value, { from: 'callers address' });
    const txReceipt = await tx.wait();
    if (txReceipt.status !== 1) {
      throw new Error('Failed to back');
    }
    // check out eventHandlers/identity
    // if we get this from chain it's a source of truth; we don't need to verify
    try {
      const response = await $.post(`${app.serverUrl()}/updateBackers`, {
        'backer_id': 'TODO: How do we get this from tx? Should be in tx receipt',
        'backer_address': 'TODO: How do we get this from tx?',
        'project_id': this.id,
      });

      // backport voter store for similar code?
      const backer = new CWBacker(
        response.result.id,
        this.id,
        response.result.backerId,
        response.result.backerAddress,
        response.result.backerAmount,
      );
      this._backers.addOrUpdate(backer);
    } catch (err) {
      // TODO
    }
    return txReceipt;
  }

  public async curate(value: string) {
    if (!this.initialized) {
      throw new Error('Project not initialized')
    }
    const curatorAddress = app.user.activeAccount.address;
    const contract = await attachSigner(app.wallets, curatorAddress, this.Contract);
    const tx = await contract.curate('token', value, { from: 'callers address' });
    const txReceipt = await tx.wait();
    if (txReceipt.status !== 1) {
      throw new Error('Failed to back');
    }
    try {
      const response = await $.post(`${app.serverUrl()}/updateCurators`, {
        'curator_id': 'TODO: How do we get this from tx?',
        'curator_address': 'TODO: How do we get this from tx?',
        'project_id': this.id,
      });

      const curator = new CWCurator(
        response.result.id,
        this.id,
        response.result.curatorId,
        response.result.curatorAddress,
        response.result.curatorAmount,
      );
      this._curators.addOrUpdate(curator);
    } catch (err) {
      // TODO
    }
    return txReceipt;
  }

  public async beneficiaryWithdraw() {
    if (!this.initialized) {
      throw new Error('Project not initialized')
    }

    const contract = await attachSigner(app.wallets, this.beneficiary, this.Contract);
    const tx = await contract.beneficiaryWithdraw(); // TODO: Flesh out
    const txReceipt = await tx.wait();
    if (txReceipt.status !== 1) {
      throw new Error('Failed to withdraw funds');
    }
    return txReceipt;
  }

  public async backerWithdraw() {
    if (!this.initialized) {
      throw new Error('Project not initialized')
    }
    // TODO: Do we want to check/list/display which addresses they've backed under, to
    // prevent confusion / them searching through looking for funds?
    const backerAddress = app.user.activeAccount.address;
    const contract = await attachSigner(app.wallets, backerAddress, this.Contract);
    const tx = await contract.backerWithdraw(); // TODO: Flesh out
    const txReceipt = await tx.wait();
    if (txReceipt.status !== 1) {
      throw new Error('Failed to withdraw funds');
    }
    return txReceipt;
  }

  public async curatorWithdraw() {
    if (!this.initialized) {
      throw new Error('Project not initialized')
    }
    // TODO: Do we want to check/list/display which addresses they've curated under, to
    // prevent confusion / them searching through looking for funds?
    const curatorAddress = app.user.activeAccount.address;
    const contract = await attachSigner(app.wallets, curatorAddress, this.Contract);
    const tx = await contract.curatorWithdraw(); // TODO: Flesh out
    const txReceipt = await tx.wait();
    if (txReceipt.status !== 1) {
      throw new Error('Failed to withdraw funds');
    }
    return txReceipt;
  }
}

// TODO: Event listeners for
// Deposit
// Curate
// Success
// Failure
// ProjectCreation