/* eslint-disable max-classes-per-file */
import { default as m } from 'mithril';
import { default as moment } from 'moment-twitter';
import { default as jdenticon } from 'jdenticon';
import { default as $ } from 'jquery';
import BN from 'bn.js';

import app, { ApiStatus } from 'state';
import { Coin } from 'adapters/currency';
import { IIdentifiable, ICompletable, ProposalAdapter } from 'adapters/shared';
import { Unsubscribable, Observable, BehaviorSubject, Subject, of, forkJoin } from 'rxjs';
import { switchMap, flatMap, map } from 'rxjs/operators';
import { ProposalStore } from './stores';
import ProposalArchiveController from '../controllers/server/proposals';

export enum ChainBase {
  CosmosSDK = 'cosmos',
  Substrate = 'substrate',
  Ethereum = 'ethereum',
  NEAR = 'near',
}

export enum ChainNetwork {
  Edgeware = 'edgeware',
  Kusama = 'kusama',
  Cosmos = 'cosmos',
  Ethereum = 'ethereum',
  NEAR = 'near',
  Moloch = 'moloch',
  Metacartel = 'metacartel',
}

export enum ChainClass {
  Edgeware = 'edgeware',
  Kusama = 'kusama',
  Supernova = 'supernova',
  CosmosHub = 'cosmos-hub',
  Gaia13k = 'gaia-13k',
  Ethereum = 'ethereum',
  Near = 'near',
  Moloch = 'moloch',
}

export abstract class StorageModule {
  public abstract get store();
}

export interface IBlockInfo {
  height: number;
  duration: number;
  lastTime: moment.Moment;
  isIrregular: boolean;
}

// Implemented by a chain's top-level module. Responsible for high-level
// metadata, API, and event-handling functionality.
export interface IChainModule<C extends Coin, A extends Account<C>> {
  coins(n: number | BN, inDollars?: boolean): C;
  denom: string;

  hasWebWallet(): boolean;

  // Signs and submits an on-chain transaction, wrapping it in a modal dialog that tracks its status.
  createTXModalData(
    author: A,
    txFunc,
    txName: string,
    objName: string,
    cb?: (success: boolean) => void): ITXModalData;
}

// Implemented by a chain's account module. Store for account objects.
export interface IAccountsModule<C extends Coin, A extends Account<C>> extends StorageModule {
  // Converts an address into an account module. Should check storage prior to
  // creating a new account object.
  get(address: string, keytype?: string): A;
}

// Implemented by a chain's governance module, assuming it uses a proposal-based mechanism.
export abstract class ProposalModule<
  ApiT,
  CT extends IIdentifiable,
  ST extends ICompletable,
  ProposalT extends Proposal<ApiT, Coin, CT, ST, IVote<Coin>>,
  AdapterT extends ProposalAdapter<ApiT, CT, ST>
> extends StorageModule {
  public readonly store = new ProposalStore<ProposalT>();

  protected _adapter: AdapterT;
  public get adapter() { return this._adapter; }

  protected _initialized: boolean = false;
  public get initialized() { return this._initialized; }

  protected initSubscription(api: ApiT, newPropsFn: (ps: CT[]) => ProposalT[]): Promise<ProposalT[]> {
    return new Promise((resolve, reject) => {
      this._subscription = this.adapter.subscribeNew(api)
      .pipe(
        flatMap((ps: CT[]) => {
          const props = newPropsFn(ps);
          if (props.length === 0) {
            return of(props);
          } else {
            return forkJoin(props.map((p) => p.initialized$)).pipe(map(() => props));
          }
        })
      ).subscribe((props: ProposalT[]) => {
        //console.log('fetched proposals for: ' + this.constructor.name);
        resolve(props);
      }, (err) => {
        console.error(`${this.constructor.name}: proposal error: ${JSON.stringify(err)}`);
        reject(new Error(err));
      });
    });
  }

  protected _subscription: Unsubscribable;

  public deinit() {
    this._initialized = false;
    this._adapter = null;
    if (this._subscription) {
      this._subscription.unsubscribe();
    }
    this.store.getAll().forEach((p) => p.unsubscribe());
    this.store.clear();
  }

  public abstract createTx(...args): ITXModalData;
}

// Offchain stores and management for discussion features.
export interface IOffchainAccountsModule<C extends Coin, A extends Account<C>> extends StorageModule {
  get(address: string, chain?: string): A;
}

interface IServerControllers {
  proposals?: ProposalArchiveController;
}

// TODO create some generic class for ICommunity and IChainAdapter
export abstract class ICommunityAdapter<C extends Coin, A extends Account<C>> {
  public abstract loaded: boolean;

  public abstract serverLoaded: boolean;

  public abstract server: IServerControllers;

  public abstract accounts: IOffchainAccountsModule<C, A>;

  public abstract init: (onServerLoaded? : () => void) => Promise<void>;

  public abstract deinit: () => Promise<void>;

  public networkStatus: ApiStatus = ApiStatus.Connected;

  public name: string;

  public readonly meta: CommunityInfo;

  constructor(meta: CommunityInfo) {
    this.meta = meta;
  }

  get id() {
    return this.meta.id;
  }
}

// Extended by a chain's main implementation. Responsible for module
// initialization. Saved as `app.chain` in the global object store.
// TODO: move this from `app.chain` or else rename `chain`?
export abstract class IChainAdapter<C extends Coin, A extends Account<C>> {
  public abstract loaded: boolean;
  public abstract serverLoaded: boolean;
  public abstract chain: IChainModule<C, A>;
  public abstract accounts: IAccountsModule<C, A>;
  public abstract server: IServerControllers;

  public abstract init: (onServerLoaded? : () => void) => Promise<void>;
  public abstract deinit: () => Promise<void>;

  public abstract base: ChainBase;
  public abstract class: ChainClass;

  public networkStatus: ApiStatus = ApiStatus.Disconnected;
  public networkError: string;

  public readonly meta: NodeInfo;
  public readonly block: IBlockInfo;

  public version: string;
  public name: string;
  public runtimeName: string;

  constructor(meta: NodeInfo) {
    this.meta = meta;
    this.block = {
      height: 0,
      duration: 0,
      lastTime: moment(),
      isIrregular: false,
    };
  }

  get id() {
    return this.meta.chain.id;
  }
  get network() {
    return this.meta.chain.network;
  }
  get currency() {
    return this.meta.chain.symbol;
  }
}

export enum OffchainThreadKind {
  Forum = 'forum',
  Link = 'link',
  Question = 'question',
  Request = 'request',
}

export enum TransactionStatus {
  'Ready',
  'Success',
  'Failed',
  'Error',
}

export interface ITransactionResult {
  status: TransactionStatus;
  hash?: string;
  err?: string;
  blocknum?: number;
  timestamp?: moment.Moment;
}

// TODO: abstract this for edgeware? Maybe replace with "command string"?
export interface ITXData {
  call: string;
}

// TODO: figure out how to abstract this to make the tx_signing_modal work with cosmos
export interface ITXModalData {
  author: Account<any>;
  txType: string;
  txData: {
    // get blob of tx data to sign
    unsignedData: () => Promise<ITXData>,

    // perform transaction
    transact: () => Observable<ITransactionResult>
  };

  // callback triggered upon exit
  cb?: (success: boolean) => void;
}

export interface IVote<C extends Coin> {
  account: Account<C>;
}

export class DepositVote<C extends Coin> implements IVote<C> {
  public readonly account: Account<C>;
  public readonly deposit: C;
  constructor(account: Account<C>, deposit: C) {
    this.account = account;
    this.deposit = deposit;
  }
}

export class BinaryVote<C extends Coin> implements IVote<C> {
  public readonly account: Account<C>;
  public readonly choice: boolean;
  public readonly weight: number;
  constructor(account: Account<C>, choice: boolean, weight?: number) {
    this.account = account;
    this.choice = choice;
    this.weight = weight;
  }
}

export class Profile {
  private _name: string;
  private _headline: string;
  private _bio: string;
  private _avatarUrl: string;
  private _initialized: boolean;
  private _anonymous: boolean;
  get name() { return this._name; }
  get headline() { return this._headline; }
  get bio() { return this._bio; }
  get avatarUrl() { return this._avatarUrl; }
  get initialized() { return this._initialized; }

  public readonly chain: string;
  public readonly address: string;

  constructor(chain: string, address: string) {
    this.chain = chain;
    this.address = address;
  }

  public initializeEmpty() {
    this._initialized = true;
  }
  public initialize(name, headline, bio, avatarUrl) {
    this._initialized = true;
    this._anonymous = false;
    this._name = name;
    this._headline = headline;
    this._bio = bio;
    this._avatarUrl = avatarUrl;
  }

  get displayName() : string {
    if (!this._initialized) return 'Loading...';
    if (this._anonymous) return 'Anonymous';
    return this.name || 'Anonymous';
  }

  public getAvatar(size: number) {
    if (this.avatarUrl) {
      return m('.avatar-image', {
        style: `width: ${size}px; height: ${size}px; background-image: url('${this.avatarUrl}'); ` +
          `background-size: cover; border-radius: 9999px`,
      });
    } else {
      const html = jdenticon.toSvg(this.address, size);
      return m('svg.Jdenticon', {
        width: size,
        height: size,
        oncreate: (vnode) => {
          jdenticon.update(vnode.dom as HTMLElement, this.address);
        },
        onupdate: (vnode) => {
          jdenticon.update(vnode.dom as HTMLElement, this.address);
        }
      });
    }
  }

  public static getSVGAvatar(address, size) {
    return jdenticon.toSvg(address, size);
  }
}

export abstract class Account<C extends Coin> {
  public readonly address: string;
  public readonly chain: ChainInfo;

  public readonly chainBase: ChainBase;
  public readonly chainClass: ChainClass;
  public get freeBalance() { return this.balance; }
  public abstract balance: Observable<C>;
  public abstract sendBalanceTx(recipient: Account<C>, amount: C): Promise<ITXModalData> | ITXModalData;
  public async abstract signMessage(message: string): Promise<string>;
  public abstract async isValidSignature(message: string, signature: string): Promise<boolean>;
  protected abstract addressFromMnemonic(mnemonic: string): string;
  protected abstract addressFromSeed(seed: string): string;

  /// The account's seed or mnemonic, used to generate their private key
  protected seed?: string;
  protected mnemonic?: string;
  // validation token sent by server
  private _validationToken?: string;

  // A helper for encoding
  private _encoding: number;
  public get encoding() { return this._encoding; }

  private _profile: Profile;
  public get profile() { return this._profile; }

  constructor(chain: ChainInfo, address: string, encoding?: number) {
    // Check if the account is being initialized from an offchain Community
    // Because there won't be any chain base or chain class
    this.chain = chain;
    this.chainBase = (app.chain) ? app.chain.base : null;
    this.chainClass = (app.chain) ? app.chain.class : null;
    this.address = address;
    this._profile = app.profiles.getProfile(chain.id, address);
    this._encoding = encoding;
  }

  public getSeed() {
    return this.seed;
  }
  public getMnemonic() {
    return this.mnemonic;
  }
  public setSeed(seed: string) {
    if (this.addressFromSeed(seed) !== this.address) {
      throw new Error('address does not match seed');
    }
    this.seed = seed;
  }
  public setMnemonic(mnemonic: string) {
    if (this.addressFromMnemonic(mnemonic) !== this.address) {
      throw new Error('address does not match mnemonic');
    }
    this.mnemonic = mnemonic;
  }
  public setEncoding(encoding: number) {
    this._encoding = encoding;
  }
  get validationToken() {
    return this._validationToken;
  }
  public setValidationToken(token: string) {
    this._validationToken = token;
  }
  public async validate(signature?: string, txParams?: string) {
    if (!this._validationToken) {
      throw new Error('no validation token found');
    }
    // We add a newline to the validation token because signing via the
    // command line always adds an implicit newline.
    if (!signature && (this.seed || this.mnemonic || this.chainBase === ChainBase.NEAR)) {
      // construct signature from private key
      signature = await this.signMessage(this._validationToken + '\n');
    } else if (signature && !txParams) {
      const withoutNewline = !(await this.isValidSignature(this._validationToken, signature));
      const withNewline = !(await this.isValidSignature(this._validationToken + '\n', signature));
      if (withNewline && withoutNewline) {
        throw new Error('invalid signature');
      }
    }

    if (signature) {
      const params : any = {
        address: this.address,
        chain: this.chain.id,
        jwt: app.login.jwt,
      };
      // If txParams is provided, the signature is actually for a
      // transaction, not a message. The transaction should be a
      // system.remark() call containing the validation token, and
      // txParams should be a JSON string of the ExtrinsicPayload.
      if (txParams) {
        params.txSignature = signature;
        params.txParams = txParams;
      } else {
        params.signature = signature;
      }
      return await Promise.resolve($.post(app.serverUrl() + '/verifyAddress', params));
    } else {
      throw new Error('signature or key required for validation');
    }
  }
}

export interface IUniqueId extends IIdentifiable {
  readonly uniqueIdentifier: string;
  readonly slug: string;
}

export abstract class Identity<C extends Coin> implements IIdentifiable {
  public readonly account: Account<C>;
  public readonly identifier: string;
  public readonly username: string;
  constructor(account: Account<C>, identifier: string, username: string) {
    this.account = account;
    this.identifier = identifier;
    this.username = username;
  }
}

export interface IFixedEndTime {
  kind: 'fixed';
  time: moment.Moment;
}
export interface IFixedBlockEndTime {
  kind: 'fixed_block';
  blocknum: number;
}
export interface IDynamicEndTime {
  kind: 'dynamic';
  getBlocknum(): number;
}
export interface IThresholdEndTime {
  kind: 'threshold';
  threshold: number;
}
export interface INotStartedEndTime {
  kind: 'not_started';
}
export interface IUnavailableEndTime {
  kind: 'unavailable';
}
export interface IQueuedEndTime {
  kind: 'queued';
}
export type ProposalEndTime = IFixedEndTime | IFixedBlockEndTime | IDynamicEndTime | IThresholdEndTime |
  INotStartedEndTime | IQueuedEndTime | IUnavailableEndTime;

export enum ProposalStatus {
  Passing = 'pass',
  Failing = 'fail',
  Passed = 'passed',
  Failed = 'failed',
  None = 'none',
}
export enum VotingType {
  SimpleYesNoVoting = 'binary',
  ConvictionYesNoVoting = 'binary_conviction',
  SimpleYesApprovalVoting = 'approval',
  YesNoAbstainVeto = 'yes_no_abstain_veto',
  RankedChoiceVoting = 'rankedchoice',
  MultiOptionVoting = 'multioption',
  None = 'none',
  MolochYesNo = 'moloch',
}
export enum VotingUnit {
  OnePersonOneVote = '1p1v',
  CoinVote = 'coin',
  ConvictionCoinVote = 'conviction_coin',
  None = 'none',
}

export abstract class Proposal<
ApiT,
C extends Coin,
ConstructorT extends IIdentifiable,
UpdateT extends ICompletable,
VoteT extends IVote<C>> implements IUniqueId {
  // basic info
  protected _data: ConstructorT;
  public get data(): ConstructorT { return this._data; }
  public readonly identifier: string;
  public readonly slug: string;
  public abstract get shortIdentifier(): string;
  public get uniqueIdentifier() {
    return `${this.slug}_${this.identifier}`;
  }
  public createdAt: moment.Moment; // TODO: unused?
  public abstract get title(): string;
  public abstract get description(): string;
  public abstract get author(): Account<C>;

  // voting
  public abstract get votingType(): VotingType;
  public abstract get votingUnit(): VotingUnit;
  public abstract canVoteFrom(account: Account<C>): boolean;

  protected votes: BehaviorSubject<{ [account: string] : VoteT }> = new BehaviorSubject({});
  // TODO: these can be observables
  public abstract get endTime(): ProposalEndTime;
  public abstract get isPassing() : ProposalStatus;

  // display
  // TODO: these should be observables
  public abstract get support(): Coin | number;
  public abstract get turnout(): number;
  //public abstract get requirementName(): string;
  //public abstract get requirementExplanation(): string;

  // adapter logic
  protected _subscription: Unsubscribable;
  protected _completed: BehaviorSubject<boolean> = new BehaviorSubject(false);
  get completed() { return this._completed.getValue(); }
  get completed$() { return this._completed.asObservable(); }
  protected _completedAt: moment.Moment; // TODO: fill this out
  get completedAt() { return this._completedAt; }

  private _initialized: BehaviorSubject<boolean> = new BehaviorSubject(false);
  public get initialized$(): Observable<boolean> { return this._initialized.asObservable(); }
  public get initialized(): boolean { return this._initialized.value; }

  constructor(slug: string, data: ConstructorT) {
    this.slug = slug;
    this._data = data;
    this.identifier = data.identifier;
  }

  // adapter logic
  protected updateState(store: ProposalStore<Proposal<ApiT, C, ConstructorT, UpdateT, VoteT>>, state: UpdateT): void {
    if (this._completed.getValue() === true) {
      throw new Error('cannot update state once marked completed');
    }
    if (state.completed) {
      this._completed.next(true);
      this.unsubscribe();
    }
    store.update(this);
    if (!this.initialized) {
      this._initialized.next(true);
      this._initialized.complete();
    }
  }
  protected subscribe(
    api: Observable<ApiT>,
    store: ProposalStore<Proposal<ApiT, C, ConstructorT, UpdateT, VoteT>>,
    adapter: ProposalAdapter<ApiT, ConstructorT, UpdateT>
  ): void {
    this._subscription = api.pipe(
      switchMap((api: ApiT) =>
        adapter.subscribeState(api, this.data))
    ).subscribe((s) => this.updateState(store, s));
  }
  public unsubscribe(): void {
    if (this._subscription) {
      this._subscription.unsubscribe();
    }
  }

  // voting
  public addOrUpdateVote(vote: VoteT) {
    const votes = this.votes.getValue();
    votes[vote.account.address] = vote;
    this.votes.next(votes);
  }
  public removeVote(account: Account<C>) {
    if (this.hasVoted(account)) {
      const votes = this.votes.getValue();
      delete votes[account.address];
      this.votes.next(votes);
    }
  }
  public clearVotes() {
    this.votes.next({});
  }
  // TODO: these can be observables, if we want
  public hasVoted(account: Account<C>) {
    return this.votes.getValue()[account.address] !== undefined;
  }
  public getVotes(fromAccount?: Account<C>) {
    if (fromAccount) {
      return this.votes.getValue()[fromAccount.address] !== undefined ?
        [this.votes.getValue()[fromAccount.address]] : [];
    } else {
      return Object.values(this.votes.getValue());
    }
  }
  public getVoters(): string[] {
    return Object.keys(this.votes.getValue());
  }
  public abstract submitVoteTx(vote: VoteT, ...args): ITXModalData | Promise<ITXModalData>;
}

export type AnyProposal = Proposal<any, any, any, any, any>;

export class AddressInfo {
  public readonly address: string;
  public readonly chain: string;
  public selected: boolean;
  public readonly keytype: string;

  constructor(address, chain, selected, keytype) {
    this.address = address;
    this.chain = chain;
    this.selected = selected;
    this.keytype = keytype;
  }
}

export class MembershipInfo {
  public readonly user_id: number;
  public readonly chain: string;
  public readonly community: string;
  public readonly active: boolean;

  constructor (user_id, chain, community, active) {
    this.user_id = user_id;
    this.chain = chain;
    this.community = community;
    this.active = active;
  }
}

export class ChainInfo {
  public readonly id: string;
  public readonly symbol: string;
  public readonly name: string;
  public readonly network: ChainNetwork;
  public readonly iconUrl: string;
  public readonly description: string;
  public readonly tags: OffchainTag[];
  public readonly chainObjectId: string;

  constructor(id, network, symbol, name, iconUrl, description, tags?, chainObjectVersion?) {
    this.id = id;
    this.network = network;
    this.symbol = symbol;
    this.name = name;
    this.iconUrl = iconUrl;
    this.description = description;
    this.tags = tags || [];
    this.chainObjectId = chainObjectVersion && chainObjectVersion.id;
  }
  public static fromJSON(json) {
    return new ChainInfo(json.id, json.network, json.symbol, json.name,
      json.icon_url,json.description, json.tags, json.ChainObjectVersion);
  }
}

export class NodeInfo {
  public readonly id: number;
  public readonly chain: ChainInfo;
  public readonly url: string;
  public readonly address: string;

  constructor(id, chain, url, address?) {
    this.id = id;
    this.chain = app.config.chains.getById(chain);
    this.url = url;
    this.address = address;
  }
  public static fromJSON(json) {
    return new NodeInfo(json.id, json.chain, json.url, json.address);
  }

  public get tags() {
    return this.chain.tags;
  }
}

export class CommunityInfo {
  public readonly id: string;
  public readonly name: string;
  public readonly description: string;
  public readonly defaultChain: ChainInfo;
  public readonly invitesEnabled: boolean;
  public readonly privacyEnabled: boolean;
  public readonly tags?: OffchainTag[];

  constructor(id, name, description, defaultChain, invitesEnabled, privacyEnabled, tags?) {
    this.id = id;
    this.name = name;
    this.description = description;
    this.defaultChain = app.config.chains.getById(defaultChain);
    this.invitesEnabled = invitesEnabled;
    this.privacyEnabled = privacyEnabled;
    this.tags = tags || [];
  }
  public static fromJSON(json) {
    return new CommunityInfo(json.id, json.name, json.description, json.default_chain, json.invitesEnabled,
                             json.privacyEnabled, json.tags);
  }
}

export class SocialAccount {
  public readonly provider: string;
  public readonly username: string;

  constructor(provider, username) {
    this.provider = provider;
    this.username = username;
  }
}

export class OffchainAttachment {
  public readonly url: string;
  public readonly description: string;

  constructor(url, description) {
    this.url = url;
    this.description = description;
  }
}

export class OffchainComment<T extends IUniqueId> {
  [x: string]: any;
  public readonly chain: string;
  public readonly author: string;
  public readonly text: string;
  public readonly attachments: OffchainAttachment[];
  public readonly proposal: T;
  public readonly id: number;
  public readonly createdAt: moment.Moment;
  public readonly community?: string;
  public readonly authorChain?: string;
  public readonly parentComment: number;
  public readonly rootProposal: number;
  public readonly childComments: number[];
  public readonly versionHistory: string[];

  constructor(chain, author, text, versionHistory, attachments, proposal, id, createdAt,
              childComments = [], rootProposal, parentComment?, community?, authorChain?) {
    this.chain = chain;
    this.author = author;
    this.text = text;
    this.versionHistory = versionHistory;
    this.attachments = attachments;
    this.proposal = proposal;
    this.id = id;
    this.createdAt = createdAt;
    this.childComments = childComments;
    this.parentComment = parentComment;
    this.rootProposal = rootProposal;
    this.community = community;
    this.authorChain = authorChain;
  }
}

export class OffchainReaction<T extends IUniqueId> {
  public readonly chain: string;
  public readonly author: string;
  public readonly reaction: string;
  public readonly proposal: T;
  public readonly id: number;
  public readonly community?: string;

  constructor(chain, author, reaction, proposal, id, community?) {
    this.chain = chain;
    this.author = author;
    this.reaction = reaction;
    this.proposal = proposal;
    this.id = id;
    this.community = community;
  }
}

export class OffchainThread implements IUniqueId {
  public readonly author: string;
  public readonly authorChain: string;
  public readonly title: string;
  public readonly body: string;
  public readonly pinned: boolean;
  public readonly kind: OffchainThreadKind;
  public readonly attachments: OffchainAttachment[];

  // TODO: it is a bit clunky to have a numeric id and a string identifier here
  //  we should remove the number to allow the store to work.
  public readonly identifier: string;
  public readonly id: number;
  public readonly createdAt: moment.Moment;
  public readonly tags: OffchainTag[];
  public readonly slug = 'discussion';
  public readonly url: string;
  public readonly versionHistory: string[];
  public readonly community: string | number;

  public get uniqueIdentifier() {
    return `${this.slug}_${this.identifier}`;
  }

  constructor(
    author: string,
    title: string,
    attachments: OffchainAttachment[],
    id: number,
    createdAt: moment.Moment,
    tags: OffchainTag[],
    kind: OffchainThreadKind,
    versionHistory: string[],
    community: number | string,
    body?: string,
    url?: string,
    authorChain?: string,
    pinned?: boolean) {
    this.author = author;
    this.title = title;
    this.body = body;
    this.attachments = attachments;
    this.id = id;
    this.identifier = '' + id;
    this.createdAt = createdAt;
    this.tags = tags;
    this.kind = kind;
    this.authorChain = authorChain;
    this.pinned = pinned;
    this.url = url;
    this.versionHistory = versionHistory;
    this.community = community;
  }
}

export class OffchainTag {
  public readonly name: string;
  public readonly id: number;
  public readonly communityId?: string;
  public readonly chainId?: string;

  constructor(name, id, communityId, chainId) {
    this.name = name;
    this.id = id;
    this.communityId = communityId;
    this.chainId = chainId;
  }
  public static fromJSON(json) {
    return new OffchainTag(json.name, json.id, json.communityId, json.chainId);
  }
}

export class NotificationCategory {
  constructor(
    public readonly name: string,
    public readonly description: string
  ) { }
  public static fromJSON(json) {
    return new NotificationCategory(json.name, json.description);
  }
}

export class NotificationSubscription {
  public readonly id: number;
  public readonly category: string;
  public readonly objectId: string;
  public readonly createdAt: moment.Moment;

  private _isActive: boolean;
  public get isActive() { return this._isActive; }
  public enable() { this._isActive = true; }
  public disable() { this._isActive = false; }

  constructor(id, category, objectId, isActive, createdAt) {
    this.id = id;
    this.category = category;
    this.objectId = objectId;
    this._isActive = isActive;
    this.createdAt = moment(createdAt);
  }

  public static fromJSON(json) {
    return new NotificationSubscription(
      json.id,
      json.category_id,
      json.object_id,
      json.is_active,
      json.created_at
    );
  }
}

export class Notification {
  public readonly id: number;
  public readonly data: string;
  public readonly createdAt: moment.Moment;
  public readonly subscription: NotificationSubscription;

  private _isRead: boolean;
  public get isRead(): boolean {
    return this._isRead;
  }

  constructor(id, data, isRead, createdAt, subscription) {
    this.id = id;
    this.data = data;
    this._isRead = isRead;
    this.createdAt = moment(createdAt);
    this.subscription = subscription;
  }
  public markRead() {
    if (this._isRead) {
      throw new Error('notification already read!');
    } else {
      this._isRead = true;
    }
  }
  public static fromJSON(json, subscription: NotificationSubscription) {
    return new Notification(json.id, json.notification_data, json.is_read, json.created_at, subscription);
  }
}

export class ContractCategory {
  public readonly name: string;
  public readonly description: string;
  public readonly id: number;
  public readonly color: string;

  constructor(name, description, id, color) {
    this.name = name;
    this.description = description;
    this.id = id;
    this.color = color;
  }
  public static fromJSON(json) {
    return new ContractCategory(json.name, json.description, json.id, json.color);
  }
}

export class ContractItem {
  public readonly name: string;
  public readonly description: string;
  public readonly id: number;
  public readonly color: string;
  public readonly category: ContractCategory;

  constructor(name, description, id, color, category) {
    this.name = name;
    this.description = description;
    this.id = id;
    this.color = color;
    this.category = category;
  }
  public static fromJSON(json) {
    return new ContractItem(json.name, json.description, json.id, json.color, json.category);
  }
}

export class ChainObjectVersion {
  constructor(
    public readonly id: string,
    public readonly chain: string,
    public readonly uniqueIdentifier: string,
    public readonly completionField: string,
  ) { }
  public static fromJSON(json) {
    return new ChainObjectVersion(
      json.id,
      json.chain,
      json.unique_identifier,
      json.completion_field,
    );
  }
}

export class ChainObjectQuery {
  constructor(
    public readonly id: number,
    public readonly objectType: string,
    public readonly queryType: string,
    public readonly active: boolean,
    public readonly description: string,
    public readonly queryUrl: string,
    public readonly query: string,
  ) { }
  public static fromJSON(json) {
    return new ChainObjectQuery(
      json.id,
      json.object_type,
      json.query_type,
      json.active,
      json.description,
      json.query_url,
      json.query
    );
  }
}

export class ChainObject<T> {
  constructor(
    public readonly id: string,
    public readonly objectType: string,
    public readonly objectId: string,
    public readonly completed: boolean,
    public readonly objectData: T,
  ) { }
  public static fromJSON(json) {
    return new ChainObject(
      json.id,
      json.object_type,
      json.object_id,
      json.completed,
      JSON.parse(json.object_data)
    );
  }
}
