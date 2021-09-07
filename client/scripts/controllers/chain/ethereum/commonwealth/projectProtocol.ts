import { BigNumber } from 'ethers';
import BN from 'bn.js';

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
import { needSync, ProjectMetaData, getTokenHolders, MAX_VALUE } from './utils';

export default class ProjectProtocol {
  private _chain: EthereumChain;
  private _api: CMNProjectProtocolApi;

  private _projectApis; // store all project's APIs
  private _projectAddresses: string[];
  private _projectStore = new CMNProjectStore();
  private _memberStore = new CMNMembersStore();

  public async init(chain: EthereumChain, projectProtocolAddress: string) {
    console.log('CMN: initializing projectProtocol');
    this._chain = chain;

    // init project protocol API
    const projectProtocolApi = new CMNProjectProtocolApi(
      CMNProjectProtocolContract.connect,
      projectProtocolAddress,
      this._chain.api.currentProvider as any
    );
    this._api = projectProtocolApi;

    // init
    this._projectApis = {};
    await this._syncProtocolStore(true);
    const pStore = this._projectStore.getById('cmn_projects');
    const projects = pStore.projects;
    for (let i = 0; i < projects.length; i++) {
      await this._syncMemberStore(projects[i]);
    }
    console.log('CMN: projectProtocol initialized');
  }

  private async _syncMemberStore(project: CMNProject) {
    const mStore = this._memberStore.getById(project.address);
    if (mStore && !needSync(mStore.updated_at)) {
      return mStore;
    }

    const backers = {};
    const curators = {};

    // TODO_CMN: fix token holder logic
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

  private async _syncProtocolStore(force = false) {
    const pStore = this._projectStore.getById('cmn_projects');
    if (pStore && !needSync(pStore.updated_at) && !force) {
      return pStore;
    }

    console.log('CMN syncing protocol store');
    // sync project APIs first
    this._projectAddresses = await this._api.Contract.getAllProjects();
    if (!this._projectAddresses && this._projectAddresses.length === 0) return;

    const projectApis = [];
    for (let i = 0; i < this._projectAddresses.length; i++) {
      projectApis.push(await this._syncProjectAPI(this._projectAddresses[i]));
    }

    // sync protocol data again
    const protocolData = await this._api.loadProtooclData(projectApis);

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

    console.log('CMN protocol store synchronized');

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
    const res = await this._api.createProject(this._chain, params);
    return res;
  }

  public async getProjectDetails(address: string) {
    await this._syncProtocolStore();

    const pStore = this._projectStore.getById('cmn_projects');
    let selectedProject = pStore.projects.filter((proj) => proj.address === address)[0];

    if (!selectedProject || !selectedProject.updated_at || needSync(selectedProject.updated_at)) {
      const projContractApi: CMNProjectApi = await this._syncProjectAPI(selectedProject.address);
      selectedProject = await projContractApi.setProjectDetails(selectedProject);
    }

    const mStore = await this._syncMemberStore(selectedProject);

    return {
      project: selectedProject,
      curators: mStore.curators,
      backers: mStore.backers
    };
  }

  public async backOrCurate(
    amount: BN,
    project: CMNProject,
    isBacking: boolean,
    from: string,
    tokenAddress: string,
    tokenDecimals: number
  ) {
    const projContractApi: CMNProjectApi = await this._syncProjectAPI(project.address);
    const approveTokenRes = await this.approveToken(project.address, tokenAddress, from, amount, false, tokenDecimals);
    if (!approveTokenRes) return { status: 'failed', error: 'Failed to approve this token' };

    let res = { status: 'success', error: '' };
    if (isBacking) {
      res = await projContractApi.back(amount, tokenAddress, from, this._chain);
    } else {
      res = await projContractApi.curate(amount, tokenAddress, from, this._chain);
    }
    return res;
  }

  public async approveToken(
    projectAddrss: string,
    tokenAddress: string,
    from: string,
    amount: BN,
    isCWToken = false,
    tokenDecimals: number
  ) {
    const tokenApi = isCWToken
      ? CWToken__factory.connect(tokenAddress, this._api.Provider)
      : ERC20__factory.connect(tokenAddress, this._api.Provider);

    let approveBalance = amount;
    if (amount.eq(new BN(-1))) {
      approveBalance = new BN(MAX_VALUE); // approve all
    }

    // TODO_CMN: check if exceeds allowance
    let allowanceBN = new BN((await tokenApi.allowance(from, projectAddrss)).toString());
    allowanceBN = allowanceBN.mul(new BN(10).pow(new BN(tokenDecimals)));

    if (allowanceBN.gte(approveBalance)) {
      return true;
    }

    let transactionSuccess = false;
    const tokenContract = await attachSigner(this._chain.app.wallets, from, tokenApi);
    const approvalTx = await tokenContract.approve(
      projectAddrss,
      approveBalance.toNumber(),
      { gasLimit: 3000000 }
    );
    const approvalTxReceipt = await approvalTx.wait();
    transactionSuccess = approvalTxReceipt.status === 1;
    return transactionSuccess;
  }

  public async getAcceptedTokens(project?: CMNProject) {
    if (project) {
      const projContractApi: CMNProjectApi = await this._syncProjectAPI(project.address);
      return projContractApi.getAcceptedTokens(); // project's acceptedTokens
    } else {
      const pStore = await this._syncProtocolStore();
      return pStore.acceptedTokens; // protocol's acceptedTokens
    }
  }

  public async redeemTokens(
    amount: BN,
    isBToken: boolean,
    project: CMNProject,
    from: string,
    cwTokenAddress: string,
    tokenAddress: string,
    tokenDecimals: number
  ) {
    const projContractApi: CMNProjectApi = await this._syncProjectAPI(project.address);
    const approveTokenRes = await this.approveToken(project.address, cwTokenAddress, from, amount, true, tokenDecimals);
    if (!approveTokenRes) return { status: 'failed', error: 'Failed to approve this token' };
    let res = { status: 'success', error: '' };
    if (isBToken) {
      res = await projContractApi.redeemTokens(amount, tokenAddress, true, from, this._chain);
    } else {
      res = await projContractApi.redeemTokens(amount, tokenAddress, false, from, this._chain);
    }
    return res;
  }

  public async withdraw(project: CMNProject, from: string) {
    const projContractApi: CMNProjectApi = await this._syncProjectAPI(project.address);
    const res = await projContractApi.withdraw(from, this._chain);
    return res;
  }
}
