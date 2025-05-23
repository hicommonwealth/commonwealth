import { ServerError, command, logger } from '@hicommonwealth/core';
import { Op } from 'sequelize';
import { RefreshCommunityMemberships } from '../aggregates/community';
import { models } from '../database';
import { systemActor } from '../middleware';

const log = logger(import.meta);

// @eslint-disable-next-line @typescript-eslint/no-explicit-any
export function debounceRefresh<T extends (...args: any[]) => Promise<void>>(
  fn: T,
  delay: number,
): (...args: Parameters<T>) => Promise<void> {
  const timeouts = new Map<string, NodeJS.Timeout>();
  const timestamps = new Map<string, number>();

  return (...args: Parameters<T>) => {
    const now = Date.now();
    const key = JSON.stringify(args);

    // Evict old entries if cache grows too large
    if (timeouts.size > 20) {
      for (const [k, t] of timestamps) {
        if (now - t > delay * 2) {
          timeouts.delete(k);
          timestamps.delete(k);
        }
      }
    }

    // Clear previous timeout if it exists
    if (timeouts.has(key)) {
      clearTimeout(timeouts.get(key)!);
    }

    // Set new debounce timeout
    timeouts.set(
      key,
      setTimeout(() => {
        void fn(...args).then(() => {
          timeouts.delete(key);
          timestamps.delete(key);
        });
      }, delay),
    );

    timestamps.set(key, now);
    return Promise.resolve();
  };
}

export const refreshProfileCount = debounceRefresh(
  async (community_id: string) => {
    await models.sequelize.query(
      `
        UPDATE "Communities" C
        SET profile_count = (SELECT COUNT(*)
                             FROM "Addresses" A
                             WHERE A.community_id = C.id
                               AND A.user_id IS NOT NULL
                               AND A.verified IS NOT NULL)
        WHERE C.id = :community_id;
      `,
      { replacements: { community_id } },
    );
  },
  10_000,
);

export const refreshMemberships = debounceRefresh(
  async (community_id: string, group_id?: number) => {
    try {
      await command(RefreshCommunityMemberships(), {
        actor: systemActor({}),
        payload: { community_id, group_id },
      });
    } catch (e) {
      log.error(
        'Failed to refresh community memberships',
        e instanceof Error ? e : undefined,
        {
          ...(e instanceof Error ? { e } : {}),
          community_id,
          group_id,
        },
      );
    }
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
