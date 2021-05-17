import { utils } from 'ethers';
import $ from 'jquery';
import BN from 'bn.js';

import app, { IApp } from 'state';
import { ERC20Token } from 'adapters/chain/ethereum/types';
import { CWProtocol, CWProject } from 'models/CWProtocol';
import { CwProtocolFactory as CWProtocolFactory } from 'CwProtocolFactory';
import { CwProjectFactory as CWProjectFactory } from 'CwProjectFactory';
import { CwProject as CWProjectContract } from 'CWProject';

import CommonwealthChain from './chain';
import CommonwealthAPI from './api';

import { CWProtocolStore } from '../../../../stores';

// const expandTo18Decimals = (n: number): BN => {
//   return new BN(n).mul((new BN(10)).pow(new BN(18)))
// };

export default class CommonwealthProtocol {
  private _initialized: boolean = false;
  private _app: IApp;
  private _api: CommonwealthAPI;
  private _store = new CWProtocolStore();
  private _chain: CommonwealthChain;

  private _activeProjectHash: string;
  private _activeProjectContract: CWProjectContract;

  public get initalized() { return this._initialized };
  public get app() { return this._app; }
  public get store() { return this._store; }

  constructor(app: IApp) {
    this._app = app;
  }

  public async init(chain: CommonwealthChain) {
    this._chain = chain;
    this._api = this._chain.CommonwealthAPI;

    const protocolFee = new BN((await this._api.Contract.protocolFee()).toString(), 10);
    const feeTo = await this._api.Contract.feeTo();

    const projects: CWProject[] =  await this.retrieveProjects();
    const newProtocol = new CWProtocol('root', 'root', protocolFee, feeTo, projects);

    this.store.add(newProtocol);
  }

  public async retrieveProjects() {
    let projects: CWProject[] =  [];
    const allProjectLenght = new BN((await this._api.Contract.allProjectsLength()).toString(), 10);
    if (allProjectLenght.gt(new BN(0))) {
      // const ps: CWProject[] = this._api.Contract.allProjects();
    }

    return projects;
  }

  public async deinit() {
    this.store.clear();
  }

  public async updateState() {
    const projects: CWProject[] =  await this.retrieveProjects();
    const protocolStore = this.store.getById('root');
    await protocolStore.setProjects(projects);
  }

  public async createProject(
    u_name: string,
    description: string,
    creator: string,
    beneficiary: string,
    u_threshold: number,
    curatorFee: number,
    deadline = 24 * 60 * 60, // 5 minutes
    backWithEther = true,
    token?: ERC20Token
  ) {
    const api = this._chain.CommonwealthAPI;
    // const threshold = expandTo18Decimals(u_threshold).clone();
    const threshold = u_threshold;
    const name = utils.formatBytes32String(u_name);
    const ipfsHash = utils.formatBytes32String('0x01');
    const cwUrl = utils.formatBytes32String('commonwealth.im');
    const acceptedTokens = ['0x01'];
    const nominations = ['0x01'];

    console.log('====>', new utils.BigNumber(1));

    const newProjectData = {
      name,
      description,
      ipfsHash,
      beneficiary,
      acceptedTokens,
      nominations,
      threshold,
      endtime: Math.ceil(Date.now() / 1000) + deadline,
      curatorFee,
      projectHash: utils.solidityKeccak256(
        ['address', 'address', 'bytes32', 'uint256'],
        [creator, beneficiary, name, threshold.toString()]
      ),
    }
    console.log('=====>newProjectData', newProjectData)
    const res = api.Contract.createProject(
      name,
      ipfsHash,
      cwUrl,
      beneficiary,
      acceptedTokens,
      nominations,
      threshold,
      deadline,
      curatorFee,
      '',
    )
    // console.log('====>Res', res);
  }

  public async setProjectContract(projectHash: string) {
    const api = this._chain.CommonwealthAPI;
    this._activeProjectHash = projectHash;
    const activeProjectAddress:string = await api.Contract.projects(projectHash);
    this._activeProjectContract = await CWProjectFactory.connect(activeProjectAddress, this._api.Provider);
  }

  private async syncActiveProject(projectHash: string) {
    if (!this._activeProjectHash || !this._activeProjectContract) {
      await this.setProjectContract(projectHash);
    }
    if (this._activeProjectHash !== projectHash) {
      await this.setProjectContract(projectHash);
    }
  }

  public async backProject(
    amount: number,
    projectHash: string,
  ) {
    await this.syncActiveProject(projectHash);
    await this._activeProjectContract.back('0x01', amount)
  }

  public async curateProject(
    amount: number,
    projectHash: string,
  ) {
    await this.syncActiveProject(projectHash);
    await this._activeProjectContract.curate('0x01', amount)
  }

  public async redeemBToken(
    amount: number,
    projectHash: string,
  ) {
    await this.syncActiveProject(projectHash);
    await this._activeProjectContract.redeemBToken('0x01', amount)
  }

  public async redeemCToken(
    amount: number,
    projectHash: string,
  ) {
    await this.syncActiveProject(projectHash);
    await this._activeProjectContract.redeemCToken('0x01', amount)
  }

  public async getCollatoralAmount(isBToken, address, projectHash) {
  }
}
 