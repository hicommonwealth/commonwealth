import { Command, InvalidState } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { Op } from 'sequelize';
import { config } from '../../config';
import { models } from '../../database';
import { isSuperAdmin, mustExist, mustNotExist } from '../../middleware';

export function UpdateMarket(): Command<typeof schemas.UpdateMarket> {
  return {
    ...schemas.UpdateMarket,
    auth: [isSuperAdmin],
    secure: true,
    body: async ({ payload }) => {
      if (!config.MARKETS.ENABLED) {
        throw new InvalidState('Markets feature is not enabled');
      }

      const {
        id,
        provider,
        slug,
        question,
        category,
        start_time,
        end_time,
        status,
        image_url,
      } = payload;

      const market = await models.Market.findOne({ where: { id } });
      mustExist('Market', market);

      // Check for duplicate slug if slug is being updated
      if (slug && slug !== market.slug) {
        const duplicateMarket = await models.Market.findOne({
          where: { slug, id: { [Op.ne]: id } },
        });
        mustNotExist('Market with this slug', duplicateMarket);
      }

      const updateData: Partial<typeof market> = {};
      if (provider !== undefined) updateData.provider = provider;
      if (slug !== undefined) updateData.slug = slug;
      if (question !== undefined) updateData.question = question;
      if (category !== undefined) updateData.category = category;
      if (start_time !== undefined) updateData.start_time = start_time;
      if (end_time !== undefined) updateData.end_time = end_time;
      if (status !== undefined) updateData.status = status;
      if (image_url !== undefined) updateData.image_url = image_url ?? null;

      const updated = await market.update(updateData);

      return updated.toJSON();
    },
  };
}
