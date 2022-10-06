/**
 * @file Manages logged-in user accounts and local storage.
 */
import $ from 'jquery';
import m from 'mithril';
import app from 'state';
import { isSameAccount } from 'helpers';

import { initAppState } from 'app';
import { Magic } from 'magic-sdk';
import { PolkadotExtension } from '@magic-ext/polkadot';
import { ChainBase, WalletId } from 'common-common/src/types';
import {
  ChainInfo,
  SocialAccount,
  Account,
  AddressInfo,
  ITokenAdapter,
} from 'models';
import moment from 'moment';
import { notifyError } from 'controllers/app/notifications';
const MAGIC_PUBLISHABLE_KEY = 'pk_live_B0604AA1B8EEFDB4';

export function linkExistingAddressToChainOrCommunity(
  address: string,
  chain: string,
  originChain: string
) {
  return $.post(`${app.serverUrl()}/linkExistingAddressToChain`, {
    address,
    chain,
    originChain,
    jwt: app.user.jwt,
  });
}

export async function setActiveAccount(account: Account): Promise<void> {
  const chain = app.activeChainId();
  const role = app.roles.getRoleInCommunity({ account, chain });

  if (app.chain && ITokenAdapter.instanceOf(app.chain)) {
    app.chain.activeAddressHasToken(account.address).then(() => m.redraw());
  }

  if (!role || role.is_user_default) {
    app.user.ephemerallySetActiveAccount(account);
    if (
      app.user.activeAccounts.filter((a) => isSameAccount(a, account))
        .length === 0
    ) {
      app.user.setActiveAccounts(app.user.activeAccounts.concat([account]));
    }
    return;
  }

  try {
    const response = await $.post(`${app.serverUrl()}/setDefaultRole`, {
      address: account.address,
      author_chain: account.chain.id,
      chain,
      jwt: app.user.jwt,
      auth: true,
    });
    if (response.status !== 'Success') {
      throw Error(`Unsuccessful status: ${response.status}`);
    }
  } catch (err) {
    console.log(err);
    notifyError('Could not set active account');
  }

  // update is_user_default
  app.roles.getAllRolesInCommunity({ chain }).forEach((r) => {
    r.is_user_default = false;
  });
  role.is_user_default = true;
  app.user.ephemerallySetActiveAccount(account);
  if (
    app.user.activeAccounts.filter((a) => isSameAccount(a, account)).length ===
    0
  ) {
    app.user.setActiveAccounts(app.user.activeAccounts.concat([account]));
  }
}

export async function completeClientLogin(account: Account) {
  try {
    let addressInfo = app.user.addresses.find(
      (a) => a.address === account.address && a.chain.id === account.chain.id
    );

    if (!addressInfo && account.addressId) {
      addressInfo = new AddressInfo(
        account.addressId,
        account.address,
        account.chain.id,
        account.walletId
      );
      app.user.addresses.push(addressInfo);
    }

    // link the address to the community
    if (app.chain) {
      try {
        if (
          !app.roles.getRoleInCommunity({
            account,
            chain: app.activeChainId(),
          })
        ) {
          await app.roles.createRole({
            address: addressInfo,
            chain: app.activeChainId(),
          });
        }
      } catch (e) {
        // this may fail if the role already exists, e.g. if the address is being migrated from another user
        console.error('Failed to create role');
      }
    }

    // set the address as active
    await setActiveAccount(account);

    if (
      app.user.activeAccounts.filter((a) => isSameAccount(a, account))
        .length === 0
    ) {
      app.user.setActiveAccounts(app.user.activeAccounts.concat([account]));
    }
    m.redraw();
  } catch (e) {
    console.trace(e);
  }
}

export async function updateLastVisited(
  activeEntity: ChainInfo,
  updateFrontend?: boolean
) {
  if (!app.isLoggedIn()) return;
  try {
    const timestamp = moment();
    const obj = { activeEntity: activeEntity.id, timestamp };
    const value = JSON.stringify(obj);
    if (updateFrontend) {
      app.user.lastVisited[activeEntity.id] = new Date().toISOString();
    }
    const response = await $.post(`${app.serverUrl()}/writeUserSetting`, {
      jwt: app.user.jwt,
      key: 'lastVisited',
      value,
    });
  } catch (e) {
    console.log('Could not update lastVisited:', e);
  }
}

export async function updateActiveAddresses(chain?: ChainInfo) {
  // update addresses for a chain (if provided) or for communities (if null)
  // for communities, addresses on all chains are available by default
  app.user.setActiveAccounts(
    app.user.addresses
      .filter((a) => a.chain.id === chain.id)
      .map((addr) => app.chain?.accounts.get(addr.address, addr.keytype))
      .filter((addr) => addr)
  );

  // select the address that the new chain should be initialized with
  const memberAddresses = app.user.activeAccounts.filter((account) => {
    return app.roles.isMember({ chain: chain.id, account });
  });

  if (memberAddresses.length === 1) {
    // one member address - start the community with that address
    await setActiveAccount(memberAddresses[0]);
  } else if (app.user.activeAccounts.length === 0) {
    // no addresses - preview the community
  } else {
    const existingAddress = app.roles.getDefaultAddressInCommunity({
      chain: chain.id,
    });

    if (existingAddress) {
      const account = app.user.activeAccounts.find((a) => {
        return (
          a.chain.id === existingAddress.chain.id &&
          a.address === existingAddress.address
        );
      });
      if (account) await setActiveAccount(account);
    }
  }
}

// called from the server, which returns public keys
// creates SubstrateAccount with associated SocialAccounts
export function updateActiveUser(data) {
  if (!data || data.loggedIn === false) {
    app.user.setEmail(null);
    app.user.setEmailInterval(null);
    app.user.setEmailVerified(null);
    app.user.setJWT(null);

    app.user.setAddresses([]);
    app.user.setSocialAccounts([]);

    app.user.setSiteAdmin(false);
    app.user.setDisableRichText(false);
    app.user.setLastVisited({});
    app.user.setUnseenPosts({});

    app.user.setActiveAccounts([]);
    app.user.ephemerallySetActiveAccount(null);
  } else {
    app.user.setEmail(data.email);
    app.user.setEmailInterval(data.emailInterval);
    app.user.setEmailVerified(data.emailVerified);
    app.user.setJWT(data.jwt);

    app.user.setAddresses(
      data.addresses.map(
        (a) =>
          new AddressInfo(
            a.id,
            a.address,
            a.chain,
            a.keytype,
            a.wallet_id,
            a.ghost_address
          )
      )
    );
    app.user.setSocialAccounts(
      data.socialAccounts.map(
        (sa) => new SocialAccount(sa.provider, sa.provider_username)
      )
    );

    app.user.setSiteAdmin(data.isAdmin);
    app.user.setDisableRichText(data.disableRichText);
    app.user.setLastVisited(data.lastVisited);
    app.user.setUnseenPosts(data.unseenPosts);
  }
}

export async function createUserWithAddress(
  address: string,
  walletId: WalletId,
  chain: string
): Promise<{ account: Account; newlyCreated: boolean }> {
  const response = await $.post(`${app.serverUrl()}/createAddress`, {
    address,
    chain,
    jwt: app.user.jwt,
    wallet_id: walletId,
  });
  const id = response.result.id;
  const chainInfo = app.config.chains.getById(chain);
  const account = new Account({
    addressId: id,
    address,
    chain: chainInfo,
    validationToken: response.result.verification_token,
    walletId,
  });
  return { account, newlyCreated: response.result.newly_created };
}

export async function unlinkLogin(account: AddressInfo) {
  const unlinkingCurrentlyActiveAccount = app.user.activeAccount === account;
  // TODO: Change to DELETE /address
  await $.post(`${app.serverUrl()}/deleteAddress`, {
    address: account.address,
    chain: account.chain.id,
    auth: true,
    jwt: app.user.jwt,
  });
  // Remove from all address stores in the frontend state.
  // This might be more gracefully handled by calling initAppState again.
  let index = app.user.activeAccounts.indexOf(account);
  app.user.activeAccounts.splice(index, 1);
  index = app.user.addresses.indexOf(
    app.user.addresses.find((a) => a.address === account.address)
  );
  app.user.addresses.splice(index, 1);

  if (!unlinkingCurrentlyActiveAccount) return;
  if (app.user.activeAccounts.length > 0) {
    await setActiveAccount(app.user.activeAccounts[0]);
  } else {
    app.user.ephemerallySetActiveAccount(null);
  }
}

export async function loginWithMagicLink(email: string) {
  const magic = new Magic(MAGIC_PUBLISHABLE_KEY, {
    extensions: [
      new PolkadotExtension({
        // we don't need a real node URL because we're only generating an address,
        // not doing anything requiring chain connection
        rpcUrl: 'ws://localhost:9944',
      }),
    ],
  });
  const didToken = await magic.auth.loginWithMagicLink({ email });
  const response = await $.post({
    url: `${app.serverUrl()}/auth/magic`,
    headers: {
      Authorization: `Bearer ${didToken}`,
    },
    xhrFields: {
      withCredentials: true,
    },
    data: {
      // send chain/community to request
      chain: app.activeChainId(),
    },
  });
  if (response.status === 'Success') {
    // log in as the new user (assume all verification done server-side)
    await initAppState(false);
    if (app.chain) {
      const c = app.user.selectedChain
        ? app.user.selectedChain
        : app.config.chains.getById(app.activeChainId());
      await updateActiveAddresses(c);
    }
  } else {
    throw new Error(`Magic auth unsuccessful: ${response.status}`);
  }
}
