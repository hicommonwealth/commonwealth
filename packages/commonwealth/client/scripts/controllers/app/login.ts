/**
 * @file Manages logged-in user accounts and local storage.
 */
import { SIWESigner } from '@canvas-js/chain-ethereum';
import { Session } from '@canvas-js/interfaces';

import { getEvmAddress } from '@hicommonwealth/evm-protocols';
import {
  ExtendedCommunity,
  GetStatus,
  MagicLogin,
} from '@hicommonwealth/schemas';
import {
  CANVAS_TOPIC,
  ChainBase,
  WalletSsoSource,
  chainBaseToCanvasChainId,
  getSessionSigners,
  serializeCanvas,
} from '@hicommonwealth/shared';
import { CosmosExtension } from '@magic-ext/cosmos';
import { FarcasterExtension } from '@magic-ext/farcaster';
import { OAuthExtension } from '@magic-ext/oauth';
import { OAuthExtension as OAuthExtensionV2 } from '@magic-ext/oauth2';
import axios from 'axios';
import { notifyError } from 'controllers/app/notifications';
import { getMagicCosmosSessionSigner } from 'controllers/server/sessions';
import { isSameAccount } from 'helpers';
import { Magic } from 'magic-sdk';
import moment from 'moment';
import app, { initAppState } from 'state';
import { getCommunityByIdQuery } from 'state/api/communities/getCommuityById';
import { SERVER_URL } from 'state/api/config';
import { welcomeOnboardModal } from 'state/ui/modals/welcomeOnboardModal';
import { userStore } from 'state/ui/user';
import { z } from 'zod';
import Account from '../../models/Account';
import AddressInfo from '../../models/AddressInfo';
import {
  fetchCachedCustomDomain,
  fetchCachedPublicEnvVar,
} from '../../state/api/configuration/index';

function storeActiveAccount(account: Account) {
  const user = userStore.getState();
  user.setData({ activeAccount: account });
  !user.accounts.some((a) => isSameAccount(a, account)) &&
    user.setData({ accounts: [...user.accounts, account] });
}

export async function setActiveAccount(account: Account): Promise<void> {
  try {
    storeActiveAccount(account);
  } catch (err) {
    // Failed to set the user's active address to this account.
    // This might be because this address isn't `verified`,
    // so we don't show an error here.
    console.error(err?.response?.data?.error || err?.message);
    notifyError('Could not set active account');
  }
}

export async function completeClientLogin(account: Account) {
  try {
    const user = userStore.getState();

    let addressInfo = user.addresses.find(
      (a) =>
        a.address === account.address &&
        a.community.id === account.community.id,
    );

    if (!addressInfo && account.addressId) {
      addressInfo = new AddressInfo({
        userId: user.id,
        id: account.addressId,
        address: account.address,
        community: account.community,
        walletId: account.walletId,
        walletSsoSource: account.walletSsoSource,
      });
      user.addresses.push(addressInfo);
    }

    // set the address as active
    await setActiveAccount(account);
  } catch (e) {
    console.trace(e);
  }
}

export async function updateActiveAddresses(chainId: string) {
  // update addresses for a chain (if provided) or for communities (if null)
  // for communities, addresses on all chains are available by default
  userStore.getState().setData({
    accounts: userStore
      .getState()
      .addresses.filter((a) => a.community.id === chainId)
      .map((addr) => {
        const tempAddr = app.chain?.accounts.get(addr.address, false);
        tempAddr.profile = addr.profile;
        tempAddr.lastActive = addr.lastActive;
        return tempAddr;
      })
      .filter((addr) => addr),
  });

  // select the address that the new chain should be initialized with
  const memberAddresses = userStore.getState().accounts.filter((account) => {
    return account.community.id === chainId;
  });

  if (memberAddresses.length === 1) {
    // one member address - start the community with that address
    await setActiveAccount(memberAddresses[0]);
  } else if (userStore.getState().accounts.length === 0) {
    // no addresses - preview the community
  } else {
    // Find all addresses in the current community for this account, sorted by last used date/time
    const communityAddressesSortedByLastUsed = [
      ...(userStore
        .getState()
        .addresses.filter((a) => a.community.id === chainId) || []),
    ].sort((a, b) => {
      if (b.lastActive && a.lastActive) return b.lastActive.diff(a.lastActive);
      if (!b.lastActive && !a.lastActive) return 0; // no change
      if (!b.lastActive) return -1; // move b towards end
      return 1; // move a towards end
    });

    // From the sorted adddress in the current community, find an address which has an active session key
    let foundAddressWithActiveSessionKey: AddressInfo | null = null;

    const sessionSigners = getSessionSigners();
    for (const communityAccount of communityAddressesSortedByLastUsed) {
      const matchedSessionSigner = sessionSigners.find((sessionSigner) =>
        sessionSigner.match(communityAccount.address),
      );
      if (!matchedSessionSigner) {
        continue;
      }

      const session = await matchedSessionSigner.getSession(CANVAS_TOPIC, {
        address: communityAccount.address,
      });

      if (session !== null) {
        foundAddressWithActiveSessionKey = communityAccount;
        break;
      }
    }

    // Use the address which has an active session key, if there is none then use the most recently used address
    const addressToUse =
      foundAddressWithActiveSessionKey || communityAddressesSortedByLastUsed[0];

    if (addressToUse) {
      const account = userStore.getState().accounts.find((a) => {
        return (
          a.community.id === addressToUse.community.id &&
          a.address === addressToUse.address
        );
      });
      if (account) await setActiveAccount(account);
    }
  }
}

// called from the server, which returns public keys
export function updateActiveUser(data?: z.infer<(typeof GetStatus)['output']>) {
  const user = userStore.getState();

  if (!data) {
    user.setData({
      id: 0,
      email: '',
      emailNotificationInterval: '',
      knockJWT: '',
      addresses: [],
      communities: [],
      accounts: [],
      activeAccount: null,
      jwt: null,
      isSiteAdmin: false,
      isEmailVerified: false,
      isPromotionalEmailEnabled: false,
      isWelcomeOnboardFlowComplete: false,
      isLoggedIn: false,
      referredByAddress: undefined,
      xpPoints: 0,
      xpReferrerPoints: 0,
      notifyUserNameChange: false,
    });
  } else {
    const addresses = data.addresses.map((a) => {
      // Map the oauth_provider string to WalletSsoSource enum
      const ssoSource = a.oauth_provider
        ? (a.oauth_provider as WalletSsoSource)
        : undefined;

      return new AddressInfo({
        userId: user.id,
        id: a.id,
        address: a.address,
        community: {
          id: a.Community.id,
          base: a.Community.base,
          ss58Prefix: a.Community.ss58_prefix || undefined,
        },
        walletId: a.wallet_id,
        ghostAddress: a.ghost_address || undefined,
        lastActive: a.last_active ? moment(a.last_active) : undefined,
        walletSsoSource: ssoSource,
      });
    });

    user.setData({
      id: data.id || 0,
      email: data.email || '',
      emailNotificationInterval: data.emailNotificationInterval || '',
      knockJWT: data.knockJwtToken || '',
      addresses,
      jwt: data.jwt || null,
      // add boolean values as boolean -- not undefined
      isSiteAdmin: !!data.isAdmin,
      isEmailVerified: !!data.emailVerified,
      isPromotionalEmailEnabled: !!data.promotional_emails_enabled,
      isWelcomeOnboardFlowComplete: !!data.is_welcome_onboard_flow_complete,
      communities: (data?.communities || []).map((c) => ({
        id: c.id || '',
        iconUrl: c.icon_url || '',
        name: c.name || '',
        isStarred: !!c.starred_at,
      })),
      isLoggedIn: true,
      xpPoints: data.xp_points || undefined,
      referredByAddress: data.referred_by_address || undefined,
      xpReferrerPoints: data.xp_referrer_points || undefined,
      tier: data.tier || undefined,
      notifyUserNameChange: data.notify_user_name_change || false,
    });
  }
}

async function constructMagic(isCosmos: boolean, chain?: string) {
  if (isCosmos && !chain) {
    throw new Error('Must be in a community to sign in with Cosmos magic link');
  }

  const { MAGIC_PUBLISHABLE_KEY } = fetchCachedPublicEnvVar() || {};

  if (!MAGIC_PUBLISHABLE_KEY) {
    throw new Error('Missing magic key');
  }

  let extensions: (
    | OAuthExtension
    | OAuthExtensionV2
    | FarcasterExtension
    | CosmosExtension
  )[] = [];

  if (isCosmos) {
    extensions = [
      new OAuthExtension(),
      new OAuthExtensionV2(),
      new CosmosExtension({
        // Magic has a strict cross-origin policy that restricts rpcs to whitelisted URLs,
        // so we can't use app.chain.meta?.node?.url
        rpcUrl: `${document.location.origin}${SERVER_URL}/magicCosmosProxy/${chain}`,
      }),
    ];
  } else {
    extensions = [
      new FarcasterExtension(),
      new OAuthExtension(),
      new OAuthExtensionV2(),
    ];
  }

  return new Magic(MAGIC_PUBLISHABLE_KEY, {
    extensions,
  });
}

export async function startLoginWithMagicLink({
  email,
  phoneNumber,
  provider,
  chain,
  isCosmos,
  referrer_address,
}: {
  email?: string;
  phoneNumber?: string;
  provider?: WalletSsoSource;
  chain?: string;
  isCosmos: boolean;
  referrer_address?: string;
}) {
  if (!email && !phoneNumber && !provider)
    throw new Error('Must provide email or SMS or SSO provider');

  const { isCustomDomain } = fetchCachedCustomDomain() || {};
  const magic = await constructMagic(isCosmos, chain);

  if (email) {
    // email-based login
    const bearer = await magic.auth.loginWithMagicLink({ email });
    const { address } = await handleSocialLoginCallback({
      bearer,
      walletSsoSource: WalletSsoSource.Email,
      referrer_address,
    });

    return { bearer, address };
  } else if (provider === WalletSsoSource.Farcaster) {
    const bearer = await magic.farcaster.login();

    const { address } = await handleSocialLoginCallback({
      bearer,
      walletSsoSource: WalletSsoSource.Farcaster,
      referrer_address,
    });

    return { bearer, address };
  } else if (phoneNumber) {
    const bearer = await magic.auth.loginWithSMS({
      phoneNumber,
      showUI: true,
    });

    const { address } = await handleSocialLoginCallback({
      bearer,
      walletSsoSource: WalletSsoSource.SMS,
      referrer_address,
    });

    return { bearer, address };
  } else {
    localStorage.setItem('magic_provider', provider!);
    localStorage.setItem('magic_chain', chain!);
    localStorage.setItem('magic_redirect_to', window.location.href);

    if (isCustomDomain) {
      const redirectTo = document.location.pathname + document.location.search;
      const params = `?redirectTo=${
        redirectTo ? encodeURIComponent(redirectTo) : ''
      }&chain=${chain || ''}&sso=${provider}`;

      await magic.oauth.loginWithRedirect({
        provider,
        redirectURI: createRedirectURI(params),
        options: {
          // prompt forces Google to show the account picker.
          prompt: 'select_account',
        },
      });
    } else {
      await magic.oauth2.loginWithRedirect({
        provider,
        redirectURI: createRedirectURI(),
        options: {
          // prompt forces Google to show the account picker.
          prompt: 'select_account',
        },
      });
    }

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
    const { avatar, id, username } = userInfo;
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
  isCustomDomain,
  referrer_address,
}: {
  bearer?: string | null;
  chain?: string;
  walletSsoSource: WalletSsoSource;
  isCustomDomain?: boolean;
  referrer_address?: string;
}): Promise<{ address: string }> {
  // desiredChain may be empty if social login was initialized from
  // a page without a chain, in which case we default to an eth login
  let desiredChain = app.chain?.meta;
  if (!desiredChain && chain) {
    const communityInfo = await getCommunityByIdQuery(chain || '', true);
    desiredChain = communityInfo as unknown as z.infer<
      typeof ExtendedCommunity
    >;
  }
  const isCosmos = desiredChain?.base === ChainBase.CosmosSDK;
  const magic = await constructMagic(isCosmos, desiredChain?.id);

  let magicOauthRes;

  // Code up to this line might run multiple times because of extra calls to useEffect().
  // Those runs will be rejected because getRedirectResult purges the browser search param.
  let profileMetadata, magicAddress;
  if (
    walletSsoSource === WalletSsoSource.Email ||
    walletSsoSource === WalletSsoSource.Farcaster ||
    walletSsoSource === WalletSsoSource.SMS
  ) {
    const metadata = await magic.user.getMetadata();
    profileMetadata = { username: null };

    if (isCosmos) {
      magicAddress = metadata.publicAddress;
    } else {
      if (metadata.publicAddress === null) {
        throw new Error('Expected magic to return publicAddress');
      }
      magicAddress = getEvmAddress(metadata.publicAddress);
    }
  } else {
    magicOauthRes = isCustomDomain
      ? await magic.oauth.getRedirectResult()
      : await magic.oauth2.getRedirectResult();

    if (!bearer) {
      console.log('No bearer token found in magic redirect result');
      // eslint-disable-next-line no-param-reassign
      bearer = magicOauthRes.magic.idToken;
      console.log('Magic redirect result:', magicOauthRes);
    }
    // Get magic metadata
    profileMetadata = getProfileMetadata(magicOauthRes.oauth);
    if (isCosmos) {
      magicAddress = magicOauthRes.magic.userMetadata.publicAddress;
    } else {
      magicAddress = getEvmAddress(
        magicOauthRes.magic.userMetadata.publicAddress,
      );
    }
  }

  let session: Session | null = null;
  try {
    // Sign a session
    if (isCosmos && desiredChain) {
      // eslint-disable-next-line
      const signer = { signMessage: (magic as unknown as any).cosmos.sign };
      const prefix = app.chain?.meta?.bech32_prefix || 'cosmos';
      const canvasChainId = chainBaseToCanvasChainId(
        ChainBase.CosmosSDK,
        prefix,
      );
      const sessionSigner = getMagicCosmosSessionSigner(
        signer,
        magicAddress,
        canvasChainId,
      );
      let sessionObject = await sessionSigner.getSession(CANVAS_TOPIC);
      if (!sessionObject) {
        sessionObject = await sessionSigner.newSession(CANVAS_TOPIC);
      }
      session = sessionObject?.payload;

      console.log(
        'Reauthenticated Cosmos session from magic address:',
        magicAddress,
      );
    } else {
      const { Web3Provider } = await import('@ethersproject/providers');

      const provider = new Web3Provider(magic.rpcProvider);
      const signer = provider.getSigner();
      const checksumAddress = getEvmAddress(magicAddress); // get checksum-capitalized eth address

      const sessionSigner = new SIWESigner({
        signer,
        chainId: app.chain?.meta?.ChainNode?.eth_chain_id || 1,
      });
      let sessionObject = await sessionSigner.getSession(CANVAS_TOPIC);
      if (!sessionObject) {
        sessionObject = await sessionSigner.newSession(CANVAS_TOPIC);
      }
      session = sessionObject.payload;
      console.log(
        'Reauthenticated Ethereum session from magic address:',
        checksumAddress,
      );
    }
  } catch (err) {
    // if session auth fails, do nothing
    console.log('Magic session auth failed', err);
  }

  // Otherwise, skip Account.validate(), proceed directly to server login
  let response;
  const data: z.infer<typeof MagicLogin> = {
    community_id: desiredChain?.id,
    access_token: magicOauthRes?.oauth?.accessToken,
    jwt: userStore.getState().jwt,
    username: profileMetadata?.username,
    avatarUrl: profileMetadata?.avatarUrl,
    magicAddress,
    session: session && serializeCanvas(session),
    walletSsoSource,
    referrer_address,
  };

  try {
    response = await axios.post(`${SERVER_URL}/auth/magic`, data, {
      withCredentials: true,
      headers: {
        Authorization: `Bearer ${bearer}`,
      },
    });
  } catch (e) {
    notifyError(e.response.data.error);
  }

  if (response.data.status === 'Success') {
    await initAppState(false);
    // This is code from before desiredChain was implemented, and
    // may not be necessary anymore:
    if (app.chain) {
      let chainInfo = userStore.getState().activeCommunity;

      if (!chainInfo && chain) {
        const communityInfo = await getCommunityByIdQuery(chain || '', true);
        chainInfo = communityInfo as unknown as z.infer<
          typeof ExtendedCommunity
        >;
      }

      chainInfo && (await updateActiveAddresses(chainInfo.id || ''));
    }

    const { Profiles: profiles } = response.data.result;

    // if account is newly created and user has not completed onboarding flow
    // then open the welcome modal.
    const userId = profiles?.[0]?.id;
    if (userId && !userStore.getState().isWelcomeOnboardFlowComplete) {
      setTimeout(() => {
        welcomeOnboardModal.getState().setIsWelcomeOnboardModalOpen(true);
      }, 1000);
    }

    return { address: magicAddress };
  } else {
    throw new Error(`Social auth unsuccessful: ${response.status}`);
  }
}

function createRedirectURI(params: string = '') {
  const url = new URL('/finishsociallogin' + params, window.location.origin);
  return url.href;
}
