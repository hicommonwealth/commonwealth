import BN from 'bn.js';

import { IApp } from 'state';
import { CWProtocol, CWProject, CWProtocolMembers } from 'models/CWProtocol';
import { CwProjectFactory as CWProjectFactory } from 'CwProjectFactory';
import { CwTokenFactory as CWTokenFactory } from 'CwTokenFactory';
import TokenApi from '../token/api';

import CommonwealthChain from './chain';
import CommonwealthAPI, { EtherAddress } from './api';

import { CWProtocolStore, CWProtocolMembersStore } from '../../../../stores';
import ContractApi from '../contractApi';

const updatePeriod = 5 * 60 * 1000; // update in every 5 mins
export default class CommonwealthProtocol {
  private _initialized: boolean = false;
  private _app: IApp;
  private _api: CommonwealthAPI;
  private _projectStore = new CWProtocolStore();
  private _memberStore = new CWProtocolMembersStore();
  private _chain: CommonwealthChain;

  public get initialized() { return this._initialized };
  public get app() { return this._app; };
  public get projectStore() { return this._projectStore; };
  public get memberStore() { return this._memberStore; };

  constructor(app: IApp) {
    this._app = app;
  }

  public async init(chain: CommonwealthChain) {
    this._chain = chain;
    this._api = this._chain.CommonwealthAPI;

    const protocolFee = new BN((await this._api.Contract.protocolFee()).toString(), 10);
    const feeTo = await this._api.Contract.feeTo();

    const projects: CWProject[] =  await this._api.retrieveAllProjects();
    const newProtocol = new CWProtocol('cmn_projects', protocolFee, feeTo, projects);
    this._projectStore.add(newProtocol);

    this._initialized = true;
  }

  public async deinit() {
    this._projectStore.clear();
    this.memberStore.clear();
  }

  public async getProjectContractApi(projAddress: string, signer: string) {
    let projectAPI = this._api.getProjectAPI(projAddress);
    if (!projectAPI) {
      projectAPI = new ContractApi(
        CWProjectFactory.connect,
        projAddress,
        this._chain.api.currentProvider as any
      );
      this._api.setProjectAPI(projAddress, projectAPI);
    }
    const contract = await projectAPI.attachSigner(this._chain.app.wallets, signer);
    return contract;
  }

  public async syncMembers(bTokenAddress: string, cTokenAddress: string, projectHash: string) {
    let mStore = this._memberStore.getById(projectHash);
    let curators = [];
    let backers = [];

    if (!mStore || !mStore.updated_at) {
      // init when no memberStore
      curators = await this._api.getTokenHolders(cTokenAddress);
      backers = await this._api.getTokenHolders(bTokenAddress);
      mStore = new CWProtocolMembers(projectHash, backers, curators);
      this._memberStore.add(mStore);
    } else {
      // only update after 1 hour from the last update
      const afterHours = Math.floor(Math.abs(new Date().getTime() - mStore.updated_at.getTime()) / updatePeriod); 
      if (afterHours > 0) {
        curators = await this._api.getTokenHolders(cTokenAddress);
        backers = await this._api.getTokenHolders(bTokenAddress);
        mStore.setParticipants(backers, curators);
      } else {
        curators = mStore.curators;
        backers = mStore.backers;
      }
    }

    return { backers, curators };
  }

  public async syncProjects(force = false) {
    const pStore = this._projectStore.getById('cmn_projects');
    var afterHours = Math.floor(Math.abs(new Date().getTime() - pStore.updated_at.getTime()) / updatePeriod); // diff in hours
    let projects: CWProject[] = []
    if (force || afterHours > 1) {
      projects =  await this._api.retrieveAllProjects();
      pStore.setProjects(projects);
    } else {
      projects = pStore.projects;
    }
    return projects;
  }

  public async createProject(
    name: string,
    description: string,
    creator: string,
    beneficiary: string,
    threshold: number,
    curatorFee: number,
    period: number, // in days
  ) {
    const contract = await this._api.attachSigner(this._chain.app.wallets, creator);
    const res = await this._api.createProject(
      contract,
      name,
      [EtherAddress],
      description,
      creator,
      beneficiary,
      threshold,
      curatorFee,
      period
    );
    // if (res.status === 'success') await this.syncProjects(true);
    return res;
  }

  public async backOrCurate(
    amount: number,
    project: CWProject,
    isBacking: boolean,
    from: string,
    tokenAddress = EtherAddress,
  ) {
    const projContractAPI = await this.getProjectContractApi(project.address, from);
    let res = { status: 'success', error: '' };
    if (isBacking) {
      res = await this._api.back(projContractAPI, amount, tokenAddress);
    } else {
      res = await this._api.curate(projContractAPI, amount, tokenAddress);
    }
    return res;
  }

  public async approveCWToken(project: CWProject, isBToken: boolean, from: string, amount: number) {
    const api = new TokenApi(
      CWTokenFactory.connect,
      isBToken ? project.bToken : project.cToken,
      this._chain.api.currentProvider as any
    );
    const cwTokenContract = await api.attachSigner(this._chain.app.wallets, from);
    const approvalTx = await cwTokenContract.approve(
      project.address,
      amount,
      { gasLimit: 3000000 }
    );
    const approvalTxReceipt = await approvalTx.wait();
    if (approvalTxReceipt.status !== 1) {
      throw new Error('failed to approve amount');
    }
    return approvalTxReceipt;
  }

  public async redeemTokens(
    amount: number,
    isBToken: boolean,
    project: CWProject,
    from: string,
    tokenAddress = EtherAddress,
  ) {
    await this.approveCWToken(project, isBToken, from, amount);
    const projContractAPI = await this.getProjectContractApi(project.address, from);
    let res = { status: 'success', error: '' };
    if (isBToken) {
      res = await this._api.redeemBToken(projContractAPI, amount, tokenAddress);
    } else {
      res = await this._api.redeemCToken(projContractAPI, amount, tokenAddress);
    }
    return res;
  }

  public async withdraw(
    project: CWProject,
    from: string,
  ) {
    const projContractAPI = await this.getProjectContractApi(project.address, from);
    const res = await this._api.withdraw(projContractAPI);
    return res;
  }
}