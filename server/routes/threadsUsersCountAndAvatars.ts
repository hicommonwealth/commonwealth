import { Request, Response } from 'express';
import { QueryTypes } from 'sequelize';
import { groupBy } from 'lodash';
import { factory, formatFilename } from '../../shared/logging';
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
  return sequelize.query<UniqueAddresses>(
    `
    select distinct cts.address_id, address, root_id, cts.chain
    from "OffchainComments" cts inner join "Addresses" adr
    on adr.id = cts.address_id
    where root_id in (${root_ids.map((root_id) => `'${root_id}'`)})
    and cts.chain = '${chain}'
    and deleted_at is null
    order by root_id
  `,
    { type: QueryTypes.SELECT }
  );
};

/*
1) Get the number of distinct users for list of threads(root_id)
2) Get first 2 avatars for each group of users
3) Get latest comment
 */
const threadsUsersCountAndAvatar = async (
  models: DB,
  req: Request,
  res: Response
) => {
  const { chain, threads } = req.body;
  try {
    const root_ids = threads.map(({ root_id }) => root_id);
    const uniqueAddressesByRootIds = await fetchUniqueAddressesByRootIds(
      models,
      { chain, root_ids }
    );
    const uniqueAddressesByThread = groupBy<UniqueAddresses>(
      uniqueAddressesByRootIds,
      ({ root_id }) => root_id
    );
    res.json(
      threads.map(({ root_id: rootId, author: authorAddress }) => {
        const addressesCount = uniqueAddressesByThread[rootId]
          ? uniqueAddressesByThread[rootId].length
          : 0;
        const addresses = (uniqueAddressesByThread[rootId] || [])
          .filter(({ address }) => address !== authorAddress)
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
  } catch (e) {
    log.error(e);
    console.log(e);
    res.json(e);
  }
};

export default threadsUsersCountAndAvatar;
