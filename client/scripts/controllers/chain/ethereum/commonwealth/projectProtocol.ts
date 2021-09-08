import { BigNumber } from 'ethers';
import BN from 'bn.js';

import {
  ProjectFactory__factory as CMNProjectProtocolContract,
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
  private _syncing: boolean;
  private _chain: EthereumChain;
  private _api: CMNProjectProtocolApi;

  private _projectStore = new CMNProjectStore();
  private _memberStore = new CMNMembersStore();

  public async init(chain: EthereumChain, projectProtocolAddress: string) {
    this._chain = chain;
    this._api = new CMNProjectProtocolApi(
      CMNProjectProtocolContract.connect,
      projectProtocolAddress,
      this._chain.api.currentProvider as any
    );
    await this._api.init();
    await this._syncProtocolStore(true); // init projectStore
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
    if (pStore && !needSync(pStore.updated_at) && !force) return pStore;

    console.log('CMN syncing protocol store');
    const protocolData = await this._api.loadProtooclData(this._chain);
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

  public async deinit() {
    this._projectStore.clear();
    this._memberStore.clear();
  }

  // interface APIs
  public async getProjects() {
    console.log('====>getProjects');
    const pStore = await this._syncProtocolStore();
    return pStore.projects;
  }

  public async getProjectDetails(address: string) {
    console.log('====>getProjectDetails');
    await this._syncProtocolStore();

    const pStore = this._projectStore.getById('cmn_projects');
    const selectedIndex = pStore.projects.findIndex((proj) => proj.address === address);
    if (selectedIndex < 0) {
      return;
    }

    let sProject = pStore.projects[selectedIndex];
    if (needSync(sProject.updated_at)) {
      const projContractApi: CMNProjectApi = await this._api.getProjectApi(sProject.address, this._chain);
      sProject = await projContractApi.setProjectDetails(sProject);
    }
    const mStore = await this._syncMemberStore(sProject);
    return {
      project: sProject,
      curators: mStore.curators,
      backers: mStore.backers
    };
  }

  public async getAcceptedTokens(project?: CMNProject) {
    console.log('====>getAcceptedTokens');
    if (project) {
      const projContractApi: CMNProjectApi = await this._api.getProjectApi(project.address, this._chain);
      return projContractApi.getAcceptedTokens(); // project's acceptedTokens
    } else {
      const pStore = await this._syncProtocolStore();
      return pStore.acceptedTokens; // protocol's acceptedTokens
    }
  }

  // handle transactions
  private async approveToken(
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

    const allowance = await tokenApi.allowance(from, projectAddrss);
    const allowanceBN = new BN(allowance.toString()).mul(new BN(10).pow(new BN(tokenDecimals)));
    if (allowanceBN.gt(new BN(0)) && allowanceBN.gte(approveBalance)) {
      return true;
    }

    const tokenContract = await attachSigner(this._chain.app.wallets, from, tokenApi);
    const approvalTx = await tokenContract.approve(
      projectAddrss,
      approveBalance.toString(),
      { gasLimit: 3000000 }
    );
    const approvalTxReceipt = await approvalTx.wait();
    return approvalTxReceipt.status === 1;
  }

  public async createProject(params: ProjectMetaData) {
    const transactionSuccessed = await this._api.createProject(params, this._chain);
    return {
      status: transactionSuccessed ? 'success' : 'failed',
      error: transactionSuccessed ? '' : 'Failed to process createProject transaction'
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
    const projContractApi: CMNProjectApi = await this._api.getProjectApi(project.address, this._chain);
    const approveTokenRes = await this.approveToken(project.address, tokenAddress, from, amount, false, tokenDecimals);
    if (!approveTokenRes) return { status: 'failed', error: 'Failed to approve this token' };

    let transactionSussessed = false;
    if (isBacking) {
      transactionSussessed = await projContractApi.back(amount, tokenAddress, from, this._chain);
    } else {
      transactionSussessed = await projContractApi.curate(amount, tokenAddress, from, this._chain);
    }
    return {
      status: transactionSussessed ? 'success' : 'failed',
      error: transactionSussessed ? '' : `failed to process ${isBacking ? 'back' : 'curate'} transaction`
    };
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
    const projContractApi: CMNProjectApi = await this._api.getProjectApi(project.address, this._chain);
    const approveTokenRes = await this.approveToken(project.address, cwTokenAddress, from, amount, true, tokenDecimals);
    if (!approveTokenRes) return { status: 'failed', error: 'Failed to approve this token' };

    let transactionSussessed = false;
    if (isBToken) {
      transactionSussessed = await projContractApi.redeemTokens(amount, tokenAddress, true, from, this._chain);
    } else {
      transactionSussessed = await projContractApi.redeemTokens(amount, tokenAddress, false, from, this._chain);
    }
    return {
      status: transactionSussessed ? 'success' : 'failed',
      error: transactionSussessed ? '' : `failed to process reedeem${isBToken ? 'B' : 'C'}token transaction`
    };
  }

  public async withdraw(project: CMNProject, from: string) {
    const projContractApi: CMNProjectApi = await this._api.getProjectApi(project.address, this._chain);
    const transactionSussessed = await projContractApi.withdraw(from, this._chain);
    return {
      status: transactionSussessed ? 'success' : 'failed',
      error: transactionSussessed ? '' : 'failed to process withdraw transaction'
    };
  }
}
