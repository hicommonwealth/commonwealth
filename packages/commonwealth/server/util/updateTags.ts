import { AppError } from '@hicommonwealth/core';
import { DB } from '@hicommonwealth/model';
import { Op } from 'sequelize';

export const updateTags = async (
  tag_ids: number[],
  models: DB,
  id: number | string,
  idType: 'profile_id' | 'community_id',
) => {
  // tag_ids should be defined, even if its an empty array, then we remove existing tags
  if (!tag_ids) return;

  // verify all tag ids exist
  if (tag_ids.length > 0) {
    const tagCount = await models.Tags.count({
      where: {
        id: { [Op.in]: tag_ids },
      },
    });

    const allTagsFound = tagCount === tag_ids.length;

    if (!allTagsFound) {
      throw new AppError('Some tag ids are invalid');
    }
  }

  // remove all existing tags
  const deleteParams = {
    where: {
      [idType]: id,
    },
  };
  idType === 'profile_id'
    ? await models.ProfileTags.destroy(deleteParams)
    : await models.CommunityTags.destroy(deleteParams);

  // create new tags
  if (tag_ids.length > 0) {
    const createParams = tag_ids.map((tag_id) => ({
      tag_id: tag_id,
      [idType]: idType === 'profile_id' ? Number(`${id}`) : `${id}`,
    }));

    const [status, newRows] =
      idType === 'profile_id'
        ? await models.ProfileTags.bulkCreate(createParams)
        : await models.CommunityTags.bulkCreate(createParams);

    if (!status || !newRows) {
      throw new AppError('Failed');
    }
  }
};
