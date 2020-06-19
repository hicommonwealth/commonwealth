/**
 * @file Manages logged-in user accounts and local storage.
 */
import m from 'mithril';
import $ from 'jquery';
import app from 'state';

import { notifySuccess, notifyError } from 'controllers/app/notifications';
import SubstrateAccounts, { SubstrateAccount } from 'controllers/chain/substrate/account';
import SelectAddressModal from 'views/modals/select_address_modal';
import {
  ChainInfo,
  SocialAccount,
  Account,
  ChainBase,
  CommunityInfo,
  AddressInfo,
} from 'models';
import moment from 'moment';

function createAccount(account: Account<any>) {
  // TODO: Change to POST /address
  return $.post(`${app.serverUrl()}/createAddress`, {
    address: account.address,
    keytype: account.chainBase === ChainBase.Substrate
      && (account as SubstrateAccount).isEd25519 ? 'ed25519' : undefined,
    chain: account.chain.id,
    jwt: app.user.jwt,
  });
}

export async function setActiveAccount(account: Account<any>, suppressNotification?) {
  return new Promise((resolve, reject) => {
    const chain = app.activeChainId();
    const community = app.activeCommunityId();
    const role = app.user.getRoleInCommunity({ chain, community });

    if (!role) {
      if (!suppressNotification && app.user.activeAccount !== account) {
        notifySuccess('Switched account');
      }
      app.user.setActiveAccount(account);
      resolve();
    } else {
      $.post(`${app.serverUrl()}/setDefaultRole`, chain ? {
        address: account.address,
        author_chain: account.chain.id,
        chain,
        jwt: app.user.jwt,
        auth: true,
      } : {
        address: account.address,
        author_chain: account.chain.id,
        community,
        jwt: app.user.jwt,
        auth: true,
      }).then((response) => {
        // update is_user_default
        app.user.getAllRolesInCommunity({ chain, community })
          .forEach((r) => { r.is_user_default = false; });
        role.is_user_default = true;

        if (!suppressNotification && app.user.activeAccount !== account) {
          notifySuccess('Switched account');
        }
        app.user.setActiveAccount(account);
        resolve();
      }).catch((err) => reject());
    }
  });
}

export async function updateLastVisited(activeEntity: ChainInfo | CommunityInfo, updateFrontend?: boolean) {
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
    console.log(e);
    notifyError('Could not update lastVisited');
  }
}

export function clearActiveAddresses() {
  app.user.setActiveAccounts([]);
  app.user.setActiveAccount(null);
}

export function updateActiveAddresses(chain?: ChainInfo, suppressAddressSelectionModal = false) {
  // update addresses for a chain (if provided) or for offchain communities (if null)
  // for offchain communities, addresses on all chains are available by default
  app.user.setActiveAccounts(
    chain
      ? app.user.addresses
        .filter((a) => a.chain === chain.id)
        .map((addr) => app.chain.accounts.get(addr.address, addr.keytype))
        .filter((addr) => addr)
      : app.user.addresses
        .map((addr) => app.community.accounts.get(addr.address, addr.chain))
        .filter((addr) => addr)
  );

  // select the address that the new chain should be initialized with
  const memberAddresses = app.user.activeAccounts.filter((account) => {
    return chain
      ? app.user.isMember({ chain: chain.id, account })
      : app.user.isMember({ community: app.community.meta.id, account });
  });

  if (memberAddresses.length === 1) {
    // one member address - start the community with that address
    setActiveAccount(memberAddresses[0]);
  } else if (app.user.activeAccounts.length === 1) {
    // one non-member address - start the community with that address
    setActiveAccount(app.user.activeAccounts[0]);
  } else if (app.user.activeAccounts.length === 0) {
    // no addresses - preview the community
  } else {
    const existingAddress = chain
      ? app.user.getDefaultAddressInCommunity({ chain: chain.id })
      : app.user.getDefaultAddressInCommunity({ community: app.community.meta.id });

    if (existingAddress) {
      const account = app.user.activeAccounts.find((a) => {
        return a.chain.id === existingAddress.chain && a.address === existingAddress.address;
      });
      if (account) setActiveAccount(account);
    } else if (!suppressAddressSelectionModal) {
      app.modals.create({ modal: SelectAddressModal });
    }
  }
}

// called from the server, which returns public keys
// creates SubstrateAccount with associated SocialAccounts
export function updateActiveUser(data) {
  if (!data || data.loggedIn === false) {
    app.user.setEmail(null);
    app.user.setJWT(null);
    app.user.setAddresses([]);
    app.user.setSocialAccounts([]);
    app.user.setSiteAdmin(false);
    app.user.setLastVisited({});
    app.user.setUnseenPosts({});
    app.user.setActiveAccounts([]);
    app.user.setActiveAccount(null);
  } else {
    app.user.setEmail(data.email);
    app.user.setEmailInterval(data.emailInterval);
    app.user.setEmailVerified(data.emailVerified);
    app.user.setJWT(data.jwt);

    app.user.setAddresses(data.addresses.map((a) => new AddressInfo(a.id, a.address, a.chain, a.keytype)));
    app.user.setSocialAccounts(data.socialAccounts.map((sa) => new SocialAccount(sa.provider, sa.provider_username)));

    app.user.setSiteAdmin(data.isAdmin);
    app.user.setDisableRichText(data.disableRichText);
    app.user.setLastVisited(data.lastVisited);
    app.user.setUnseenPosts(data.unseenPosts);
  }
}

// called from within the client only
// creates SubstrateAccount with only a private key
export async function createUserWithSeed(seed: string): Promise<Account<any>> {
  // Look for unlocked account with the same seed
  const existingDevAccount = app.user.activeAccounts.find((user) => user.getSeed() === seed);
  if (existingDevAccount) {
    throw new Error('User with this seed already exists');
  }

  const account = (app.chain.accounts as SubstrateAccounts).fromSeed(seed);
  // Look for account with the same public key
  const existingUser = app.user.activeAccounts.find((user) => user.address === account.address);
  if (existingUser) {
    account.setSeed(seed);
    // TODO: what should we do here?
  }
  const response = await createAccount(account);
  account.setValidationToken(response.result.verification_token);
  await account.validate();
  return account;
}

export async function createUserWithMnemonic(mnemonic: string): Promise<Account<any>> {
  const account = (app.chain.accounts as SubstrateAccounts).fromMnemonic(mnemonic);
  const response = await createAccount(account);
  account.setValidationToken(response.result.verification_token);
  await account.validate();
  return account;
}

export async function createUserWithAddress(address: string, keytype?: string): Promise<Account<any>> {
  const account = app.chain.accounts.get(address, keytype);
  const response = await createAccount(account);
  const token = response.result.verification_token;
  account.setValidationToken(token);
  return account;
}

export function unlinkLogin(account) {
  const unlinkingCurrentlyActiveAccount = app.user.activeAccount === account;
  // TODO: Change to DELETE /address
  return $.post(`${app.serverUrl()}/deleteAddress`, {
    address: account.address,
    chain: account.chain,
    auth: true,
    jwt: app.user.jwt,
  }).then((result) => {
    // Remove from all address stores in the frontend state.
    // This might be more gracefully handled by calling initAppState again.
    let index = app.user.activeAccounts.indexOf(account);
    app.user.activeAccounts.splice(index, 1);
    index = app.user.addresses.indexOf(app.user.addresses.find((a) => a.address === account.address));
    app.user.addresses.splice(index, 1);

    if (!unlinkingCurrentlyActiveAccount) return;
    app.user.setActiveAccount(app.user.activeAccounts.length > 0 ? app.user.activeAccounts[0] : null);
  });
}
