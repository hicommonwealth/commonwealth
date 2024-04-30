import { command } from '@hicommonwealth/core';
import { logger } from '@hicommonwealth/logging';
import { Community, models } from '@hicommonwealth/model';
import { Op } from 'sequelize';

import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const log = logger(__filename);

async function main() {
  const stakedCommunities = await models.Community.findAll({
    where: {
      ...(process.env.COMMUNITY_ID && { id: process.env.COMMUNITY_ID }),
      namespace: {
        [Op.ne]: undefined,
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
      const result = await command(Community.GenerateStakeholderGroups(), {
        id: c.id,
        actor: {
          user: { email: 'generate-stakeholder-groups' },
        },
        payload: {},
      });

      if (result?.created) {
        log.info(
          `created ${result.groups?.length} stakeholder groups for ${c.id} – refreshing memberships...`,
        );
      } else {
        log.info(
          `stakeholder groups (${result?.groups?.length}) already exist for ${c.id}`,
        );
      }
    }
  }

  process.exit(0);
}

main().catch((err) => {
  if (err instanceof Error) {
    log.fatal('Fatal error occurred', err);
  } else {
    log.fatal('Fatal error occurred', undefined, { err });
  }
  process.exit(1);
});
