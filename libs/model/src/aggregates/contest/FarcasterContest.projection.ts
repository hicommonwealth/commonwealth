import { logger, Projection } from '@hicommonwealth/core';
import { events } from '@hicommonwealth/schemas';
import { Op } from 'sequelize';
import { models } from '../../database';
import { mustExist } from '../../middleware/guards';
import { buildFarcasterContentUrl } from '../../utils';

const log = logger(import.meta);

const Errors = {
  ContestEnded: 'Contest has ended',
};

const inputs = {
  FarcasterReplyCastDeleted: events.FarcasterReplyCastDeleted,
};

export function FarcasterContestProjection(): Projection<typeof inputs> {
  return {
    inputs,
    body: {
      FarcasterReplyCastDeleted: async ({ payload }) => {
        // find associated contest manager by parent cast hash
        const contestManager = await models.ContestManager.findOne({
          where: {
            cancelled: {
              [Op.not]: true,
            },
            ended: {
              [Op.not]: true,
            },
            farcaster_frame_hashes: {
              [Op.contains]: [payload.parent_hash!],
            },
          },
          include: [
            {
              model: models.Contest,
              as: 'contests',
              required: true,
            },
          ],
        });
        mustExist('Contest Manager', contestManager);
        if (new Date() > contestManager.contests![0]!.end_time) {
          log.warn(`${Errors.ContestEnded}: ${contestManager.contest_address}`);
          return;
        }

        const content_url = buildFarcasterContentUrl(
          payload.parent_hash!,
          payload.hash,
          payload.author!.fid,
        );

        // mark the content as deleted, but keep the record
        // because the onchain content is immutable
        await models.ContestAction.update(
          {
            cast_deleted_at: new Date(),
          },
          {
            where: {
              action: 'added',
              contest_address: contestManager.contest_address,
              content_url,
            },
          },
        );
      },
    },
  };
}
