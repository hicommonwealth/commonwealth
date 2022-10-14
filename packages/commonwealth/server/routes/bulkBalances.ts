import TokenBalanceCache from 'token-balance-cache/src/index';
import { AddressInstance } from 'server/models/address';
import { Op, QueryTypes } from 'sequelize';
import { DB } from '../models';
import { sequelize } from '../database';
import { AppError } from '../util/errors';
import { success, TypedRequestBody, TypedResponse } from '../types';

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
    [nodeId: number]: Array<{ address: string, tokenType: string }>;
  };
};

type bulkBalanceResp = {
  balances: {
    [nodeId: string]:
      | {
          [tokenAddress: string]: number;
        }
      | number;
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
  const basesRaw: string[] = <any>(await sequelize.query(baseQuery, {
    raw: true,
    type: QueryTypes.SELECT,
  }));

  const bases = basesRaw.map((b) => b['base']);

  const balances: {
    [nodeId: string]:
      | {
          [tokenAddress: string]: number;
        }
      | number;
  } = {};

  // Iterate through chain nodes
  for (const nodeIdString of Object.keys(chainNodes)) {
    const contracts = req.body.chainNodes[nodeIdString];
    const nodeId = parseInt(nodeIdString, 10);

    // Handle when only one value in array
    // no longer needed, always { address, tokenType }
    // if (typeof tokenAddresses === 'string') {
    //   tokenAddresses = [tokenAddresses];
    // }

    // Handle no token addresses for chain node
    // This is for Cosmos base
    if (!contracts || contracts.length === 0) {
      let balanceTotal = 0;
      let atLeastOneTokenAddress = false;
      for (const userWalletAddress of profileWalletAddresses) {
        try {
          const balance = await tokenBalanceCache.getBalance(
            nodeId,
            userWalletAddress
          );
          balanceTotal += balance.toNumber();
          atLeastOneTokenAddress = false;
        } catch (e) {
          console.log(
            "Couldn't get balance for chainNodeId ",
            nodeId,
            ' with wallet ',
            userWalletAddress
          );
        }
      }
      if (atLeastOneTokenAddress) {
        balances[nodeId] = balanceTotal;
      }
    } else {
      // this is for Ethereum / Solana Bases
      const tokenBalances: { [contractAddress: string]: number } = {};
      let atLeastOneTokenAddress = false;

      // Build token balances for each address
      for (const contract of contracts) {
        let balanceTotal = 0;
        for (const userWalletAddress of profileWalletAddresses) {
          try {
            const balance = await tokenBalanceCache.getBalance(
              nodeId,
              userWalletAddress,
              contract.address,
              contract.tokenType,
            );
            balanceTotal += balance.toNumber();
            atLeastOneTokenAddress = true;
          } catch (e) {
            console.log(
              "Couldn't get balance for token address",
              contract.address,
              'on chainNodeId',
              nodeId,
              ' with wallet ',
              userWalletAddress
            );
          }
        }
        if (atLeastOneTokenAddress) {
          tokenBalances[contract.address] = balanceTotal;
        }
      }

      // Ensure we had some valid lookups
      if (Object.keys(tokenBalances).length > 0) {
        balances[nodeId] = tokenBalances;
      }
    }
  }

  return success(res, {balances, bases});
};

export default bulkBalances;
