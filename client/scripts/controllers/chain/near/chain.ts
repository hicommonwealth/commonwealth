import { Near as NearApi, connect as nearConnect, WalletAccount } from 'near-api-js';
import { NodeStatusResult } from 'near-api-js/lib/providers/provider';
import { uuidv4 } from 'lib/util';
import { IChainModule, ITXModalData, NodeInfo } from 'models';
import { NearToken } from 'adapters/chain/near/types';
import BN from 'bn.js';
import { ApiStatus, IApp } from 'state';
import moment from 'moment';
import * as m from 'mithril';
import { NearAccounts, NearAccount } from './account';

class NearChain implements IChainModule<NearToken, NearAccount> {
  private _api: NearApi;
  public get api(): NearApi {
    return this._api;
  }

  public get denom() { return this.app.chain.currency; }
  public coins(n: number | string | BN, inDollars?: boolean) {
    return new NearToken(n, inDollars);
  }

  private _config: any;
  public get config() { return this._config; }

  private _chainId: string;
  public get chainId() { return this._chainId; }

  private _syncHandle;
  private _nodeStatus: NodeStatusResult;
  public get nodeStatus(): NodeStatusResult {
    return this._nodeStatus;
  }

  private _networkId = 'testnet';
  public get isMainnet() {
    return this._networkId === 'mainnet';
  }

  private _app: IApp;
  public get app() { return this._app; }

  constructor(app: IApp) {
    this._app = app;
  }

  public async init(node: NodeInfo, accounts: NearAccounts, reset = false) {
    const networkSuffix = node.chain.id.split('.').pop();
    this._networkId = node.chain.id === 'near-testnet' || networkSuffix === 'testnet'
      ? 'testnet' : 'mainnet';
    this._config = {
      networkId: this.isMainnet ? 'mainnet' : 'testnet',
      nodeUrl: node.url,
      walletUrl: this.isMainnet ? 'https://wallet.near.org/' : 'https://wallet.testnet.near.org/',
      keyStore: accounts.keyStore,
    };

    this._api = await nearConnect(this.config);

    // block times seem about 1.5-2.5 seconds, so querying every 2s feels right
    const syncFn = async () => {
      try {
        this._nodeStatus = await this._api.connection.provider.status();

        // handle chain-related updates
        this._chainId = this._nodeStatus.chain_id;
        const { latest_block_time, latest_block_height } = this._nodeStatus.sync_info;

        // update block heights and times
        const lastTime: moment.Moment = this.app.chain.block && this.app.chain.block.lastTime;
        const lastHeight = this.app.chain.block && this.app.chain.block.height;
        this.app.chain.block.lastTime = moment(latest_block_time);
        this.app.chain.block.height = latest_block_height;
        if (lastTime && lastHeight) {
          const duration = this.app.chain.block.lastTime.diff(lastTime, 'ms') / 1000;
          const nBlocks = this.app.chain.block.height - lastHeight;
          if (nBlocks > 0 && duration > 0) {
            // if we accidentally miss multiple blocks, use the average block time across all of them
            this.app.chain.block.duration = duration / nBlocks;
          }
        }
        if (this.app.chain.networkStatus !== ApiStatus.Connected) {
          this.app.chain.networkStatus = ApiStatus.Connected;
          m.redraw();
        }
      } catch (e) {
        if (this.app.chain.networkStatus !== ApiStatus.Disconnected) {
          console.error(`failed to query NEAR status: ${JSON.stringify(e)}`);
          this.app.chain.networkStatus = ApiStatus.Disconnected;
          m.redraw();
        }
      }
    };
    await syncFn();
    this._syncHandle = setInterval(syncFn, 2000);
  }

  public async createDaoTx(creator: NearAccount, name: string, purpose: string, value: BN) {
    const contractId = this.isMainnet ? 'sputnik2.near' : 'sputnikv2.testnet';
    const methodName = 'create';
    const pk = this.isMainnet
      ? '2gtDEwdLuUBawzFLAnCS9gUso3Ph76bRzMpVrtb66f3J'
      : 'G8JpvUhKqfr89puEKgbBqUxQzCMfJfPSRvKw4EJoiZpZ';

    const argsList = {
      config: {
        name,
        purpose,
        metadata: '',
      },
      // initial council
      policy: [ creator.address ],
    };
    const yoktoNear = new BN('1000000000000000000000000');
    const attachedDeposit = value.mul(yoktoNear).toString();
    const args = Buffer.from(JSON.stringify(argsList)).toString('base64');
    const propArgs = {
      name,
      public_key: pk,
      args,
    };

    // redirect back to /finishNearLogin for chain node creation
    const id = this.isMainnet ? `${name}.sputnik-dao.near` : `${name}.sputnikv2.testnet`;
    const redirectUrl = `${window.location.origin}/${this.app.activeChainId()}/finishNearLogin?chain_name=${id}`;
    await this.redirectTx(contractId, methodName, propArgs, attachedDeposit, redirectUrl, '150000000000000');
  }

  public async redirectTx(
    contractId: string,
    methodName: string,
    args: any,
    attachedDeposit?: string,
    postTxRedirect?: string,
    gas?: string,
  ) {
    // construct tx object
    const functionCall: any = {
      contractId,
      methodName,
      args,
    };
    if (attachedDeposit) {
      functionCall.attachedDeposit = attachedDeposit;
    }
    if (postTxRedirect) {
      functionCall.walletCallbackUrl = postTxRedirect;
    }
    if (gas) {
      functionCall.gas = gas;
    }

    // generate random identifier as localStorage key
    const uuid = uuidv4();
    localStorage[uuid] = JSON.stringify(functionCall);

    // redirect to generate access key for dao contract
    const redirectUrl = `${window.location.origin}/${this.app.activeChainId()}/finishNearLogin`;
    const successUrl = `${redirectUrl}?saved_tx=${uuid}`;
    const failureUrl = `${redirectUrl}?tx_failure=${uuid}`;

    const wallet = new WalletAccount(this.api, 'commonwealth_near');
    await wallet.requestSignIn({
      contractId,
      methodNames: [methodName],
      successUrl,
      failureUrl
    });
  }

  public async deinit(): Promise<void> {
    clearInterval(this._syncHandle);
    this.app.chain.networkStatus = ApiStatus.Disconnected;
  }

  public createTXModalData(
    author: NearAccount,
    txFunc,
    txName: string,
    objName: string,
    cb?: (success: boolean) => void,
  ): ITXModalData {
    // TODO
    throw new Error('Txs not yet implemented');
  }
}

export default NearChain;
