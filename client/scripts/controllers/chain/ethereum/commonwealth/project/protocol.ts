import BN from 'bn.js';

import { IApp } from 'state';
import { Project__factory, CWToken__factory } from 'eth/types';
import { CMNProjectStore, CMNProjectMembersStore } from '../../../../../stores';
import { CMNProjectProtocol, CMNProject, CMNProjectMembers } from '../../../../../models';

import CMNProjectAPI, { EtherAddress, ProjectMetaData } from './api';
import CMNChain from '../chain';
import { attachSigner } from '../../contractApi';

export default class ProjectProtocol {
  private _projectStore = new CMNProjectStore();
  public get projectStore() { return this._projectStore; }

  private _memberStore = new CMNProjectMembersStore();
  public get memberStore() { return this._memberStore; }

  private _chain: CMNChain;
  private _api: CMNProjectAPI;

  private _syncPeriod = 5 * 60 * 1000; // update in every 5 mins

  private _initialized: boolean = false;
  public get initialized() { return this._initialized; }

  private _app: IApp;
  public get app() { return this._app; }

  constructor(app: IApp) {
    this._app = app;
  }

  public async init(chain: CMNChain) {
    this._chain = chain;
    this._api = this._chain.CMNProjectApi;

    const protocolData = await this._api.Contract.protocolData();

    // const protocolFee = new BN((await this._api.Contract.protocolFee()).toString(), 10);
    const protocolFee = protocolData.protocolFee;
    const feeTo = protocolData.feeTo;
    const projects: CMNProject[] = await this._api.retrieveAllProjects();

    this._projectStore.add(new CMNProjectProtocol('cmn_projects', protocolFee, feeTo, projects));
  }

  public async deinit() {
    this._projectStore.clear();
    this.memberStore.clear();
  }

  public async getProjectContractApi(projAddress: string, signer: string) {
    let projectApi = this._api.getProjectAPI(projAddress);
    if (!projectApi) {
      projectApi = await Project__factory.connect(
        projAddress,
        this._chain.api.currentProvider as any
      );
      this._api.setProjectAPI(projAddress, projectApi);
    }
    const contract = await projectApi.attachSigner(this._chain.app.wallets, signer);
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
      mStore = new CMNProjectMembers(projectHash, backers, curators);
      this._memberStore.add(mStore);
    } else {
      // only update after 1 hour from the last update
      const afterHours = Math.floor(Math.abs(new Date().getTime() - mStore.updated_at.getTime()) / this._syncPeriod);
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
    const afterHours = Math.floor(
      Math.abs(new Date().getTime() - pStore.updated_at.getTime()) / this._syncPeriod
    ); // diff in hours

    let projects: CMNProject[] = [];
    if (force || afterHours > 1) {
      projects =  await this._api.retrieveAllProjects();
      pStore.setProjects(projects);
    } else {
      projects = pStore.projects;
    }
    return projects;
  }

  public async createProject(params: ProjectMetaData) {
    params.acceptedTokens = [EtherAddress];
    const contract = await attachSigner(this._chain.app.wallets, params.creator, this._api.Contract);
    return this._api.createProject(contract, params);
  }

  public async backOrCurate(
    amount: number,
    project: CMNProject,
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

  public async approveCWToken(project: CMNProject, isBToken: boolean, from: string, amount: number) {
    const tokenAdddress = isBToken ? project.bToken : project.cToken;
    const tokenApi = CWToken__factory.connect(
      tokenAdddress,
      this._chain.api.currentProvider as any
    );
    const cwTokenContract = await attachSigner(this._chain.app.wallets, from, tokenApi);

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
}
