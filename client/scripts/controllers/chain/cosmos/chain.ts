import {
  ITXModalData,
  ITransactionResult,
  TransactionStatus,
  NodeInfo,
  IChainModule,
  ITXData,
} from 'models';
import * as m from 'mithril';
import { ApiStatus, IApp } from 'state';
import moment from 'moment';
import { CosmosApi } from 'adapters/chain/cosmos/api';
import { BlocktimeHelper } from 'helpers';
import { Observable, Subject } from 'rxjs';
import BN from 'bn.js';
import { CosmosToken } from 'adapters/chain/cosmos/types';
import { CosmosAccount } from './account';

export interface ICosmosTXData extends ITXData {
  chainId: string;
  accountNumber: number;
  sequence: number;

  // skip simulating the tx twice by saving the original estimated gas
  gas: number;
}

class CosmosChain implements IChainModule<CosmosToken, CosmosAccount> {
  private _api: CosmosApi;
  public get api(): CosmosApi {
    return this._api;
  }

  // TODO: rename this something like "bankDenom" or "gasDenom" or "masterDenom"
  private _denom: string;
  public get denom(): string {
    return this._denom;
  }

  // TODO: use this in the UI
  private _chainId: string;
  public get chainId(): string {
    return this._chainId;
  }

  private _staked: number;
  public get staked(): number {
    return this._staked;
  }

  private _app: IApp;
  public get app() { return this._app; }

  constructor(app: IApp) {
    this._app = app;
  }

  public coins(n: number | BN, inDollars?: boolean) {
    // never interpret a CosmosToken in dollars
    return new CosmosToken(this.denom, n);
  }

  public hasWebWallet(): boolean {
    return false;
  }

  private _blocktimeHelper: BlocktimeHelper = new BlocktimeHelper();
  public async init(node: NodeInfo, reset = false) {
    const rpcUrl = (node.url.indexOf('localhost') !== -1 || node.url.indexOf('127.0.0.1') !== -1) ?
      ('ws://' + node.url.split(':')[0] + ':26657') :
      ('wss://' + node.url.split(':')[0] + ':36657');

    // A note on RPC: gaiacli exposes a command line option "rest-server" which
    // creates the endpoint necessary. However, it doesn't send headers correctly
    // on its own, so you need to configure a reverse-proxy server (I did it with nginx)
    // that forwards the requests to it, and adds the header 'Access-Control-Allow-Origin: *'
    const restUrl = (node.url.indexOf('localhost') !== -1 || node.url.indexOf('127.0.0.1') !== -1) ?
      ('http://' + node.url.split(':')[0] + ':1318') :
      ('https://' + node.url.split(':')[0] + ':11318');
    console.log(`Starting Lunie API at ${restUrl} and Tendermint on ${rpcUrl}...`);
    this._api = new CosmosApi(rpcUrl, restUrl);
    if (this.app.chain.networkStatus === ApiStatus.Disconnected) {
      this.app.chain.networkStatus = ApiStatus.Connecting;
    }
    await this._api.init((header) => {
      this._blocktimeHelper.stamp(moment(header.time));
      this.app.chain.block.height = +header.height;
      m.redraw();
    });
    this.app.chain.networkStatus = ApiStatus.Connected;
    const { bonded_tokens } = await this._api.query.pool();
    this._staked = +bonded_tokens;
    const { bond_denom } = await this._api.query.stakingParameters();
    this._denom = bond_denom;          // uatom
    this._chainId = this._api.chainId; // cosmoshub-2
    m.redraw();
  }

  public async deinit(): Promise<void> {
    this.app.chain.networkStatus = ApiStatus.Disconnected;
    this._api.deinit();
  }

  public createTXModalData(
    author: CosmosAccount,
    txFunc,
    txName: string,
    objName: string,
    cb?: (success: boolean) => void,
  ): ITXModalData {
    return {
      author: author,
      txType: txName,
      cb: cb,
      txData: {
        unsignedData: async (): Promise<ICosmosTXData> => {
          const { cmdData: { messageToSign, chainId, accountNumber, gas, sequence } } = await txFunc();
          return {
            call: JSON.stringify({ type: 'cosmos-sdk/StdTx', value: messageToSign }),
            chainId,
            gas,
            accountNumber,
            sequence,
          };
        },
        transact: (signature?, computedGas?: number): Observable<ITransactionResult> => {
          const subject = new Subject<ITransactionResult>();
          let signer;
          if (signature) {
            // create replacement signer that delivers signature as needed
            signer = () => ({
              signature: Buffer.from(signature.signature, 'base64'),
              publicKey: Buffer.from(signature.pub_key.value, 'base64'),
            });
          } else {
            signer = (author as CosmosAccount).getLedgerSigner();
          }
          // perform transaction and coerce into compatible observable
          txFunc(computedGas).then(({ msg, memo, cmdData: { gas }}) => {
            return msg.send({ gas: '' + gas, memo }, signer);
          }).then(({ hash, sequence, included }) => {
            subject.next({ status: TransactionStatus.Ready, hash: hash });
            // wait for transaction to process
            return included();
          }).then((txObj) => {
            // TODO: is this necessarily success or can it fail?
            console.log(txObj);
            // TODO: add gas wanted/gas used to the modal?
            subject.next({
              status: TransactionStatus.Success,
              blocknum: +txObj.height,
              timestamp: moment(txObj.timestamp),
              hash: '--', // TODO: fetch the hash value of the block rather than the tx
            });
          }).catch((err) => {
            console.error(err);
            subject.next({ status: TransactionStatus.Error, err: err.message });
          });
          return subject.asObservable();
        },
      }
    };
  }
}

export default CosmosChain;
