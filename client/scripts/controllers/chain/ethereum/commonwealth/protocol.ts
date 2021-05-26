import { utils } from 'ethers';
import BN from 'bn.js';
import moment from 'moment';

import { Coin } from 'adapters/currency';

import { IApp } from 'state';
import { CWProtocol, CWProject } from 'models/CWProtocol';
import { CwProjectFactory as CWProjectFactory } from 'CwProjectFactory';
import { CwProject as CWProjectContract } from 'CwProject';

import CommonwealthChain from './chain';
import CommonwealthAPI from './api';

import { CWProtocolStore } from '../../../../stores';

const expandTo18Decimals = (n: number): BN => {
  return new BN(n).mul((new BN(10)).pow(new BN(18)))
};

export default class CommonwealthProtocol {
  private _initialized: boolean = false;
  private _app: IApp;
  private _api: CommonwealthAPI;
  private _store = new CWProtocolStore();
  private _chain: CommonwealthChain;

  // private _activeProjectHash: string;
  // private _activeProjectContract: CWProjectContract;

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

    await this.createProject(
      'cmn first project',
      'project that is running on cw protocol',
      '0xF5B35b607377850696cAF2ac4841D61E7d825a3b',
      '0xF5B35b607377850696cAF2ac4841D61E7d825a3b',
      '1',
      '1',
      '1',
    )

    this.store.add(newProtocol);
  }

  public async getProjectDetails(projAddress: string) {
    const projContract: CWProjectContract = await CWProjectFactory.connect(projAddress, this._api.Provider);

    const name = await projContract.name();
    const ipfsHash = await projContract.ipfsHash();
    const cwUrl = await projContract.cwUrl();
    const beneficiary = await projContract.beneficiary();
    const threshold = await projContract.threshold();
    const curatorFee = await projContract.curatorFee();
    const creator = await projContract.creator();
    const totalFunding = await projContract.totalFunding();

    const projectHash = utils.solidityKeccak256(
      ['address', 'address', 'bytes32', 'uint256'],
      [creator, beneficiary, name, threshold.toString()]
    );
    const daedline = (new BN((await projContract.deadline()).toString()).mul(new BN(1000))).toNumber();
    const endTime = new Date(daedline);
    const funded = await projContract.funded();

    let status = 'In Progress';
    if ((new Date()).getTime() - endTime.getTime() > 0) {
      if (funded) {
        status = 'Successed';
      } else {
        status = 'Failed';
      }
    }

    const bToken = await projContract.bToken();
    const backers = []  // get bToken holders

    const cToken = await projContract.cToken();
    const curators = []  // get cToken holders

    const newProj = new CWProject(
      utils.parseBytes32String(name),
      '',
      utils.parseBytes32String(ipfsHash),
      utils.parseBytes32String(cwUrl),
      beneficiary,
      '0x00', // aceptedTokens
      [], // nominations,
      threshold,
      endTime,
      curatorFee,
      projectHash,
      status,
      totalFunding,
      backers,
      curators
    );

    return newProj;
  }

  public async retrieveProjects() {
    const projects: CWProject[] =  [];
    const allProjectLenght = new BN((await this._api.Contract.allProjectsLength()).toString(), 10);
    if (allProjectLenght.gt(new BN(0))) {
      const projectAddresses = await this._api.Contract.getAllProjects();
      for (let i=0; i<projectAddresses.length; i++) {
        const proj: CWProject = await this.getProjectDetails(projectAddresses[i]);
        projects.push(proj);
      }
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
    u_description: string,
    creator: string,
    beneficiary: string,
    u_threshold: string,
    u_curatorFee: string,
    u_period = '1', // 1 day
    backWithEther = true,
    token?: ERC20Token
  ) {
    const api = this._chain.CommonwealthAPI;
    await api.attachSigner(this._chain.app.wallets, '0xF5B35b607377850696cAF2ac4841D61E7d825a3b');
    console.log('====>after attach signer', api);


    // const threshold = new utils.BigNumber(parseFloat(u_threshold));
    // const name = utils.formatBytes32String(u_name);
    // const ipfsHash = utils.formatBytes32String('0x01');
    // const cwUrl = utils.formatBytes32String('commonwealth.im');
    // const acceptedTokens = ['0x0000000000000000000000000000000000000000'];
    // const nominations = [creator, beneficiary];
    // const projectHash = utils.solidityKeccak256(
    //   ['address', 'address', 'bytes32', 'uint256'],
    //   [creator, beneficiary, name, threshold.toString()]
    // );
    // const endtime = Math.ceil(Date.now() / 1000) + parseFloat(u_period) * 24 * 60;
    // const curatorFee = parseFloat(u_curatorFee);

    // const tx = await api.Contract.createProject(
    //   name,
    //   ipfsHash,
    //   cwUrl,
    //   beneficiary,
    //   acceptedTokens,
    //   nominations,
    //   threshold,
    //   endtime,
    //   curatorFee,
    //   '',
    // )
    // const txReceipt = await tx.wait();
    // if (txReceipt.status !== 1) {
    //   throw new Error('failed to submit vote');
    // }
    // console.log('====>txReceipt', txReceipt);
  }

  // public async setProjectContract(projectHash: string) {
  //   const api = this._chain.CommonwealthAPI;
  //   this._activeProjectHash = projectHash;
  //   const activeProjectAddress:string = await api.Contract.projects(projectHash);
  //   this._activeProjectContract = await CWProjectFactory.connect(activeProjectAddress, this._api.Provider);
  // }

  // private async syncActiveProject(projectHash: string) {
  //   if (!this._activeProjectHash || !this._activeProjectContract) {
  //     await this.setProjectContract(projectHash);
  //   }
  //   if (this._activeProjectHash !== projectHash) {
  //     await this.setProjectContract(projectHash);
  //   }
  // }

  public async getProjectContract(proj: string, byHash = false) {
    let projecAddress = proj;
    if (byHash) {
      projecAddress = await this._api.Contract.projects(proj);
    }
    const projectContract: CWProjectContract = await CWProjectFactory.connect(proj, this._api.Provider);
    return projectContract;
  }

  public async backProject(
    amount: number,
    projectHash: string,
  ) {
    // await this.syncActiveProject(projectHash);
    // await this._activeProjectContract.back('0x01', amount)
  }

  public async curateProject(
    amount: number,
    projectHash: string,
  ) {
    // await this.syncActiveProject(projectHash);
    // await this._activeProjectContract.curate('0x01', amount)
  }

  public async redeemBToken(
    amount: number,
    projectHash: string,
  ) {
    // await this.syncActiveProject(projectHash);
    // await this._activeProjectContract.redeemBToken('0x01', amount)
  }

  public async redeemCToken(
    amount: number,
    projectHash: string,
  ) {
    // await this.syncActiveProject(projectHash);
    // await this._activeProjectContract.redeemCToken('0x01', amount)
  }

  public async getCollatoralAmount(isBToken, address, projectHash) {
  }
}
 