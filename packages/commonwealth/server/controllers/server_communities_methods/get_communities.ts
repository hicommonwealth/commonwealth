import { CommunityInstance } from '@hicommonwealth/model';
import { Includeable } from 'sequelize';
import { ServerCommunitiesController } from '../server_communities_controller';

export type GetCommunitiesOptions = {
  hasGroups?: boolean; // only return communities with associated groups
  includeStakes?: boolean; // include community stakes
};
export type GetCommunitiesResult = {
  community: CommunityInstance;
}[];

export async function __getCommunities(
  this: ServerCommunitiesController,
  { hasGroups }: GetCommunitiesOptions,
): Promise<GetCommunitiesResult> {
  const communitiesInclude: Includeable[] = [
    {
      model: this.models.CommunityStake,
    },
    {
      model: this.models.CommunityTags,
      include: [
        {
          model: this.models.Tags,
        },
      ],
    },
  ];
  if (hasGroups) {
    communitiesInclude.push({
      model: this.models.Group,
      as: 'groups',
      required: true,
    });
  }

  const communities = await this.models.Community.findAll({
    where: { active: true },
    include: communitiesInclude,
  });

  // TODO: fix type
  return communities.map((c) => ({
    community: {
      ...c.toJSON(),
      CommunityTags: (c.toJSON().CommunityTags || []).map(
        (ct) => (ct as any).Tag,
      ),
    },
  })) as any;
}
