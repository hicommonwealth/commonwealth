import { IApp } from 'state';

import { ProjectFactory__factory as CMNProjectProtocolContract } from 'eth/types';
import EthereumChain from '../chain';
import CMNProjectApi from './project/api';
import CMNProjectProtocol from './project/protocol';

export default class CMNAdapter {
  public chain: EthereumChain;
  public projectProtocol: CMNProjectProtocol;

  private _initialized: boolean = false;
  public get initialized() { return this._initialized; }

  constructor(app: IApp) {
    this.chain = new EthereumChain(app);
    this.projectProtocol = new CMNProjectProtocol();
  }

  public async init(
    projectProtocolAddress: string,
    collectiveProtocolAddress: string
  ) {
    // init project functions
    const projectApi = new CMNProjectApi(
      CMNProjectProtocolContract.connect,
      projectProtocolAddress,
      this.chain.api.currentProvider as any
    );
    await projectApi.init();
    await this.projectProtocol.init(this.chain, projectApi);

    this._initialized = true;
    console.log('Ethereum CMN-Protocol started.');
  }
}
