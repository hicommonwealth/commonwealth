import { Request, Response } from 'express';
import { QueryTypes } from 'sequelize';
import { groupBy } from 'lodash';
import { factory, formatFilename } from 'common-common/src/logging';
import { DB, sequelize } from '../database';

const log = factory.getLogger(formatFilename(__filename));

type UniqueAddresses = {
  root_id: string;
  address_id: number;
  address: string;
  chain;
};

const fetchUniqueAddressesByRootIds = async (
  models: DB,
  { chain, root_ids }
) => {
  const formattedIds = root_ids.map((root_id) => `${root_id}`);
  return sequelize.query<UniqueAddresses>(
    `
    SELECT distinct cts.address_id, address, root_id, cts.chain
    FROM "OffchainComments" cts INNER JOIN "Addresses" adr
    ON adr.id = cts.address_id
    WHERE root_id IN ($root_ids)
    AND cts.chain = $chain
    AND deleted_at IS NULL
    ORDER BY root_id
  `,
    {
      type: QueryTypes.SELECT,
      bind: {
        root_ids: formattedIds,
        chain,
      }
    }
  );
};

/*
1) Get the number of distinct users for list of threads(root_id)
2) Get first 2 avatars for each group of users
3) Get latest comment

TODO: The naming system here, and in the threadUniqueAddressesCount controller,
is wildly unclear and wildly inconsistent. We should standardize + clarify.
 */
const threadsUsersCountAndAvatar = async (
  models: DB,
  req: Request,
  res: Response
) => {
  const { chain, threads = [] } = req.body;
  try {
    if (chain && threads.length) {
      const root_ids = threads.map(({ root_id }) => root_id);
      const uniqueAddressesByRootIds = await fetchUniqueAddressesByRootIds(
        models,
        { chain, root_ids }
      );
      const uniqueAddressesByThread = groupBy<UniqueAddresses>(
        uniqueAddressesByRootIds,
        ({ root_id }) => root_id
      );
      return res.json(
        threads.map(({ root_id: rootId, author: authorAddress }) => {
          const uniqueAddresses = (
            uniqueAddressesByThread[rootId] || []
          ).filter(({ address }) => address !== authorAddress);
          const addressesCount = uniqueAddresses.length + 1;
          const addresses = uniqueAddresses
            .concat({
              root_id: rootId,
              address: authorAddress,
              address_id: null,
              chain,
            })
            .slice(0, 2);
          return {
            id: rootId,
            rootId,
            addresses,
            count: addressesCount > 2 ? addressesCount - 2 : 0,
          };
        })
      );
    }
    return res.json([]);
  } catch (e) {
    log.error(e);
    console.log(e);
    res.json(e);
  }
};

export default threadsUsersCountAndAvatar;
