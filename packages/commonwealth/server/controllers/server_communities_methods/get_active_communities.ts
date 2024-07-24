import { CacheNamespaces, cache } from '@hicommonwealth/core';
import {
  CommunityAttributes,
  CommunityInstance,
  sequelize,
} from '@hicommonwealth/model';
import { Op, QueryTypes } from 'sequelize';
import { config } from '../../config';
import { ServerCommunitiesController } from '../server_communities_controller';
import { CommunityWithTags } from './get_communities';

const CACHE_KEY = 'active-communities';

export type GetActiveCommunitiesOptions = {
  cacheEnabled: boolean;
};
export type GetActiveCommunitiesResult = {
  communities: CommunityAttributes[];
  totalCommunitiesCount: number;
};

export async function __getActiveCommunities(
  this: ServerCommunitiesController,
  { cacheEnabled }: GetActiveCommunitiesOptions,
): Promise<GetActiveCommunitiesResult> {
  if (cacheEnabled) {
    const cachedResult = await cache().getKey(
      CacheNamespaces.Function_Response,
      CACHE_KEY,
    );
    if (cachedResult) {
      return JSON.parse(cachedResult);
    }
  }

  const query = `
    SELECT
        c.id,
        COUNT(DISTINCT t.id) AS topic_count,
        COUNT(DISTINCT a.id) AS address_count,
        COUNT(DISTINCT cs.community_id) AS community_stake_count
    FROM
        "Communities" c
        LEFT JOIN "Topics" t ON c.id = t.community_id
        LEFT JOIN "Addresses" a ON c.id = a.community_id
        LEFT JOIN "CommunityStakes" cs ON c.id = cs.community_id
        LEFT JOIN "CommunityTags" ct ON c.id = ct.community_id
    WHERE
      c.active = true
    GROUP BY
        c.id
    HAVING
      (
        COUNT(DISTINCT t.id) > 0
        AND
        COUNT(DISTINCT a.id) >= 10
      ) OR
      COUNT(DISTINCT cs.community_id) > 0;
    `;
  const activeCommunities = await sequelize.query<CommunityAttributes>(query, {
    type: QueryTypes.SELECT,
  });

  const communityIds = activeCommunities.map((community) => community.id);
  const [communities, totalCommunitiesCount]: [CommunityInstance[], number] =
    await Promise.all([
      this.models.Community.findAll({
        // @ts-expect-error StrictNullChecks
        where: {
          id: {
            [Op.in]: communityIds,
          },
        },
        include: [
          { model: this.models.CommunityStake },
          {
            model: this.models.CommunityTags,
            include: [
              {
                model: this.models.Tags,
              },
            ],
          },
          {
            model: this.models.Topic,
            required: true,
            as: 'topics',
            attributes: ['id'],
          },
        ],
      }),
      this.models.Community.count({
        where: {
          active: true,
        },
      }),
    ]);

  const result = {
    communities: communities.map((c) => ({
      ...c.toJSON(),
      CommunityTags: (c.toJSON().CommunityTags || []).map(
        (ct) => (ct as unknown as CommunityWithTags).Tag,
      ),
    })),
    totalCommunitiesCount,
  };

  if (cacheEnabled) {
    cache().setKey(
      CacheNamespaces.Function_Response,
      CACHE_KEY,
      JSON.stringify(result),
      config.ACTIVE_COMMUNITIES_CACHE_TTL_SECONDS,
    );
  }

  return result;
}
