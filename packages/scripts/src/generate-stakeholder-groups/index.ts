import { command, dispose, logger } from '@hicommonwealth/core';
import { Community, models } from '@hicommonwealth/model';
import { Op } from 'sequelize';

const log = logger(import.meta);

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
        actor: {
          user: { email: 'generate-stakeholder-groups' },
        },
        payload: { id: c.id! },
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
}

main()
  .then(async () => await dispose()('EXIT', true))
  .catch((err) => {
    if (err instanceof Error) {
      log.fatal('Fatal error occurred', err);
    } else {
      log.fatal('Fatal error occurred', undefined, { err });
    }
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    dispose()('ERROR', true);
  });
