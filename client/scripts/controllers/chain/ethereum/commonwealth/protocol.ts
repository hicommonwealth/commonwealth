import { utils } from 'ethers';
import BN from 'bn.js';
import $ from 'jquery';

import app, { IApp } from 'state';
import { ERC20Token } from 'adapters/chain/ethereum/types';
import { CWProtocol, CWProject } from 'models/CWProtocol';

import { CWProtocolStore } from '../../../../stores';

const expandTo18Decimals = (n: number): BN => {
  return new BN(n).mul((new BN(10)).pow(new BN(18)))
};
export default class CommonwealthProtocol {
  private _initialized: boolean = false;
  public get initalized() { return this._initialized };

  private _protocolAddress: string = 'root';
  public get protocolAddress() { return this._protocolAddress}

  private _store: CWProtocolStore<CWProtocol> = new CWProtocolStore();
  public get store() { return this._store; }

  private _app: IApp;
  public get app() { return this._app; }

  constructor(app: IApp) {
    this._app = app;
  }

  public get(protocolID: string, chain?: string) {
    try {
      return this._store.getByID(protocolID);
    } catch(e) {
    }
    return new CommonwealthProtocol(this.app);
  }

  public async retrieveProjects() {
    // temporary API logic: router.get('/cw/projects', builkProjects.bind(this, models));
    let projects: CWProject[] =  [];
    const res = await $.get(`${app.serverUrl()}/cw/projects`, {
      auth: true,
      jwt: app.user.jwt
    });
    if (res['status'] === 'Success' && res.result && res.result.projects && res.result.projects.length > 0) {
      projects = res.result.projects;
    }
    return projects;
  }

  public async init() {
    const projects: CWProject[] =  await this.retrieveProjects();
    const newProtocol = { 
      name: 'root',
      id: 'root',
      protocolFee: 5,
      feeTo: '0x01',
      projects,
    } as CWProtocol;
    this.store.add(newProtocol);
  }

  public async deinit() {
    this.store.clear();
  }

  public async updateState() {
    const projects: CWProject[] =  await this.retrieveProjects();
    const prevProtocol = await this.get('root');
    this.store.remove(prevProtocol as CWProtocol);
    this.store.add({
      projects,
      ...prevProtocol
    } as CWProtocol);
  }

  public async createProject(
    u_name: string,
    description: string,
    creator: string,
    beneficiary: string,
    u_threshold: number,
    curatorFee: number,
    deadline = 24 * 60 * 60, // 5 minutes
    backWithEther = true,
    token?: ERC20Token
  ) {
    const threshold = expandTo18Decimals(u_threshold);
    const name = utils.formatBytes32String(u_name);
    const newProjectData = {
      name,
      description,
      ipfsHash: utils.formatBytes32String('0x01'),
      cwUrl: utils.formatBytes32String('commonwealth.im'),
      beneficiary,
      acceptedTokens: '0x01', // [],
      nominations: [],
      threshold,
      endtime: Math.ceil(Date.now() / 1000) + deadline,
      curatorFee,
      projectHash: utils.solidityKeccak256(
        ['address', 'address', 'bytes32', 'uint256'],
        [creator, beneficiary, name, threshold.toString()]
      ),
    }

    // router.post('/cw/create-project', passport.authenticate('jwt', { session: false }), createProject.bind(this, models));
    const res = await $.post(`${app.serverUrl()}/cw/create-project`, {
      ...newProjectData,
      auth: true,
      jwt: app.user.jwt
    });
    if (res['status'] === 'Success') {
      await this.updateState();
    }
    return res;
  }

  public async backProject(
    backer: string,
    amount: number,
    projectHash: string,
  ) {
    // router.post('/cw/back-project', passport.authenticate('jwt', { session: false }), backProject.bind(this, models));
    const res = await $.post(`${app.serverUrl()}/cw/back-project`, {
      backer,
      amount,
      projectHash,
      auth: true,
      jwt: app.user.jwt
    });
    if (res['status'] === 'Success') {
      await this.updateState();
    }
  }

  public async curateProject(
    curator: string,
    amount: number,
    projectHash: string,
  ) {
    // router.post('/cw/curate-project', passport.authenticate('jwt', { session: false }), backProject.bind(this, models));
    const res = await $.post(`${app.serverUrl()}/cw/back-project`, {
      curator,
      amount,
      projectHash,
      auth: true,
      jwt: app.user.jwt
    });
    console.log('=====>Res', res);
    if (res['status'] === 'Success') {
      await this.updateState();
    }
  }

  public async getCollatoralAmount(isBToken, address, projectHash) {
    const res = await $.get(`${app.serverUrl()}/cw/get-collatora-amount`, {
      address,
      isBToken,
      projectHash,
      auth: true,
      jwt: app.user.jwt
    });
    console.log('====>res', res);
    // if (res['status'] === 'Success') {
    //   await this.updateState();
    // }
  }

  public async redeemBToken(
    backer: string,
    amount: number,
    projectHash: string,
  ) {
    // router.post('/cw/redeem-bToken', passport.authenticate('jwt', { session: false }), backProject.bind(this, models));
    const res = await $.post(`${app.serverUrl()}/cw/back-project`, {
      backer,
      amount,
      projectHash,
      auth: true,
      jwt: app.user.jwt
    });
    if (res['status'] === 'Success') {
      await this.updateState();
    }
  }

  public async redeemCToken(
    curator: string,
    amount: number,
    projectHash: string,
  ) {
    // router.post('/cw/redeem-bToken', passport.authenticate('jwt', { session: false }), backProject.bind(this, models));
    const res = await $.post(`${app.serverUrl()}/cw/back-project`, {
      curator,
      amount,
      projectHash,
      auth: true,
      jwt: app.user.jwt
    });
    if (res['status'] === 'Success') {
      await this.updateState();
    }
  }

}
