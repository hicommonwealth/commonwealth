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
import Token from 'controllers/chain/ethereum/token/adapter';

import {
  ChainInfo,
  SocialAccount,
  Account,
  ChainBase,
  CommunityInfo,
  AddressInfo
} from 'models';
import moment from 'moment';
import { notifyError } from 'controllers/app/notifications';
const MAGIC_PUBLISHABLE_KEY = 'pk_live_B0604AA1B8EEFDB4';

function createAccount(
  account: Account<any>,
  community?: string
) {
  return $.post(`${app.serverUrl()}/createAddress`, {
    address: account.address,
    keytype: account.chainBase === ChainBase.Substrate
      && (account as any).isEd25519 ? 'ed25519' : undefined,
    chain: account.chain.id,
    community,
    jwt: app.user.jwt,
  });
}

export function linkExistingAddressToChainOrCommunity(
  address: string,
  chain: string,
  originChain: string,
  community: string,
) {
  return $.post(`${app.serverUrl()}/linkExistingAddressToChain`, {
    'address': address,
    'chain': chain,
    'originChain': originChain,
    'community': community,
    jwt: app.user.jwt,
  });
}

export async function setActiveAccount(account: Account<any>): Promise<void> {
  const chain = app.activeChainId();
  const community = app.activeCommunityId();
  const role = app.user.getRoleInCommunity({ account, chain, community });

  if (app.chain && (app.chain as Token).isToken) {
    (app.chain as Token).activeAddressHasToken(account.address).then(() => m.redraw());
  }

  if (!role || role.is_user_default) {
    app.user.ephemerallySetActiveAccount(account);
    if (app.user.activeAccounts.filter((a) => isSameAccount(a, account)).length === 0) {
      app.user.setActiveAccounts(app.user.activeAccounts.concat([account]));
    }
    return;
  }

  try {
    const response = await $.post(`${app.serverUrl()}/setDefaultRole`, chain ? {
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
    });
    if (response.status !== 'Success') {
      throw Error(`Unsuccessful status: ${response.status}`);
    }
  } catch (err) {
    console.log(err);
    notifyError('Could not set active account');
  }

  // update is_user_default
  app.user.getAllRolesInCommunity({ chain, community })
    .forEach((r) => { r.is_user_default = false; });
  role.is_user_default = true;
  app.user.ephemerallySetActiveAccount(account);
  if (app.user.activeAccounts.filter((a) => isSameAccount(a, account)).length === 0) {
    app.user.setActiveAccounts(app.user.activeAccounts.concat([account]));
  }
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
    console.log('Could not update lastVisited:', e);
  }
}

export async function updateActiveAddresses(chain?: ChainInfo) {
  // update addresses for a chain (if provided) or for offchain communities (if null)
  // for offchain communities, addresses on all chains are available by default
  app.user.setActiveAccounts(
    chain
      ? app.user.addresses
        .filter((a) => a.chain === chain.id)
        .map((addr) => app.chain?.accounts.get(addr.address, addr.keytype))
        .filter((addr) => addr)
      : app.user.addresses
        .filter((addr) => app.config.chains.getById(addr.chain))
        .map((addr) => app.community?.accounts.get(addr.address, addr.chain))
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
    await setActiveAccount(memberAddresses[0]);
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

    app.user.setAddresses(data.addresses.map((a) => new AddressInfo(a.id, a.address, a.chain, a.keytype, a.is_magic)));
    app.user.setSocialAccounts(data.socialAccounts.map((sa) => new SocialAccount(sa.provider, sa.provider_username)));

    app.user.setSiteAdmin(data.isAdmin);
    app.user.setDisableRichText(data.disableRichText);
    app.user.setLastVisited(data.lastVisited);
    app.user.setUnseenPosts(data.unseenPosts);
  }
}

export async function createUserWithAddress(
  address: string, keytype?: string, community?: string
): Promise<Account<any>> {
  const account = app.chain.accounts.get(address, keytype);
  const response = await createAccount(account, community);
  const token = response.result.verification_token;
  account.setValidationToken(token);
  account.setAddressId(response.result.id);
  return account;
}

export async function unlinkLogin(account) {
  const unlinkingCurrentlyActiveAccount = app.user.activeAccount === account;
  // TODO: Change to DELETE /address
  await $.post(`${app.serverUrl()}/deleteAddress`, {
    address: account.address,
    chain: account.chain,
    auth: true,
    jwt: app.user.jwt,
  });
  // Remove from all address stores in the frontend state.
  // This might be more gracefully handled by calling initAppState again.
  let index = app.user.activeAccounts.indexOf(account);
  app.user.activeAccounts.splice(index, 1);
  index = app.user.addresses.indexOf(app.user.addresses.find((a) => a.address === account.address));
  app.user.addresses.splice(index, 1);

  if (!unlinkingCurrentlyActiveAccount) return;
  if (app.user.activeAccounts.length > 0) {
    await setActiveAccount(app.user.activeAccounts[0]);
  } else {
    app.user.ephemerallySetActiveAccount(null);
  }
}

export async function loginWithMagicLink(email: string) {
  const magic = new Magic(MAGIC_PUBLISHABLE_KEY, { extensions: [
    new PolkadotExtension({
      // we don't need a real node URL because we're only generating an address,
      // not doing anything requiring chain connection
      rpcUrl: 'ws://localhost:9944',
    })
  ] });
  const didToken = await magic.auth.loginWithMagicLink({ email });
  const response = await $.post({
    url: `${app.serverUrl()}/auth/magic`,
    headers: {
      Authorization: `Bearer ${didToken}`,
    },
    xhrFields: {
      withCredentials: true
    },
    data: {
      // send chain/community to request
      'chain': app.activeChainId(),
      'community': app.activeCommunityId(),
    },
  });
  if (response.status === 'Success') {
    // log in as the new user (assume all verification done server-side)
    await initAppState(false);
    if (app.community) {
      await updateActiveAddresses();
    } else if (app.chain) {
      const c = app.user.selectedNode
        ? app.user.selectedNode.chain
        : app.config.nodes.getByChain(app.activeChainId())[0].chain;
      await updateActiveAddresses(c);
    }
  } else {
    throw new Error(`Magic auth unsuccessful: ${response.status}`);
  }
}
