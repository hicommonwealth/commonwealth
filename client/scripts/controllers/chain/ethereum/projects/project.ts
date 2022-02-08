import $ from 'jquery';
import app from 'state';
import moment from 'moment';

import { BigNumber, providers } from 'ethers';
import { IProject, IProject__factory } from 'eth/types';
import ParticipantStore from './participant_store';
import { CWBacker, CWCurator } from './participants';

export class CWProject {
  private _Contract: IProject;
  private _Provider: providers.Provider;
  private _address: string; // Reconcile against ipfsHash prop

  private _initialized: boolean;
  public get initialized() { return this._initialized; }

  private _id: number;
  public get id() { return this._id; }

  private _ipfsHash: string;
  public get ipfsHash() { return this._ipfsHash; }

  private _chain: string;
  public get chain() { return this._chain; }

  private _creator: string;
  public get creator() { return this._creator; }

  private _beneficiary: string;
  public get beneficiary() { return this._beneficiary; }

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
    this._Provider = provider;
    this._address = address;
    this._id = id;
    this._ipfsHash = ipfsHash; // Is this same as address? Get clear what ipfsHash even is
    this._beneficiary = beneficiary;
    this._creator = creator;
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
    this._initialized = true;
  }

  // Wll not work until we figure out how to get a wallet
  public async back(value: string) {
    // TODO: get a signer / provider?
    const tx = await this._Contract.back('token', value, { from: 'callers address' });
    const txReceipt = await tx.wait();
    if (txReceipt.status !== 1) {
      throw new Error('Failed to back');
    }
    try {
      const response = await $.post(`${app.serverUrl()}/updateBackers`, {
        'backer_id': 'TODO: How do we get this from tx?',
        'backer_address': 'TODO: How do we get this from tx?',
        'project_id': this._id,
      });

      const backer = new CWBacker(
        response.result.id,
        this._id,
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
    const tx = await this._Contract.curate('token', value, { from: 'callers address' });
    const txReceipt = await tx.wait();
    if (txReceipt.status !== 1) {
      throw new Error('Failed to back');
    }
    try {
      const response = await $.post(`${app.serverUrl()}/updateCurators`, {
        'curator_id': 'TODO: How do we get this from tx?',
        'curator_address': 'TODO: How do we get this from tx?',
        'project_id': this._id,
      });

      const curator = new CWCurator(
        response.result.id,
        this._id,
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
    const tx = await this._Contract.beneficiaryWithdraw(); // TODO: Flesh out
    const txReceipt = await tx.wait();
    if (txReceipt.status !== 1) {
      throw new Error('Failed to back');
    }
    return txReceipt;
  }

  public async backerWithdraw() {
    const tx = await this._Contract.backerWithdraw(); // TODO: Flesh out
    const txReceipt = await tx.wait();
    if (txReceipt.status !== 1) {
      throw new Error('Failed to back');
    }
    return txReceipt;
  }

  public async curatorWithdraw() {
    const tx = await this._Contract.curatorWithdraw(); // TODO: Flesh out
    const txReceipt = await tx.wait();
    if (txReceipt.status !== 1) {
      throw new Error('Failed to back');
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