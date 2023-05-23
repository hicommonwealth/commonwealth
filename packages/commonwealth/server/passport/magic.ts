import type { MagicUserMetadata } from '@magic-sdk/admin';
import { Magic } from '@magic-sdk/admin';

import { ServerError } from 'common-common/src/errors';
import { NotificationCategories, WalletId } from 'common-common/src/types';
import passport from 'passport';
import { DoneFunc, Strategy as MagicStrategy, MagicUser } from 'passport-magic';
import { MAGIC_API_KEY } from '../config';
import { sequelize } from '../database';
import { validateChain } from '../middleware/validateChain';
import type { DB } from '../models';
import type { ProfileAttributes } from '../models/profile';

import '../types';
import { createRole } from '../util/roles';
import { TypedRequestBody } from '../types';
import { UserAttributes, UserInstance } from '../models/user';
import { Transaction } from 'sequelize';
import { AddressInstance } from '../models/address';
import { ChainAttributes } from '../models/chain';

async function createMagicAddress(
  models: DB,
  chain: string,
  user_id: number,
  profile_id: number,
  address: string,
  t?: Transaction
): Promise<AddressInstance> {
  // create a default Eth address
  const addressInstance = await models.Address.create(
    {
      address,
      chain,
      verification_token: 'MAGIC',
      verification_token_expires: null,
      verified: new Date(), // trust addresses from magic
      last_active: new Date(),
      user_id,
      profile_id,
      wallet_id: WalletId.Magic,
    },
    { transaction: t }
  );

  await createRole(
    models,
    addressInstance.id,
    chain,
    'member',
    false,
    t
  );
  return addressInstance;
}

async function createMagicSubscriptions(models: DB, user_id: number, t?: Transaction) {
  // Automatically create subscription to their own mentions
  await models.Subscription.create(
    {
      subscriber_id: user_id,
      category_id: NotificationCategories.NewMention,
      object_id: `user-${user_id}`,
      is_active: true,
    },
    { transaction: t }
  );

  // Automatically create a subscription to collaborations
  await models.Subscription.create(
    {
      subscriber_id: user_id,
      category_id: NotificationCategories.NewCollaboration,
      object_id: `user-${user_id}`,
      is_active: true,
    },
    { transaction: t }
  );
}

async function createNewMagicUser(
  models: DB,
  userMetadata: MagicUserMetadata,
  providedUser: MagicUser,
  registrationChain: ChainAttributes,
  registrationChainAddress: string,
): Promise<UserInstance> {
  const canonicalAddress = userMetadata.publicAddress;

  // completely new user: create user, profile, addresses
  const result = await sequelize.transaction(async (t) => {
    const newUser = await models.User.createWithProfile(
      models,
      {
        email: userMetadata.email,
        emailVerified: true,
      },
      { transaction: t }
    );

    const canonicalAddressInstance = await createMagicAddress(
      models,
      'ethereum',
      newUser.id,
      (newUser.Profiles[0] as ProfileAttributes).id,
      canonicalAddress,
      t
    );

    if (registrationChainAddress) {
      await createMagicAddress(
        models,
        registrationChain.id,
        newUser.id,
        (newUser.Profiles[0] as ProfileAttributes).id,
        registrationChainAddress,
        t
      );
    }

    await createMagicSubscriptions(models, newUser.id, t);

    // create token with provided user/address
    await models.SsoToken.create(
      {
        issuer: userMetadata.issuer,
        issued_at: providedUser.claim.iat,
        address_id: canonicalAddressInstance.id, // always ethereum address
        created_at: new Date(),
        updated_at: new Date(),
      },
      { transaction: t }
    );

    return newUser;
  });

  // re-fetch user to include address object
  const newUser = await models.User.findOne({
    where: {
      id: result.id,
    },
    include: [models.Address],
  });
  return newUser;
}

async function loginExistingMagicUser(
  models: DB,
  existingUser: UserInstance,
  userMetadata: MagicUserMetadata,
  providedUser: MagicUser,
  registrationChain: ChainAttributes,
  registrationChainAddress: string
): Promise<UserInstance> {
  const ssoToken = await models.SsoToken.findOne({
    where: {
      issuer: providedUser.issuer,
    },
    include: [
      {
        model: models.Address,
        where: { address: userMetadata.publicAddress },
        required: true,
      },
    ],
  });
  // login user if they registered via magic
  if (providedUser.claim.iat <= ssoToken.issued_at) {
    console.log('Replay attack detected.');
    throw new Error(`Replay attack detected for user ${userMetadata.publicAddress}}.`);
  }
  ssoToken.issued_at = providedUser.claim.iat;
  ssoToken.updated_at = new Date();
  await ssoToken.save();
  console.log(`Found existing user: ${JSON.stringify(existingUser)}`);

  const addressExistsForChain = existingUser.Addresses?.some(
    (a) =>
      registrationChain?.id === a.chain ||
      (registrationChain?.base === 'cosmos' &&
        (a.address.startsWith('cosmos') ||
          a.address.startsWith('osmo')))
  );

  if (registrationChainAddress && !addressExistsForChain) {
    // insert an address for their selected chain if it doesn't exist
    await sequelize.transaction(async (t) => {
      const [newRegistrationChainAddress, created] =
        await models.Address.findOrCreate({
          where: {
            address: registrationChainAddress,
            chain: registrationChain.id,
            user_id: existingUser.id,
            profile_id: (existingUser.Profiles[0] as ProfileAttributes).id,
            wallet_id: WalletId.Magic,
          },
          defaults: {
            verification_token: 'MAGIC',
            verification_token_expires: null,
            verified: new Date(),
            last_active: new Date(),
          },
          transaction: t,
        });
      if (created) {
        await createRole(
          models,
          newRegistrationChainAddress.id,
          registrationChain.id,
          'member',
          false,
          t
        );
      }
    });
  }
  return existingUser;
}

async function magicLoginRoute(
  magic: Magic,
  models: DB,
  req: TypedRequestBody<{
    address?: string,
    chain?: string,
  }>,
  user: MagicUser,
  cb: DoneFunc
) {
  console.log(user);
  let chain, error, registrationChainAddress;

  // validate chain if provided (i.e. logging in on community page)
  if (req.body.chain) {
    [chain, error] = await validateChain(models, req.body);
    if (error) return cb(error);
  }

  // validate address if provided (i.e. cosmos changed address)
  if (req.body.address) {
    registrationChainAddress = req.body.address;
  }

  const registrationChain = chain;

  // fetch user data from magic backend
  let userMetadata: MagicUserMetadata;
  try {
    userMetadata = await magic.users.getMetadataByIssuer(user.issuer);
    console.log('User metadata:', userMetadata);
  } catch (e) {
    return cb(
      new ServerError(
        `Magic fetch failed: ${e.message} - ${JSON.stringify(e.data)}`
      )
    );
  }

  const canonicalAddress = userMetadata.publicAddress;

  // check if the user is already logged in
  const loggedInUser: UserAttributes | undefined = req.user;

  // check if new signup or login
  const existingUser = await models.User.scope('withPrivateData').findOne(
    {
      include: [
        {
          model: models.Address,
          where: {
            wallet_id: WalletId.Magic,
            address: canonicalAddress,
          },
          required: false,
        },
        {
          model: models.Profile,
        },
      ],
    }
  );

  if (loggedInUser && existingUser) {
    // user is already logged in + has already linked the provided magic address.
    // TODO: we should merge the existing magic user with the logged in user, unless
    //   the two are identical, in which case we should do nothing.
  } else if (!loggedInUser && existingUser) {
    // user is logging in with an existing magic account
    const returnedUser = await loginExistingMagicUser(
      models,
      existingUser,
      userMetadata,
      user,
      registrationChain,
      registrationChainAddress
    );
    return cb(null, returnedUser);
  } else if (loggedInUser && !existingUser) {
    // user is already logged in and is linking a new magic login to their account
    // TODO: create + add the magic addresses
  } else {
    // completely new user: create user, profile, addresses
    const newUser = await createNewMagicUser(
      models,
      userMetadata,
      user,
      registrationChain,
      registrationChainAddress
    );
    return cb(null, newUser);
  }
}

export function initMagicAuth(models: DB) {
  // allow magic login if configured with key
  if (MAGIC_API_KEY) {
    // TODO: verify we are in a community that supports magic login
    const magic = new Magic(MAGIC_API_KEY);
    passport.use(
      new MagicStrategy({ passReqToCallback: true }, async (req, user, cb) => {
        return magicLoginRoute(magic, models, req, user, cb);
      })
    );
  }
}
