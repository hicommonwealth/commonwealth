import type { Session } from '@canvas-js/interfaces';
import { logger, ServerError } from '@hicommonwealth/core';
import { Address, MagicLogin } from '@hicommonwealth/schemas';
import {
  ALL_COMMUNITIES,
  bumpUserTier,
  CANVAS_TOPIC,
  ChainBase,
  deserializeCanvas,
  getSessionSignerForDid,
  UserTierMap,
  WalletId,
  WalletSsoSource,
} from '@hicommonwealth/shared';
import { Magic, MagicUserMetadata, WalletType } from '@magic-sdk/admin';
import jsonwebtoken from 'jsonwebtoken';
import { MagicUser } from 'passport-magic';
import { Op, Transaction, WhereOptions } from 'sequelize';
import { z } from 'zod';
import { emitSignInEvents } from '../aggregates/user/signIn/emitSignInEvents';
import { config } from '../config';
import { models, sequelize } from '../database';
import { AddressAttributes, AddressInstance } from '../models/address';
import { CommunityInstance } from '../models/community';
import { UserInstance } from '../models/user';
import { getVerifiedUserInfo } from './oauth/getVerifiedUserInfo';
import { VerifiedUserInfo } from './oauth/types';

const log = logger(import.meta);

type MagicLoginContext = {
  decodedMagicToken: MagicUser;
  magicUserMetadata: MagicUserMetadata;
  generatedAddresses: Array<{ address: string; community_id: string }>;
  walletSsoSource: WalletSsoSource;
  accessToken?: string; // SSO access token returned by OAuth process
  existingUserInstance?: UserInstance | null;
  loggedInUser?: UserInstance | null;
  profileMetadata?: { username?: string | null; avatarUrl?: string | null };
  referrer_address?: string | null;
};

const DEFAULT_ETH_COMMUNITY_ID = 'ethereum';

type OauthInfo = {
  oauth_provider: WalletSsoSource;
  oauth_email: string | null;
  oauth_email_verified: boolean | null;
  oauth_username: string | null;
  oauth_phone_number: string | null;
};

async function getVerifiedInfo(
  magicUserMetadata: MagicUserMetadata,
  walletSsoSource: WalletSsoSource,
  accessToken?: string,
): Promise<OauthInfo> {
  let verifiedUserInfo: VerifiedUserInfo;
  try {
    verifiedUserInfo = await getVerifiedUserInfo({
      magicMetadata: magicUserMetadata,
      token: accessToken,
      walletSsoSource,
    });
  } catch (e) {
    log.error('Failed to fetch verified SSO user info', e as Error, {
      magicUserMetadata,
    });
    throw new ServerError('Could not verify user');
  }

  return {
    oauth_provider: verifiedUserInfo.provider,
    oauth_email: verifiedUserInfo.email || null,
    oauth_email_verified: verifiedUserInfo.email
      ? !!verifiedUserInfo.emailVerified
      : null,
    oauth_username: verifiedUserInfo.username || null,
    oauth_phone_number: verifiedUserInfo.phoneNumber || null,
  };
}

async function updateAddressesOauth(
  {
    oauth_provider,
    oauth_email,
    oauth_email_verified,
    oauth_username,
    oauth_phone_number,
  }: OauthInfo,
  addressInstance: z.infer<typeof Address>,
  transaction?: Transaction,
) {
  if (
    (oauth_provider && addressInstance.oauth_provider !== oauth_provider) ||
    (oauth_email && addressInstance.oauth_email !== oauth_email) ||
    (oauth_username && addressInstance.oauth_username !== oauth_username) ||
    (oauth_phone_number &&
      addressInstance.oauth_phone_number !== oauth_phone_number) ||
    (oauth_email_verified !== null &&
      addressInstance.oauth_email_verified !== oauth_email_verified)
  ) {
    await models.Address.update(
      {
        oauth_provider,
        oauth_email,
        oauth_username,
        oauth_phone_number,
        oauth_email_verified,
      },
      {
        where: {
          address: addressInstance.address,
          user_id: addressInstance.user_id,
        },
        transaction,
      },
    );
  }
}

async function bumpTier(
  user: UserInstance,
  verifiedInfo: OauthInfo,
  transaction?: Transaction,
) {
  if (
    !verifiedInfo.oauth_email ||
    (verifiedInfo.oauth_email && verifiedInfo.oauth_email_verified)
  ) {
    bumpUserTier({ newTier: UserTierMap.SocialVerified, targetObject: user });
    await user.save({ transaction });
  }
}

// Creates a trusted address in a community
async function createMagicAddressInstances({
  generatedAddresses,
  user,
  isNewUser,
  decodedMagicToken,
  magicUserMetadata,
  walletSsoSource,
  transaction,
  accessToken,
  oauthInfo,
}: {
  generatedAddresses: Array<{ address: string; community_id: string }>;
  user: UserInstance;
  isNewUser: boolean;
  decodedMagicToken: MagicUser;
  magicUserMetadata: MagicUserMetadata;
  walletSsoSource: WalletSsoSource;
  accessToken?: string;
  transaction?: Transaction;
  oauthInfo?: OauthInfo;
}): Promise<AddressInstance[]> {
  const addressInstances: AddressInstance[] = [];
  const user_id = user.id;

  const verifiedInfo =
    oauthInfo ||
    (await getVerifiedInfo(magicUserMetadata, walletSsoSource, accessToken));
  const {
    oauth_provider,
    oauth_email,
    oauth_username,
    oauth_phone_number,
    oauth_email_verified,
  } = verifiedInfo;
  await bumpTier(user, verifiedInfo, transaction);

  for (const { community_id, address } of generatedAddresses) {
    log.trace(`CREATING OR LOCATING ADDRESS ${address} IN ${community_id}`);
    const [addressInstance, created] = await models.Address.findOrCreate({
      where: {
        address,
        community_id,
        wallet_id: WalletId.Magic,
      },
      defaults: {
        address,
        community_id,
        user_id,
        verification_token: decodedMagicToken.claim.tid, // to prevent re-use
        verification_token_expires: null,
        verified: new Date(), // trust addresses from magic
        last_active: new Date(),
        role: 'member',
        ghost_address: false,
        is_banned: false,
        oauth_provider,
        oauth_email,
        oauth_username,
        oauth_phone_number,
        oauth_email_verified,
      },
      transaction,
    });

    if (created) {
      await emitSignInEvents({
        newAddress: true,
        newUser: isNewUser,
        transferredUser: false,
        address: addressInstance,
        user,
        transaction: transaction!,
      });
    }

    // case should not happen, but if somehow a to-be-created address is owned
    // by another user than the one logging in, we should throw an error, because that is an
    // invalid state (we may have failed to identify the logged in user correctly?)
    if (!created && addressInstance.user_id !== user_id) {
      log.error(
        `Address ${address} owned by ${user_id} found on user ${addressInstance.user_id}!`,
      );
      throw new ServerError('Address owned by somebody else!');
    }

    if (!created) {
      await updateAddressesOauth(verifiedInfo, addressInstance, transaction);
      // Update used magic token to prevent replay attacks
      addressInstance.verification_token = decodedMagicToken.claim.tid;

      await addressInstance.save({ transaction });
    }
    addressInstances.push(addressInstance);
  }
  return addressInstances;
}

// User is logged out + selects magic, and provides a new email. Create a new user for them.
async function createNewMagicUser({
  decodedMagicToken,
  magicUserMetadata,
  generatedAddresses,
  profileMetadata,
  accessToken,
  walletSsoSource,
  referrer_address,
}: MagicLoginContext): Promise<UserInstance> {
  const oauthInfo = await getVerifiedInfo(
    magicUserMetadata,
    walletSsoSource,
    accessToken,
  );

  // completely new user: create user, profile, addresses
  return sequelize.transaction(async (transaction) => {
    const newUser = await models.User.create(
      {
        // we rely ONLY on the address as a canonical piece of login information (discourse import aside)
        // so it is safe to set emails from magic as part of User data, even though they may be unverified.
        // although not usable for login, this email (used for outreach) is still considered sensitive user data.
        email: magicUserMetadata.email,

        // we mark email verified so that we are OK to send update emails, but we should note that
        // just because an email comes from magic doesn't mean it's legitimately owned by the signing-in
        // user, unless it's via the email flow (e.g. you can spoof an email on Discord -> Discord allows oauth
        // sign in with unverified email addresses)
        emailVerified: !!magicUserMetadata.email,
        profile: {
          // name: oauth_username, ?
        },
        referred_by_address: referrer_address,
        tier: UserTierMap.SocialVerified, // verified SSO
      },
      { transaction },
    );

    // update profile with metadata if exists
    if (profileMetadata?.username) {
      newUser.profile.name = profileMetadata.username;
    }
    if (profileMetadata?.avatarUrl) {
      newUser.profile.avatar_url = profileMetadata.avatarUrl;
    }
    if (profileMetadata?.username || profileMetadata?.avatarUrl) {
      await newUser.save({ transaction });
    }

    const addressInstances: AddressAttributes[] =
      await createMagicAddressInstances({
        generatedAddresses,
        user: newUser,
        isNewUser: true,
        decodedMagicToken,
        magicUserMetadata,
        walletSsoSource,
        accessToken,
        transaction,
        oauthInfo,
      });

    // create token with provided user/address
    const canonicalAddressInstance = addressInstances.find(
      (a) => a.community_id === DEFAULT_ETH_COMMUNITY_ID,
    );
    // THIS SHOULD NEVER HAPPEN
    if (!canonicalAddressInstance) {
      throw new Error('Could not find canonical address for new user');
    }
    await models.SsoToken.create(
      {
        issuer: decodedMagicToken.issuer,
        issued_at: decodedMagicToken.claim.iat,
        address_id: canonicalAddressInstance.id!, // always ethereum address
        created_at: new Date(),
        updated_at: new Date(),
      },
      { transaction },
    );

    return newUser;
  });
}

// Replaces ghost addresses once replacements have been generated
async function replaceGhostAddresses(
  existingUserInstance: UserInstance,
  addressInstances: AddressInstance[],
  transaction: Transaction,
) {
  const ghostAddresses =
    existingUserInstance?.Addresses?.filter(
      ({ ghost_address }) => !!ghost_address,
    ) || [];

  for (const ghost of ghostAddresses) {
    const replacementAddress = addressInstances.find(
      ({ community_id, ghost_address }) =>
        !ghost_address && community_id === ghost.community_id,
    );

    // should always exist, but check for it to avoid null check error
    if (replacementAddress) {
      // update data objects and delete ghost address
      await models.Collaboration.update(
        { address_id: replacementAddress.id! },
        { where: { address_id: ghost.id! }, transaction },
      );
      await models.Comment.update(
        { address_id: replacementAddress.id! },
        { where: { address_id: ghost.id! }, transaction },
      );
      await models.Reaction.update(
        { address_id: replacementAddress.id! },
        { where: { address_id: ghost.id! }, transaction },
      );
      await models.Thread.update(
        { address_id: replacementAddress.id! },
        { where: { address_id: ghost.id! }, transaction },
      );
      // should be no memberships or SsoTokens, but handle case for completeness sake
      await models.Membership.update(
        { address_id: replacementAddress.id! },
        { where: { address_id: ghost.id! }, transaction },
      );
      await models.SsoToken.destroy({
        where: { address_id: ghost.id! },
        transaction,
      });
      await models.Address.destroy({
        where: { id: ghost.id },
        transaction,
      });
    }
  }
}

// User is logged out + selects magic, and provides an existing magic account. Log them in.
async function loginExistingMagicUser({
  existingUserInstance,
  decodedMagicToken,
  generatedAddresses,
  magicUserMetadata,
  walletSsoSource,
  accessToken,
}: MagicLoginContext): Promise<UserInstance> {
  if (!existingUserInstance) {
    throw new Error('No user provided to sign in');
  }
  return sequelize.transaction(async (transaction) => {
    // verify login token
    const ssoToken = await models.SsoToken.scope('withPrivateData').findOne({
      where: {
        issuer: decodedMagicToken.issuer,
      },
      include: [
        {
          model: models.Address,
          where: { address: decodedMagicToken.publicAddress },
          required: true,
        },
      ],
      transaction,
    });

    if (ssoToken) {
      // login user if they registered via magic
      if (decodedMagicToken.claim.iat <= ssoToken.issued_at) {
        log.warn('Replay attack detected.');
        throw new Error(
          `Replay attack detected for user ${decodedMagicToken.publicAddress}}.`,
        );
      }
      ssoToken.issued_at = decodedMagicToken.claim.iat;
      ssoToken.updated_at = new Date();
      await ssoToken.save({ transaction });

      const verifiedInfo = await getVerifiedInfo(
        magicUserMetadata,
        walletSsoSource,
        accessToken,
      );

      await bumpTier(existingUserInstance, verifiedInfo, transaction);
      await updateAddressesOauth(verifiedInfo, ssoToken.Address!, transaction);

      log.trace('SSO TOKEN HANDLED NORMALLY');
    } else {
      const addressInstances = await createMagicAddressInstances({
        generatedAddresses,
        user: existingUserInstance,
        isNewUser: false,
        decodedMagicToken,
        magicUserMetadata,
        walletSsoSource,
        accessToken,
        transaction,
      });

      // once addresses have been created and/or located, we finalize the migration of malformed sso
      // tokens, or create a new one if absent entirely
      const canonicalAddressInstance = addressInstances.find(
        (a) => a.community_id === DEFAULT_ETH_COMMUNITY_ID,
      );
      // THIS SHOULD NEVER HAPPEN
      if (!canonicalAddressInstance) {
        throw new Error('Could not find canonical address for new user');
      }

      await models.SsoToken.create(
        {
          issuer: decodedMagicToken.issuer,
          issued_at: decodedMagicToken.claim.iat,
          address_id: canonicalAddressInstance.id!, // always ethereum address
          created_at: new Date(),
          updated_at: new Date(),
        },
        { transaction },
      );

      // TODO: Check if ONLY after first token created for a canonical address?
      await replaceGhostAddresses(
        existingUserInstance,
        addressInstances,
        transaction,
      );
      log.info(`Created SsoToken for user ${existingUserInstance.id}`);
    }

    return existingUserInstance;
  });
}

// User is logged in + selects magic, and provides an existing email different from their current
// authentication. Move their addresses from the provided email to the currently logged in user.
async function mergeLogins(ctx: MagicLoginContext): Promise<UserInstance> {
  if (!ctx.loggedInUser || !ctx.existingUserInstance) {
    throw new Error('No users provided to merge');
  }

  // first, verify the existing magic user to ensure they're not performing a replay attack
  await loginExistingMagicUser(ctx);
  const { loggedInUser, existingUserInstance } = ctx;

  // update previously-registered magic addresses for incoming magic user
  // to be owned by currently logged in user
  await models.Address.update(
    {
      user_id: loggedInUser?.id,
      verification_token: ctx.decodedMagicToken.claim.tid,
    },
    {
      where: {
        wallet_id: WalletId.Magic,
        user_id: existingUserInstance!.id,
      },
    },
  );

  // TODO: send move email

  return loggedInUser;
}

// User is logged in + selects magic, and provides a totally new email.
// Add the new Magic address to the existing User.
async function addMagicToUser({
  generatedAddresses,
  loggedInUser,
  decodedMagicToken,
  magicUserMetadata,
  walletSsoSource,
  accessToken,
}: MagicLoginContext): Promise<UserInstance> {
  if (!loggedInUser) {
    throw new Error('No user provided to create magic address on');
  }

  // create new address on logged-in user
  const addressInstances = await createMagicAddressInstances({
    generatedAddresses,
    user: loggedInUser,
    isNewUser: false,
    decodedMagicToken,
    walletSsoSource,
    accessToken,
    magicUserMetadata,
  });

  // create new token with provided user/address. contract is each address owns an SsoToken.
  const canonicalAddressInstance = addressInstances.find(
    (a) => a.community_id === DEFAULT_ETH_COMMUNITY_ID,
  );
  // This should never happen
  if (!canonicalAddressInstance) {
    throw new Error('Could not find canonical address for new user');
  }

  await models.SsoToken.create({
    issuer: decodedMagicToken.issuer,
    issued_at: decodedMagicToken.claim.iat,
    address_id: canonicalAddressInstance.id!,
    created_at: new Date(),
    updated_at: new Date(),
  });

  return loggedInUser;
}

// Entrypoint into the magic passport strategy
export async function magicLogin(
  magic: Magic,
  body: z.infer<typeof MagicLogin>,
  decodedMagicToken: MagicUser,
) {
  log.trace(`MAGIC TOKEN: ${JSON.stringify(decodedMagicToken, null, 2)}`);
  let communityToJoin: CommunityInstance | undefined | null,
    loggedInUser: UserInstance | null | undefined;

  const generatedAddresses = [
    {
      address: decodedMagicToken.publicAddress,
      community_id: DEFAULT_ETH_COMMUNITY_ID,
    },
  ];

  // canonical address is always ethereum
  const canonicalAddress = decodedMagicToken.publicAddress;

  // replay attack check
  const didTokenId = decodedMagicToken.claim.tid; // single-use token id

  // The same didToken is used for potentially two addresses at the same time
  // (ex: Eth and cosmos for Cosmos sign-in),
  // but if a single one is found we reject the token replay
  const usedMagicToken = await models.Address.findOne({
    where: {
      verification_token: didTokenId,
    },
  });

  if (usedMagicToken) {
    log.warn('Replay attack detected.');
    throw new Error(
      `Replay attack detected for user ${decodedMagicToken.publicAddress}.`,
    );
  }

  // validate community if provided (i.e. logging in on community page)
  if (body.community_id && body.community_id !== ALL_COMMUNITIES) {
    communityToJoin = await models.Community.findOne({
      where: { id: body.community_id },
      include: [
        {
          model: models.ChainNode,
          required: true,
        },
      ],
    });
    if (!communityToJoin) throw Error('Community does not exist');
  }

  // check if the user is logged in already (provided valid JWT)
  if (body.jwt) {
    try {
      const { id } = jsonwebtoken.verify(body.jwt, config.AUTH.JWT_SECRET) as {
        id: number;
      };
      loggedInUser = await models.User.findOne({
        where: { id },
      });
      log.trace(
        `DECODED LOGGED IN USER: ${JSON.stringify(loggedInUser, null, 2)}`,
      );
      if (!loggedInUser) {
        throw new Error('User not found');
      }
    } catch (e) {
      throw Error('Could not verify login');
    }
  }

  const isCosmos = communityToJoin?.base === ChainBase.CosmosSDK;

  const magicUserMetadata = await magic.users.getMetadataByIssuerAndWallet(
    decodedMagicToken.issuer,
    isCosmos ? WalletType.COSMOS : WalletType.ETH,
  );

  log.trace(
    `MAGIC USER METADATA: ${JSON.stringify(magicUserMetadata, null, 2)}`,
  );

  // the user should have signed a sessionPayload with the client-side
  // magic address. validate the signature and add that address
  try {
    // TODO: body.session can be null?
    const session: Session = deserializeCanvas(body.session!);

    if (communityToJoin) {
      if (isCosmos) {
        // (magic bug?): magic typing doesn't match data, so we need to cast as any
        // TODO: fix this, the types below should be used instead
        // const magicUserMetadataCosmosAddress = magicUserMetadata.wallets?.find(
        //   (wallet) => wallet.walletType === WalletType.COSMOS,
        // )?.publicAddress;
        const magicUserMetadataCosmosAddress = magicUserMetadata.wallets?.find(
          // @ts-expect-error types are wrong
          (wallet) => wallet.wallet_type === WalletType.COSMOS,
          // @ts-expect-error types are wrong
        )?.public_address;

        if (body.magicAddress !== magicUserMetadataCosmosAddress) {
          throw new Error(
            'user-provided magicAddress does not match magic metadata Cosmos address',
          );
        }

        generatedAddresses.push({
          address: body.magicAddress,
          community_id: communityToJoin.id,
        });
      } else if (
        communityToJoin.base === ChainBase.Ethereum &&
        session.did.startsWith('did:pkh:eip155:')
      ) {
        generatedAddresses.push({
          address: body.magicAddress,
          community_id: communityToJoin.id,
        });
      } else {
        // ignore invalid community base
        log.warn(
          `Cannot create magic account on community ${communityToJoin.id}. Ignoring.`,
        );
      }
    }

    // verify the session signature using session signer
    const sessionSigner = getSessionSignerForDid(session.did);
    if (!sessionSigner) {
      throw new Error('No session signer found for address');
    }
    await sessionSigner.verifySession(CANVAS_TOPIC, session);
  } catch (err) {
    log.warn(
      `Could not set up a valid client-side magic address ${body.magicAddress}`,
    );
  }

  // attempt to locate an existing magic user by canonical address.
  // this is the properly modern method of identifying users, as it conforms to
  // the DID standard.
  let existingUserInstance = await models.User.scope('withPrivateData').findOne(
    {
      include: [
        {
          model: models.Address,
          where: {
            wallet_id: WalletId.Magic,
            address: canonicalAddress,
            verified: { [Op.ne]: null },
          },
          required: true,
        },
      ],
    },
  );

  if (
    !existingUserInstance &&
    (!magicUserMetadata.oauthProvider ||
      magicUserMetadata.oauthProvider === 'email') &&
    magicUserMetadata.email
  ) {
    // if unable to locate a magic user by address, attempt to locate by email.
    // the ONLY time this should trigger is for claiming ghost addresses on discourse communities,
    // which requires the email-specific magic login, as the email usage on social providers
    // is insecure.
    existingUserInstance = await models.User.scope('withPrivateData').findOne({
      where: { email: magicUserMetadata.email },
      include: [
        {
          // guarantee that we only access ghost addresses as part of this query
          model: models.Address,
          where: {
            ghost_address: true,
          } as WhereOptions<AddressAttributes>,
          required: true,
        },
      ],
    });

    // generate replacement magic addresses for all ghost addresses, which will be deleted in `loginExistingMagicUser`
    if (existingUserInstance?.Addresses) {
      for (const ghost of existingUserInstance.Addresses as AddressAttributes[]) {
        const needsReplacementAddress = !generatedAddresses.some(
          ({ community_id }) => community_id === ghost.community_id,
        );
        if (needsReplacementAddress) {
          // note that discourse imports not supported on cosmos
          generatedAddresses.push({
            address: canonicalAddress,
            community_id: ghost.community_id!,
          });
        }
      }
    }
  }

  log.trace(
    `EXISTING USER INSTANCE: ${JSON.stringify(existingUserInstance, null, 2)}`,
  );

  if (loggedInUser && existingUserInstance?.id === loggedInUser?.id) {
    // already logged in as existing user, just ensure generated addresses are all linked
    // we don't need to setup a canonical address/SsoToken, that should already be done
    log.trace('CASE 0: LOGGING IN USER SAME AS EXISTING USER');
    await createMagicAddressInstances({
      generatedAddresses,
      user: loggedInUser,
      isNewUser: false,
      decodedMagicToken,
      walletSsoSource: body.walletSsoSource,
      accessToken: body.access_token,
      magicUserMetadata,
    });
    return existingUserInstance;
  }

  let finalUser: UserInstance;
  const magicContext: MagicLoginContext = {
    decodedMagicToken,
    magicUserMetadata,
    generatedAddresses,
    existingUserInstance,
    loggedInUser,
    walletSsoSource: body.walletSsoSource,
    accessToken: body.access_token,
    profileMetadata: {
      username: body.username,
      avatarUrl: body.avatarUrl,
    },
    referrer_address: body.referrer_address,
  };

  if (loggedInUser && loggedInUser.tier === UserTierMap.BannedUser) {
    throw Error('User is banned');
  } else if (
    existingUserInstance &&
    existingUserInstance.tier === UserTierMap.BannedUser
  ) {
    throw Error('User is banned');
  }

  try {
    if (loggedInUser && existingUserInstance) {
      // user is already logged in + has already linked the provided magic address.
      // merge the existing magic user with the logged in user
      log.trace('CASE 1: EXISTING MAGIC INCOMING TO USER, MERGE LOGINS');
      finalUser = await mergeLogins(magicContext);
    } else if (!loggedInUser && existingUserInstance) {
      // user is logging in with an existing magic account
      log.trace('CASE 2: LOGGING INTO EXISTING MAGIC USER');
      finalUser = await loginExistingMagicUser(magicContext);
    } else if (loggedInUser && !existingUserInstance) {
      // user is already logged in and is linking a new magic login to their account
      log.trace('CASE 3: ADDING NEW MAGIC ADDRESSES TO EXISTING USER');
      finalUser = await addMagicToUser(magicContext);
    } else {
      // completely new user: create user, profile, addresses
      log.trace('CASE 4: CREATING NEW MAGIC USER');
      finalUser = await createNewMagicUser(magicContext);
    }
  } catch (e) {
    log.error(`Failed to sign in user ${JSON.stringify(e, null, 2)}`);
    throw e;
  }

  if (finalUser.tier === UserTierMap.BannedUser) {
    throw Error('User is banned');
  }

  log.trace(`LOGGING IN FINAL USER: ${JSON.stringify(finalUser, null, 2)}`);
  return finalUser;
}
