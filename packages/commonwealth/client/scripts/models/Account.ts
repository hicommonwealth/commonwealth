import {
  DEFAULT_NAME,
  type ChainBase,
  type WalletId,
} from '@hicommonwealth/shared';
import type momentType from 'moment';
import moment from 'moment';
import NewProfilesController from '../controllers/server/newProfiles';
import MinimumProfile from './MinimumProfile';

export type AccountCommunity = {
  id: string;
  base?: ChainBase;
  ss58Prefix?: number;
};

class Account {
  public readonly address: string;
  public readonly community: AccountCommunity;
  public readonly ghostAddress: boolean;
  public lastActive?: momentType.Moment;

  // validation token sent by server
  private _validationToken?: string;
  private _sessionPublicAddress: string;
  // block that the client is signing, in order to validate login to the server
  private _validationBlockInfo?: string;

  private _addressId?: number;
  private _walletId?: WalletId;

  private _profile?: MinimumProfile;

  public get profile() {
    return this._profile;
  }

  public set profile(profile) {
    this._profile = profile;
  }

  constructor({
    community,
    address,
    ghostAddress,
    addressId,
    walletId,
    validationToken,
    sessionPublicAddress,
    validationBlockInfo,
    profile,
    signedInProfile,
    ignoreProfile = true,
    lastActive,
  }: {
    // required args
    community: AccountCommunity;
    address: string;

    // optional args
    addressId?: number;
    walletId?: WalletId;
    validationToken?: string;
    sessionPublicAddress?: string;
    validationBlockInfo?: string;
    profile?: MinimumProfile;
    lastActive?: string | momentType.Moment;
    signedInProfile?: {
      userId: number;
      name?: string;
      avatarUrl?: string;
      lastActive?: Date;
    };

    // flags
    ghostAddress?: boolean;
    ignoreProfile?: boolean;
  }) {
    // Check if the account is being initialized from a Community
    // Because there won't be any chain base or chain class
    this.community = community;
    this.address = address;
    this._addressId = addressId;
    this._walletId = walletId;
    this._validationToken = validationToken;
    // @ts-expect-error StrictNullChecks
    this._sessionPublicAddress = sessionPublicAddress;
    this._validationBlockInfo = validationBlockInfo;
    this.ghostAddress = !!ghostAddress;
    // @ts-expect-error StrictNullChecks
    this.lastActive = lastActive ? moment(lastActive) : null;
    if (profile) {
      this._profile = profile;
    } else if (!ignoreProfile && community?.id && signedInProfile) {
      const updatedProfile = new MinimumProfile(address, community?.id);
      updatedProfile.initialize(
        signedInProfile.userId,
        signedInProfile.name ?? DEFAULT_NAME,
        address,
        signedInProfile.avatarUrl ?? '',
        updatedProfile.chain,
        signedInProfile.lastActive ?? null,
      );
      // manually trigger an update signal when data is fetched
      NewProfilesController.Instance.isFetched.emit('redraw');
      this._profile = updatedProfile;
    }
  }

  get addressId() {
    return this._addressId;
  }

  public setAddressId(id: number) {
    this._addressId = id;
  }

  get walletId() {
    return this._walletId;
  }

  public setWalletId(walletId: WalletId) {
    this._walletId = walletId;
  }

  get validationToken() {
    return this._validationToken;
  }

  public setValidationToken(token: string) {
    this._validationToken = token;
  }

  get validationBlockInfo() {
    return this._validationBlockInfo;
  }

  public setValidationBlockInfo(token: string) {
    this._validationBlockInfo = token;
  }

  get sessionPublicAddress() {
    return this._sessionPublicAddress;
  }

  public setSessionPublicAddress(sessionPublicAddress: string) {
    this._sessionPublicAddress = sessionPublicAddress;
  }
}

export default Account;
