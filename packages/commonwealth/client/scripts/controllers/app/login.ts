/**
 * @file Manages logged-in user accounts and local storage.
 */
import { initAppState } from 'state';
import { ChainBase, WalletId } from 'common-common/src/types';
import { notifyError } from 'controllers/app/notifications';
import { signSessionWithMagic } from 'controllers/server/sessions';
import { getADR036SignableSession } from 'adapters/chain/cosmos/keys';
import { chainBaseToCanvasChainId } from 'canvas/chainMappings';
import { isSameAccount } from 'helpers';
import $ from 'jquery';

import moment from 'moment';
import app from 'state';
import Account from '../../models/Account';
import AddressInfo from '../../models/AddressInfo';
import type BlockInfo from '../../models/BlockInfo';
import type ChainInfo from '../../models/ChainInfo';
import ITokenAdapter from '../../models/ITokenAdapter';
import SocialAccount from '../../models/SocialAccount';

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

export async function setActiveAccount(
  account: Account,
  shouldRedraw = true
): Promise<void> {
  const chain = app.activeChainId();
  const role = app.roles.getRoleInCommunity({ account, chain });

  if (app.chain && ITokenAdapter.instanceOf(app.chain)) {
    await app.chain.activeAddressHasToken(account.address);
  }

  if (!role || role.is_user_default) {
    app.user.ephemerallySetActiveAccount(account);
    if (
      app.user.activeAccounts.filter((a) => isSameAccount(a, account))
        .length === 0
    ) {
      app.user.setActiveAccounts(
        app.user.activeAccounts.concat([account]),
        shouldRedraw
      );
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
    app.user.setActiveAccounts(
      app.user.activeAccounts.concat([account]),
      shouldRedraw
    );
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
    await $.post(`${app.serverUrl()}/writeUserSetting`, {
      jwt: app.user.jwt,
      key: 'lastVisited',
      value,
    });
  } catch (e) {
    console.log('Could not update lastVisited:', e);
  }
}

export async function updateActiveAddresses({
  chain,
  shouldRedraw = true,
}: {
  chain?: ChainInfo;
  shouldRedraw?: boolean;
}) {
  // update addresses for a chain (if provided) or for communities (if null)
  // for communities, addresses on all chains are available by default
  app.user.setActiveAccounts(
    app.user.addresses
      .filter((a) => a.chain.id === chain.id)
      .map((addr) => app.chain?.accounts.get(addr.address, addr.keytype))
      .filter((addr) => addr),
    shouldRedraw
  );

  // select the address that the new chain should be initialized with
  const memberAddresses = app.user.activeAccounts.filter((account) => {
    return app.roles.isMember({ chain: chain.id, account });
  });

  if (memberAddresses.length === 1) {
    // one member address - start the community with that address
    await setActiveAccount(memberAddresses[0], shouldRedraw);
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
      if (account) await setActiveAccount(account, shouldRedraw);
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
  chain: string,
  sessionPublicAddress?: string,
  validationBlockInfo?: BlockInfo
): Promise<{ account: Account; newlyCreated: boolean }> {
  const response = await $.post(`${app.serverUrl()}/createAddress`, {
    address,
    chain,
    jwt: app.user.jwt,
    wallet_id: walletId,
    block_info: validationBlockInfo
      ? JSON.stringify(validationBlockInfo)
      : null,
  });
  const id = response.result.id;
  const chainInfo = app.config.chains.getById(chain);
  const account = new Account({
    addressId: id,
    address,
    chain: chainInfo,
    validationToken: response.result.verification_token,
    walletId,
    sessionPublicAddress: sessionPublicAddress,
    validationBlockInfo: response.result.block_info,
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

async function constructMagic(isCosmos) {
  const { Magic } = await import('magic-sdk');
  const { OAuthExtension } = await import('@magic-ext/oauth');
  const { CosmosExtension } = await import('@magic-ext/cosmos');

  if (!app.chain && isCosmos) {
    throw new Error("Must be in a community to login with Cosmos magic link");
  }

  return new Magic(process.env.MAGIC_PUBLISHABLE_KEY, {
    extensions: (!isCosmos) ? [
      new OAuthExtension(),
    ] : [
      new OAuthExtension(),
      new CosmosExtension({
        // Magic has a strict cross-origin policy that restricts rpcs to whitelisted URLs,
        // so we can't use app.chain.meta?.node?.url
        rpcUrl: `${document.location.origin}/magicCosmosAPI/${app.chain.id}`
      }),
    ]
  });
}

export async function startLoginWithMagicLink({ email, provider, isCosmos }: {
  email?: string,
  provider?: string,
  isCosmos: boolean
}) {
  if (!email && !provider) throw new Error('Must provide email or SSO provider');
  const magic = await constructMagic(isCosmos);

  if (email) {
    // email-based login
    const bearer = await magic.auth.loginWithMagicLink({ email });
    const address = await handleSocialLoginCallback(bearer);
    return { bearer, address };
  } else {
    // provider-based login
    const address = await magic.oauth.loginWithRedirect({
      provider: provider as any,
      redirectURI: new URL('/finishsociallogin', window.location.origin).href,
    });
    debugger;
    // TODO: is this really the address?
    return { address };
  }
}

// Cannot get proper type due to code splitting
function getProfileMetadata({ provider, userInfo }): { username?: string, avatarUrl?: string } {
  // provider: result.oauth.provider (twitter, discord, github)
  if (provider === 'discord') {
    // for discord: result.oauth.userInfo.sources.https://discord.com/api/users/@me.username = name
    //   avatar: https://cdn.discordapp.com/avatars/<user id>/<avatar id>.png
    const { avatar, id, username } = userInfo.sources['https://discord.com/api/users/@me'];
    if (avatar) {
      const avatarUrl = `https://cdn.discordapp.com/avatars/${id}/${avatar}.png`;
      return { username, avatarUrl };
    } else {
      return { username };
    }
  } else if (provider === 'github') {
    // for github: result.oauth.userInfo.name / picture
    return { username: userInfo.name, avatarUrl: userInfo.picture };
  } else if (provider === 'twitter') {
    // for twitter: result.oauth.userInfo.name / profile
    return { username: userInfo.name, avatarUrl: userInfo.profile };
  } else if (provider === 'google') {
    return { username: userInfo.name, avatarUrl: userInfo.picture };
  }
  return {};
}

// Given a magic bearer token, generate a session key for the user, and (optionally) also log them in
export async function handleSocialLoginCallback(bearer?: string, onlyRevalidateSession: boolean): string {
  let profileMetadata: { username?: string, avatarUrl?: string } = {};

  const isCosmos = app.chain && app.chain.base === ChainBase.CosmosSDK; // TODO: This won't work for SSO
  const magic = await constructMagic(isCosmos);

  if (!bearer) {
    const result = await magic.oauth.getRedirectResult();
    profileMetadata = getProfileMetadata(result.oauth);
    bearer = result.magic.idToken;
    // console.log('Magic redirect result:', result);
  }

  const info = await magic.wallet.getInfo();
  const magicAddress = info.publicAddress;

  // Sign a session
  if (isCosmos) {
    // Not every chain prefix will succeed, so Magic defaults to osmo... as the Cosmos prefix
    const bech32Prefix = app.chain.meta.bech32Prefix;
    let chainAddress;
    try {
      chainAddress = await magic.cosmos.changeAddress(bech32Prefix);
    } catch (err) {
      console.error(
        `Error changing address to ${bech32Prefix}. Keeping default cosmos prefix and moving on. Error: ${err}`
      );
    }

    // Request the cosmos chain ID, since this is used by Magic to generate
    // the signed message. The API is already used by the Magic iframe,
    // but they don't expose the results.
    const nodeInfo = await $.get(`${document.location.origin}/magicCosmosAPI/${app.chain.id}/node_info`);
    const chainId = nodeInfo.node_info.network;

    const timestamp = +new Date();

    const signer = { signMessage: magic.cosmos.sign }
    const { signed, sessionPayload } = await signSessionWithMagic(ChainBase.CosmosSDK, signer, chainAddress, timestamp);
    // TODO: provide blockhash as last argument to signSessionWithMagic
    const signature = signed.signatures[0];
    signature.chain_id = chainId;
    await app.sessions.authSession(
      ChainBase.CosmosSDK, // not app.chain.base, since we don't know where the user is logging in
      chainBaseToCanvasChainId(ChainBase.CosmosSDK, bech32Prefix), // not the cosmos chain id, since that might change
      chainAddress,
      sessionPayload,
      JSON.stringify(signature),
    );
    if (onlyRevalidateSession) {
      return chainAddress;
    }
  } else {
    const { Web3Provider } = await import('@ethersproject/providers');
    const { utils } = await import('ethers');

    const provider = new Web3Provider(magic.rpcProvider);
    const signer = provider.getSigner();
    const checksumAddress = utils.getAddress(magicAddress); // get checksum-capitalized eth address

    const timestamp = +new Date();
    const { signed, sessionPayload } = await signSessionWithMagic(ChainBase.Ethereum, signer, checksumAddress, timestamp);
    // TODO: provide blockhash as last argument to signSessionWithMagic

    await app.sessions.authSession(
      ChainBase.Ethereum, // not app.chain.base, since we don't know where the user is logging in
      chainBaseToCanvasChainId(ChainBase.Ethereum, 1), // magic defaults to mainnet
      checksumAddress,
      sessionPayload,
      signed
    );
    if (onlyRevalidateSession) {
      return magicAddress;
    }
  }

  // Otherwise, skip Account.validate(), proceed directly to server login
  const response = await $.post({
    url: `${app.serverUrl()}/auth/magic`,
    headers: {
      Authorization: `Bearer ${bearer}`,
    },
    xhrFields: {
      withCredentials: true,
    },
    data: {
      chain: app.activeChainId(),
      jwt: app.user.jwt,
      username: profileMetadata?.username,
      avatarUrl: profileMetadata?.avatarUrl,
    },
  });

  if (response.status === 'Success') {
    await initAppState(false);
    if (app.chain) {
      const c = app.user.selectedChain
        ? app.user.selectedChain
        : app.config.chains.getById(app.activeChainId());
      await updateActiveAddresses({ chain: c });
    }
    return magicAddress;
  } else {
    throw new Error(`Social auth unsuccessful: ${response.status}`);
  }
}
