import { utils } from 'ethers';
import BN from 'bn.js';

import {
  ProjectFactory as CMNProjectProtocolContract,
  Project__factory,
} from 'eth/types';

import ContractApi, { attachSigner } from '../../contractApi';
import CMNProjectApi from './projectApi';
import { ProjectMetaData, getTokenDetails } from '../utils';
import { CMNProject } from '../../../../../models';
import EthereumChain from '../../chain';

export default class CMNProjectProtocolApi extends ContractApi<CMNProjectProtocolContract> {
  public readonly gasLimit: number = 3000000;
  private _projectAddresses: string[];
  private _projectApis;

  public async init() {
    this._projectApis = {};
    super.init();
  }

  public deinit() {
    this._projectApis = {};
  }

  private async _syncProjectAddresses(chain: EthereumChain) {
    this._projectAddresses = (await this.Contract.getAllProjects()).map((addr) => addr.toLowerCase());
    for (let i = 0; i < this._projectAddresses.length; i++) {
      const proj = this._projectAddresses[i];
      if (!this._projectApis[proj]) {
        this._projectApis[proj] = this.getProjectApi(proj, chain);
      }
    }
  }

  public async getAcceptedTokens() {
    const tokens = await this.Contract.getAllAcceptedTokens();
    const tokensData = await getTokenDetails(tokens);
    return tokensData;
  }

  public async createProject(params: ProjectMetaData, chain: EthereumChain) {
    const name = utils.formatBytes32String(params.name);
    const ipfsHash = utils.formatBytes32String('0x01');
    const cwUrl = utils.formatBytes32String('commonwealth.im');
    const nominations = [params.creator, params.beneficiary];
    const endtime = Math.ceil(Math.ceil(Date.now() / 1000) + params.deadline * 24 * 60 * 60); // in days
    const curatorFee = params.curatorFee * 100;
    const threshold = new BN(params.threshold * 100000000);

    const contract = await attachSigner(chain.app.wallets, params.creator, this.Contract);
    try {
      const tx = await contract.createProject(
        name,
        ipfsHash,
        cwUrl,
        params.beneficiary,
        params.acceptedTokens,
        nominations,
        threshold.toString(),
        endtime,
        curatorFee.toString(),
        { gasLimit: this.gasLimit }
      );
      const txReceipt = await tx.wait();
      return txReceipt.status === 1;
    } catch (err) {
      return false;
    }
  }

  public async getProtocolData() {
    const protocolData = await this.Contract.protocolData();
    const protocolFee = protocolData.protocolFee;
    const feeTo = protocolData.feeTo;
    return { protocolFee, feeTo };
  }

  public async loadProtooclData(chain: EthereumChain) {
    await this._syncProjectAddresses(chain);

    const { protocolFee, feeTo } = await this.getProtocolData();
    const acceptedTokens = await this.getAcceptedTokens();

    const projects: CMNProject[] = [];
    for (let i = 0; i < this._projectAddresses.length; i++) {
      const proj = this._projectAddresses[i];
      const projApi = this.getProjectApi(proj, chain);
      const projDetails = await projApi.getProjectInfo();
      projects.push(projDetails);
    }
    return {
      protocolFee,
      feeTo,
      projects,
      acceptedTokens
    };
  }

  public getProjectApi(proj: string, chain: EthereumChain) {
    if (!this._projectApis[proj]) {
      this._projectApis[proj] = new CMNProjectApi(
        Project__factory.connect,
        proj,
        chain.api.currentProvider as any
      );
    }
    return this._projectApis[proj];
  }
}
