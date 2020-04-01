/* eslint-disable max-classes-per-file */
import { Observable, BehaviorSubject } from 'rxjs';
import { byAscendingCreationDate } from 'helpers';
import { filter } from 'rxjs/operators';
import { IIdentifiable } from 'adapters/shared';
import { Coin } from 'adapters/currency';
import { Account, ChainInfo, CommunityInfo, NodeInfo, OffchainComment, OffchainReaction, Profile,
  IUniqueId, Notification, NotificationSubscription, OffchainTag } from './models';

/*
 * stores
 */
export enum UpdateType {
  Add,
  Remove,
  Update,
}

export interface IStoreUpdate<T> {
  item: T;
  updateType: UpdateType;
}

// TODO: we can make this even better if we have T implement a StoreKey mixin,
// then we can look up items by key, prevent duplicates from being inserted, etc
export abstract class Store<T> {
  protected _store: T[] = [];

  private _subject: BehaviorSubject<IStoreUpdate<T> | null> = new BehaviorSubject(null);

  public add(item: T): Store<T> {
    this._store.push(item);
    this._subject.next({ item, updateType: UpdateType.Add });
    return this;
  }

  public remove(item: T): Store<T> {
    const index = this._store.indexOf(item);
    if (index === -1) {
      console.error('Attempting to remove an object that was not found in the store');
      return this;
    }
    this._store.splice(index, 1);
    this._subject.next({ item, updateType: UpdateType.Remove });
    return this;
  }

  public update(item: T): Store<T> {
    this._subject.next({ item, updateType: UpdateType.Update });
    return this;
  }

  public clear() {
    this._store = [];
    this._subject = new BehaviorSubject(null);
  }

  public getAll(): T[] {
    return this._store;
  }

  public getObservable(): Observable<IStoreUpdate<T>> {
    return this._subject.asObservable().pipe(filter((s) => s !== null));
  }
}

export class ProposalStore<ProposalT extends IIdentifiable> extends Store<ProposalT> {
  private _storeId: { [hash: string]: ProposalT } = {};

  public add(proposal: ProposalT) {
    super.add(proposal);
    this._storeId[proposal.identifier] = proposal;
    return this;
  }

  public remove(proposal: ProposalT) {
    super.remove(proposal);
    delete this._storeId[proposal.identifier];
    return this;
  }

  public clear() {
    super.clear();
    this._storeId = {};
  }

  public getByIdentifier(identifier: string | number): ProposalT {
    return this._storeId[identifier];
  }
}

interface IHasAddress {
  address: string;
}

export class AccountsStore<T extends IHasAddress> extends Store<T> {
  private _storeAddress: { [address: string]: T } = {};

  public add(account: T) {
    super.add(account);
    this._storeAddress[account.address] = account;
    return this;
  }

  public remove(account: T) {
    super.remove(account);
    delete this._storeAddress[account.address];
    return this;
  }

  public clear() {
    this._storeAddress = {};
  }

  public getByAddress(address: string): T {
    if (this._storeAddress[address] === undefined) {
      throw new Error('Invalid user: ' + address);
    }
    return this._storeAddress[address];
  }
}

interface IHasId {
  id: string | number;
}

class IdStore<T extends IHasId> extends Store<T> {
  private _storeId: { [id: string]: T} = {};

  public add(n: T) {
    super.add(n);
    this._storeId[n.id.toString()] = n;
    return this;
  }

  public remove(n: T) {
    super.remove(n);
    delete this._storeId[n.id.toString()];
    return this;
  }

  public clear() {
    super.clear();
    this._storeId = {};
  }

  public getById(id: number | string): T {
    return this._storeId[id.toString()];
  }
}

export class ChainStore extends IdStore<ChainInfo> {

}

export class OffchainCommunitiesStore extends IdStore<CommunityInfo> {
  private _storeCommunity: { [community: string]: CommunityInfo[] } = {};

  public add(c: CommunityInfo) {
    super.add(c);
    if (!this._storeCommunity[c.id]) {
      this._storeCommunity[c.id] = [];
    }
    this._storeCommunity[c.id].push(c);
    return this;
  }

  public remove(c: CommunityInfo) {
    super.remove(c);
    this._storeCommunity[c.id] = this._storeCommunity[c.id].filter((x) => x !== c);
    return this;
  }

  public clear() {
    super.clear();
    this._storeCommunity = {};
  }

  public getByCommunity(communityId: string) {
    return this._storeCommunity[communityId];
  }
}

export class NodeStore extends IdStore<NodeInfo> {
  private _storeChain: { [chain: string]: NodeInfo[] } = {};

  public add(n: NodeInfo) {
    super.add(n);
    if (!this._storeChain[n.chain.id]) {
      this._storeChain[n.chain.id] = [];
    }
    this._storeChain[n.chain.id].push(n);
    return this;
  }

  public remove(n: NodeInfo) {
    super.remove(n);
    this._storeChain[n.chain.id] = this._storeChain[n.chain.id].filter((x) => x !== n);
    return this;
  }

  public clear() {
    super.clear();
    this._storeChain = {};
  }

  public getByChain(chainId: string) {
    return this._storeChain[chainId];
  }
}

export class ProfileStore extends Store<Profile> {
  private _storeAddress: { [address: string]: Profile } = {};

  public add(profile: Profile) {
    super.add(profile);
    this._storeAddress[profile.address] = profile;
    return this;
  }

  public remove(profile: Profile) {
    super.remove(profile);
    delete this._storeAddress[profile.address];
    return this;
  }

  public clear() {
    super.clear();
    this._storeAddress = {};
  }

  public getByAddress(address: string) {
    return this._storeAddress[address];
  }
}

export class NotificationStore extends IdStore<Notification> {
  private _storeSubscription: { [subscriptionId: number]: Notification } = {};

  public add(n: Notification) {
    super.add(n);
    this._storeSubscription[n.subscription.id] = n;
    return this;
  }

  public remove(n: Notification) {
    super.remove(n);
    delete this._storeSubscription[n.subscription.id];
    return this;
  }

  public clear() {
    super.clear();
    this._storeSubscription = {};
  }

  public getBySubscription(subscription: NotificationSubscription) {
    return this._storeSubscription[subscription.id];
  }
}

export class CommentsStore extends IdStore<OffchainComment<any>> {
  private _storeAuthor: { [address: string]: Array<OffchainComment<any>> } = {};

  private _storeProposal: { [identifier: string]: Array<OffchainComment<any>> } = {};

  public add(comment: OffchainComment<any>) {
    // TODO: Remove this once we start enforcing an ordering in stores
    super.add(comment);
    this.getAll().sort(byAscendingCreationDate);
    if (!this._storeAuthor[comment.author]) {
      this._storeAuthor[comment.author] = [];
    }
    this._storeAuthor[comment.author].push(comment);
    this._storeAuthor[comment.author].sort(byAscendingCreationDate);
    if (!this._storeProposal[comment.rootProposal]) {
      this._storeProposal[comment.rootProposal] = [];
    }
    this._storeProposal[comment.rootProposal].push(comment);
    this._storeProposal[comment.rootProposal].sort(byAscendingCreationDate);
    return this;
  }

  public remove(comment: OffchainComment<any>) {
    super.remove(comment);

    const authorIndex = this._storeAuthor[comment.author].indexOf(comment);
    if (authorIndex === -1) {
      throw new Error('Comment not in authors store');
    }
    this._storeAuthor[comment.author].splice(authorIndex, 1);

    const proposalIndex = this._storeProposal[comment.proposal.uniqueIdentifier].indexOf(comment);
    if (comment.proposal && proposalIndex === -1) {
      throw new Error('Comment not in proposals store');
    }
    this._storeProposal[comment.proposal.uniqueIdentifier].splice(proposalIndex, 1);
    return this;
  }

  public clear() {
    super.clear();
    this._storeAuthor = {};
    this._storeProposal = {};
  }

  public clearProposal<T extends IUniqueId>(proposal: T) {
    if (this._storeProposal[proposal.uniqueIdentifier]) {
      const comments = this._storeProposal[proposal.uniqueIdentifier].slice();
      comments.map(this.remove.bind(this));
      delete this._storeProposal[proposal.uniqueIdentifier];
    }
    return this;
  }

  public getById(id: number): OffchainComment<any> {
    return this._store.find((c) => c.id === id);
  }

  public getByAuthor(address: string): Array<OffchainComment<any>> {
    return this._storeAuthor[address] || [];
  }

  public getByProposal<T extends IUniqueId>(proposal: T): Array<OffchainComment<any>> {
    return this._storeProposal[proposal.uniqueIdentifier] || [];
  }

  public nComments<T extends IUniqueId>(proposal: T): number {
    if (this._storeProposal[proposal.uniqueIdentifier]) {
      return this._storeProposal[proposal.uniqueIdentifier].length;
    } else {
      return 0;
    }
  }
}

export class ReactionsStore extends IdStore<OffchainReaction<any>> {
  private _storeProposal: { [identifier: string]: Array<OffchainReaction<any>> } = {};

  public add(reaction: OffchainReaction<any>) {
    // TODO: Remove this once we start enforcing an ordering in stores
    super.add(reaction);
    this.getAll().sort(byAscendingCreationDate);

    if (!this._storeProposal[reaction.proposal.uniqueIdentifier]) {
      this._storeProposal[reaction.proposal.uniqueIdentifier] = [];
    }
    this._storeProposal[reaction.proposal.uniqueIdentifier].push(reaction);
    this._storeProposal[reaction.proposal.uniqueIdentifier].sort(byAscendingCreationDate);

    return this;
  }

  public remove(reaction: OffchainReaction<any>) {
    super.remove(reaction);

    const proposalIndex = this._storeProposal[reaction.proposal.uniqueIdentifier].indexOf(reaction);
    if (proposalIndex === -1) {
      throw new Error('Reaction not in proposals store');
    }
    this._storeProposal[reaction.proposal.uniqueIdentifier].splice(proposalIndex, 1);
    return this;
  }

  public clear() {
    super.clear();
    this._storeProposal = {};
  }

  public clearProposal<T extends IUniqueId>(proposal: T) {
    if (this._storeProposal[proposal.uniqueIdentifier]) {
      const reactions = this._storeProposal[proposal.uniqueIdentifier].slice();
      reactions.map(this.remove.bind(this));
      delete this._storeProposal[proposal.uniqueIdentifier];
    }
    return this;
  }

  public getByProposal<T extends IUniqueId>(proposal: T): Array<OffchainReaction<any>> {
    return this._storeProposal[proposal.uniqueIdentifier] || [];
  }
}

export class TagsStore extends IdStore<OffchainTag> {
  private _storeCommunity: { [identifier: string]: Array<OffchainTag> } = {};

  public add(tag: OffchainTag) {
    // TODO: Remove this once we start enforcing an ordering in stores
    super.add(tag);
    this.getAll().sort(byAscendingCreationDate);

    const parentEntity = tag.communityId ? tag.communityId : tag.chainId;

    if (!this._storeCommunity[tag[parentEntity]]) {
      this._storeCommunity[tag[parentEntity]] = [];
    }
    this._storeCommunity[tag[parentEntity]].push(tag);
    this._storeCommunity[tag[parentEntity]].sort(byAscendingCreationDate);

    return this;
  }

  public remove(tag: OffchainTag) {
    super.remove(tag);

    const parentEntity = tag.communityId ? tag.communityId : tag.chainId;

    const proposalIndex = this._storeCommunity[tag[parentEntity]].indexOf(tag);
    if (proposalIndex === -1) {
      throw new Error('Tag not in proposals store');
    }
    this._storeCommunity[tag[parentEntity]].splice(proposalIndex, 1);
    return this;
  }

  public clear() {
    super.clear();
    this._storeCommunity = {};
  }

  public getByCommunity(communityId): Array<OffchainTag> {
    return this._storeCommunity[communityId] || [];
  }
}
