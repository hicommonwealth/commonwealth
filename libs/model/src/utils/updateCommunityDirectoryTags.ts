import { AppError } from '@hicommonwealth/core';
import { Transaction } from 'sequelize';
import { models } from '../database';

export const updateCommunityDirectoryTags = async (
  tag_names: string[],
  community_id: string,
  selected_community_ids: string[],
  transaction?: Transaction,
) => {
  // Get tag IDs from names
  const tags = await models.Tags.findAll({
    where: { name: tag_names },
    attributes: ['id', 'name'],
    transaction,
  });

  const tagNameToId = new Map(tags.map((tag) => [tag.name, tag.id]));

  // Verify all tag names exist
  if (tag_names.length > 0) {
    const tagCount = tags.length;
    const allTagsFound = tagCount === tag_names.length;

    if (!allTagsFound) {
      throw new AppError('Some tag names are invalid');
    }
  }

  // Delete existing entries
  await models.CommunityDirectoryTags.destroy({
    where: { community_id },
    transaction,
  });

  // Insert new entries
  if (tag_names.length > 0) {
    const validEntries = [];

    for (const tag_name of tag_names) {
      const tag_id = tagNameToId.get(tag_name);
      if (tag_id !== undefined) {
        validEntries.push({
          community_id,
          tag_id,
          selected_community_id: selected_community_ids[0],
          created_at: new Date(),
          updated_at: new Date(),
        });
      }
    }

    if (validEntries.length > 0) {
      const [status, newRows] = await models.CommunityDirectoryTags.bulkCreate(
        validEntries,
        { transaction },
      );

      if (!(status || newRows)) {
        throw new AppError('Failed to create community directory tags');
      }
    }
  }
};
