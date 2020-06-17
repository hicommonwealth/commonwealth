import m from 'mithril';
import $ from 'jquery';
import app from 'state';

import { ChainStore, OffchainCommunitiesStore, NodeStore } from 'stores';
import {
  NodeInfo,
  AddressInfo,
  RoleInfo,
  SocialAccount,
  OffchainTag,
  ContractCategory,
  Account,
  IChainAdapter,
  ICommunityAdapter,
  NotificationCategory,
} from 'models';

import moment from 'moment';
import NotificationsController from './notifications';

export default class {
  private _activeAccount: Account<any>;
  public get activeAccount(): Account<any> { return this._activeAccount; }
  public _setActiveAccount(account: Account<any>): void { this._activeAccount = account; }

  private _email: string;
  public get email(): string { return this._email; }
  public _setEmail(email: string): void { this._email = email; }

  private _jwt: string;
  public get jwt(): string { return this._jwt; }
  public _setJWT(JWT: string): void { this._jwt = JWT; }

  private _addresses: AddressInfo[];
  public get addresses(): AddressInfo[] { return this._addresses; }
  public _setAddresses(addresses: AddressInfo[]): void { this._addresses = addresses; }

  private _roles: RoleInfo[];
  public get roles(): RoleInfo[] { return this._roles; }

  private _activeAddresses: Account<any>[];
  public get activeAddresses(): Account<any>[] { return this._activeAddresses; }
  public _setActiveAddresses(activeAddresses: Account<any>[]): void { this._activeAddresses = activeAddresses; }

  private _socialAccounts: SocialAccount[];
  public get socialAccounts(): SocialAccount[] { return this._socialAccounts; }
  public _setSocialAccounts(socialAccounts: SocialAccount[]): void { this._socialAccounts = socialAccounts; }

  private _selectedNode: NodeInfo;
  public get selectedNode(): NodeInfo { return this._selectedNode; }
  public _setSelectedNode(selectedNode: NodeInfo): void { this._selectedNode = selectedNode; }

  private _isSiteAdmin: boolean;
  public get isSiteAdmin(): boolean { return this._isSiteAdmin; }
  public _setSiteAdmin(isAdmin: boolean): void { this._isSiteAdmin = isAdmin; }

  private _disableRichText: boolean;
  public get disableRichText(): boolean { return this._disableRichText; }
  public _setDisableRichText(disableRichText: boolean): void { this._disableRichText = disableRichText; }

  private _notifications: NotificationsController;
  public get notifications(): NotificationsController { return this._notifications; }
  public _setNotifications(notifications: NotificationsController): void { this._notifications = notifications; }

  private _lastVisited: object;
  public get lastVisited(): object { return this._lastVisited; }
  public _setLastVisited(lastVisited: object): void { this._lastVisited = lastVisited; }

  private _unseenPosts: object;
  public get unseenPosts(): object { return this._unseenPosts; }
  public _setUnseenPosts(unseenPosts: object): void { this._unseenPosts = unseenPosts; }

  constructor() {}

  public setActiveAccount(account: Account<any>): void {

  }

  public setEmail(email: string): void {}
  public setJWT(JWT: string): void {}
  public setAddresses(addresses: AddressInfo[]): void {}
  public setRoles(roles: RoleInfo[]): void {
    // add roles data for user and maintain array structure
    roles.forEach((role, inx) => {
      this._roles[role.offchain_community_id || role.chain_id] = role;
      this._roles[inx] = role;
    });
  }
  public setActiveAddresses(activeAddresses: Account<any>[]): void {}
  public setSocialAccounts(socialAccounts: SocialAccount[]): void {}
  public setSelectedNode(selectedNode: NodeInfo): void {}
  public setSiteAdmin(isAdmin: boolean): void {}
  public setDisableRichText(disableRichText: boolean): void {}
  public setNotifications(notifications: NotificationsController): void {}
  public setLastVisited(lastVisited: object): void {}
  public setUnseenPosts(unseenPosts: object): void {}
}
