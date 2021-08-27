import { IApp } from 'state';

import { ProjectFactory__factory as CMNProjectProtocolContract } from 'eth/types';
import EthereumChain from '../chain';
import CMNProjectApi from './project/api';
import CMNProjectProtocol from './project/protocol';

export default class CMNAdapter {
  public chain: EthereumChain;
  public project_protocol: CMNProjectProtocol;
  public chainId: string;

  private _initialized: boolean = false;
  public get initialized() { return this._initialized; }

  public async init(
    chainId: string,
    app: IApp,
    projectProtocolAddress: string,
    collectiveProtocolAddress: string
  ) {
    this.chainId = chainId;
    this.chain = app.chain.chain as EthereumChain;

    this.project_protocol = new CMNProjectProtocol();
    // init project functions
    const projectApi = new CMNProjectApi(
      CMNProjectProtocolContract.connect,
      projectProtocolAddress,
      this.chain.api.currentProvider as any
    );
    await projectApi.init();
    await this.project_protocol.init(this.chain, projectApi);

    this._initialized = true;
    console.log('Ethereum CMN-Protocol started.');
  }
}
