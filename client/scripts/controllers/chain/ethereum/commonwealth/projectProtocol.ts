import {
  ProjectFactory__factory as CMNProjectProtocolContract,
  Project__factory,
  CWToken__factory,
  ERC20__factory
} from 'eth/types';

import { CMNProjectStore, CMNMembersStore } from '../../../../stores';
import { CMNProjectProtocol, CMNProject, CMNMembers } from '../../../../models';
import EthereumChain from '../chain';
import { attachSigner } from '../contractApi';

import CMNProjectProtocolApi from './project/protocolApi';
import CMNProjectApi from './project/projectApi';
import { needSync, ProjectMetaData, getTokenHolders } from './utils';

export default class ProjectProtocol {
  private _chain: EthereumChain;
  private _api: CMNProjectProtocolApi;

  private _projectApis; // store all project's APIs
  private _projectAddresses: string[];
  private _projectStore = new CMNProjectStore();
  private _memberStore = new CMNMembersStore();

  public async init(chain: EthereumChain, projectProtocolAddress: string) {
    this._chain = chain;

    // init project protocol API
    const projectProtocolApi = new CMNProjectProtocolApi(
      CMNProjectProtocolContract.connect,
      projectProtocolAddress,
      this._chain.api.currentProvider as any
    );
    this._api = projectProtocolApi;

    // init projectApis
    this._projectApis = {};
    this._projectAddresses = await this._api.Contract.getAllProjects();
    for (let i = 0; i < this._projectAddresses.length; i++) {
      await this._syncProjectAPI(this._projectAddresses[i]);
    }
    // init store
    await this._syncProtocolStore();
    const pStore = this._projectStore.getById('cmn_projects');
    const projects = pStore.projects;
    for (let i = 0; i < projects.length; i++) {
      await this._syncMemberStore(projects[i]);
    }
  }

  private async _syncMemberStore(project: CMNProject) {
    const mStore = this._memberStore.getById(project.address);
    if (mStore && !needSync(mStore.updated_at)) {
      return mStore;
    }

    const backers = {};
    const curators = {};
    // const { bTokens, cTokens, acceptedTokens } = project;
    // for (let i = 0; i < acceptedTokens.length; i++) {
    //   const token = acceptedTokens[i].address;
    //   if (bTokens[token]) {
    //     backers[token] = await getTokenHolders(bTokens[token]);
    //   }
    //   if (cTokens[token]) {
    //     curators[token] = await getTokenHolders(cTokens[token]);
    //   }
    // }

    if (!mStore) {
      this._memberStore.add(new CMNMembers(project.address, backers, curators));
    } else {
      mStore.set(backers, curators);
    }
    return this._memberStore.getById(project.address);
  }

  private async _syncProtocolStore() {
    const pStore = this._projectStore.getById('cmn_projects');
    if (pStore && pStore.updated_at) {
      console.log('===>needSync(pStore.updated_at)', needSync(pStore.updated_at));
    }
    if (pStore && !needSync(pStore.updated_at)) {
      return pStore;
    }

    const projApisArray = [];
    for (let i = 0; i < this._projectAddresses.length; i++) {
      projApisArray.push(this._projectApis[this._projectAddresses[i]]);
    }
    const protocolData = await this._api.loadProtooclData(projApisArray);
    if (!pStore) {
      // init Store
      this._projectStore.add(
        new CMNProjectProtocol(
          'cmn_projects',
          protocolData.protocolFee,
          protocolData.feeTo,
          protocolData.projects,
          protocolData.acceptedTokens
        )
      );
    } else {
      pStore.set(
        protocolData.protocolFee,
        protocolData.feeTo,
        protocolData.projects,
        protocolData.acceptedTokens
      );
    }

    return this._projectStore.getById('cmn_projects');
  }

  private async _syncProjectAPI(project: string) {
    if (!this._projectApis[project]) {
      this._projectApis[project] = new CMNProjectApi(
        Project__factory.connect,
        project,
        this._chain.api.currentProvider as any
      );
    }
    return this._projectApis[project];
  }

  public async deinit() {
    this._projectStore.clear();
    this._memberStore.clear();
    this._projectApis = {};
  }

  // interface APIs
  public async getProjects() {
    const pStore = await this._syncProtocolStore();
    return pStore.projects;
  }

  public async createProject(params: ProjectMetaData) {
    const res = await this._api.createProject(params);
    return res;
  }

  public async backOrCurate(
    amount: number,
    project: CMNProject,
    isBacking: boolean,
    from: string,
    tokenAddress: string,
  ) {
    const projContractApi: CMNProjectApi = await this._syncProjectAPI(project.address);

    // TODO: Approve Logic
    const approveTxStatus = await this.approveToken(project.address, tokenAddress, from, amount, false);
    if (!approveTxStatus) {
      return { status: 'failed', error: 'Failed to approve token' };
    }

    let res = { status: 'success', error: '' };
    if (isBacking) {
      res = await projContractApi.back(amount, tokenAddress);
    } else {
      res = await projContractApi.curate(amount, tokenAddress);
    }
    return res;
  }

  public async approveToken(
    projectAddrss: string,
    tokenAddress: string,
    from: string,
    amount: number,
    isCWToken = false
  ) {
    const tokenApi = isCWToken ? CWToken__factory.connect(
      tokenAddress,
      this._api.Provider
    ) : ERC20__factory.connect(
      tokenAddress,
      this._api.Provider
    );

    let transactionSuccess = false;
    const tokenContract = await attachSigner(this._chain.app.wallets, from, tokenApi);
    const approvalTx = await tokenContract.approve(
      projectAddrss,
      amount,
      { gasLimit: 3000000 }
    );
    const approvalTxReceipt = await approvalTx.wait();
    transactionSuccess = approvalTxReceipt.status === 1;
    return transactionSuccess;
  }

  public async getAcceptedTokens(project?: CMNProject) {
    if (project) {
      // return protocol's acceptedTokens
      const projContractApi: CMNProjectApi = await this._syncProjectAPI(project.address);
      return projContractApi.getAcceptedTokens();
    } else {
      // return project's acceptedTokens
      const pStore = await this._syncProtocolStore();
      return pStore.acceptedTokens;
    }
  }

  public async getMembers(proj: CMNProject) {
    await this._syncProjectAPI(proj.address);
    const pStore = await this._syncProtocolStore();
    const index = pStore.projects.findIndex((item) => item.address === proj.address);
    if (index < 0) {
      return;
    }
    const project = pStore.projects[index];
    const mStore = await this._syncMemberStore(project);
    return { curators: mStore.curators, backers: mStore.backers };
  }
}
