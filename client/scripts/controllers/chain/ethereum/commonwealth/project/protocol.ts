import { utils } from 'ethers';
import BN from 'bn.js';

import { Project__factory, CWToken__factory, ERC20__factory } from 'eth/types';
import { CMNProjectStore, CMNProjectMembersStore } from '../../../../../stores';
import { CMNProjectProtocol, CMNProject, CMNProjectMembers } from '../../../../../models';

import CMNProjectAPI, { ProjectMetaData } from './api';
import { attachSigner } from '../../contractApi';
import EthereumChain from '../../chain';
import { kovanTokenData } from '../tokens';

export default class ProjectProtocol {
  private _projectStore = new CMNProjectStore();
  public get projectStore() { return this._projectStore; }

  private _memberStore = new CMNProjectMembersStore();
  public get memberStore() { return this._memberStore; }

  private _chain: EthereumChain;
  private _api: CMNProjectAPI;

  private _syncPeriod = 5 * 60 * 1000; // update in every 5 mins

  public async init(chain: EthereumChain, api: CMNProjectAPI) {
    this._chain = chain;
    this._api = api;

    const protocolData = await this._api.Contract.protocolData();
    const protocolFee = protocolData.protocolFee;
    const feeTo = protocolData.feeTo;
    const projects: CMNProject[] = await this.retrieveAllProjects();

    this._projectStore.add(new CMNProjectProtocol('cmn_projects', protocolFee, feeTo, projects));
  }

  public async deinit() {
    this._projectStore.clear();
    this.memberStore.clear();
  }

  public async getProjectDetails(projAddress: string) {
    const projContract = await this.getProjectContractApi(projAddress);
    const metaData = await projContract.metaData();

    const { name, ipfsHash, cwUrl, beneficiary, creator, id, factory } = metaData;
    const curatorFee = await projContract.curatorFee();
    const threshold = await projContract.threshold();
    const totalFunding = await projContract.totalFunding();
    const funded = await projContract.funded();
    const lockedWithdraw = await projContract.lockedWithdraw();
    const daedline = (new BN((await projContract.deadline()).toString()).mul(new BN(1000))).toNumber();
    const endTime = new Date(daedline);

    const projectHash = utils.solidityKeccak256(
      ['address', 'address', 'bytes32', 'uint256'],
      [creator, beneficiary, name, threshold.toString()]
    );

    let status = 'In Progress';
    if ((new Date()).getTime() - endTime.getTime() > 0) {
      if (funded) {
        status = 'Successed';
      } else {
        status = 'Failed';
      }
    }

    const acceptedTokenAddresses = await projContract.getAcceptedTokens() || [];
    const bTokens = {};
    const cTokens = {};
    for (let i = 0; i < acceptedTokenAddresses.length; i++) {
      bTokens[acceptedTokenAddresses[i]] = await projContract.getBToken(acceptedTokenAddresses[i]);
      cTokens[acceptedTokenAddresses[i]] = await projContract.getCToken(acceptedTokenAddresses[i]);
    }
    const acceptedTokens = this.getAcceptedTokenDetails(acceptedTokenAddresses);

    const newProj = new CMNProject(
      utils.parseBytes32String(name),
      '',
      utils.parseBytes32String(ipfsHash),
      utils.parseBytes32String(cwUrl),
      beneficiary,
      acceptedTokens, // aceptedTokens
      [], // nominations,
      threshold, // decimals in 8
      endTime,
      curatorFee,
      projectHash,
      status,
      lockedWithdraw,
      totalFunding, // decimals in 8
      bTokens,
      cTokens,
      projAddress,
    );

    return newProj;
  }

  public async retrieveAllProjects() {
    const projects: CMNProject[] =  [];
    const projectAddresses = await this._api.Contract.getAllProjects();

    for (let i = 0; i < projectAddresses.length; i++) {
      const proj: CMNProject = await this.getProjectDetails(projectAddresses[i]);
      projects.push(proj);
    }

    return projects;
  }

  public async getProjectContractApi(projAddress: string, signer?: string) {
    let projectApi = this._api.getProjectAPI(projAddress);
    if (!projectApi) {
      projectApi = await Project__factory.connect(
        projAddress,
        this._api.Provider
      );
      this._api.setProjectAPI(projAddress, projectApi);
    }
    console.log('====>signer', signer);
    if (signer) {
      const contract = await attachSigner(this._chain.app.wallets, signer, projectApi);
      console.log('====>contract', contract);
      return contract;
    }
    
    return projectApi;
  }

  public async syncMembers(project: CMNProject) {
    const { bTokens, cTokens, acceptedTokens, projectHash } = project;

    let mStore = this._memberStore.getById(projectHash);

    const backers = {};
    const curators = {};

    if (
      mStore
      && mStore.updated_at
      && (Math.floor((Math.abs(new Date().getTime() - mStore.updated_at.getTime())) / this._syncPeriod) < 1)
    ) {
      return { curators: mStore.curators, backers: mStore.backers };
    }

    // for (let i = 0; i < acceptedTokens.length; i++) {
    //   const token = acceptedTokens[i];
    //   if (bTokens[token]) {
    //     backers[token] = await this._api.getTokenHolders(bTokens[token]);
    //   }
    //   if (cTokens[token]) {
    //     curators[token] = await this._api.getTokenHolders(cTokens[token]);
    //   }
    // }

    if (!mStore || !mStore.updated_at) {
      mStore = new CMNProjectMembers(projectHash, backers, curators);
      this._memberStore.add(mStore);
    } else {
      mStore.setParticipants(backers, curators);
    }
  }

  public async syncProjects(force = false) {
    const pStore = this._projectStore.getById('cmn_projects');
    const needSync = Math.floor(Math.abs(new Date().getTime() - pStore.updated_at.getTime()) / this._syncPeriod) > 0;

    if (force || needSync) {
      pStore.setProjects(await this.retrieveAllProjects());
    }
    return pStore.projects;
  }

  public async createProject(params: ProjectMetaData) {
    const contract = await attachSigner(this._chain.app.wallets, params.creator, this._api.Contract);
    return this._api.createProject(contract, params);
  }

  public async backOrCurate(
    amount: number,
    project: CMNProject,
    isBacking: boolean,
    from: string,
    tokenAddress: string,
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
    const tokenAdddress = isBToken ? project.bTokens : project.cTokens;
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

  public getAcceptedTokenDetails(tokenAddresses: string[]) {
    const tokensData = [];
    for (let i = 0; i < tokenAddresses.length; i++) {
      const index = kovanTokenData.findIndex(
        (t) => t.address.toLowerCase() === tokenAddresses[i].toLowerCase()
      );
      if (index > -1) {
        tokensData.push(kovanTokenData[index]);
      }
    }
    return tokensData;
  }

  public async getAcceptedTokens(project?: CMNProject) {
    let tokenAddresses = [];
    if (project) {
      const projContractAPI = await this.getProjectContractApi(project.address);
      tokenAddresses = await this._api.getAcceptedTokens(projContractAPI);
    } else {
      tokenAddresses = await this._api.getAcceptedTokens();
    }
    return this.getAcceptedTokenDetails(tokenAddresses);
  }

  public async redeemTokens(
    amount: number,
    isBToken: boolean,
    project: CMNProject,
    from: string,
    tokenAddress: string,
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
}
