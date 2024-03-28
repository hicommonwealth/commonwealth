import type { WalletId, WalletSsoSource } from '@hicommonwealth/core';
import app from 'state';
import NewProfilesController from '../controllers/server/newProfiles';

import { Session } from '@canvas-js/interfaces';
import axios from 'axios';
import type momentType from 'moment';
import moment from 'moment';
import { DISCOURAGED_NONREACTIVE_fetchProfilesByAddress } from 'state/api/profiles/fetchProfilesByAddress';
import type ChainInfo from './ChainInfo';
import MinimumProfile from './MinimumProfile';

class Account {
  public readonly address: string;
  public readonly community: ChainInfo;
  public readonly ghostAddress: boolean;
  public lastActive?: momentType.Moment;

  // validation token sent by server
  private _validationToken?: string;
  private _sessionPublicAddress: string;
  // block that the client is signing, in order to validate login to the server
  private _validationBlockInfo?: string;

  private _addressId?: number;
  private _walletId?: WalletId;
  private _walletSsoSource?: WalletSsoSource;

  private _profile?: MinimumProfile;

  public get profile() {
    return this._profile;
  }

  constructor({
    community,
    address,
    ghostAddress,
    addressId,
    walletId,
    walletSsoSource,
    validationToken,
    sessionPublicAddress,
    validationBlockInfo,
    profile,
    ignoreProfile = true,
    lastActive,
  }: {
    // required args
    community: ChainInfo;
    address: string;

    // optional args
    addressId?: number;
    walletId?: WalletId;
    walletSsoSource?: WalletSsoSource;
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
    this._walletSsoSource = walletSsoSource;
    this._validationToken = validationToken;
    this._sessionPublicAddress = sessionPublicAddress;
    this._validationBlockInfo = validationBlockInfo;
    this.ghostAddress = !!ghostAddress;
    this.lastActive = lastActive ? moment(lastActive) : null;
    if (profile) {
      this._profile = profile;
    } else if (!ignoreProfile && community?.id) {
      const updatedProfile = new MinimumProfile(address, community?.id);

      // the `ignoreProfile` var tells that we have to refetch any profile data related to provided
      // address and chain. This method mimic react query for non-react files and as the name suggests
      // its discouraged to use and should be avoided at all costs. Its used here because we have some
      // wallet related code and a lot of other code that depends on the `new Account(...)` instance.
      // As an effort to gradually migrate, this method is used. After this account controller is
      // de-side-effected (all api calls removed from here). Then we would be in a better position to
      // remove this discouraged method
      DISCOURAGED_NONREACTIVE_fetchProfilesByAddress(
        community?.id,
        address,
      ).then((res) => {
        const data = res[0];
        if (!data) {
          console.log(
            'No profile data found for address',
            address,
            'on chain',
            community?.id,
          );
        } else {
          updatedProfile.initialize(
            data?.name,
            data.address,
            data?.avatarUrl,
            data.id,
            updatedProfile.chain,
            data?.lastActive,
          );
        }
        // manually trigger an update signal when data is fetched
        NewProfilesController.Instance.isFetched.emit('redraw');
      });

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

  get walletSsoSource() {
    return this._walletSsoSource;
  }

  public setWalletSsoSource(walletSsoSource: WalletSsoSource) {
    this._walletSsoSource = walletSsoSource;
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

  public async validate(session: Session, shouldRedraw = true) {
    const ipldDagJson = await import('@ipld/dag-json');

    const params = {
      address: this.address,
      community_id: this.community.id,
      jwt: app.user.jwt,
      session: ipldDagJson.stringify(ipldDagJson.encode(session)),
      wallet_id: this.walletId,
      wallet_sso_source: this.walletSsoSource,
    };

    const res = await axios.post(`${app.serverUrl()}/verifyAddress`, params);

    if (res.data.result.status === 'Success') {
      // update ghost address for discourse users
      const hasGhostAddress = app.user.addresses.some(
        ({ address, ghostAddress, community }) =>
          ghostAddress &&
          this.community.id === community.id &&
          app.user.activeAccounts.some(
            (account) => account.address === address,
          ),
      );

      if (hasGhostAddress) {
        const response = await axios.post(
          `${app.serverUrl()}/updateAddress`,
          params,
        );

        if (response.data.success && response.data.ghostAddressId) {
          // remove ghost address from addresses
          app.user.setAddresses(
            app.user.addresses.filter(({ ghostAddress }) => {
              return !ghostAddress;
            }),
          );
          app.user.setActiveAccounts([], shouldRedraw);
        }
      }
    }
  }
}

export default Account;
