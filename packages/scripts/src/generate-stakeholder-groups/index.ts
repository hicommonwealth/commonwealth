import { command } from '@hicommonwealth/core';
import { Community, models } from '@hicommonwealth/model';
import { Op } from 'sequelize';

async function main() {
  const stakedCommunities = await models.Community.findAll({
    where: {
      ...(process.env.COMMUNITY_ID && { id: process.env.COMMUNITY_ID }),
      namespace: {
        [Op.ne]: null,
      },
    },
    include: [
      {
        model: models.CommunityStake,
        as: 'CommunityStakes',
        required: true,
      },
    ],
  });

  // generate stakeholder group for each staked community
  for (const c of stakedCommunities) {
    if ((c.CommunityStakes || []).length > 0) {
      const { groups, created } = await command(
        Community.GenerateStakeholderGroups(),
        {
          id: c.id,
          actor: {
            user: undefined,
          },
          payload: {},
        },
      );

      if (created) {
        console.log(
          `created ${groups.length} stakeholder groups for ${c.id} – refreshing memberships...`,
        );
      } else {
        console.log(
          `stakeholder groups (${groups.length}) already exist for ${c.id}`,
        );
      }
    }
  }

  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
