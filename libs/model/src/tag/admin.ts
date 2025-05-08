/*
import { ServerTagsController } from '../server_tags_controller';

export type AdminTagResponse = {
  id: number;
  name: string;
  community_count: number;
  created_at: Date;
};

export type TagUsageResponse = {
  communities: { id: string; name: string }[];
};

export async function __getAdminTags(
  this: ServerTagsController,
): Promise<AdminTagResponse[]> {
  const tags = await this.models.Tags.findAll({
    attributes: ['id', 'name', 'created_at'],
    order: [['name', 'ASC']],
  });

  // Get community count for each tag
  const tagIds = tags.map((tag) => tag.id);
  const communityCounts = await this.models.CommunityTags.findAll({
    attributes: ['tag_id', [this.models.sequelize.fn('COUNT', '*'), 'count']],
    where: {
      tag_id: tagIds,
    },
    group: ['tag_id'],
    raw: true,
  });

  // Create a map of tag_id to count
  const countMap = new Map<number, number>();
  communityCounts.forEach((item: any) => {
    countMap.set(item.tag_id, parseInt(item.count, 10));
  });

  // Add the count to each tag
  return tags.map((tag) => ({
    id: tag.id,
    name: tag.name,
    community_count: countMap.get(tag.id) || 0,
    created_at: tag.created_at,
  }));
}

export async function __createAdminTag(
  this: ServerTagsController,
  name: string,
): Promise<AdminTagResponse> {
  // Check if tag already exists
  const existingTag = await this.models.Tags.findOne({
    where: { name },
  });

  if (existingTag) {
    throw new Error('Tag with this name already exists');
  }

  // Create the tag
  const newTag = await this.models.Tags.create({
    name,
  });

  return {
    id: newTag.id,
    name: newTag.name,
    community_count: 0,
    created_at: newTag.created_at,
  };
}

export async function __updateAdminTag(
  this: ServerTagsController,
  id: number,
  name: string,
): Promise<AdminTagResponse> {
  // Check if tag exists
  const existingTag = await this.models.Tags.findOne({
    where: { id },
  });

  if (!existingTag) {
    throw new Error('Tag not found');
  }

  // Check if the new name already exists for a different tag
  const duplicateTag = await this.models.Tags.findOne({
    where: { name, id: { [this.models.Sequelize.Op.ne]: id } },
  });

  if (duplicateTag) {
    throw new Error('Tag with this name already exists');
  }

  // Update the tag
  await existingTag.update({ name });

  // Get the community count
  const communityCount = await this.models.CommunityTags.count({
    where: { tag_id: id },
  });

  return {
    id: existingTag.id,
    name: existingTag.name,
    community_count: communityCount,
    created_at: existingTag.created_at,
  };
}

export async function __deleteAdminTag(
  this: ServerTagsController,
  id: number,
): Promise<void> {
  // Check if tag exists
  const existingTag = await this.models.Tags.findOne({
    where: { id },
  });

  if (!existingTag) {
    throw new Error('Tag not found');
  }

  // Delete all associations first
  await this.models.CommunityTags.destroy({
    where: { tag_id: id },
  });

  // Delete the tag
  await existingTag.destroy();
}

export async function __getTagUsage(
  this: ServerTagsController,
  id: number,
): Promise<TagUsageResponse> {
  // Check if tag exists
  const existingTag = await this.models.Tags.findOne({
    where: { id },
  });

  if (!existingTag) {
    throw new Error('Tag not found');
  }

  // Get all communities that use this tag
  const communityTags = await this.models.CommunityTags.findAll({
    where: { tag_id: id },
    include: [
      {
        model: this.models.Community,
        attributes: ['id', 'name'],
        as: 'Community',
      },
    ],
  });

  const communities = communityTags.map((ct: any) => ({
    id: ct.Community.id,
    name: ct.Community.name,
  }));

  return { communities };
}
*/
