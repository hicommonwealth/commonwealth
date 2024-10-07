import { cache, CacheNamespaces, type Command } from '@hicommonwealth/core';
import { buildApiKeySaltCacheKey } from '@hicommonwealth/model';
import * as schemas from '@hicommonwealth/schemas';
import { Sequelize } from 'sequelize';
import { models } from '../database';

export function DeleteApiKey(): Command<typeof schemas.DeleteApiKey> {
  return {
    ...schemas.DeleteApiKey,
    auth: [],
    secure: true,
    body: async ({ actor }) => {
      const apiKey = await models.ApiKey.findOne({
        where: {
          user_id: actor.user.id,
        },
      });
      if (!apiKey) return { deleted: false };

      const addresses = (
        await models.Address.findAll({
          attributes: [
            [Sequelize.fn('DISTINCT', Sequelize.col('address')), 'address'],
          ],
          where: {
            user_id: actor.user.id,
          },
        })
      ).map((a) => a.address!);

      for (const address of addresses) {
        await cache().deleteKey(
          CacheNamespaces.Api_key_auth,
          buildApiKeySaltCacheKey(address),
        );
      }
      await cache().deleteKey(
        CacheNamespaces.Api_key_auth,
        apiKey.hashed_api_key,
      );

      const numDeleted = await models.ApiKey.destroy({
        where: {
          user_id: actor.user.id,
        },
      });

      return {
        deleted: !!numDeleted,
      };
    },
  };
}
