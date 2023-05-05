import { redraw } from 'mithrilInterop';
import type { SubmittableResult } from '@polkadot/api';
import { ApiPromise, Keyring, WsProvider } from '@polkadot/api';
import type {
  ApiOptions,
  Signer,
  SubmittableExtrinsic,
  VoidFn,
} from '@polkadot/api/types';
import type { u128 } from '@polkadot/types';

import type { Compact } from '@polkadot/types/codec';
import type {
  ActiveEraInfo,
  Call,
  DispatchError,
  EraIndex,
  SessionIndex,
} from '@polkadot/types/interfaces';
import type { CallFunction, InterfaceTypes } from '@polkadot/types/types';
import { u8aToHex } from '@polkadot/util';
import { SubstrateCoin } from 'adapters/chain/substrate/types';

import { formatCoin } from 'adapters/currency';
import BN from 'bn.js';

import { SubstrateEvents } from 'chain-events/src';
import { ChainNetwork } from 'common-common/src/types';

import {
  notifyError,
  notifyInfo,
  notifySuccess,
} from 'controllers/app/notifications';
import { EventEmitter } from 'events';
import type {
  ChainInfo,
  IChainModule,
  ITXData,
  ITXModalData,
  NodeInfo,
} from 'models';
import { TransactionStatus } from 'models';
import moment from 'moment';
import type { IApp } from 'state';
import { ApiStatus } from 'state';
import { constructSubstrateUrl } from 'substrate';
import { formatAddressShort } from '../../../../../shared/utils';
import { chainToEventNetwork } from '../../server/chain_entities';
import type { SubstrateAccount } from './account';

export interface ISubstrateTXData extends ITXData {
  nonce: string;
  blockHash: string;
  isEd25519: boolean;
}

/* eslint-disable no-restricted-syntax */
class SubstrateChain implements IChainModule<SubstrateCoin, SubstrateAccount> {
  // balances
  private _totalbalance: SubstrateCoin;
  public get totalbalance() {
    return this._totalbalance;
  }

  private _existentialdeposit: SubstrateCoin;
  public get existentialdeposit() {
    return this._existentialdeposit;
  }

  private _metadataInitialized = false;

  private _eventsInitialized = false;

  private _sudoKey: string;
  public get sudoKey() {
    return this._sudoKey;
  }

  private _ss58Format: number;
  public get ss58Format() {
    return this._ss58Format;
  }

  public keyring(useEd25519 = false) {
    return new Keyring({
      type: useEd25519 ? 'ed25519' : 'sr25519',
      ss58Format: this._ss58Format,
    });
  }

  private _tokenDecimals: number;
  private _tokenSymbol: string;

  public get denom() {
    return this.app.chain.currency;
  }

  private readonly _silencedEvents = {};

  private _blockSubscription: VoidFn;

  private _suppressAPIDisconnectErrors = false;
  private _api: ApiPromise;

  private _app: IApp;
  public get app() {
    return this._app;
  }

  constructor(app: IApp) {
    this._app = app;
  }

  public coins(
    n: number | BN | SubstrateCoin | Compact<u128>,
    inDollars?: boolean
  ) {
    if (typeof n !== 'undefined') {
      return new SubstrateCoin(
        this._tokenSymbol,
        n,
        new BN(10).pow(new BN(this._tokenDecimals)),
        inDollars
      );
    }
  }

  public createType<K extends keyof InterfaceTypes>(type: K, ...params: any[]) {
    return this.api.registry.createType(type, ...params);
  }

  public findCall(callIndex: Uint8Array | string): CallFunction {
    return this.api.findCall(callIndex);
  }

  public get registry() {
    return this.api.registry;
  }

  private _connectTime = 0;
  private _timedOut = false;
  public get timedOut() {
    return this._timedOut;
  }

  // creates a substrate API provider and waits for it to emit a connected event
  public async createApiProvider(node: NodeInfo): Promise<WsProvider> {
    this._suppressAPIDisconnectErrors = false;
    const INTERVAL = 1000;
    const CONNECT_TIMEOUT = 10000;

    const nodeUrl = constructSubstrateUrl(node.url);
    const provider = new WsProvider(nodeUrl, INTERVAL);

    const connectedCb = () => {
      if (this.app.chain) {
        this.app.chain.networkStatus = ApiStatus.Connected;
        this.app.chain.networkError = null;
        this._suppressAPIDisconnectErrors = false;
        this._connectTime = 0;
        redraw();
      }
    };
    const disconnectedCb = () => {
      if (
        !this._suppressAPIDisconnectErrors &&
        this.app.chain &&
        node === this.app.chain.meta.node
      ) {
        this.app.chain.networkStatus = ApiStatus.Disconnected;
        this.app.chain.networkError = null;
        this._suppressAPIDisconnectErrors = true;
        setTimeout(() => {
          this._suppressAPIDisconnectErrors = false;
        }, CONNECT_TIMEOUT);
        redraw();
      }
    };
    const errorCb = (err) => {
      console.log(`api error; waited ${this._connectTime}ms`);
      this._connectTime += INTERVAL;
      if (
        !this._suppressAPIDisconnectErrors &&
        this.app.chain &&
        node === this.app.chain.meta.node
      ) {
        if (this.app.chain.networkStatus === ApiStatus.Connected) {
          notifyInfo('Reconnecting to chain...');
        } else {
          notifyInfo('Connecting to chain...');
        }
        this.app.chain.networkStatus = ApiStatus.Disconnected;
        this.app.chain.networkError = err.message;
        this._suppressAPIDisconnectErrors = true;
        setTimeout(() => {
          // this._suppressAPIDisconnectErrors = false;
          console.log('chain connection timed out!');
          provider.disconnect();
          this._timedOut = true;
          redraw();
        }, CONNECT_TIMEOUT);
        redraw();
      }
    };

    this._removeConnectedCb = provider.on('connected', connectedCb);
    this._removeDisconnectedCb = provider.on('disconnected', disconnectedCb);
    this._removeErrorCb = provider.on('error', errorCb);

    let unsubscribe: () => void;
    await new Promise<void>((resolve) => {
      unsubscribe = provider.on('connected', () => resolve());
    });
    if (unsubscribe) unsubscribe();
    window['wsProvider'] = provider;
    if (provider.isConnected) connectedCb();
    return provider;
  }

  public async resetApi(
    selectedChain: ChainInfo,
    additionalOptions?
  ): Promise<ApiPromise> {
    const provider = await this.createApiProvider(selectedChain.node);

    // note that we reuse the same provider and type registry to create both an rxjs
    // and a promise-based API -- this avoids creating multiple connections to the node
    const options: ApiOptions = {
      provider,
      ...additionalOptions,
    };
    this._api = await ApiPromise.create(options);
    return this._api;
  }

  private _removeConnectedCb: () => void;
  private _removeDisconnectedCb: () => void;
  private _removeErrorCb: () => void;

  public async deinitApi() {
    if (!this._api) return;
    try {
      await this._api.disconnect();
      if (this._removeConnectedCb) this._removeConnectedCb();
      if (this._removeDisconnectedCb) this._removeDisconnectedCb();
      if (this._removeErrorCb) this._removeErrorCb();
      this._api = null;
    } catch (e) {
      console.error(
        'Error disconnecting from API, it might already be disconnected.'
      );
    }
  }

  public get api(): ApiPromise {
    if (!this._api) {
      throw new Error('Must initialize API before using.');
    }
    return this._api;
  }

  public get apiInitialized(): boolean {
    return !!this._api;
  }

  // load existing events and subscribe to future via client node connection
  public async initChainEntities(): Promise<void> {
    await this._app.chainEntities.refresh(this.app.chain.id);
    const subscriber = new SubstrateEvents.Subscriber(this.api);
    const processor = new SubstrateEvents.Processor(this.api);
    return this._app.chainEntities.subscribeEntities(
      this._app.chain.id,
      chainToEventNetwork(this.app.chain.meta),
      subscriber,
      processor
    );
  }

  public listApiModules() {
    if (!this.api.tx) {
      return [];
    }
    return Object.keys(this.api.tx).filter((mod) => !!mod.trim());
  }

  public listModuleFunctions(mod: string) {
    if (!mod || !this.api.tx) {
      return [];
    }
    return Object.keys(this.api.tx[mod] || {}).filter(
      (modName) => !!modName.trim()
    );
  }

  public generateArgumentInputs(mod: string, func: string) {
    if (!mod || !func) {
      return [];
    }
    const tx = this.api.tx[mod][func];
    const args = tx.meta.args;
    return args.toArray();
  }

  public getTxMethod(mod: string, func: string, args: any[]): Call {
    const result = this.api.tx[mod][func];
    if (!result) {
      throw new Error(`unsupported transaction: ${mod}::${func}`);
    }
    return this.api.findCall(result.callIndex)(...args);
  }

  public deinitMetadata() {
    this._metadataInitialized = false;
  }

  // Loads chain metadata such as issuance and block period
  // TODO: lazy load this
  public async initMetadata(): Promise<void> {
    const chainname = await this.api.rpc.system.chain();
    const chainversion = await this.api.rpc.system.version();
    const chainruntimename = await this.api.rpc.system.name();
    const minimumperiod = this.api.consts.timestamp.minimumPeriod;
    const blockNumber = await this.api.derive.chain.bestNumber();
    const totalbalance = await this.api.query.balances.totalIssuance();
    const existentialdeposit = this.api.consts.balances.existentialDeposit;
    const sudokey = this.api.query.sudo
      ? await this.api.query.sudo.key()
      : null;
    const chainProps = await this.api.rpc.system.properties();
    this.app.chain.name = chainname.toString();
    this.app.chain.version = chainversion.toString();
    this.app.chain.runtimeName = chainruntimename.toString();

    this.app.chain.block.height = +blockNumber;
    // TODO: this is still wrong on edgeware local -- fix chain spec to get 4s rather than 8s blocktimes
    this.app.chain.block.duration = (+minimumperiod * 2) / 1000;

    // chainProps needs to be set first so calls to coins() correctly populate the denom
    if (chainProps) {
      const { ss58Format, tokenDecimals, tokenSymbol } = chainProps;
      this.registry.setChainProperties(
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        this.createType('ChainProperties', { ...chainProps, ss58Format })
      );
      this._ss58Format = +ss58Format.unwrapOr(42);
      this._tokenDecimals = +tokenDecimals.unwrapOr([12])[0];
      this._tokenSymbol = `${
        tokenSymbol.unwrapOr([this.app.chain.currency])[0]
      }`;
    }

    this._totalbalance = this.coins(totalbalance);
    this._existentialdeposit = this.coins(existentialdeposit);
    this._sudoKey = sudokey ? sudokey.toString() : undefined;

    // redraw
    redraw();
    this._metadataInitialized = true;
  }

  public silenceEvent(moduleName: string, eventName: string) {
    if (!this._silencedEvents[moduleName]) {
      this._silencedEvents[moduleName] = {};
    }
    if (!this._silencedEvents[moduleName][eventName]) {
      this._silencedEvents[moduleName][eventName] = true;
    }
  }

  public deinitEventLoop() {
    this._eventsInitialized = false;
    for (const event of Object.keys(this._silencedEvents)) {
      delete this._silencedEvents[event];
    }
    if (this._blockSubscription) {
      this._blockSubscription();
    }
  }

  public async initEventLoop() {
    // silence annoying events in the console
    this.silenceEvent('system', 'ExtrinsicSuccess');
    // TODO: these two should NOT be silenced in production
    this.silenceEvent('staking', 'OfflineSlash');
    this.silenceEvent('staking', 'OfflineWarning');
    this.silenceEvent('session', 'NewSession');
    this.silenceEvent('imOnline', 'HeartbeatReceived');
    this.silenceEvent('treasuryReward', 'TreasuryMinting');

    this._blockSubscription = await this.api.derive.chain.subscribeNewBlocks(
      async (signedBlock) => {
        // if app.chain has gone away, just return -- the subscription should be removed soon
        if (!this.app.chain) return;

        const block = signedBlock.block;
        const blockNumber = block.header.number;
        const timestamp = await this.api.query.timestamp.now();
        this.app.chain.block.height = +blockNumber;

        // update timestamp and handle stalling
        const blocktime = moment(+timestamp);
        if (this.app.chain.block.lastTime) {
          const computedDuration =
            blocktime.seconds() - this.app.chain.block.lastTime.seconds();
          if (computedDuration > this.app.chain.block.duration * 1) {
            // we should reset this flag if we receive regular blocktimes for e.g. 10 blocks in a row,
            // but for now it's not important
            this.app.chain.block.isIrregular = true;
            console.log(
              `Blocktime is irregular: took ${computedDuration}s, expected ${this.app.chain.block.duration}s.`
            );
          }
        }
        this.app.chain.block.lastTime = blocktime;

        // update events
        signedBlock.events.forEach((record) => {
          // extract the phase, event and the event types
          const { event, phase } = record;
          const types = event.typeDef;

          if (
            !this._silencedEvents[event.section] ||
            !this._silencedEvents[event.section][event.method]
          ) {
            console.log(
              `\t${event.section}:${event.method}:: (phase=${phase.toString()})`
            );

            // loop through each of the parameters, displaying the type and data
            if (event.data && event.data.forEach) {
              event.data.forEach((data, index) => {
                console.log(`\t\t\t${types[index].type}: ${data.toString()}`);
              });
            }
          }
        });
        redraw();
      }
    );
    this._eventsInitialized = true;
  }

  // TODO: refactor fee computation into a more standard form that can be used throughout
  //   and shown at TX creation time

  public async computeFees(
    senderAddress: string,
    txFunc: (api: ApiPromise) => SubmittableExtrinsic<'promise'>
  ): Promise<SubstrateCoin> {
    return txFunc(this.api)
      .paymentInfo(senderAddress)
      .then((fees) => this.coins(fees.partialFee.toBn()));
  }

  public createTXModalData(
    author: SubstrateAccount,
    txFunc: (api: ApiPromise) => SubmittableExtrinsic<'promise'>,
    txName: string,
    objName: string,
    cb?: (success: boolean) => void // TODO: remove this argument
  ): ITXModalData {
    // TODO: check if author has funds for tx fee
    const events = new EventEmitter();
    return {
      author,
      txType: txName,
      cb,
      txData: {
        events,
        unsignedData: async (): Promise<ISubstrateTXData> => {
          const txHex = txFunc(this.api).method.toHex();
          const nonce = this.api.query.system.accountNonce
            ? await this.api.query.system.accountNonce(author.address)
            : (await this.api.query.system.account(author.address)).nonce;
          const genesisHash = this.api.genesisHash.toHex();
          return {
            call: txHex,
            nonce: (+nonce).toString(),
            blockHash: genesisHash,
            isEd25519: author.isEd25519,
          };
        },
        transact: (hexTxOrAddress?: string, signer?: Signer): void => {
          let unsubscribe: Promise<VoidFn>;
          const txResultHandler = (result: SubmittableResult) => {
            const status = result.status;
            if (status.isReady) {
              console.log(`Pending ${txName}: "${objName}"`);
              events.emit(TransactionStatus.Ready.toString(), {});
            } else if (status.isFinalized || status.isInBlock) {
              for (const e of result.events) {
                if (this.api.events.system.ExtrinsicSuccess.is(e.event)) {
                  notifySuccess(`Confirmed ${txName}`);
                  events.emit(TransactionStatus.Success.toString(), {
                    hash: status.isFinalized
                      ? status.asFinalized.toHex()
                      : status.asInBlock.toHex(),
                    blocknum: this.app.chain.block.height,
                    timestamp: this.app.chain.block.lastTime,
                  });
                  if (unsubscribe) unsubscribe.then((u) => u());
                } else if (this.api.events.system.ExtrinsicFailed.is(e.event)) {
                  const errorData = e.event.data[0] as unknown as DispatchError;
                  let errorInfo;
                  if (errorData.isModule) {
                    const decoded = this.registry.findMetaError(
                      errorData.asModule
                    );
                    const { docs, method, section } = decoded;
                    errorInfo = `${section}.${method}: ${docs.join(' ')}`;
                  } else if (errorData.isBadOrigin) {
                    errorInfo = 'TX Error: invalid sender origin';
                  } else if (errorData.isCannotLookup) {
                    errorInfo = 'TX Error: cannot lookup call';
                  } else {
                    errorInfo = 'TX Error: unknown';
                  }
                  console.error(errorInfo);
                  notifyError(`Failed ${txName}: "${objName}"`);
                  events.emit(TransactionStatus.Failed.toString(), {
                    hash: status.isFinalized
                      ? status.asFinalized.toHex()
                      : status.asInBlock.toHex(),
                    blocknum: this.app.chain.block.height,
                    timestamp: this.app.chain.block.lastTime,
                    err: errorInfo,
                  });
                  if (unsubscribe) unsubscribe.then((u) => u());
                }
              }
            }
          };
          try {
            if (signer) {
              this.api.setSigner(signer);
              unsubscribe = txFunc(this.api).signAndSend(
                hexTxOrAddress,
                txResultHandler
              );
            } else if (hexTxOrAddress) {
              unsubscribe = this.api.tx(hexTxOrAddress).send(txResultHandler);
            } else {
              throw new Error('no signer found');
            }
          } catch (err) {
            if (err.message.indexOf('1014: Priority is too low') !== -1) {
              notifyError(
                'Another transaction is already queued for processing'
              );
            } else {
              notifyError(err.toString());
            }
            redraw();
            events.emit(TransactionStatus.Error.toString(), {
              err: err.toString(),
            });
          }
        },
      },
    };
  }

  public methodToTitle(method): string {
    if (!method) {
      return 'UNDEFINED';
    }
    const signature = this.generateArgumentInputs(method.section, method.call);
    const args = (method.args as any[]).map((arg, index) => {
      const argType = signature[index]
        ? signature[index].type.toString()
        : undefined;
      switch (argType) {
        case 'Proposal':
          return this.methodToTitle(arg);
        case 'Bytes':
          return u8aToHex(arg).toString().slice(0, 16);
        // TODO: provide chain to formatAddressShort
        case 'Address':
          return formatAddressShort(
            this.createType('AccountId', arg).toString(),
            null
          );
        // TODO: when do we actually see this Moment in practice? is this a correct decoding?
        case 'Moment':
          return moment(new Date(this.createType('Moment', arg).toNumber()))
            .utc()
            .toString();
        case 'Balance':
          return formatCoin(this.coins(this.createType('Balance', arg).toBn()));
        default:
          return arg.toString().length > 16
            ? `${arg.toString().substr(0, 15)}...`
            : arg.toString();
      }
    });
    const name = method.meta
      ? method.meta.name
      : `${method.section}.${method.call}`;
    return `${name}(${args.reduce(
      (prev, curr, idx) => prev + (idx > 0 ? ', ' : '') + curr,
      ''
    )})`;
  }

  public get session(): Promise<SessionIndex> {
    return this.api.query.session.currentIndex();
  }
}

export default SubstrateChain;
