import { utils } from 'ethers';
import BN from 'bn.js';

import { IApp } from 'state';
import { ProposalModule, ITXModalData } from 'models';
import { ERC20Token } from 'adapters/chain/ethereum/types';

import CommonwealthAPI from './api';
import CommonwealthChain from './chain';
import CommonwealthMembers from './members';

const expandTo18Decimals = (n: number): BN => {
  return new BN(n).mul(new BN(10).pow(new BN(18)))
};

export default class CommonwealthProtocol extends ProposalModule<
  any,
  any,
  any
>{
  private _api: CommonwealthAPI;
  private _Members: CommonwealthMembers;

  public get api() { return this._api; }
  // public get usingServerChainEntities() { return this._usingServerChainEntities; }

  constructor(app: IApp, private _usingServerChainEntities = false) {
    super(app, (e) => {
      // new CommonwealthProtocol(this._Members, this, e)
    });
  }

  public async init(chain: CommonwealthChain, Members: CommonwealthMembers) {
    const api = chain.CommonwealthAPI;
    this._Members = Members;
    this._api = api;
    this._initialized = true;
  }

  public deinit() {
    this.store.clear();
  }

  public async createProject(
    u_name: string,
    creator: string,
    beneficiary: string,
    u_threshold: number,
    curatorFee: number,
    deadline = 5 * 60, // 5 minutes
    backWithEther = true,
    token?: ERC20Token
  ) {
    console.log('=====>u_threshold', u_threshold);
    const threshold = expandTo18Decimals(u_threshold);
    console.log('=====>threshold');


    console.log('=====>u_name', u_name);
    const name = utils.formatBytes32String(u_name);
    console.log('=====>name');


    const projectHash = utils.solidityKeccak256(
      ['address', 'address', 'bytes32', 'uint256'],
      [creator, beneficiary, name, threshold]
    );
    

    const newProjectData = {
      name,
      ipfsHash: utils.formatBytes32String('0x01'),
      cwUrl: utils.formatBytes32String('commonwealth.im'),
      beneficiary,
      acceptedTokens: [],
      nominations: [],
      threshold,
      deadline: Math.ceil(Date.now() / 1000) + deadline,
      curatorFee,
    }
    console.log('====>newProjectData', newProjectData)
    // call protocol.createProject() method
  }

  public async loadData() {
    const res = new BN((await this._api.CWProtocolContract.allProjectsLength()).toString(), 10);
    console.log('====>res', res);
  }

  public createTx(...args: any[]): ITXModalData {
    throw new Error('Method not implemented.');
  }
}
