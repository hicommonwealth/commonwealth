import type { WalletId } from 'common-common/src/types';
import { ChainType } from 'common-common/src/types';
import $ from 'jquery';
import app from 'state';
import NewProfilesController from '../controllers/server/newProfiles';

import BN from 'bn.js';
import type ChainInfo from './ChainInfo';
import MinimumProfile from './MinimumProfile';
import { DISCOURAGED_NONREACTIVE_getProfilesByAddress } from 'state/api/profiles/getProfilesByAddress';

class Account {
  public readonly address: string;
  public readonly chain: ChainInfo;
  public readonly ghostAddress: boolean;

  // validation token sent by server
  private _validationToken?: string;
  private _sessionPublicAddress: string;
  // block that the client is signing, in order to validate login to the server
  private _validationBlockInfo?: string;

  private _addressId?: number;
  private _walletId?: WalletId;

  private _profile?: MinimumProfile;

  private _tokenBalance?: BN;

  public get profile() {
    return this._profile;
  }

  constructor({
    chain,
    address,
    ghostAddress,
    addressId,
    walletId,
    validationToken,
    sessionPublicAddress,
    validationBlockInfo,
    profile,
    ignoreProfile = true,
  }: {
    // required args
    chain: ChainInfo;
    address: string;

    // optional args
    addressId?: number;
    walletId?: WalletId;
    validationToken?: string;
    sessionPublicAddress?: string;
    validationBlockInfo?: string;
    profile?: MinimumProfile;

    // flags
    ghostAddress?: boolean;
    ignoreProfile?: boolean;
  }) {
    // Check if the account is being initialized from a Community
    // Because there won't be any chain base or chain class
    this.chain = chain;
    this.address = address;
    this._addressId = addressId;
    this._walletId = walletId;
    this._validationToken = validationToken;
    this._sessionPublicAddress = sessionPublicAddress;
    this._validationBlockInfo = validationBlockInfo;
    this.ghostAddress = !!ghostAddress;
    if (profile) {
      this._profile = profile;
    } else if (!ignoreProfile && chain?.id) {
      const updatedProfile = new MinimumProfile(address, chain?.id);

      // the `ignoreProfile` var tells that we have to refetch any profile data related to provided
      // address and chain. This method mimic react query for non-react files and as the name suggests
      // its discouraged to use and should be avoided at all costs. Its used here because we have some
      // wallet related code and a lot of other code that depends on the `new Account(...)` instance.
      // As an effort to gradually migrate, this method is used. After this account controller is
      // de-side-effected (all api calls removed from here). Then we would be in a better position to
      // remove this discouraged method
      DISCOURAGED_NONREACTIVE_getProfilesByAddress(chain?.id, address).then(
        (res) => {
          const data = res[0];
          updatedProfile.initialize(
            data?.name,
            data.address,
            data?.avatarUrl,
            data.id,
            updatedProfile.chain,
            data?.lastActive
          );
          // manually trigger an update signal when data is fetched
          NewProfilesController.Instance.isFetched.emit('redraw');
        }
      );

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

  get tokenBalance(): BN {
    return this._tokenBalance;
  }

  public setTokenBalance(balance: BN) {
    this._tokenBalance = balance;
  }

  public async validate(
    signature: string,
    timestamp: number,
    chainId: string | number,
    shouldRedraw = true
  ) {
    if (!this._validationToken && !this._validationBlockInfo) {
      throw new Error('no validation token found');
    }
    if (!signature) {
      throw new Error('signature required for validation');
    }

    const params = {
      address: this.address,
      chain: this.chain.id,
      chain_id: chainId,
      isToken: this.chain.type === ChainType.Token,
      jwt: app.user.jwt,
      signature,
      wallet_id: this.walletId,
      session_public_address: await app.sessions.getOrCreateAddress(
        this.chain.base,
        chainId.toString()
      ),
      session_timestamp: timestamp,
      session_block_data: this.validationBlockInfo,
    };
    const result = await $.post(`${app.serverUrl()}/verifyAddress`, params);
    if (result.status === 'Success') {
      // update ghost address for discourse users
      const hasGhostAddress = app.user.addresses.some(
        ({ address, ghostAddress, chain }) =>
          ghostAddress &&
          this.chain.id === chain.id &&
          app.user.activeAccounts.some((account) => account.address === address)
      );
      if (hasGhostAddress) {
        const { success, ghostAddressId } = await $.post(
          `${app.serverUrl()}/updateAddress`,
          params
        );
        if (success && ghostAddressId) {
          // remove ghost address from addresses
          app.user.setAddresses(
            app.user.addresses.filter(({ ghostAddress }) => {
              return !ghostAddress;
            })
          );
          app.user.setActiveAccounts([], shouldRedraw);
        }
      }
    }
  }
}

export default Account;
