import { IApp } from 'state';

// import { ProjectFactory__factory as CMNProjectProtocolContract } from 'eth/types';
import EthereumChain from '../chain';
// import CMNProjectProtocolApi from './project/api';
import CMNProjectProtocol from './projectProtocol';

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
    console.log('Ethereum CMN-Protocol starting...');

    this.chainId = chainId;
    this.chain = app.chain.chain as EthereumChain;

    this.project_protocol = new CMNProjectProtocol();
    await this.project_protocol.init(this.chain, projectProtocolAddress);

    this._initialized = true;
    console.log('Ethereum CMN-Protocol started.');
  }
}
