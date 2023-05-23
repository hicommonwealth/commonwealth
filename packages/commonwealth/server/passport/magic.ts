import { MagicUserMetadata } from '@magic-sdk/admin';
import { Magic } from '@magic-sdk/admin';
import { verify } from 'jsonwebtoken';
import { Op, Transaction } from 'sequelize';

import { ServerError } from 'common-common/src/errors';
import { NotificationCategories, WalletId } from 'common-common/src/types';
import passport from 'passport';
import { DoneFunc, Strategy as MagicStrategy, MagicUser } from 'passport-magic';
import { JWT_SECRET, MAGIC_API_KEY } from '../config';
import { sequelize } from '../database';
import { validateChain } from '../middleware/validateChain';
import type { DB } from '../models';
import type { ProfileAttributes } from '../models/profile';
import '../types';
import { createRole } from '../util/roles';
import { TypedRequestBody } from '../types';
import { UserInstance } from '../models/user';
import { AddressInstance } from '../models/address';

// TODO: update file for cosmos changes from master

// Creates a trusted address in a community
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

// User is logged out + selects magic, and provides a new email. Create a new user for them.
async function createNewMagicUser(
  models: DB,
  userMetadata: MagicUserMetadata,
  providedUser: MagicUser,
  chain?: string,
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
      chain || 'ethereum',
      newUser.id,
      (newUser.Profiles[0] as ProfileAttributes).id,
      canonicalAddress,
      t
    );

    // Automatically create subscription to their own mentions
    await models.Subscription.create(
      {
        subscriber_id: newUser.id,
        category_id: NotificationCategories.NewMention,
        object_id: `user-${newUser.id}`,
        is_active: true,
      },
      { transaction: t }
    );

    // Automatically create a subscription to collaborations
    await models.Subscription.create(
      {
        subscriber_id: newUser.id,
        category_id: NotificationCategories.NewCollaboration,
        object_id: `user-${newUser.id}`,
        is_active: true,
      },
      { transaction: t }
    );

    // create token with provided user/address
    await models.SsoToken.create(
      {
        issuer: providedUser.issuer,
        issued_at: providedUser.claim.iat,
        address_id: canonicalAddressInstance.id, // always ethereum address
        created_at: new Date(),
        updated_at: new Date(),
      },
      { transaction: t }
    );

    return newUser;
  });

  return result;
}

// User is logged out + selects magic, and provides an existing email. Log them in.
async function loginExistingMagicUser(
  models: DB,
  existingUser: UserInstance,
  providedUser: MagicUser,
  chain?: string
): Promise<UserInstance> {
  const ssoToken = await models.SsoToken.findOne({
    where: {
      issuer: providedUser.issuer,
    },
    include: [
      {
        model: models.Address,
        where: { address: providedUser.publicAddress },
        required: true,
      },
    ],
  });

  // login user if they registered via magic
  if (providedUser.claim.iat <= ssoToken.issued_at) {
    console.log('Replay attack detected.');
    throw new Error(`Replay attack detected for user ${providedUser.publicAddress}}.`);
  }
  ssoToken.issued_at = providedUser.claim.iat;
  ssoToken.updated_at = new Date();
  await ssoToken.save();
  console.log(`Found existing user: ${JSON.stringify(existingUser)}`);

  // auto "join" community logged in against
  if (chain && ssoToken.Address.chain !== chain) {
    await createMagicAddress(
      models,
      chain,
      existingUser.id,
      existingUser.Profiles[0].id,
      providedUser.publicAddress,
    );
  }
  return existingUser;
}

// User is logged in + selects magic, and provides an existing email different from their current
// authentication. Move their addresses from the provided email to the currently logged in user.
async function mergeLogins(
  models: DB,
  loggedInUserId: number,
  providedUser: MagicUser,
  magicUser: UserInstance,
) {
  // first, verify the existing magic user to ensure they're not performing a replay attack
  await loginExistingMagicUser(models, magicUser, providedUser);

  // then, merge their information into the logged-in user
  const loggedInUser = await models.User.findOne({
    where: { id: loggedInUserId },
    include: [
      {
        model: models.Profile,
      },
    ]
  });

  // update MAGIC addresses for incoming magic user to point to current user
  await models.Address.update(
    {
      user_id: loggedInUser.id,
      profile_id: loggedInUser.Profiles[0].id,
    },
    {
      where: {
        wallet_id: WalletId.Magic,
        user_id: magicUser.id,
      },
    }
  );

  // TODO: send move email

  return loggedInUser;
}

// User is logged in + selects magic, and provides a totally new email. Add the new Magic address
// to the existing User.
async function addMagicToUser(
  models: DB,
  loggedInUserId: number,
  providedUser: MagicUser,
  chain?: string,
) {
  const loggedInUser = await models.User.findOne({
    where: { id: loggedInUserId },
    include: [
      {
        model: models.Profile,
      },
    ]
  });

  // create new address on logged-in user
  const canonicalAddressInstance = await createMagicAddress(
    models,
    chain || 'ethereum',
    loggedInUser.id,
    (loggedInUser.Profiles[0] as ProfileAttributes).id,
    providedUser.publicAddress,
  );

  // create new token with provided user/address
  await models.SsoToken.create(
    {
      issuer: providedUser.issuer,
      issued_at: providedUser.claim.iat,
      address_id: canonicalAddressInstance.id, // always ethereum address
      created_at: new Date(),
      updated_at: new Date(),
    }
  );
  return loggedInUser;
}

async function magicLoginRoute(
  magic: Magic,
  models: DB,
  req: TypedRequestBody<{
    chain?: string,
    jwt?: string,
  }>,
  magicUser: MagicUser,
  cb: DoneFunc
) {
  let chain, error, user_id;

  // validate chain if provided (i.e. logging in on community page)
  if (req.body.chain) {
    [chain, error] = await validateChain(models, req.body);
    if (error) return cb(error);
  }

  // check if the user is logged in already (provided valid JWT)
  if (req.body.jwt) {
    try {
      const { id } = verify(req.body.jwt, JWT_SECRET) as { id: number, email: string | null };
      user_id = id;
    } catch (e) {
      return cb('Could not verify login');
    }
  }

  // fetch user data from magic backend
  let userMetadata: MagicUserMetadata;
  try {
    userMetadata = await magic.users.getMetadataByIssuer(magicUser.issuer);
    console.log('User metadata:', userMetadata);
  } catch (e) {
    return cb(
      new ServerError(
        `Magic fetch failed: ${e.message} - ${JSON.stringify(e.data)}`
      )
    );
  }

  const canonicalAddress = userMetadata.publicAddress;

  // check if new signup or login
  const existingUser = await models.User.scope('withPrivateData').findOne(
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
    }
  );

  if (existingUser.id === user_id) {
    // already logged in as existing user, do nothing
    return cb(null, existingUser);
  }

  let final_id;
  if (user_id && existingUser) {
    // user is already logged in + has already linked the provided magic address.
    // merge the existing magic user with the logged in user
    const finalUser = await mergeLogins(
      models,
      user_id,
      magicUser,
      existingUser
    );
    final_id = finalUser.id;
  } else if (!user_id && existingUser) {
    // user is logging in with an existing magic account
    const returnedUser = await loginExistingMagicUser(
      models,
      existingUser,
      magicUser,
      chain
    );
    final_id = returnedUser.id;
  } else if (user_id && !existingUser) {
    // user is already logged in and is linking a new magic login to their account
    const finalUser = await addMagicToUser(
      models,
      user_id,
      magicUser,
      chain
    );
    final_id = finalUser.id;
  } else {
    // completely new user: create user, profile, addresses
    const newUser = await createNewMagicUser(
      models,
      userMetadata,
      magicUser,
      chain
    );
    final_id = newUser.id;
  }

  // always re-fetch user to include address object
  const finalUser = await models.User.findOne({
    where: {
      id: final_id,
    },
    include: [models.Address],
  });
  return cb(null, finalUser);
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
