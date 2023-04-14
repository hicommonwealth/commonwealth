import type { DB } from '../models';
import BN from 'bn.js';
import { AppError } from 'common-common/src/errors';
import { factory, formatFilename } from 'common-common/src/logging';
import { QueryTypes } from 'sequelize';
import type { TokenBalanceCache } from 'token-balance-cache/src';
import { sequelize } from '../database';
import type { AddressInstance } from '../models/address';
import type { TypedRequestBody, TypedResponse } from '../types';
import { success } from '../types';

const log = factory.getLogger(formatFilename(__filename));

enum BulkBalancesErrors {
  InvalidToken = 'Invalid token',
  NoProfileId = 'No profileId provided',
  NoProfile = "Profile doesn't exist",
  NoRegisteredAddresses = 'No wallet addresses registered to this profile',
  Failed = 'Request Failed',
}

// ----------- OUTSTANDING QUESTIONS -----------
// 1. Max across addresses or sum across addresses?
//      - SUM WAS DECIDED ON, LESS EXPECTED FOR ADMINS BUT BETTER FOR USERS
//      - WE WANT TO LET THE USERS DECIDE IN THE FUTURE, POSSIBLY.

type bulkBalanceReq = {
  profileId: number;
  token: string;
  chainNodes: {
    [nodeId: number]: Array<{ address: string; tokenType: string }>;
  };
};

// TODO: ensure commonbot parses the strings properly rather than relying
//   on js `numbers`, which can overflow in e.g. wei.
type bulkBalanceResp = {
  balances: {
    [nodeId: string]:
      | {
          [tokenAddress: string]: string;
        }
      | string;
  };
  bases: string[];
};

const bulkBalances = async (
  models: DB,
  tokenBalanceCache: TokenBalanceCache,
  req: TypedRequestBody<bulkBalanceReq>,
  res: TypedResponse<bulkBalanceResp>
) => {
  const { profileId, chainNodes, token } = req.body;

  if (!process.env.DISCORD_BOT_TOKEN)
    throw new AppError(BulkBalancesErrors.Failed);

  if (!token || token !== process.env.DISCORD_BOT_TOKEN)
    throw new AppError(BulkBalancesErrors.InvalidToken);

  if (!profileId) throw new AppError(BulkBalancesErrors.NoProfileId);

  const profile = await models.Profile.findOne({
    where: { id: profileId },
  });
  if (!profile) throw new AppError(BulkBalancesErrors.NoProfile);

  // Get all addresses registered with user
  const addressInstances: AddressInstance[] = await models.Address.findAll({
    where: { profile_id: profileId },
  });

  // Remove duplicates from addresses
  const profileWalletAddresses: string[] = [
    ...new Set(addressInstances.map((addressObj) => addressObj.address)),
  ];

  if (profileWalletAddresses.length === 0) {
    throw new AppError(BulkBalancesErrors.NoRegisteredAddresses);
  }

  // get bases for addresses being returned
  // THIS IS FOR THE COMMON BOT'S "VALID ADDRESS BY CHAINBASE" RULE
  // THIS WILL BE REMOVED EVENTUALLY WHEN RULES-API GOES LIVE
  const baseQuery = `
    SELECT DISTINCT(c.base) FROM "Addresses" addr 
      LEFT JOIN "Chains" c ON addr.chain = c.id 
      WHERE addr.profile_id = ${profileId};`;
  const basesRaw: string[] = <any>await sequelize.query(baseQuery, {
    raw: true,
    type: QueryTypes.SELECT,
  });

  const bases = basesRaw.map((b) => b['base']);

  const balances: Pick<bulkBalanceResp, 'balances'>['balances'] = {};

  // Iterate through chain nodes
  for (const nodeIdString of Object.keys(chainNodes)) {
    const contracts = req.body.chainNodes[nodeIdString];
    const nodeId = parseInt(nodeIdString, 10);

    const [{ bp }] = await tokenBalanceCache.getBalanceProviders(nodeId);
    // Handle when only one value in array
    // no longer needed, always { address, tokenType }
    // if (typeof tokenAddresses === 'string') {
    //   tokenAddresses = [tokenAddresses];
    // }

    // Handle no token addresses for chain node
    // This is for Cosmos base
    if (!contracts || contracts.length === 0) {
      let balanceTotal = new BN(0);
      try {
        const balanceResults = await tokenBalanceCache.getBalancesForAddresses(
          nodeId,
          profileWalletAddresses,
          bp,
          {}
        );
        for (const balance of Object.values(balanceResults.balances)) {
          balanceTotal = balanceTotal.add(new BN(balance));
        }
        balances[nodeId] = balanceTotal.toString();
      } catch (e) {
        log.info(
          `Couldn't get balances for chainNodeId ${nodeId}: ${e.message}`
        );
      }
    } else {
      // this is for Ethereum / Solana Bases
      const tokenBalances: { [contractAddress: string]: string } = {};

      // Build token balances for each address
      for (const contract of contracts) {
        let balanceTotal = new BN(0);
        try {
          const balanceResults =
            await tokenBalanceCache.getBalancesForAddresses(
              nodeId,
              profileWalletAddresses,
              bp,
              {
                contractType: contract.tokenType,
                tokenAddress: contract.address,
              }
            );
          for (const balance of Object.values(balanceResults.balances)) {
            balanceTotal = balanceTotal.add(new BN(balance));
          }
          tokenBalances[contract.address] = balanceTotal.toString();
        } catch (e) {
          log.info(
            `Couldn't get token balances for chainNodeId ${nodeId} + contract ${contract.address}: ${e.message}`
          );
        }
      }

      // Ensure we had some valid lookups
      if (Object.keys(tokenBalances).length > 0) {
        balances[nodeId] = tokenBalances;
      }
    }
  }

  return success(res, { balances, bases });
};

export default bulkBalances;
