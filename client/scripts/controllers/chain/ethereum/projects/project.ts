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
  private _address: string;
  // AAVE has equivalent—controllers/chain/ethereum/aave/proposal init call
  // $.getJSON(`https://ipfs.infura.io:5001/api/v0/cat?arg=${this._ipfsAddress}`).then((ipfsData) => {
  //   this._ipfsData = ipfsData;
  // }).catch((e) => console.error(`Failed to fetch ipfs data for ${this._ipfsAddress}`));

  private _initialized: boolean;
  public get initialized() { return this._initialized; }

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
    public readonly provider: providers.Provider,
    public readonly address: string,
    public readonly id: number,
    public readonly ipfsHash: string,
    public readonly beneficiary: string,
    public readonly creator: string,
    title: string,
    description: string,
    deadline: moment.Moment,
    threshold: string,
    curatorFee: number,
  ) {
    this._Provider = provider;
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
    // throw an error—UI element shouldn't be availble til this._initialized
    // TODO: get a signer / provider?
    const tx = await this._Contract.back('token', value, { from: 'callers address' });
    const txReceipt = await tx.wait();
    // attachSigner, activeAddress as from
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
    const tx = await this._Contract.curate('token', value, { from: 'callers address' });
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