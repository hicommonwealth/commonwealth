import { AppError } from '@hicommonwealth/core';
import { Transaction } from 'sequelize';
import { models } from '../database';

export const MAX_SELECTED_COMMUNITIES = 20;

export const updateCommunityDirectoryTags = async (
  tag_names: string[],
  community_id: string,
  selected_community_ids: string[],
  transaction?: Transaction,
) => {
  // Check for maximum number of selected communities
  if (selected_community_ids.length > MAX_SELECTED_COMMUNITIES) {
    throw new AppError(
      `Cannot select more than ${MAX_SELECTED_COMMUNITIES} communities`,
    );
  }

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

  const entries = [];

  // Create entries for tags (with null selected_community_id)
  for (const tag_name of tag_names) {
    const tag_id = tagNameToId.get(tag_name);
    if (tag_id !== undefined) {
      entries.push({
        community_id,
        tag_id,
        selected_community_id: null,
        created_at: new Date(),
        updated_at: new Date(),
      });
    }
  }

  // Create entries for selected communities (with null tag_id)
  for (const selected_community_id of selected_community_ids) {
    entries.push({
      community_id,
      tag_id: null,
      selected_community_id,
      created_at: new Date(),
      updated_at: new Date(),
    });
  }

  // Insert all entries if we have any
  if (entries.length > 0) {
    const [status, newRows] = await models.CommunityDirectoryTags.bulkCreate(
      entries,
      { transaction },
    );

    if (!(status || newRows)) {
      throw new AppError('Failed to create community directory tags');
    }
  }
};
