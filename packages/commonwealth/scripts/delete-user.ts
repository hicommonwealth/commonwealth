import { dispose, logger } from '@hicommonwealth/core';
import { UserInstance, models } from '@hicommonwealth/model';

const log = logger(import.meta);

async function deleteUser(user_id: number) {
  log.info(`Deleting user ${user_id}`);
  await models.sequelize.transaction(async (transaction) => {
    await models.CommentSubscription.destroy({
      where: {
        user_id,
      },
      transaction,
    });
    await models.CommunityAlert.destroy({
      where: {
        user_id,
      },
      transaction,
    });
    await models.StarredCommunity.destroy({
      where: {
        user_id,
      },
      transaction,
    });
    await models.SubscriptionPreference.destroy({
      where: {
        user_id,
      },
      transaction,
    });
    await models.ThreadSubscription.destroy({
      where: {
        user_id,
      },
      transaction,
    });
    await models.ProfileTags.destroy({
      where: {
        user_id,
      },
      transaction,
    });

    const address_ids = (
      await models.Address.findAll({
        where: {
          user_id,
        },
        transaction,
      })
    ).map((a) => a.id!);

    // address dependencies
    await models.Collaboration.destroy({
      where: {
        address_id: address_ids,
      },
      transaction,
    });
    await models.Comment.destroy({
      where: {
        address_id: address_ids,
      },
      transaction,
    });
    await models.Membership.destroy({
      where: {
        address_id: address_ids,
      },
      transaction,
    });
    await models.Reaction.destroy({
      where: {
        address_id: address_ids,
      },
      transaction,
    });
    await models.Thread.destroy({
      where: {
        address_id: address_ids,
      },
      transaction,
    });
    await models.SsoToken.destroy({
      where: {
        address_id: address_ids,
      },
      transaction,
    });
    await models.Address.destroy({
      where: {
        user_id,
      },
      transaction,
    });
    await models.XpLog.destroy({
      where: { creator_user_id: user_id },
      transaction,
    });
    await models.User.destroy({
      where: {
        id: user_id,
      },
      transaction,
    });
  });
  log.info(`User ${user_id} deleted`);
}

async function main() {
  if (!process.argv[2]) {
    throw new Error(
      'Must provide a user id (number) or email (string) to delete',
    );
  }

  let user: UserInstance | null;
  if (process.argv[2].includes('@')) {
    user = await models.User.findOne({
      where: {
        email: process.argv[2],
      },
    });
  } else {
    user = await models.User.findOne({
      where: {
        id: parseInt(process.argv[2]),
      },
    });
  }

  if (user) {
    await deleteUser(user.id!);
  } else {
    log.warn(`User not found.`);
  }
}

if (import.meta.url.endsWith(process.argv[1])) {
  main()
    .then(() => {
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      dispose()('EXIT', true);
    })
    .catch((err) => {
      console.log('Failed to delete user', err);
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      dispose()('ERROR', true);
    });
}
