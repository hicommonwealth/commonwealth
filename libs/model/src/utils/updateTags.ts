import { AppError } from '@hicommonwealth/core';
import { Op, Transaction } from 'sequelize';
import { models } from '../database';

export const updateTags = async (
  tag_ids: number[],
  id: number | string,
  idType: 'user_id' | 'community_id',
  transaction?: Transaction,
) => {
  // tag_ids should be defined, even if its an empty array, then we remove existing tags
  if (!tag_ids) return;

  // verify all tag ids exist
  if (tag_ids.length > 0) {
    const tagCount = await models.Tags.count({
      where: {
        id: { [Op.in]: tag_ids },
      },
      transaction,
    });

    const allTagsFound = tagCount === tag_ids.length;

    if (!allTagsFound) {
      throw new AppError('Some tag ids are invalid');
    }
  }

  // remove all existing tags
  idType === 'user_id'
    ? await models.ProfileTags.destroy({ where: { user_id: id }, transaction })
    : await models.CommunityTags.destroy({
        where: { community_id: id },
        transaction,
      });

  // create new tags
  if (tag_ids.length > 0) {
    const [status, newRows] =
      idType === 'user_id'
        ? await models.ProfileTags.bulkCreate(
            tag_ids.map((tag_id) => ({
              tag_id,
              user_id: +id,
              created_at: new Date(),
              updated_at: new Date(),
            })),
            { transaction },
          )
        : await models.CommunityTags.bulkCreate(
            tag_ids.map((tag_id) => ({
              tag_id,
              community_id: `${id}`,
              created_at: new Date(),
              updated_at: new Date(),
            })),
            { transaction },
          );

    if (!(status || newRows)) {
      throw new AppError('Failed');
    }
  }
};
