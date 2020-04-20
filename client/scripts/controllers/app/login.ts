/**
 * @file Manages logged-in user accounts and local storage.
 */
import { default as m } from 'mithril';
import { default as $ } from 'jquery';
import app from 'state';

import { notifySuccess, notifyError } from 'controllers/app/notifications';
import SubstrateAccounts, { SubstrateAccount } from 'controllers/chain/substrate/account';
import {
  ChainInfo,
  SocialAccount,
  Account,
  ChainBase,
  CommunityInfo,
  AddressInfo,
  MembershipInfo
} from 'models';
import moment from 'moment';

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

export function updateActiveAddresses(newChain?: ChainInfo) {
  // if newChain is set, then update addresses for a chain (filter to addresses matching that chain)
  // if newChain is unset, then update addresses for an offchain community (add all saved addresses)
  try {
    app.login.activeAddresses = newChain
      ? app.login.addresses
        .filter((a) => a.chain === newChain.id)
        .sort((addr1, addr2) => (addr2.selected ? 1 : 0) - (addr1.selected ? 1 : 0))
        .map((addr) => app.chain.accounts.get(addr.address, addr.keytype))
      : app.login.addresses
        .sort((addr1, addr2) => (addr2.selected ? 1 : 0) - (addr1.selected ? 1 : 0))
        .map((addr) => app.community.accounts.get(addr.address, addr.chain));
  } catch (e) {
    app.login.activeAddresses = [];
  }
  // set active account if there isn't one yet
  if (app.login.activeAddresses.length > 0) {
    app.vm.activeAccount = app.login.activeAddresses[0];
  } else {
    app.vm.activeAccount = null;
  }

  // populate dev seed addresses
  if (newChain && newChain.network === 'edgeware') {
    app.login.activeAddresses.map((acct) => {
      ['Alice', 'Bob', 'Charlie', 'Dave', 'Eve', 'Ferdie',
       'Alice//stash', 'Bob//stash', 'Charlie//stash',
       'Dave//stash', 'Eve//stash', 'Ferdie//stash'].map((seed) => {
         const newAcct = (app.chain.accounts as SubstrateAccounts).fromSeed(seed);
         if (acct instanceof SubstrateAccount && !acct.getSeed() && acct.address === newAcct.address) {
           acct.setSeed(seed);
         }
      });
    });
  }
}

// called from the server, which returns public keys
// creates SubstrateAccount with associated SocialAccounts
export function updateActiveUser(data) {
  if (!data || data.loggedIn === false) {
    delete app.login.email;
    delete app.login.jwt;
    app.login.addresses = [];
    app.login.socialAccounts = [];
    app.login.memberships = [];
    app.login.isSiteAdmin = false;
    app.login.lastVisited = {};
    app.login.unseenPosts = {};
    app.login.activeAddresses = [];
    app.vm.activeAccount = null;
  } else {
    app.login.email = data.email;
    app.login.jwt = data.jwt;

    app.login.addresses = data.addresses.sort((a, b) => (b.selected ? 1 : 0) - (a.selected ? 1 : 0))
      .map((a) => new AddressInfo(a.id, a.address, a.chain, a.selected, a.keytype));
    app.login.socialAccounts = data.socialAccounts
      .map((sa) => new SocialAccount(sa.provider, sa.provider_username));
    app.login.memberships = data.memberships
      .map((m) => new MembershipInfo(m.user_id, m.chain, m.community, m.active));

    app.login.isSiteAdmin = data.isAdmin;
    app.login.disableRichText = data.disableRichText;
    app.login.lastVisited = data.lastVisited;
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

function createAccount(account: Account<any>) {
  return $.post(app.serverUrl() + '/createAddress', {
    address: account.address,
    keytype: account.chainBase === ChainBase.Substrate &&
      (account as SubstrateAccount).isEd25519 ? 'ed25519' : undefined,
    chain: account.chain.id,
    jwt: app.login.jwt,
  });
}

export function unlinkLogin(account) {
  const unlinkingCurrentlyActiveAccount = app.vm.activeAccount === account;
  return $.post(app.serverUrl() + '/deleteAddress', {
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
    if (app.login.activeAddresses.length > 0) {
      selectLogin(app.login.activeAddresses[0]);
    } else {
      app.vm.activeAccount = null;
    }
  });
}

export async function selectLogin(account: Account<any>, suppressNotification?): Promise<Account<any>> {
  return new Promise((resolve, reject) => {
    $.post(app.serverUrl() + '/selectAddress', {
      address: account.address,
      chain: account.chain.id,
      auth: true,
      jwt: app.login.jwt,
    }).then((result) => {
      const addressId = result.result.id;
      const acct = app.login.addresses.find((a) => {
        return a.address === account.address && app.chain && app.chain.id === a.chain;
      });

      if (!acct) {
        // Only push if is chain because adds another address if in a community
        if (app.chain) {
          app.login.activeAddresses.push(account);
          const keytype = (account as SubstrateAccount).isEd25519 ? 'ed25519' : undefined;
          app.login.addresses.push(new AddressInfo(addressId, account.address, account.chain.id, true, keytype));
        }
      } else {
        acct.selected = true;
      }

      // remove old selection
      for (const acct of app.login.addresses) {
        if (app.chain) {
          if (acct.selected && app.chain && app.chain.id === acct.chain && acct.address !== account.address) {
            acct.selected = false;
          }
        }
        // else if (isCommunity) {
        //   if (acct.selected && app.community && acct.address !== account.address) {
        //     acct.selected = false;
        //   }
        // }
      }

      if (!suppressNotification) {
        notifySuccess('Switched account');
      }
      app.vm.activeAccount = account;
      // Usually it would be bad practice to put an m.redraw() in controller code, but we're mutating view state here...
      m.redraw();
      resolve(account);
    }).catch((error) => reject(error));
  });
}
