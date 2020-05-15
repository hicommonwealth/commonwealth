import m from 'mithril';
import { ApiStatus, IApp } from 'state';
import moment from 'moment';
import { switchMap, catchError, map, shareReplay, first, filter } from 'rxjs/operators';
import { of, combineLatest, Observable, Unsubscribable } from 'rxjs';
import BN from 'bn.js';

import { ApiRx, WsProvider, SubmittableResult, Keyring, ApiPromise } from '@polkadot/api';
import { u8aToHex } from '@polkadot/util';
import {
  Moment,
  Balance,
  EventRecord,
  Event,
  BlockNumber,
  Index,
  Hash,
  AccountId,
  ChainProperties,
  DispatchError,
  ActiveEraInfo,
  EraIndex,
  SessionIndex
} from '@polkadot/types/interfaces';

import { Vec, Compact } from '@polkadot/types/codec';
import { createType } from '@polkadot/types/create';
import { ApiOptions, Signer, SubmittableExtrinsic } from '@polkadot/api/types';

import { formatCoin, Coin } from 'adapters/currency';
import { formatAddressShort, BlocktimeHelper } from 'helpers';
import {
  Proposal,
  NodeInfo,
  StorageModule,
  ITXModalData,
  ITransactionResult,
  TransactionStatus,
  IChainModule,
  ITXData,
  ChainBase,
  ChainClass,
  ChainEntity,
  ChainEvent,
  ChainEventType,
} from 'models';

import { CWEvent } from 'events/interfaces';
import loadSubstrateEvents from 'events/edgeware/migration';
import EdgewareEventSubscriber from 'events/edgeware/subscriber';
import EdgewareEventProcessor from 'events/edgeware/processor';
import { createApi as createApiPromise } from 'events/edgeware/index';
import {
  SubstrateEntityKind, SubstrateEventKind, ISubstrateCollectiveProposalEvents,
  eventToEntity, entityToFieldName
} from 'events/edgeware/types';

import { notifySuccess, notifyError } from 'controllers/app/notifications';
import { SubstrateCoin } from 'adapters/chain/substrate/types';
import { InterfaceTypes, CallFunction } from '@polkadot/types/types';
import { SubmittableExtrinsicFunction } from '@polkadot/api/types/submittable';
import { u128, TypeRegistry } from '@polkadot/types';
import { SubstrateAccount } from './account';

export type HandlerId = number;

// TODO: it may make sense to abstract this further, and keep api as a member
//   of the main chain module, but not necessary for now.
function createApi(app: IApp, node: NodeInfo, additionalOptions?): ApiRx {
  if (app.chain) {
    if (ChainBase.Substrate !== app.chain.base) {
      throw new Error('Invalid chain selection');
    }
    const registry = new TypeRegistry();
    const nodeUrl = node.url;
    const hasProtocol = nodeUrl.indexOf('wss://') !== -1 || nodeUrl.indexOf('ws://') !== -1;
    const isInsecureProtocol = nodeUrl.indexOf('edgewa.re') === -1;
    const protocol = hasProtocol ? '' : (isInsecureProtocol ? 'ws://' : 'wss://');
    const options: ApiOptions = {
      provider : new WsProvider(protocol + nodeUrl),
      ...additionalOptions,
      registry,
    };
    // tslint:disable-next-line
    window['wsProvider'] = options.provider;
    return new ApiRx(options);
  }
}

export async function initApiPromise(chain, url): Promise<ApiPromise> {
  // TODO: figure out a way to link this provider/API combo up with the connection
  //   event handling further down, regarding the "connected/disconnected" light,
  //   error msgs, etc.
  const provider = new WsProvider(url);
  await new Promise((resolve) => {
    provider.on('connected', () => resolve());
  });
  const apiPromise = await createApiPromise(provider, chain.startsWith('edgeware')).isReady;
  return apiPromise;
}

// client event handler
function handleCWEvent(app: IApp, chain: string, cwEvent: CWEvent): [ ChainEntity, ChainEvent ] | null {
  // immediately return if no entity involved, event unrelated to proposals/etc
  const entityKind = eventToEntity(cwEvent.data.kind);
  if (!entityKind) return null;

  // create event type
  const eventType = new ChainEventType(
    `${chain}-${cwEvent.data.kind.toString()}`,
    chain,
    cwEvent.data.kind.toString()
  );

  // create event
  const event = new ChainEvent(cwEvent.blockNumber, cwEvent.data, eventType);

  // create entity
  const fieldName = entityToFieldName(entityKind);
  if (!fieldName) return null;
  const fieldValue = event.data[fieldName];
  const entity = new ChainEntity(chain, entityKind, fieldValue.toString(), []);
  app.chainEntities.update(entity, event);
  // eslint-disable-next-line no-use-before-define
  handleSubstrateEntityUpdate(app.chain, entity, event);
}

export async function initChainEntities(app: IApp, api: ApiPromise, chain: string) {
  const cwEvents = await loadSubstrateEvents(api);
  // eslint-disable-next-line no-restricted-syntax
  for (const cwEvent of cwEvents) {
    handleCWEvent(app, chain, cwEvent);
  }
}

export async function initChainEntitySubscription(app: IApp, api: ApiPromise, chain: string) {
  const subscriber = new EdgewareEventSubscriber(api);
  const processor = new EdgewareEventProcessor(api);
  // TODO: handle unsubscribing
  console.log('Subscribing to chain events.');
  subscriber.subscribe(async (block) => {
    const cwEvents = await processor.process(block);
    // eslint-disable-next-line no-restricted-syntax
    for (const cwEvent of cwEvents) {
      const results = handleCWEvent(app, chain, cwEvent);
    }
  });
}

export function handleSubstrateEntityUpdate(chain, entity: ChainEntity, event: ChainEvent): void {
  switch (entity.type) {
    case SubstrateEntityKind.DemocracyProposal: {
      return chain.democracyProposals.updateProposal(entity, event);
    }
    case SubstrateEntityKind.DemocracyReferendum: {
      return chain.democracy.updateProposal(entity, event);
    }
    case SubstrateEntityKind.DemocracyPreimage: {
      if (event.data.kind === SubstrateEventKind.PreimageNoted) {
        console.log('dispatching preimage noted, from entity', entity);
        const proposal = chain.democracyProposals.getByHash(entity.typeId);
        if (proposal) {
          proposal.update(event);
        }
        const referendum = chain.democracy.getByHash(entity.typeId);
        if (referendum) {
          referendum.update(event);
        }
      }
      break;
    }
    case SubstrateEntityKind.TreasuryProposal: {
      return chain.treasury.updateProposal(entity, event);
    }
    case SubstrateEntityKind.CollectiveProposal: {
      const collectiveName = (event.data as ISubstrateCollectiveProposalEvents).collectiveName;
      if (collectiveName && collectiveName === 'technicalCommittee' && chain.class === ChainClass.Kusama) {
        return chain.technicalCommittee.updateProposal(entity, event);
      } else {
        return chain.council.updateProposal(entity, event);
      }
    }
    case SubstrateEntityKind.SignalingProposal: {
      if (chain.class === ChainClass.Edgeware) {
        return chain.signaling.updateProposal(entity, event);
      } else {
        console.error('Received signaling update on non-edgeware chain!');
        break;
      }
    }
    default:
      break;
  }
  // force titles to update?
  m.redraw();
}

export interface ISubstrateTXData extends ITXData {
  nonce: string;
  blockHash: string;
  isEd25519: boolean;
}

class SubstrateChain implements IChainModule<SubstrateCoin, SubstrateAccount> {
  // balances
  private _totalbalance: SubstrateCoin;
  public get totalbalance() { return this._totalbalance; }

  private _existentialdeposit: SubstrateCoin;
  public get existentialdeposit() { return this._existentialdeposit; }

  private _creationfee: SubstrateCoin;
  public get creationfee() { return this._creationfee; }

  private _metadataInitialized: boolean = false;
  public get metadataInitialized() { return this._metadataInitialized; }

  private _eventsInitialized: boolean = false;
  public get eventsInitialized() { return this._eventsInitialized; }

  private _sudoKey: string;
  public get sudoKey() { return this._sudoKey; }

  private _ss58Format: number;
  public get ss58Format() { return this._ss58Format; }
  public keyring(useEd25519 = false) {
    return new Keyring({
      type: useEd25519 ? 'ed25519' : 'sr25519',
      ss58Format: this._ss58Format,
    });
  }

  private _tokenDecimals: number;
  private _tokenSymbol: string;

  public get denom() { return this.app.chain.currency; }

  private readonly _eventHandlers = { };
  private readonly _silencedEvents = { };

  private _blockSubscription: Unsubscribable;
  private _timestampSubscription: Unsubscribable;
  private _eventSubscription: Unsubscribable;

  private _suppressAPIDisconnectErrors: boolean = false;
  private _api: ApiRx;

  private _reservationFee: SubstrateCoin;
  public get reservationFee() { return this._reservationFee; }

  private _app: IApp;
  public get app() { return this._app; }

  constructor(app: IApp) {
    this._app = app;
  }

  public coins(n: number | BN | SubstrateCoin | Compact<u128>, inDollars?: boolean) {
    if (typeof n !== 'undefined') {
      return new SubstrateCoin(this._tokenSymbol, n, new BN(10).pow(new BN(this._tokenDecimals)), inDollars);
    }
  }

  public hasWebWallet(): boolean {
    return true;
  }

  public createType<K extends keyof InterfaceTypes>(type: K, ...params: any[]): InterfaceTypes[K] {
    return this._api.registry.createType(type, ...params);
  }
  public findCall(callIndex: Uint8Array | string): CallFunction {
    return this._api.findCall(callIndex);
  }
  public get registry() { return this._api.registry; }

  public resetApi(selectedNode: NodeInfo, additionalOptions?): Promise<ApiRx> {
    const api = this.initApi(createApi(this.app, selectedNode, additionalOptions), selectedNode);
    return api;
  }

  private _connectedCb: () => void;
  private _disconnectedCb: () => void;
  private _errorCb: (err) => void;

  public initApi(api: ApiRx, node?: NodeInfo): Promise<ApiRx> {
    this._connectedCb = () => {
      this.app.chain.networkStatus = ApiStatus.Connected;
      this.app.chain.networkError = null;
      this._suppressAPIDisconnectErrors = false;
      m.redraw();
    };
    this._disconnectedCb = () => {
      if (!this._suppressAPIDisconnectErrors && this.app.chain && node === this.app.chain.meta) {
        this.app.chain.networkStatus = ApiStatus.Disconnected;
        this.app.chain.networkError = null;
        this._suppressAPIDisconnectErrors = true;
        setTimeout(() => {
          this._suppressAPIDisconnectErrors = false;
        }, 5000);
        m.redraw();
      }
    };
    this._errorCb = (err) => {
      if (!this._suppressAPIDisconnectErrors && this.app.chain && node === this.app.chain.meta) {
        console.log('api error');
        this.app.chain.networkStatus = ApiStatus.Disconnected;
        this.app.chain.networkError = err.message;
        notifyError('API error');
        this._suppressAPIDisconnectErrors = true;
        setTimeout(() => {
          this._suppressAPIDisconnectErrors = false;
        }, 5000);
        m.redraw();
      }
    };
    api.on('connected', this._connectedCb);
    api.on('disconnected', this._disconnectedCb);
    api.on('error', this._errorCb);
    this._api = api;
    return this._api.isReady.toPromise();
  }

  public deinitApi() {
    if (!this._api) return;
    try {
      this._api.disconnect();
      if (this._connectedCb) this._api.off('connected', this._connectedCb);
      if (this._disconnectedCb) this._api.off('disconnected', this._disconnectedCb);
      if (this._errorCb) this._api.off('error', this._errorCb);
      this._api = null;
    } catch (e) {
      console.error('Error disconnecting from API, it might already be disconnected.');
    }
  }

  public get api(): Observable<ApiRx> {
    if (!this._api) {
      throw new Error('Must initialize API before using.');
    }
    return this._api.isReady;
  }

  public get apiInitialized() : boolean {
    return !!this._api;
  }

  public query<T>(fn: (api: ApiRx) => Observable<T>): Observable<T> {
    return this.api.pipe(switchMap((api: ApiRx) => fn(api)));
  }

  public listApiModules() {
    if (!this._api.tx) {
      return [];
    }
    return Object.keys(this._api.tx).filter((m) => !!(m.trim()));
  }

  public listModuleFunctions(mod : string) {
    if (!mod || !this._api.tx) {
      return [];
    }
    return Object.keys(this._api.tx[mod] || {}).filter((m) => !!(m.trim()));
  }

  public generateArgumentInputs(mod: string, func: string) {
    if (!mod || !func) {
      return [];
    }
    const tx = this._api.tx[mod][func];
    const args = tx.meta.args;
    return args.toArray();
  }

  public generateMethod(mod: string, func: string, args) {
    if (!mod || !func) {
      return null;
    }
    return this._api.tx[mod][func](...args);
  }

  public getTxMethod(mod: string, func: string): SubmittableExtrinsicFunction<'rxjs'> {
    const result = this._api.tx[mod][func];
    if (!result) {
      throw new Error(`unsupported transaction: ${mod}::${func}`);
    }
    return result;
  }

  public deinitMetadata() {
    this._metadataInitialized = false;
  }

  // Loads chain metadata such as issuance and block period
  // TODO: lazy load this
  public initMetadata(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.api.pipe(
        switchMap((api: ApiRx) => {
          return combineLatest(
            api.rpc.system.chain(),
            api.rpc.system.version(),
            api.rpc.system.name(),
            of(api.consts.timestamp.minimumPeriod),
            api.derive.chain.bestNumber(),
            api.query.balances.totalIssuance(),
            of(api.consts.balances.existentialDeposit),
            of(api.consts.balances.creationFee),
            api.query.sudo ? api.query.sudo.key() : of(null),
            api.rpc.system.properties(),
            api.consts.nicks ? of(api.consts.nicks.reservationFee) : of(null),
          );
        }),
        first(), // TODO: leave this open?
      ).subscribe(([
        chainname, chainversion, chainruntimename, minimumperiod, blockNumber,
        totalbalance, existentialdeposit, creationfee, sudokey,
        chainProps, reservationFee,
      ]: [
          string, string, string, Moment, BlockNumber,
          Balance, Balance, Balance, AccountId, ChainProperties, Balance
      ]) => {
        this.app.chain.name = chainname;
        this.app.chain.version = chainversion;
        this.app.chain.runtimeName = chainruntimename;

        this.app.chain.block.height = +blockNumber;
        // TODO: this is still wrong on edgeware local -- fix chain spec to get 4s rather than 8s blocktimes
        this.app.chain.block.duration = +minimumperiod * 2 / 1000;

        // chainProps needs to be set first so calls to coins() correctly populate the denom
        if (chainProps) {
          const { ss58Format, tokenDecimals, tokenSymbol } = chainProps;
          this.registry.setChainProperties(this.createType('ChainProperties', { ...chainProps, ss58Format }));
          this._ss58Format = +ss58Format.unwrapOr(42);
          this._tokenDecimals = +tokenDecimals.unwrapOr(12);
          this._tokenSymbol = tokenSymbol.unwrapOr(this.app.chain.currency).toString();
        }

        this._totalbalance = this.coins(totalbalance);
        this._existentialdeposit = this.coins(existentialdeposit);
        this._creationfee = this.coins(creationfee);
        this._sudoKey = sudokey ? sudokey.toString() : undefined;
        this._reservationFee = reservationFee ? this.coins(reservationFee) : null;
        // grab last timestamps from storage and use to compute blocktime
        const TIMESTAMP_LOOKBACK = 5;
        this.api.pipe(
          switchMap((api: ApiRx) => {
            const blockNumbers = [...Array(TIMESTAMP_LOOKBACK).keys()].map((i) => +blockNumber - i - 1);
            return combineLatest(api.query.system.blockHash.multi(blockNumbers), of(api));
          }),
          switchMap(([hashes, api]: [Hash[], ApiRx]) => combineLatest(
            hashes.map((hash) => api.query.timestamp.now.at(hash))
          )),
          first(),
        ).subscribe((timestamps: Moment[]) => {
          const blocktimeHelper = new BlocktimeHelper();
          for (const timestamp of timestamps.reverse()) {
            blocktimeHelper.stamp(moment(+timestamp));
          }
          this.app.chain.block.duration = blocktimeHelper.blocktime;
          this._metadataInitialized = true;
          resolve();
        });
      },
      (err) => reject(new Error(err)));
    });
  }

  public silenceEvent(moduleName: string, eventName: string) {
    if (!this._silencedEvents[moduleName]) {
      this._silencedEvents[moduleName] = { };
    }
    if (!this._silencedEvents[moduleName][eventName]) {
      this._silencedEvents[moduleName][eventName] = true;
    }
  }

  public unsilenceEvent(moduleName: string, eventName: string) {
    if (this._silencedEvents[moduleName] && this._silencedEvents[moduleName][eventName]) {
      delete this._silencedEvents[moduleName][eventName];
    }
  }

  public addEventHandler(
    moduleName: string,
    eventName: string,
    callback: (event: Event, block?: number) => void
  ): HandlerId {
    if (!this._eventHandlers[moduleName]) {
      this._eventHandlers[moduleName] = { };
    }
    if (!this._eventHandlers[moduleName][eventName]) {
      this._eventHandlers[moduleName][eventName] = { nextId: 1 };
    }
    const id = this._eventHandlers[moduleName][eventName].nextId++;
    this._eventHandlers[moduleName][eventName][id] = callback;
    return id;
  }

  public removeEventHandler(moduleName: string, eventName: string, id: HandlerId): boolean {
    if (this.isHandler(moduleName, eventName, id)) {
      delete this._eventHandlers[moduleName][eventName][id];
      return true;
    }
    return false;
  }

  public isHandler(moduleName: string, eventName: string, id: HandlerId): boolean {
    return this._eventHandlers[moduleName]
      && this._eventHandlers[moduleName][eventName]
      && !!this._eventHandlers[moduleName][eventName][id];
  }

  public deinitEventLoop() {
    this._eventsInitialized = false;
    for (const event of Object.keys(this._eventHandlers)) {
      delete this._eventHandlers[event];
    }
    for (const event of Object.keys(this._silencedEvents)) {
      delete this._silencedEvents[event];
    }
    if (this._eventSubscription) {
      this._eventSubscription.unsubscribe();
    }
    if (this._blockSubscription) {
      this._blockSubscription.unsubscribe();
    }
    if (this._timestampSubscription) {
      this._timestampSubscription.unsubscribe();
    }
  }

  public initEventLoop() {
    // grab block numbers from header
    this._blockSubscription = this.api.pipe(
      switchMap((api: ApiRx) => combineLatest(
        api.derive.chain.bestNumber(),
        api.query.timestamp.now()
      )
    )).subscribe(([blockNumber, timestamp]: [BlockNumber, Moment]) => {
      // if app.chain has gone away, just return -- the subscription should be removed soon
      if (!this.app.chain) return;

      this.app.chain.block.height = +blockNumber;
      const blocktime = moment(+timestamp);
      if (this.app.chain.block.lastTime) {
        const computedDuration = blocktime.seconds() - this.app.chain.block.lastTime.seconds();
        if (computedDuration > this.app.chain.block.duration * 1) {
          // we should reset this flag if we receive regular blocktimes for e.g. 10 blocks in a row,
          // but for now it's not important
          this.app.chain.block.isIrregular = true;
          console.log(`Blocktime is irregular: took ${computedDuration}s, expected ${this.app.chain.block.duration}s.`);
        }
      }
      this.app.chain.block.lastTime = blocktime;
      m.redraw();
    });

    // silence annoying events in the console
    this.silenceEvent('system', 'ExtrinsicSuccess');
    // TODO: these two should NOT be silenced in production
    this.silenceEvent('staking', 'OfflineSlash');
    this.silenceEvent('staking', 'OfflineWarning');
    this.silenceEvent('session', 'NewSession');
    this.silenceEvent('imOnline', 'HeartbeatReceived');
    this.silenceEvent('treasuryReward', 'TreasuryMinting');

    // init main event loop
    this._eventSubscription = this.api.pipe(
      switchMap((api: ApiRx) => api.query.system.events()),
    ).subscribe((events: Vec<EventRecord>) => {
      // if app.chain has gone away, just return -- the subscription should be removed soon
      if (!this.app.chain) return;

      const blocknum = this.app.chain.block.height;
      events.forEach((record) => {
        // extract the phase, event and the event types
        const { event, phase } = record;
        const types = event.typeDef;

        if (!this._silencedEvents[event.section] || !this._silencedEvents[event.section][event.method]) {
          console.log(`\t${event.section}:${event.method}:: (phase=${phase.toString()})`);

          // loop through each of the parameters, displaying the type and data
          event.data.forEach((data, index) => {
            console.log(`\t\t\t${types[index].type}: ${data.toString()}`);
          });
        }

        // dispatch event to handler
        if (this._eventHandlers[event.section] && this._eventHandlers[event.section][event.method]) {
          const handlers = Object.keys(this._eventHandlers[event.section][event.method]);
          handlers.map((id) => {
            if (id !== 'nextId' && this.isHandler(event.section, event.method, +id)) {
              this._eventHandlers[event.section][event.method][+id](event, blocknum);
            }
          });
        }
      });
    },
    (err: string) => {
      console.error('Failed to get chain events: ' + err);
    });
    this._eventsInitialized = true;
  }

  // TODO: refactor fee computation into a more standard form that can be used throughout
  //   and shown at TX creation time
  public async canPayFee(
    sender: SubstrateAccount,
    txFunc: (api: ApiRx) => SubmittableExtrinsic<'rxjs'>,
    additionalDeposit?: SubstrateCoin,
  ): Promise<boolean> {
    const senderBalance = await sender.freeBalance.pipe(first()).toPromise();
    const netBalance = additionalDeposit ? senderBalance.sub(additionalDeposit) : senderBalance;
    let fees: SubstrateCoin;
    if (sender.chainClass === ChainClass.Edgeware) {
      // XXX: we cannot compute tx fees on edgeware yet, so we are forced to assume no fees
      //   besides explicit additional fees
      fees = additionalDeposit || this.coins(0);
    } else {
      fees = await this.computeFees(sender.address, txFunc);
    }
    console.log(`sender free balance: ${senderBalance.format(true)}, tx fees: ${fees.format(true)}, additional deposit: ${additionalDeposit ? additionalDeposit.format(true) : 'N/A'}`);
    return netBalance.gte(fees);
  }

  public async computeFees(
    senderAddress: string,
    txFunc: (api: ApiRx) => SubmittableExtrinsic<'rxjs'>,
  ): Promise<SubstrateCoin> {
    return new Promise((resolve, reject) => {
      this.api.pipe(
        switchMap((api: ApiRx) => {
          return txFunc(api).paymentInfo(senderAddress);
        }),
      ).subscribe((fees) => {
        resolve(this.coins(fees.partialFee.toBn()));
      }, (error) => reject(error));
    });
  }

  public createTXModalData(
    author: SubstrateAccount,
    txFunc,
    txName: string,
    objName: string,
    cb?: (success: boolean) => void, // TODO: remove this argument
  ): ITXModalData {
    // TODO: check if author has funds for tx fee
    return {
      author: author,
      txType: txName,
      cb: cb,
      txData: {
        unsignedData: (): Promise<ISubstrateTXData> => {
          return new Promise((resolve, reject) => {
            this.api.pipe(
              switchMap((api: ApiRx) => {
                return combineLatest(
                  of(txFunc(api).method.toHex()),
                  api.query.system.accountNonce(author.address),
                  of(api.genesisHash)
                );
              }),
              switchMap(([txHex, nonce, genesisHash]: [string, Index, Hash]): Observable<ISubstrateTXData> => {
                return of({
                  call: txHex,
                  nonce: nonce.toNumber().toString(),
                  blockHash: genesisHash.toHex(),
                  isEd25519: author.isEd25519,
                });
              }),
              first(),
            ).subscribe(
              (data) => resolve(data),
              (error) => reject(new Error(error)),
            );
          });
        },
        transact: (hexTxOrAddress?: string, signer?: Signer): Observable<ITransactionResult> => {
          return this.api.pipe(
            switchMap((api: ApiRx) => {
              if (signer) {
                api.setSigner(signer);
              }
              return combineLatest(
                of(api),
                signer ? txFunc(api).signAndSend(hexTxOrAddress) :
                hexTxOrAddress ? api.tx(hexTxOrAddress).send()
                  : txFunc(api).signAndSend(author.getKeyringPair())
              );
            }),
            map(([api, result]: [ApiRx, SubmittableResult]) => {
              const status = result.status;
              if (status.isReady) {
                notifySuccess(`Pending ${txName}: "${objName}"`);
                return { status: TransactionStatus.Ready };
              }
              if (status.isFinalized) {
                for (const e of result.events) {
                  const { data, method, section } = e.event;
                  if (section === 'system') {
                    if (method === 'ExtrinsicSuccess') {
                      notifySuccess(`Confirmed ${txName}: "${objName}"`);
                      return {
                        status: TransactionStatus.Success,
                        hash: status.asFinalized.toHex(),
                        blocknum: this.app.chain.block.height,
                        timestamp: this.app.chain.block.lastTime,
                      };
                    } else if (method === 'ExtrinsicFailed') {
                      const errorData = data[0] as DispatchError;
                      if (errorData.isModule) {
                        const errorInfo = this.registry.findMetaError(errorData.asModule.toU8a());
                        console.error(`${errorInfo.section}::${errorInfo.name}: ${errorInfo.documentation[0]}`);
                      }
                      notifyError(`Failed ${txName}: "${objName}"`);
                      return {
                        status: TransactionStatus.Failed,
                        hash: status.asFinalized.toHex(),
                        blocknum: this.app.chain.block.height,
                        timestamp: this.app.chain.block.lastTime,
                      };
                    }
                  }
                }
              }
            }),
            catchError((err) => {
              if (err.message.indexOf('1014: Priority is too low') !== -1) {
                notifyError('Another transaction is already queued for processing');
              } else {
                notifyError(err.toString());
              }
              m.redraw();
              return of({ status: TransactionStatus.Error, err: err.toString() });
            }),
            filter((txResult) => !!txResult),
            shareReplay(),
          );
        },
      }
    };
  }

  public methodToTitle(method): string {
    if (!method) {
      return 'UNDEFINED';
    }
    const signature = this.generateArgumentInputs(method.section, method.call);
    const args = (method.args as any[]).map((arg, index) => {
      const argType = signature[index] ? signature[index].type.toString() : undefined;
      switch (argType) {
        case 'Proposal': return this.methodToTitle(arg);
        case 'Bytes': return u8aToHex(arg).toString().slice(0, 16);
        case 'Address': return formatAddressShort(this.createType('AccountId', arg).toString());
        // TODO: when do we actually see this Moment in practice? is this a correct decoding?
        case 'Compact<Moment>': return moment(new Date(this.createType('Compact<Moment>', arg).toNumber())).utc().toString();
        case 'Compact<Balance>': return formatCoin(this.coins(this.createType('Compact<Balance>', arg)));
        default: return arg.toString().length > 16 ? arg.toString().substr(0, 15) + '...' : arg.toString();
      }
    });
    const name = method.meta ? method.meta.name : `${method.section}.${method.call}`;
    return name + '(' + args.reduce((prev, curr, idx) => prev + (idx > 0 ? ', ' : '') + curr, '') + ')';
  }

  public get currentEra(): Observable<EraIndex> {
    return this.query((api: ApiRx) => api.query.staking.currentEra())
      .pipe(map((era: EraIndex) => {
        if (era) {
          return era;
        } else {
          return null;
        }
      }));
  }

  public get activeEra(): Observable<ActiveEraInfo> {
    return this.query((api: ApiRx) => {
      if (api.query.staking.activeEra) {
        return api.query.staking.activeEra();
      } else {
        return of(null);
      }
    })
      .pipe(map((era: ActiveEraInfo) => {
        if (era) {
          return era;
        } else {
          return null;
        }
      }));
  }

  public get session(): Observable<SessionIndex> {
    return this.query((api: ApiRx) => api.query.session.currentIndex())
      .pipe(map((sessionInx) => {
        if (sessionInx) {
          return sessionInx;
        } else {
          return null;
        }
      }));
  }
}

export default SubstrateChain;
