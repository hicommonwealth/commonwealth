import { utils } from 'ethers';
import BN from 'bn.js';
import moment from 'moment';

import { IApp } from 'state';
import { CWProtocol, CWProject } from 'models/CWProtocol';
import { CwProjectFactory as CWProjectFactory } from 'CwProjectFactory';

import CommonwealthChain from './chain';
import CommonwealthAPI from './api';

import { CWProtocolStore } from '../../../../stores';
import ContractApi from '../contractApi';

const expandTo18Decimals = (n: number): BN => {
  return new BN(n).mul((new BN(10)).pow(new BN(18)))
};

export default class CommonwealthProtocol {
  private _initialized: boolean = false;
  private _app: IApp;
  private _api: CommonwealthAPI;
  private _store = new CWProtocolStore();
  private _chain: CommonwealthChain;

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

    const projects: CWProject[] =  await this._api.retrieveAllProjects();
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

  public async deinit() {
    this.store.clear();
  }

  public async updateState() {
    const protocolStore = this.store.getById('root');
    let projects: CWProject[] =  await this._api.retrieveAllProjects(); // update all projects
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

    return txReceipt.status === 1;
  }

  public async projectContractApi(projectHash: string, signer: string) {
    const projAddress = await this._api.Contract.projects(projectHash);
    const contract = new ContractApi(
      CWProjectFactory.connect,
      projAddress,
      this._chain.api.currentProvider as any
    );
    const attachedContract = await contract.attachSigner(this._chain.app.wallets, signer);
    return attachedContract;
  }

  public async backOrCurate(
    amount: number,
    projectHash: string,
    isBacking: boolean,
    from: string,
    withEther = true,
  ) {
    const projContractAPI = await this.projectContractApi(projectHash, from);
    const isTxSuccessed = await this._api.backOrCurateWithEther(projContractAPI, amount, isBacking, withEther);
    if (isTxSuccessed) {
      await this.updateState();
    }
    return isTxSuccessed;
  }

  public async redeemTokens(
    amount: number,
    projectHash: string,
    isBToken: boolean,
    from: string,
    withEther = true,
  ) {
    const projContractAPI = await this.projectContractApi(projectHash, from);
    const isTxSuccessed = await this._api.redeemTokens(projContractAPI, amount, isBToken, withEther);
    if (isTxSuccessed) {
      await this.updateState();
    }
    return isTxSuccessed;
  }

  public async withdraw(
    projectHash: string,
    from: string,
  ) {
    const projContractAPI = await this.projectContractApi(projectHash, from);
    const isTxSuccessed = await this._api.withdraw(projContractAPI);
    if (isTxSuccessed) {
      await this.updateState();
    }
    return isTxSuccessed;
  }

  public async getTokenHolders(tokenAddress: string) {
    const tokenHolders = [];

    // do some logic to get token holders
    return tokenHolders;
  }
}
 