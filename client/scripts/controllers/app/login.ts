/**
 * @file Manages logged-in user accounts and local storage.
 */
import { default as m } from 'mithril';
import { default as $ } from 'jquery';
import app from 'state';

import { notifySuccess, notifyError } from 'controllers/app/notifications';
import SubstrateAccounts, { SubstrateAccount } from 'controllers/chain/substrate/account';
import SelectAddressModal from 'views/modals/select_address_modal';
import { isMember } from 'views/components/membership_button';
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
  return $.post(`${app.serverUrl()}/createAddress`, {
    address: account.address,
    keytype: account.chainBase === ChainBase.Substrate
      && (account as SubstrateAccount).isEd25519 ? 'ed25519' : undefined,
    chain: account.chain.id,
    jwt: app.login.jwt,
  });
}

export async function setActiveAccount(account: Account<any>, suppressNotification?) {
  if (!suppressNotification) {
    notifySuccess('Switched account');
  }
  app.vm.activeAccount = account;

  if (app.activeCommunityId()) {
    app.login.selectedAddresses.setByCommunity(app.activeCommunityId(), account);
  } else if (app.activeChainId()) {
    app.login.selectedAddresses.setByChain(app.activeChainId(), account);
  }
}

export async function updateLastVisited(activeEntity: ChainInfo | CommunityInfo, updateFrontend?: boolean) {
  if (!app.isLoggedIn()) return;
  try {
    const timestamp = moment();
    const obj = { activeEntity: activeEntity.id, timestamp };
    const value = JSON.stringify(obj);
    if (updateFrontend) {
      app.login.lastVisited[activeEntity.id] = new Date().toISOString();
    }
    const response = await $.post(`${app.serverUrl()}/writeUserSetting`, {
      jwt: app.login.jwt,
      key: 'lastVisited',
      value,
    });
  } catch (e) {
    console.log(e);
    notifyError('Could not update lastVisited');
  }
}

export function clearActiveAddresses() {
  app.login.activeAddresses = [];
  app.vm.activeAccount = null;
}

export function updateActiveAddresses(chain?: ChainInfo, suppressAddressSelectionModal = false) {
  // update addresses for a chain (if provided) or for offchain communities (if null)
  // for offchain communities, addresses on all chains are available by default
  app.login.activeAddresses = chain
    ? app.login.addresses
      .filter((a) => a.chain === chain.id)
      .map((addr) => app.chain.accounts.get(addr.address, addr.keytype))
      .filter((addr) => addr)
    : app.login.addresses
      .map((addr) => app.community.accounts.get(addr.address, addr.chain))
      .filter((addr) => addr);

  // select the address that the new chain should be initialized with
  const memberAddresses = app.login.activeAddresses.filter((address) => {
    return chain
      ? isMember(chain.id, null, address)
      : isMember(null, app.community.meta.id, address);
  });

  if (memberAddresses.length === 0) {
    // no member addresses - preview the community
  } else if (memberAddresses.length === 1) {
    // one member address - start the community with that address (don't check for default address)
    setActiveAccount(app.login.activeAddresses[0]);
  } else if (memberAddresses.length > 1 && !suppressAddressSelectionModal) {
    // more than one member address - show modal to choose (TODO: check for default address)
    app.modals.create({ modal: SelectAddressModal });
  }

  // try to load a previously selected account for the chain/community
  // TODO: bring this back when default addresses are saved

  // if (chain) {
  //   const defaultAddress = app.login.selectedAddresses.getByChain(chain.id);
  //   app.vm.activeAccount = app.login.activeAddresses
  //     .filter((a) => a.address === defaultAddress && a.chain.id === chain.id)[0];
  // } else if (app.activeCommunityId()) {
  //   const defaultAddress = app.login.selectedAddresses.getByCommunity(app.activeCommunityId());
  //   app.vm.activeAccount = app.login.activeAddresses.filter((a) => a.address === defaultAddress)[0];
  // }
}

// called from the server, which returns public keys
// creates SubstrateAccount with associated SocialAccounts
export function updateActiveUser(data) {
  if (!data || data.loggedIn === false) {
    delete app.login.email;
    delete app.login.jwt;
    app.login.addresses = [];
    app.login.socialAccounts = [];
    app.login.isSiteAdmin = false;
    app.login.lastVisited = {};
    app.login.selectedAddresses.reset();
    app.login.unseenPosts = {};
    app.login.activeAddresses = [];
    app.vm.activeAccount = null;
  } else {
    app.login.email = data.email;
    app.login.jwt = data.jwt;

    app.login.addresses = data.addresses
      .map((a) => new AddressInfo(a.id, a.address, a.chain, a.keytype));
    app.login.socialAccounts = data.socialAccounts
      .map((sa) => new SocialAccount(sa.provider, sa.provider_username));

    app.login.isSiteAdmin = data.isAdmin;
    app.login.disableRichText = data.disableRichText;
    app.login.lastVisited = data.lastVisited;
    app.login.selectedAddresses.reset(data.selectedAddresses);
    app.login.unseenPosts = data.unseenPosts;
  }
}

// called from within the client only
// creates SubstrateAccount with only a private key
export async function createUserWithSeed(seed: string): Promise<Account<any>> {
  // Look for unlocked account with the same seed
  const existingDevAccount = app.login.activeAddresses.find((user) => user.getSeed() === seed);
  if (existingDevAccount) {
    throw new Error('User with this seed already exists');
  }

  const account = (app.chain.accounts as SubstrateAccounts).fromSeed(seed);
  // Look for account with the same public key
  const existingUser = app.login.activeAddresses.find((user) => user.address === account.address);
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
  const unlinkingCurrentlyActiveAccount = app.vm.activeAccount === account;
  return $.post(`${app.serverUrl()}/deleteAddress`, {
    address: account.address,
    chain: account.chain,
    auth: true,
    jwt: app.login.jwt,
  }).then((result) => {
    // Remove from all address stores in the frontend state.
    // This might be more gracefully handled by calling initAppState again.
    let index = app.login.activeAddresses.indexOf(account);
    app.login.activeAddresses.splice(index, 1);
    index = app.login.addresses.indexOf(app.login.addresses.find((a) => a.address === account.address));
    app.login.addresses.splice(index, 1);

    if (!unlinkingCurrentlyActiveAccount) return;
    app.vm.activeAccount = app.login.activeAddresses.length > 0 ? app.login.activeAddresses[0] : null;
  });
}
