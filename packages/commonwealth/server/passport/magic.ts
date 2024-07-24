/* eslint-disable @typescript-eslint/no-unused-vars */
import type { Session } from '@canvas-js/interfaces';
import { ServerError, logger } from '@hicommonwealth/core';
import type {
  DB,
  ProfileAttributes,
  ProfileInstance,
} from '@hicommonwealth/model';
import {
  AddressAttributes,
  AddressInstance,
  CommunityInstance,
  UserAttributes,
  UserInstance,
  sequelize,
} from '@hicommonwealth/model';
import {
  CANVAS_TOPIC,
  ChainBase,
  NotificationCategories,
  WalletId,
  WalletSsoSource,
  deserializeCanvas,
  getSessionSignerForAddress,
} from '@hicommonwealth/shared';
import { Magic, MagicUserMetadata, WalletType } from '@magic-sdk/admin';
import jsonwebtoken from 'jsonwebtoken';
import passport from 'passport';
import { DoneFunc, Strategy as MagicStrategy, MagicUser } from 'passport-magic';
import { Op, Transaction, WhereOptions } from 'sequelize';
import { fileURLToPath } from 'url';
import { config } from '../config';
import { validateCommunity } from '../middleware/validateCommunity';
import { TypedRequestBody } from '../types';

const __filename = fileURLToPath(import.meta.url);
const log = logger(__filename);

type MagicLoginContext = {
  models: DB;
  decodedMagicToken: MagicUser;
  magicUserMetadata: MagicUserMetadata;
  generatedAddresses: Array<{ address: string; community_id: string }>;
  existingUserInstance?: UserInstance;
  loggedInUser?: UserInstance;
  profileMetadata?: { username?: string; avatarUrl?: string };
  walletSsoSource: WalletSsoSource;
};

const DEFAULT_ETH_COMMUNITY_ID = 'ethereum';

// Creates a trusted address in a community
async function createMagicAddressInstances(
  models: DB,
  generatedAddresses: Array<{ address: string; community_id: string }>,
  user: UserAttributes,
  walletSsoSource: WalletSsoSource,
  decodedMagicToken: MagicUser,
  t?: Transaction,
): Promise<AddressInstance[]> {
  const addressInstances: AddressInstance[] = [];
  const user_id = user.id;
  // @ts-expect-error StrictNullChecks
  const profile_id = (user.Profiles[0] as ProfileAttributes).id;

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
        user_id,
        verification_token: decodedMagicToken.claim.tid, // to prevent re-use
        verification_token_expires: null,
        verified: new Date(), // trust addresses from magic
        last_active: new Date(),
        role: 'member',
      },
      transaction: t,
    });

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
      // Update used magic token to prevent replay attacks
      addressInstance.verification_token = decodedMagicToken.claim.tid;

      if (
        addressInstance.wallet_sso_source === WalletSsoSource.Unknown ||
        // set wallet_sso_source if it was unknown before
        addressInstance.wallet_sso_source === undefined ||
        addressInstance.wallet_sso_source === null
      ) {
        addressInstance.wallet_sso_source = walletSsoSource;
      }

      await addressInstance.save({ transaction: t });
    }
    addressInstances.push(addressInstance);
  }
  return addressInstances;
}

// User is logged out + selects magic, and provides a new email. Create a new user for them.
async function createNewMagicUser({
  models,
  decodedMagicToken,
  magicUserMetadata,
  generatedAddresses,
  profileMetadata,
  walletSsoSource,
}: MagicLoginContext): Promise<UserInstance> {
  // completely new user: create user, profile, addresses
  return sequelize.transaction(async (transaction) => {
    // @ts-expect-error StrictNullChecks
    const newUser = await models.User.createWithProfile(
      {
        // we rely ONLY on the address as a canonical piece of login information (discourse import aside)
        // so it is safe to set emails from magic as part of User data, even though they may be unverified.
        // although not usable for login, this email (used for outreach) is still considered sensitive user data.
        email: magicUserMetadata.email,

        // we mark email verified so that we are OK to send update emails, but we should note that
        // just because an email comes from magic doesn't mean it's legitimately owned by the signing-in
        // user, unless it's via the email flow (e.g. you can spoof an email on Discord)
        emailVerified: !!magicUserMetadata.email,
        profile: {},
      },
      { transaction },
    );

    // update profile with metadata if exists
    // @ts-expect-error StrictNullChecks
    const newProfile = newUser.Profiles[0] as ProfileInstance;
    if (profileMetadata?.username) {
      newProfile.profile_name = profileMetadata.username;
    }
    if (profileMetadata?.avatarUrl) {
      newProfile.avatar_url = profileMetadata.avatarUrl;
    }
    if (profileMetadata?.username || profileMetadata?.avatarUrl) {
      await newProfile.save({ transaction });
    }

    const addressInstances: AddressAttributes[] =
      await createMagicAddressInstances(
        models,
        generatedAddresses,
        newUser,
        walletSsoSource,
        decodedMagicToken,
        transaction,
      );

    // Automatically create subscription to their own mentions
    await models.Subscription.create(
      {
        // @ts-expect-error StrictNullChecks
        subscriber_id: newUser.id,
        category_id: NotificationCategories.NewMention,
        is_active: true,
      },
      { transaction },
    );

    // Automatically create a subscription to collaborations
    await models.Subscription.create(
      {
        // @ts-expect-error StrictNullChecks
        subscriber_id: newUser.id,
        category_id: NotificationCategories.NewCollaboration,
        is_active: true,
      },
      { transaction },
    );

    // create token with provided user/address
    const canonicalAddressInstance = addressInstances.find(
      (a) => a.community_id === DEFAULT_ETH_COMMUNITY_ID,
    );
    await models.SsoToken.create(
      {
        issuer: decodedMagicToken.issuer,
        issued_at: decodedMagicToken.claim.iat,
        // @ts-expect-error StrictNullChecks
        address_id: canonicalAddressInstance.id, // always ethereum address
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
  models: DB,
  transaction: Transaction,
) {
  const ghostAddresses = (existingUserInstance?.Addresses?.filter(
    ({ ghost_address }: AddressAttributes) => !!ghost_address,
  ) || []) as AddressAttributes[];

  for (const ghost of ghostAddresses) {
    const replacementAddress = addressInstances.find(
      ({ community_id, ghost_address }) =>
        !ghost_address && community_id === ghost.community_id,
    );

    // should always exist, but check for it to avoid null check error
    if (replacementAddress) {
      // update data objects and delete ghost address
      await models.Collaboration.update(
        { address_id: replacementAddress.id },
        { where: { address_id: ghost.id }, transaction },
      );
      await models.Comment.update(
        { address_id: replacementAddress.id },
        { where: { address_id: ghost.id }, transaction },
      );
      await models.Reaction.update(
        { address_id: replacementAddress.id },
        { where: { address_id: ghost.id }, transaction },
      );
      await models.Thread.update(
        { address_id: replacementAddress.id },
        { where: { address_id: ghost.id }, transaction },
      );
      // should be no memberships or SsoTokens, but handle case for completeness sake
      await models.Membership.update(
        { address_id: replacementAddress.id },
        { where: { address_id: ghost.id }, transaction },
      );
      await models.SsoToken.destroy({
        where: { address_id: ghost.id },
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
  models,
  existingUserInstance,
  decodedMagicToken,
  generatedAddresses,
  walletSsoSource,
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
      log.trace('SSO TOKEN HANDLED NORMALLY');
    } else {
      const addressInstances = await createMagicAddressInstances(
        models,
        generatedAddresses,
        existingUserInstance,
        walletSsoSource,
        decodedMagicToken,
        transaction,
      );

      // once addresses have been created and/or located, we finalize the migration of malformed sso
      // tokens, or create a new one if absent entirely
      const canonicalAddressInstance = addressInstances.find(
        (a) => a.community_id === DEFAULT_ETH_COMMUNITY_ID,
      );

      await models.SsoToken.create(
        {
          issuer: decodedMagicToken.issuer,
          issued_at: decodedMagicToken.claim.iat,
          // @ts-expect-error StrictNullChecks
          address_id: canonicalAddressInstance.id, // always ethereum address
          created_at: new Date(),
          updated_at: new Date(),
        },
        { transaction },
      );

      // TODO: Check if ONLY after first token created for a canonical address?
      await replaceGhostAddresses(
        existingUserInstance,
        addressInstances,
        models,
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
  // first, verify the existing magic user to ensure they're not performing a replay attack
  await loginExistingMagicUser(ctx);
  const { models, loggedInUser, existingUserInstance } = ctx;

  // update previously-registered magic addresses for incoming magic user
  // to be owned by currently logged in user
  await models.Address.update(
    {
      // @ts-expect-error StrictNullChecks
      user_id: loggedInUser.id,
      // @ts-expect-error StrictNullChecks
      profile_id: loggedInUser.Profiles[0].id,
      verification_token: ctx.decodedMagicToken.claim.tid,
    },
    {
      where: {
        wallet_id: WalletId.Magic,
        // @ts-expect-error StrictNullChecks
        user_id: existingUserInstance.id,
      },
    },
  );

  // TODO: send move email

  // @ts-expect-error StrictNullChecks
  return loggedInUser;
}

// User is logged in + selects magic, and provides a totally new email.
// Add the new Magic address to the existing User.
async function addMagicToUser({
  models,
  generatedAddresses,
  loggedInUser,
  decodedMagicToken,
  walletSsoSource,
}: MagicLoginContext): Promise<UserInstance> {
  // create new address on logged-in user
  const addressInstances = await createMagicAddressInstances(
    models,
    generatedAddresses,
    // @ts-expect-error StrictNullChecks
    loggedInUser,
    walletSsoSource,
    decodedMagicToken,
  );

  // create new token with provided user/address. contract is each address owns an SsoToken.
  const canonicalAddressInstance = addressInstances.find(
    (a) => a.community_id === DEFAULT_ETH_COMMUNITY_ID,
  );
  await models.SsoToken.create({
    issuer: decodedMagicToken.issuer,
    issued_at: decodedMagicToken.claim.iat,
    // @ts-expect-error StrictNullChecks
    address_id: canonicalAddressInstance.id,
    created_at: new Date(),
    updated_at: new Date(),
  });
  // @ts-expect-error StrictNullChecks
  return loggedInUser;
}

// Entrypoint into the magic passport strategy
async function magicLoginRoute(
  magic: Magic,
  models: DB,
  req: TypedRequestBody<{
    community_id?: string;
    jwt?: string;
    username?: string;
    avatarUrl?: string;
    signature: string;
    session?: string;
    magicAddress?: string; // optional because session keys are feature-flagged
    walletSsoSource: WalletSsoSource;
  }>,
  decodedMagicToken: MagicUser,
  cb: DoneFunc,
) {
  log.trace(`MAGIC TOKEN: ${JSON.stringify(decodedMagicToken, null, 2)}`);
  let communityToJoin: CommunityInstance, error, loggedInUser: UserInstance;

  const walletSsoSource = req.body.walletSsoSource;
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
  if (req.body.community_id) {
    [communityToJoin, error] = await validateCommunity(models, req.body);
    if (error) return cb(error);
  }

  // check if the user is logged in already (provided valid JWT)
  if (req.body.jwt) {
    try {
      const { id } = jsonwebtoken.verify(
        req.body.jwt,
        config.AUTH.JWT_SECRET,
      ) as {
        id: number;
      };
      // @ts-expect-error StrictNullChecks
      loggedInUser = await models.User.findOne({
        where: { id },
        include: [
          {
            model: models.Profile,
          },
        ],
      });
      log.trace(
        `DECODED LOGGED IN USER: ${JSON.stringify(loggedInUser, null, 2)}`,
      );
      if (!loggedInUser) {
        throw new Error('User not found');
      }
    } catch (e) {
      return cb('Could not verify login');
    }
  }

  // @ts-expect-error StrictNullChecks
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
    // @ts-expect-error <StrictNullChecks>
    const session: Session = deserializeCanvas(req.body.session);

    // @ts-expect-error StrictNullChecks
    if (communityToJoin) {
      if (isCosmos) {
        // (magic bug?): magic typing doesn't match data, so we need to cast as any
        const magicWallets = magicUserMetadata.wallets as any[];
        const magicUserMetadataCosmosAddress = magicWallets?.find(
          (wallet) => wallet.wallet_type === WalletType.COSMOS,
        )?.public_address;

        if (req.body.magicAddress !== magicUserMetadataCosmosAddress) {
          throw new Error(
            'user-provided magicAddress does not match magic metadata Cosmos address',
          );
        }

        generatedAddresses.push({
          // @ts-expect-error StrictNullChecks
          address: req.body.magicAddress,
          // @ts-expect-error StrictNullChecks
          community_id: communityToJoin.id,
        });
      } else if (
        communityToJoin.base === ChainBase.Ethereum &&
        session.address.startsWith('eip155:')
      ) {
        generatedAddresses.push({
          // @ts-expect-error StrictNullChecks
          address: req.body.magicAddress,
          // @ts-expect-error StrictNullChecks
          community_id: communityToJoin.id,
        });
      } else {
        // ignore invalid community base
        log.warn(
          `Cannot create magic account on community ${communityToJoin.id}. Ignoring.`,
        );
      }
    }

    if (config.ENFORCE_SESSION_KEYS) {
      // verify the session signature using session signer
      const sessionSigner = getSessionSignerForAddress(session.address);
      if (!sessionSigner) {
        throw new Error('No session signer found for address');
      }
      await sessionSigner.verifySession(CANVAS_TOPIC, session);
    }
  } catch (err) {
    log.warn(
      `Could not set up a valid client-side magic address ${req.body.magicAddress}`,
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
        {
          model: models.Profile,
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
          model: models.Profile,
        },
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

  // @ts-expect-error StrictNullChecks
  if (loggedInUser && existingUserInstance?.id === loggedInUser?.id) {
    // already logged in as existing user, just ensure generated addresses are all linked
    // we don't need to setup a canonical address/SsoToken, that should already be done
    log.trace('CASE 0: LOGGING IN USER SAME AS EXISTING USER');
    await createMagicAddressInstances(
      models,
      generatedAddresses,
      loggedInUser,
      walletSsoSource,
      decodedMagicToken,
    );
    return cb(null, existingUserInstance);
  }

  let finalUser: UserInstance;
  const magicContext: MagicLoginContext = {
    models,
    decodedMagicToken,
    magicUserMetadata,
    generatedAddresses,
    // @ts-expect-error StrictNullChecks
    existingUserInstance,
    // @ts-expect-error StrictNullChecks
    loggedInUser,
    profileMetadata: {
      username: req.body.username,
      avatarUrl: req.body.avatarUrl,
    },
    walletSsoSource,
  };
  try {
    // @ts-expect-error StrictNullChecks
    if (loggedInUser && existingUserInstance) {
      // user is already logged in + has already linked the provided magic address.
      // merge the existing magic user with the logged in user
      log.trace('CASE 1: EXISTING MAGIC INCOMING TO USER, MERGE LOGINS');
      finalUser = await mergeLogins(magicContext);
      // @ts-expect-error StrictNullChecks
    } else if (!loggedInUser && existingUserInstance) {
      // user is logging in with an existing magic account
      log.trace('CASE 2: LOGGING INTO EXISTING MAGIC USER');
      finalUser = await loginExistingMagicUser(magicContext);
      // @ts-expect-error StrictNullChecks
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
    return cb(e);
  }

  log.trace(`LOGGING IN FINAL USER: ${JSON.stringify(finalUser, null, 2)}`);
  return cb(null, finalUser);
}

export function initMagicAuth(models: DB) {
  // allow magic login if configured with key
  if (config.AUTH.MAGIC_API_KEY) {
    // TODO: verify we are in a community that supports magic login
    const magic = new Magic(config.AUTH.MAGIC_API_KEY);
    passport.use(
      new MagicStrategy({ passReqToCallback: true }, async (req, user, cb) => {
        try {
          return await magicLoginRoute(magic, models, req, user, cb);
        } catch (e) {
          return cb(e, user);
        }
      }),
    );
  }
}
