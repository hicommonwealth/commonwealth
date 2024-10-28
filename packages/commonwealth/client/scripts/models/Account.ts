import { Session } from '@canvas-js/interfaces';
import type { ChainBase, WalletId } from '@hicommonwealth/shared';
import { serializeCanvas } from '@hicommonwealth/shared';
import axios from 'axios';
import type momentType from 'moment';
import moment from 'moment';
import { SERVER_URL } from 'state/api/config';
import { userStore } from 'state/ui/user';
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
    } else if (!ignoreProfile && community?.id) {
      const updatedProfile = new MinimumProfile(address, community?.id);

      // trpcVanillaClient.user.getUserAddresses
      //   .query({ communities: community?.id, addresses: address })
      //   .then((addresses) => {
      //     if (addresses.length === 0) {
      //       console.log(
      //         'No profile data found for address',
      //         address,
      //         'on chain',
      //         community?.id,
      //       );
      //     } else {
      //       const addr = addresses[0];
      //       updatedProfile.initialize(
      //         addr.userId,
      //         addr.name,
      //         addr.address,
      //         addr.avatarUrl ?? '',
      //         updatedProfile.chain,
      //         addr.lastActive ? new Date(addr.lastActive) : null,
      //       );
      //     }
      //     // manually trigger an update signal when data is fetched
      //     NewProfilesController.Instance.isFetched.emit('redraw');
      //   });

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

  public async validate(session: Session) {
    const params = {
      address: this.address,
      community_id: this.community.id,
      jwt: userStore.getState().jwt,
      session: serializeCanvas(session),
      wallet_id: this.walletId,
    };

    return await axios.post(`${SERVER_URL}/verifyAddress`, params);
  }
}

export default Account;
