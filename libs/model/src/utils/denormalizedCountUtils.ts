import { ServerError, command, logger } from '@hicommonwealth/core';
import { Op } from 'sequelize';
import { RefreshCommunityMemberships } from '../aggregates/community';
import { models } from '../database';
import { systemActor } from '../middleware';

const log = logger(import.meta);

/*
 * Debounces community refreshes
 */
export function debounceRefresh(
  fn: (community_id: string, group_id?: number) => Promise<void>,
  delay: number,
): (community_id: string, group_id?: number) => void {
  const timeouts = new Map<string, NodeJS.Timeout>();
  const timestamps = new Map<string, number>();

  return (community_id: string, group_id?: number) => {
    const now = Date.now();

    // make sure to only keep 20 timeouts to avoid the maps to grow too large
    if (timeouts.size > 20) {
      for (const [key, timestamp] of timestamps) {
        if (now - timestamp > delay * 2) {
          timeouts.delete(key);
          timestamps.delete(key);
        }
      }
    }

    timeouts.has(community_id) && clearTimeout(timeouts.get(community_id)!);
    timeouts.set(
      community_id,
      setTimeout(() => {
        void fn(community_id, group_id).then(() => {
          // clean up after execution
          timeouts.delete(community_id);
          timestamps.delete(community_id);
        });
      }, delay),
    );
    timestamps.set(community_id, now);
  };
}

export const refreshProfileCount = debounceRefresh(
  async (community_id: string) => {
    await models.sequelize.query(
      `
UPDATE "Communities" C
SET profile_count = (
    SELECT COUNT(*) 
    FROM "Addresses" A 
    WHERE A.community_id = C.id AND A.user_id IS NOT NULL AND A.verified IS NOT NULL
)
WHERE C.id = :community_id;
    `,
      { replacements: { community_id } },
    );
  },
  10_000,
);

export const refreshMemberships = debounceRefresh(
  async (community_id: string, group_id?: number) => {
    await command(RefreshCommunityMemberships(), {
      actor: systemActor({}),
      payload: { community_id, group_id },
    });
  },
  10_000,
);

// TODO: check if we need a maintenance policy for this
export async function assertAddressOwnership(address: string) {
  const addressUsers = await models.Address.findAll({
    where: {
      address,
      verified: { [Op.ne]: null },
    },
  });
  const numUserIds = new Set(addressUsers.map((au) => au.user_id)).size;
  if (numUserIds !== 1) {
    log.error(`Address ${address} is not owned by a single user!`);
    if (process.env.NODE_ENV !== 'production')
      throw new ServerError('Address failed assertion check');
  }
}
