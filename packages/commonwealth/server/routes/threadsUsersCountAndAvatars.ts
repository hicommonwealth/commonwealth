import { factory, formatFilename } from 'common-common/src/logging';
import type { Request, Response } from 'express';
import { groupBy } from 'lodash';
import { QueryTypes } from 'sequelize';
import { sequelize } from '../database';
import type { DB } from '../models';

const log = factory.getLogger(formatFilename(__filename));

type UniqueAddresses = {
  thread_id: number;
  address_id: number;
  address: string;
  chain;
};

const fetchUniqueAddressesByThreadIds = async (
  models: DB,
  { chain, thread_ids },
) => {
  return sequelize.query<UniqueAddresses>(
    `
    SELECT distinct cts.address_id, address, thread_id, cts.community_id
    FROM "Comments" cts INNER JOIN "Addresses" adr
    ON adr.id = cts.address_id
    WHERE thread_id = ANY($thread_ids)
    AND cts.community_id = $chain
    AND deleted_at IS NULL
    ORDER BY thread_id
  `,
    {
      type: QueryTypes.SELECT,
      bind: {
        thread_ids,
        chain,
      },
    },
  );
};

/*
1) Get the number of distinct users for list of threads(thread_id)
2) Get first 2 avatars for each group of users
3) Get latest comment

TODO: The naming system here, and in the threadUniqueAddressesCount controller,
is wildly unclear and wildly inconsistent. We should standardize + clarify.
 */
const threadsUsersCountAndAvatar = async (
  models: DB,
  req: Request,
  res: Response,
) => {
  const { chain, threads = [] } = req.body;
  try {
    if (chain && threads.length) {
      const thread_ids = threads.map(({ thread_id }) => thread_id);
      const uniqueAddressesByRootIds = await fetchUniqueAddressesByThreadIds(
        models,
        { chain, thread_ids },
      );
      const uniqueAddressesByThread = groupBy<UniqueAddresses>(
        uniqueAddressesByRootIds,
        ({ thread_id }) => thread_id,
      );
      return res.json(
        threads.map(({ thread_id: thread_id, author: authorAddress }) => {
          const uniqueAddresses = (
            uniqueAddressesByThread[thread_id] || []
          ).filter(({ address }) => address !== authorAddress);
          const addressesCount = uniqueAddresses.length + 1;
          const addresses = uniqueAddresses
            .concat({
              thread_id: thread_id,
              address: authorAddress,
              address_id: null,
              chain,
            })
            .slice(0, 2);
          return {
            id: thread_id,
            thread_id,
            addresses,
            count: addressesCount > 2 ? addressesCount - 2 : 0,
          };
        }),
      );
    }
    return res.json([]);
  } catch (e) {
    log.error('Error fetching threads users count and avatar', e);
    console.log(e);
    res.json(e);
  }
};

export default threadsUsersCountAndAvatar;
