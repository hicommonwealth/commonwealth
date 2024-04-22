/**
 * @file Manages logged-in user accounts and local storage.
 */
import { ChainBase, WalletId, WalletSsoSource } from '@hicommonwealth/shared';
import { chainBaseToCanvasChainId } from 'canvas/chainMappings';
import { notifyError } from 'controllers/app/notifications';
import { getMagicCosmosSessionSigner } from 'controllers/server/sessions';
import { isSameAccount } from 'helpers';

import { getSessionSigners } from 'shared/canvas/verify';
import { initAppState } from 'state';

import { SIWESigner } from '@canvas-js/chain-ethereum';
import { Session } from '@canvas-js/interfaces';
import { encode, stringify } from '@ipld/dag-json';
import { CosmosExtension } from '@magic-ext/cosmos';
import { OAuthExtension } from '@magic-ext/oauth';
import { Magic } from 'magic-sdk';
import { CANVAS_TOPIC } from 'shared/canvas';

import axios from 'axios';
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
  return axios.post(`${app.serverUrl()}/linkExistingAddressToCommunity`, {
    address,
    community_id: community,
    originChain, // not used
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
    const response = await axios.post(`${app.serverUrl()}/setDefaultRole`, {
      address: account.address,
      author_community_id: account.community.id,
      community_id: community,
      jwt: app.user.jwt,
      auth: true,
    });

    app.roles.getAllRolesInCommunity({ community }).forEach((r) => {
      r.is_user_default = false;
    });
    role.is_user_default = true;

    if (response.data.status !== 'Success') {
      throw Error(`Unsuccessful status: ${response.status}`);
    }
  } catch (err) {
    console.error(err?.response.data.error || err?.message);
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
        communityId: account.community.id,
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
      .map((addr) => {
        const tempAddr = app.chain?.accounts.get(
          addr.address,
          addr.keytype,
          false,
        );
        tempAddr.profile = addr.profile;
        tempAddr.lastActive = addr.lastActive;
        return tempAddr;
      })
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
    // Find all addresses in the current community for this account, sorted by last used date/time
    const communityAddressesSortedByLastUsed = [
      ...(app.user.addresses.filter((a) => a.community.id === chain.id) || []),
    ].sort((a, b) => b.lastActive.diff(a.lastActive));

    // From the sorted adddress in the current community, find an address which has an active session key
    let foundAddressWithActiveSessionKey = null;

    const sessionSigners = getSessionSigners();
    for (const communityAccount of communityAddressesSortedByLastUsed) {
      const matchedSessionSigner = sessionSigners.find((sessionSigner) =>
        sessionSigner.match(communityAccount.address),
      );
      if (!matchedSessionSigner) {
        continue;
      }
      let hasSession = false;
      try {
        await matchedSessionSigner.getCachedSession(
          CANVAS_TOPIC,
          communityAccount.address,
        );
        hasSession = true;
      } catch (e) {
        // do nothing
      }
      if (hasSession) {
        foundAddressWithActiveSessionKey = communityAccount;
        break;
      }
    }

    // Use the address which has an active session key, if there is none then use the most recently used address
    const addressToUse =
      foundAddressWithActiveSessionKey || communityAddressesSortedByLastUsed[0];

    if (addressToUse) {
      const account = app.user.activeAccounts.find((a) => {
        return (
          a.community.id === addressToUse.community.id &&
          a.address === addressToUse.address
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
            communityId: a.community_id,
            keytype: a.keytype,
            walletId: a.wallet_id,
            walletSsoSource: a.wallet_sso_source,
            ghostAddress: a.ghost_address,
            lastActive: a.last_active,
          }),
      ),
    );

    app.user.setSiteAdmin(data.isAdmin);
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
  const response = await axios.post(`${app.serverUrl()}/createAddress`, {
    address,
    community_id: chain,
    jwt: app.user.jwt,
    wallet_id: walletId,
    wallet_sso_source: walletSsoSource,
    block_info: validationBlockInfo
      ? JSON.stringify(validationBlockInfo)
      : null,
  });

  const id = response.data.result.id;
  const chainInfo = app.config.chains.getById(chain);
  const account = new Account({
    addressId: id,
    address,
    community: chainInfo,
    validationToken: response.data.result.verification_token,
    walletId,
    sessionPublicAddress: sessionPublicAddress,
    validationBlockInfo: response.data.result.block_info,
    ignoreProfile: false,
  });
  return {
    account,
    newlyCreated: response.data.result.newly_created,
    joinedCommunity: response.data.result.joined_community,
  };
}

async function constructMagic(isCosmos: boolean, chain?: string) {
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
    const address = await handleSocialLoginCallback({
      bearer,
      walletSsoSource: WalletSsoSource.Email,
    });
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
}: {
  bearer?: string;
  chain?: string;
  walletSsoSource?: string;
}): Promise<string> {
  // desiredChain may be empty if social login was initialized from
  // a page without a chain, in which case we default to an eth login
  const desiredChain = app.chain?.meta || app.config.chains.getById(chain);
  const isCosmos = desiredChain?.base === ChainBase.CosmosSDK;
  const magic = await constructMagic(isCosmos, desiredChain?.id);
  const isEmail = walletSsoSource === WalletSsoSource.Email;

  // Code up to this line might run multiple times because of extra calls to useEffect().
  // Those runs will be rejected because getRedirectResult purges the browser search param.
  let profileMetadata, magicAddress;
  if (isEmail) {
    const metadata = await magic.user.getMetadata();
    profileMetadata = { username: null };

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

  let session: Session;
  try {
    // Sign a session
    if (isCosmos && desiredChain) {
      const signer = { signMessage: magic.cosmos.sign };
      const prefix = app.chain?.meta.bech32Prefix || 'cosmos';
      const canvasChainId = chainBaseToCanvasChainId(
        ChainBase.CosmosSDK,
        prefix,
      );
      const sessionSigner = await getMagicCosmosSessionSigner(
        signer,
        magicAddress,
        canvasChainId,
      );
      session = await sessionSigner.getSession(CANVAS_TOPIC);

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

      const sessionSigner = new SIWESigner({
        signer,
        chainId: app.chain?.meta.node?.ethChainId || 1,
      });
      // TODO: provide blockhash
      session = await sessionSigner.getSession(CANVAS_TOPIC);
      console.log(
        'Reauthenticated Ethereum session from magic address:',
        checksumAddress,
      );
    }
  } catch (err) {
    // if session auth fails, do nothing
  }

  // Otherwise, skip Account.validate(), proceed directly to server login
  const response = await axios.post(
    `${app.serverUrl()}/auth/magic`,
    {
      data: {
        community_id: desiredChain?.id,
        jwt: app.user.jwt,
        username: profileMetadata?.username,
        avatarUrl: profileMetadata?.avatarUrl,
        magicAddress,
        session: stringify(encode(session)),
        walletSsoSource,
      },
    },
    {
      withCredentials: true,
      headers: {
        Authorization: `Bearer ${bearer}`,
      },
    },
  );

  if (response.data.status === 'Success') {
    await initAppState(false);
    // This is code from before desiredChain was implemented, and
    // may not be necessary anymore:
    if (app.chain) {
      const c = app.user.selectedCommunity
        ? app.user.selectedCommunity
        : app.config.chains.getById(app.activeChainId());
      await updateActiveAddresses({ chain: c });
    }
    return magicAddress;
  } else {
    throw new Error(`Social auth unsuccessful: ${response.status}`);
  }
}
