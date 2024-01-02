/**
 * @file Manages logged-in user accounts and local storage.
 */
import { ChainBase, WalletId, WalletSsoSource } from '@hicommonwealth/core';
import { chainBaseToCanvasChainId } from 'canvas/chainMappings';
import { notifyError } from 'controllers/app/notifications';
import { signSessionWithMagic } from 'controllers/server/sessions';
import { isSameAccount } from 'helpers';
import $ from 'jquery';
import { initAppState } from 'state';

import app from 'state';
import Account from '../../models/Account';
import AddressInfo from '../../models/AddressInfo';
import type BlockInfo from '../../models/BlockInfo';
import type ChainInfo from '../../models/ChainInfo';

export function linkExistingAddressToChainOrCommunity(
  address: string,
  community: string,
  originChain: string,
) {
  return $.post(`${app.serverUrl()}/linkExistingAddressToChain`, {
    address,
    chain: community,
    originChain,
    jwt: app.user.jwt,
  });
}

export async function setActiveAccount(
  account: Account,
  shouldRedraw = true,
): Promise<void> {
  const community = app.activeChainId();
  const role = app.roles.getRoleInCommunity({ account, community });

  if (!role) {
    app.user.ephemerallySetActiveAccount(account);
    if (
      app.user.activeAccounts.filter((a) => isSameAccount(a, account))
        .length === 0
    ) {
      app.user.setActiveAccounts(
        app.user.activeAccounts.concat([account]),
        shouldRedraw,
      );
    }

    // HOT FIX: https://github.com/hicommonwealth/commonwealth/issues/4177
    // Emit a force re-render on cosmos chains to make sure
    // that app.user.activeAccount is set - this is required for many actions
    // There is a race condition b/w the app accessing app.user.activeAccount
    // and updating it. A proper solution would be to fix this race condition
    // for cosmos chains - since the issue happens only on that chain
    if (app.chain.base === 'cosmos') {
      app.loginStateEmitter.emit('redraw');
    }

    return;
  }

  try {
    const response = await $.post(`${app.serverUrl()}/setDefaultRole`, {
      address: account.address,
      author_chain: account.community.id,
      chain: community,
      jwt: app.user.jwt,
      auth: true,
    });

    app.roles.getAllRolesInCommunity({ community }).forEach((r) => {
      r.is_user_default = false;
    });
    role.is_user_default = true;

    if (response.status !== 'Success') {
      throw Error(`Unsuccessful status: ${response.status}`);
    }
  } catch (err) {
    console.log(err);
    notifyError('Could not set active account');
  }

  app.user.ephemerallySetActiveAccount(account);
  if (
    app.user.activeAccounts.filter((a) => isSameAccount(a, account)).length ===
    0
  ) {
    app.user.setActiveAccounts(
      app.user.activeAccounts.concat([account]),
      shouldRedraw,
    );
  }
}

export async function completeClientLogin(account: Account) {
  try {
    let addressInfo = app.user.addresses.find(
      (a) =>
        a.address === account.address &&
        a.community.id === account.community.id,
    );

    if (!addressInfo && account.addressId) {
      addressInfo = new AddressInfo({
        id: account.addressId,
        address: account.address,
        chainId: account.community.id,
        walletId: account.walletId,
        walletSsoSource: account.walletSsoSource,
      });
      app.user.addresses.push(addressInfo);
    }

    // link the address to the community
    if (app.chain) {
      try {
        if (
          !app.roles.getRoleInCommunity({
            account,
            community: app.activeChainId(),
          })
        ) {
          await app.roles.createRole({
            address: addressInfo,
            community: app.activeChainId(),
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
      .filter((a) => a.community.id === chain.id)
      .map((addr) => app.chain?.accounts.get(addr.address, addr.keytype, false))
      .filter((addr) => addr),
    shouldRedraw,
  );

  // select the address that the new chain should be initialized with
  const memberAddresses = app.user.activeAccounts.filter((account) => {
    return app.roles.isMember({ community: chain.id, account });
  });

  if (memberAddresses.length === 1) {
    // one member address - start the community with that address
    await setActiveAccount(memberAddresses[0], shouldRedraw);
  } else if (app.user.activeAccounts.length === 0) {
    // no addresses - preview the community
  } else {
    const existingAddress = app.roles.getDefaultAddressInCommunity({
      community: chain.id,
    });

    if (existingAddress) {
      const account = app.user.activeAccounts.find((a) => {
        return (
          a.community.id === existingAddress.community.id &&
          a.address === existingAddress.address
        );
      });
      if (account) await setActiveAccount(account, shouldRedraw);
    }
  }
}

// called from the server, which returns public keys
export function updateActiveUser(data) {
  if (!data || data.loggedIn === false) {
    app.user.setEmail(null);
    app.user.setEmailInterval(null);
    app.user.setEmailVerified(null);
    app.user.setJWT(null);

    app.user.setAddresses([]);

    app.user.setSiteAdmin(false);
    app.user.setDisableRichText(false);
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
          new AddressInfo({
            id: a.id,
            address: a.address,
            chainId: a.community_id,
            keytype: a.keytype,
            walletId: a.wallet_id,
            walletSsoSource: a.wallet_sso_source,
            ghostAddress: a.ghost_address,
          }),
      ),
    );

    app.user.setSiteAdmin(data.isAdmin);
    app.user.setDisableRichText(data.disableRichText);
    app.user.setUnseenPosts(data.unseenPosts);
  }
}

export async function createUserWithAddress(
  address: string,
  walletId: WalletId,
  walletSsoSource: WalletSsoSource,
  chain: string,
  sessionPublicAddress?: string,
  validationBlockInfo?: BlockInfo,
): Promise<{
  account: Account;
  newlyCreated: boolean;
  joinedCommunity: boolean;
}> {
  const response = await $.post(`${app.serverUrl()}/createAddress`, {
    address,
    chain,
    jwt: app.user.jwt,
    wallet_id: walletId,
    wallet_sso_source: walletSsoSource,
    block_info: validationBlockInfo
      ? JSON.stringify(validationBlockInfo)
      : null,
  });
  const id = response.result.id;
  const chainInfo = app.config.chains.getById(chain);
  const account = new Account({
    addressId: id,
    address,
    community: chainInfo,
    validationToken: response.result.verification_token,
    walletId,
    sessionPublicAddress: sessionPublicAddress,
    validationBlockInfo: response.result.block_info,
    ignoreProfile: false,
  });
  return {
    account,
    newlyCreated: response.result.newly_created,
    joinedCommunity: response.result.joined_community,
  };
}

async function constructMagic(isCosmos: boolean, chain?: string) {
  const { Magic } = await import('magic-sdk');
  const { OAuthExtension } = await import('@magic-ext/oauth');
  const { CosmosExtension } = await import('@magic-ext/cosmos');

  if (isCosmos && !chain) {
    throw new Error('Must be in a community to sign in with Cosmos magic link');
  }

  return new Magic(process.env.MAGIC_PUBLISHABLE_KEY, {
    extensions: !isCosmos
      ? [new OAuthExtension()]
      : [
          new OAuthExtension(),
          new CosmosExtension({
            // Magic has a strict cross-origin policy that restricts rpcs to whitelisted URLs,
            // so we can't use app.chain.meta?.node?.url
            rpcUrl: `${document.location.origin}/magicCosmosAPI/${chain}`,
            // rpcUrl: app.chain?.meta?.node?.url || app.config.chains.getById('osmosis').node.url,
          }),
        ],
  });
}

export async function startLoginWithMagicLink({
  email,
  provider,
  redirectTo,
  chain,
  isCosmos,
}: {
  email?: string;
  provider?: WalletSsoSource;
  redirectTo?: string;
  chain?: string;
  isCosmos: boolean;
}) {
  if (!email && !provider)
    throw new Error('Must provide email or SSO provider');
  const magic = await constructMagic(isCosmos, chain);

  if (email) {
    // email-based login
    const bearer = await magic.auth.loginWithMagicLink({ email });
    const address = await handleSocialLoginCallback({ bearer, isEmail: true });
    return { bearer, address };
  } else {
    const params = `?redirectTo=${
      redirectTo ? encodeURIComponent(redirectTo) : ''
    }&chain=${chain || ''}&sso=${provider}`;
    await magic.oauth.loginWithRedirect({
      provider: provider as any,
      redirectURI: new URL(
        '/finishsociallogin' + params,
        window.location.origin,
      ).href,
    });

    // magic should redirect away from this page, but we return after 5 sec if it hasn't
    await new Promise<void>((resolve) => setTimeout(() => resolve(), 5000));
    const info = await magic.user.getInfo();
    return { address: info.publicAddress };
  }
}

// Cannot get proper type due to code splitting
function getProfileMetadata({ provider, userInfo }): {
  username?: string;
  avatarUrl?: string;
} {
  // provider: result.oauth.provider (twitter, discord, github)
  if (provider === 'discord') {
    // for discord: result.oauth.userInfo.sources.https://discord.com/api/users/@me.username = name
    //   avatar: https://cdn.discordapp.com/avatars/<user id>/<avatar id>.png
    const { avatar, id, username } =
      userInfo.sources['https://discord.com/api/users/@me'];
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
export async function handleSocialLoginCallback({
  bearer,
  chain,
  walletSsoSource,
  isEmail,
}: {
  bearer?: string;
  chain?: string;
  walletSsoSource?: string;
  isEmail?: boolean;
}): Promise<string> {
  // desiredChain may be empty if social login was initialized from
  // a page without a chain, in which case we default to an eth login
  const desiredChain = app.chain?.meta || app.config.chains.getById(chain);
  const isCosmos = desiredChain?.base === ChainBase.CosmosSDK;
  const magic = await constructMagic(isCosmos, desiredChain?.id);

  // Code up to this line might run multiple times because of extra calls to useEffect().
  // Those runs will be rejected because getRedirectResult purges the browser search param.
  let profileMetadata, magicAddress;
  if (isEmail) {
    const metadata = await magic.user.getMetadata();
    profileMetadata = { username: metadata.email };

    if (isCosmos) {
      magicAddress = metadata.publicAddress;
    } else {
      const { utils } = await import('ethers');
      magicAddress = utils.getAddress(metadata.publicAddress);
    }
  } else {
    const result = await magic.oauth.getRedirectResult();

    if (!bearer) {
      bearer = result.magic.idToken;
      console.log('Magic redirect result:', result);
    }
    // Get magic metadata
    profileMetadata = getProfileMetadata(result.oauth);
    if (isCosmos) {
      magicAddress = result.magic.userMetadata.publicAddress;
    } else {
      const { utils } = await import('ethers');
      magicAddress = utils.getAddress(result.magic.userMetadata.publicAddress);
    }
  }

  let authedSessionPayload, authedSignature;
  try {
    // Sign a session
    if (isCosmos && desiredChain) {
      // Not every chain prefix will succeed, so Magic defaults to osmo... as the Cosmos prefix
      const bech32Prefix = desiredChain.bech32Prefix;
      try {
        magicAddress = await magic.cosmos.changeAddress(bech32Prefix);
      } catch (err) {
        console.error(
          `Error changing address to ${bech32Prefix}. Keeping default cosmos prefix and moving on. Error: ${err}`,
        );
      }

      // Request the cosmos chain ID, since this is used by Magic to generate
      // the signed message. The API is already used by the Magic iframe,
      // but they don't expose the results.
      const nodeInfo = await $.get(
        `${document.location.origin}/magicCosmosAPI/${desiredChain.id}/node_info`,
      );
      const chainId = nodeInfo.node_info.network;

      const timestamp = +new Date();

      const signer = { signMessage: magic.cosmos.sign };
      const { signature, sessionPayload } = await signSessionWithMagic(
        ChainBase.CosmosSDK,
        signer,
        magicAddress,
        timestamp,
      );
      // TODO: provide blockhash as last argument to signSessionWithMagic
      signature.signatures[0].chain_id = chainId;
      await app.sessions.authSession(
        ChainBase.CosmosSDK, // could be desiredChain.base in the future?
        chainBaseToCanvasChainId(ChainBase.CosmosSDK, bech32Prefix), // not the cosmos chain id, since that might change
        magicAddress,
        sessionPayload,
        JSON.stringify(signature.signatures[0]),
      );
      authedSessionPayload = JSON.stringify(sessionPayload);
      authedSignature = JSON.stringify(signature.signatures[0]);
      console.log(
        'Reauthenticated Cosmos session from magic address:',
        magicAddress,
      );
    } else {
      const { Web3Provider } = await import('@ethersproject/providers');
      const { utils } = await import('ethers');

      const provider = new Web3Provider(magic.rpcProvider);
      const signer = provider.getSigner();
      const checksumAddress = utils.getAddress(magicAddress); // get checksum-capitalized eth address

      const timestamp = +new Date();
      const { signature, sessionPayload } = await signSessionWithMagic(
        ChainBase.Ethereum,
        signer,
        checksumAddress,
        timestamp,
      );
      // TODO: provide blockhash as last argument to signSessionWithMagic

      await app.sessions.authSession(
        ChainBase.Ethereum, // could be desiredChain.base in the future?
        chainBaseToCanvasChainId(ChainBase.Ethereum, 1), // magic defaults to mainnet
        checksumAddress,
        sessionPayload,
        signature,
      );
      authedSessionPayload = JSON.stringify(sessionPayload);
      authedSignature = signature;
      console.log(
        'Reauthenticated Ethereum session from magic address:',
        checksumAddress,
      );
    }
  } catch (err) {
    // if session auth fails, do nothing
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
      chain: desiredChain?.id,
      jwt: app.user.jwt,
      username: profileMetadata?.username,
      avatarUrl: profileMetadata?.avatarUrl,
      magicAddress,
      sessionPayload: authedSessionPayload,
      signature: authedSignature,
      walletSsoSource,
    },
  });

  if (response.status === 'Success') {
    await initAppState(false);
    // This is code from before desiredChain was implemented, and
    // may not be necessary anymore:
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
